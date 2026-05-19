import { spawn, execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, "..");
const analysisRoot = path.join(appRoot, "_recording-analysis");
const sourceDir = process.env.LEAGUE_RECORDINGS_DIR || "C:\\Users\\phama\\Documents\\League of Legends\\Highlights";
const replayDir = process.env.LEAGUE_REPLAY_DIR || path.join(path.dirname(sourceDir), "Replays");
const captureRoot = process.env.LEAGUE_AUTO_CAPTURE_DIR || path.join(path.dirname(sourceDir), "AO Labs Live Captures");
const lockPath = path.join(analysisRoot, "league-live-recorder.lock");
const logPath = path.join(analysisRoot, "league-live-recorder.log");
const pollMs = Number(process.env.LEAGUE_LIVE_POLL_MS || 5000);
const endGraceMs = Number(process.env.LEAGUE_LIVE_END_GRACE_MS || 35000);
const segmentSeconds = Number(process.env.LEAGUE_LIVE_SEGMENT_SECONDS || 30);
const fastForwardSpeed = Number(process.env.LEAGUE_LIVE_FAST_FORWARD || 8);
const minGameSeconds = Number(process.env.LEAGUE_LIVE_MIN_GAME_SECONDS || 90);
const fps = String(process.env.LEAGUE_LIVE_FPS || 30);
const crf = String(process.env.LEAGUE_LIVE_CRF || 26);
const publishAfterGame = process.env.LEAGUE_LIVE_PUBLISH !== "0";
const npmBin = process.platform === "win32" ? "npm.cmd" : "npm";

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function log(message) {
  const line = `${new Date().toISOString()} ${message}\n`;
  await fs.mkdir(analysisRoot, { recursive: true });
  await fs.appendFile(logPath, line, "utf8");
  process.stdout.write(line);
}

async function run(command, args, options = {}) {
  const result = await execFileAsync(command, args, {
    cwd: appRoot,
    maxBuffer: 64 * 1024 * 1024,
    shell: process.platform === "win32" && /\.cmd$/i.test(command),
    windowsHide: true,
    ...options
  });
  return result.stdout || "";
}

async function acquireLock() {
  await fs.mkdir(analysisRoot, { recursive: true });
  try {
    const handle = await fs.open(lockPath, "wx");
    await handle.writeFile(String(process.pid), "utf8");
    await handle.close();
  } catch {
    const stat = await fs.stat(lockPath).catch(() => null);
    if (stat && Date.now() - stat.mtimeMs > 24 * 60 * 60 * 1000) {
      await fs.unlink(lockPath).catch(() => {});
      return acquireLock();
    }
    await log("Live recorder already has a lock; exiting.");
    process.exit(0);
  }
}

async function releaseLock() {
  await fs.unlink(lockPath).catch(() => {});
}

async function gameIsRunning() {
  try {
    const stdout = await run("tasklist", ["/FI", "IMAGENAME eq League of Legends.exe", "/FO", "CSV", "/NH"]);
    return /League of Legends\.exe/i.test(stdout);
  } catch {
    return false;
  }
}

function stamp(date = new Date()) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

async function latestReplay(startMs, endMs) {
  const entries = await fs.readdir(replayDir, { withFileTypes: true }).catch(() => []);
  const candidates = [];
  for (const entry of entries) {
    if (!entry.isFile() || !/^NA1-\d+\.rofl$/i.test(entry.name)) continue;
    const filePath = path.join(replayDir, entry.name);
    const stat = await fs.stat(filePath).catch(() => null);
    if (!stat) continue;
    if (stat.mtimeMs < startMs - 10 * 60 * 1000 || stat.mtimeMs > endMs + 10 * 60 * 1000) continue;
    candidates.push({
      matchId: entry.name.replace(/\.rofl$/i, ""),
      mtimeMs: stat.mtimeMs
    });
  }
  return candidates.sort((a, b) => b.mtimeMs - a.mtimeMs)[0] || null;
}

async function probeDuration(filePath) {
  const stdout = await run("ffprobe", [
    "-v", "error",
    "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1",
    filePath
  ]);
  return Number(stdout.trim()) || 0;
}

async function startSession() {
  const startedAt = new Date();
  const sessionRoot = path.join(captureRoot, stamp(startedAt));
  await fs.mkdir(sessionRoot, { recursive: true });
  const outputPattern = path.join(sessionRoot, "segment-%04d.mkv");
  const args = [
    "-y",
    "-hide_banner",
    "-loglevel", "error",
    "-f", "gdigrab",
    "-framerate", fps,
    "-draw_mouse", "1",
    "-i", "desktop",
    "-an",
    "-c:v", "libx264",
    "-preset", "veryfast",
    "-crf", crf,
    "-pix_fmt", "yuv420p",
    "-f", "segment",
    "-segment_time", String(segmentSeconds),
    "-reset_timestamps", "1",
    outputPattern
  ];
  const child = spawn("ffmpeg", args, {
    cwd: appRoot,
    windowsHide: true,
    stdio: ["pipe", "ignore", "pipe"]
  });
  child.stderr.on("data", (chunk) => {
    fs.appendFile(path.join(sessionRoot, "ffmpeg.log"), chunk).catch(() => {});
  });
  await log(`Started League screen capture in ${sessionRoot}`);
  return {
    child,
    sessionRoot,
    startedAt,
    startedMs: startedAt.getTime(),
    lastSeenMs: Date.now()
  };
}

async function stopSession(session) {
  await log("Stopping League screen capture.");
  session.endedAt = new Date();
  session.endedMs = session.endedAt.getTime();
  if (!session.child.killed) {
    session.child.stdin?.write("q");
    session.child.stdin?.end();
  }
  await Promise.race([
    new Promise((resolve) => session.child.once("exit", resolve)),
    delay(20000).then(() => {
      if (!session.child.killed) session.child.kill("SIGTERM");
    })
  ]);
}

async function writeConcatList(listPath, files) {
  const text = files
    .map((file) => `file '${file.replace(/\\/g, "/").replace(/'/g, "'\\''")}'`)
    .join("\n");
  await fs.writeFile(listPath, `${text}\n`, "utf8");
}

function importantSegmentIndexes(segments) {
  const usable = segments.filter((item) => item.size > 160 * 1024);
  if (!usable.length) return new Set(segments.map((item) => item.index));
  const median = [...usable].sort((a, b) => a.size - b.size)[Math.floor(usable.length / 2)]?.size || 1;
  const top = [...usable]
    .sort((a, b) => b.size - a.size)
    .filter((item, index) => index < 8 || item.size > median * 1.12);
  const byIndex = new Map(segments.map((item) => [item.index, item]));
  const selected = new Set();
  for (const item of top) {
    for (const index of [item.index - 1, item.index, item.index + 1]) {
      if (byIndex.has(index)) selected.add(index);
    }
  }
  return selected;
}

async function processSegment(segment, importantIndexes, sessionRoot) {
  const isImportant = importantIndexes.has(segment.index);
  const speed = isImportant ? 1 : Math.max(1, fastForwardSpeed);
  const outputPath = path.join(sessionRoot, `processed-${String(segment.index).padStart(4, "0")}.mp4`);
  await run("ffmpeg", [
    "-y",
    "-hide_banner",
    "-loglevel", "error",
    "-i", segment.filePath,
    "-vf", `setpts=PTS/${speed},fps=${fps}`,
    "-an",
    "-c:v", "libx264",
    "-preset", "veryfast",
    "-crf", "29",
    "-pix_fmt", "yuv420p",
    "-movflags", "+faststart",
    outputPath
  ]);
  return {
    ...segment,
    outputPath,
    speed,
    important: isImportant
  };
}

async function nextOutputPath(matchId) {
  const safeMatch = matchId && /^NA1-\d+$/i.test(matchId) ? matchId.toUpperCase() : `NA1-${Date.now()}`;
  for (let index = 1; index <= 99; index += 1) {
    const name = `auto_${safeMatch}_${String(index).padStart(2, "0")}.mp4`;
    const filePath = path.join(sourceDir, name);
    if (!(await fs.stat(filePath).catch(() => null))) return filePath;
  }
  throw new Error(`Could not allocate output filename for ${safeMatch}`);
}

async function finalizeSession(session) {
  const elapsedSeconds = Math.round((session.endedMs - session.startedMs) / 1000);
  if (elapsedSeconds < minGameSeconds) {
    await log(`Capture was ${elapsedSeconds}s, below ${minGameSeconds}s; keeping raw segments only.`);
    return;
  }
  const entries = await fs.readdir(session.sessionRoot, { withFileTypes: true });
  const segments = [];
  for (const entry of entries) {
    if (!entry.isFile() || !/^segment-\d+\.mkv$/i.test(entry.name)) continue;
    const filePath = path.join(session.sessionRoot, entry.name);
    const stat = await fs.stat(filePath);
    const index = Number(entry.name.match(/segment-(\d+)/i)?.[1]) || 0;
    segments.push({ filePath, size: stat.size, index });
  }
  segments.sort((a, b) => a.index - b.index);
  if (!segments.length) {
    await log("No usable segments were created.");
    return;
  }

  const replay = await latestReplay(session.startedMs, session.endedMs);
  const outputPath = await nextOutputPath(replay?.matchId);
  const importantIndexes = importantSegmentIndexes(segments);
  const processed = [];
  for (const segment of segments) {
    processed.push(await processSegment(segment, importantIndexes, session.sessionRoot));
  }
  const listPath = path.join(session.sessionRoot, "processed.txt");
  const joinedPath = path.join(session.sessionRoot, "processed.mp4");
  await writeConcatList(listPath, processed.map((item) => item.outputPath));
  await run("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", listPath, "-c", "copy", joinedPath]);
  await fs.mkdir(sourceDir, { recursive: true });
  await run("ffmpeg", [
    "-y",
    "-hide_banner",
    "-loglevel", "error",
    "-i", joinedPath,
    "-c:v", "libx264",
    "-preset", "veryfast",
    "-crf", "29",
    "-pix_fmt", "yuv420p",
    "-an",
    "-movflags", "+faststart",
    outputPath
  ]);
  const duration = await probeDuration(outputPath);
  const sidecar = {
    createdAt: new Date().toISOString(),
    source: "AO Labs League live recorder",
    matchId: replay?.matchId || "",
    startedAt: session.startedAt.toISOString(),
    endedAt: session.endedAt.toISOString(),
    outputPath,
    durationSeconds: duration,
    sourceDurationSeconds: elapsedSeconds,
    segmentSeconds,
    fastForwardSpeed,
    allSegmentsPreserved: true,
    segments: processed.map((item) => ({
      index: item.index,
      size: item.size,
      speed: item.speed,
      important: item.important
    })),
    inputPolicy: "Screen and mouse cursor are recorded. Raw keyboard text is not logged."
  };
  await fs.writeFile(path.join(session.sessionRoot, "review-clip.json"), `${JSON.stringify(sidecar, null, 2)}\n`, "utf8");
  await log(`Created review clip ${outputPath}`);

  if (publishAfterGame) {
    await log("Publishing updated League recordings.");
    await run(npmBin, ["run", "publish:recordings"]);
  }
}

async function main() {
  await acquireLock();
  process.on("exit", () => {
    fs.unlink(lockPath).catch(() => {});
  });
  process.on("SIGINT", async () => {
    await releaseLock();
    process.exit(0);
  });

  await log("League live recorder is watching for game process.");
  let session = null;
  while (true) {
    const running = await gameIsRunning();
    if (running && !session) {
      session = await startSession();
    }
    if (running && session) {
      session.lastSeenMs = Date.now();
    }
    if (!running && session && Date.now() - session.lastSeenMs > endGraceMs) {
      const current = session;
      session = null;
      try {
        await stopSession(current);
        await finalizeSession(current);
      } catch (error) {
        await log(`Finalize failed: ${error.message}`);
      }
    }
    await delay(pollMs);
  }
}

main().catch(async (error) => {
  await log(`Live recorder failed: ${error.stack || error.message}`);
  await releaseLock();
  process.exitCode = 1;
});
