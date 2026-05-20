import { spawn, execFile } from "node:child_process";
import fs from "node:fs/promises";
import https from "node:https";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, "..");
const analysisRoot = path.join(appRoot, "_recording-analysis");
const sourceDir = process.env.LEAGUE_RECORDINGS_DIR || "C:\\Users\\phama\\Documents\\League of Legends\\Highlights";
const replayDir = process.env.LEAGUE_REPLAY_DIR || path.join(path.dirname(sourceDir), "Replays");
const captureRoot = process.env.LEAGUE_AUTO_CAPTURE_DIR || path.join(path.dirname(sourceDir), "AO Labs Live Captures");
const leagueLockfile = process.env.LEAGUE_LOCKFILE || "C:\\Riot Games\\League of Legends\\lockfile";
const lockPath = path.join(analysisRoot, "league-live-recorder.lock");
const logPath = path.join(analysisRoot, "league-live-recorder.log");
const pollMs = Number(process.env.LEAGUE_LIVE_POLL_MS || 5000);
const endGraceMs = Number(process.env.LEAGUE_LIVE_END_GRACE_MS || 35000);
const segmentSeconds = Number(process.env.LEAGUE_LIVE_SEGMENT_SECONDS || 30);
const fastForwardSpeed = Number(process.env.LEAGUE_LIVE_FAST_FORWARD || 8);
const minGameSeconds = Number(process.env.LEAGUE_LIVE_MIN_GAME_SECONDS || 90);
const fps = String(process.env.LEAGUE_LIVE_FPS || 10);
const encoderPreference = String(process.env.LEAGUE_LIVE_ENCODER || "auto").toLowerCase();
const liveCq = String(process.env.LEAGUE_LIVE_CQ || 20);
const liveCaptureCq = String(process.env.LEAGUE_LIVE_CAPTURE_CQ || 31);
const x264Crf = String(process.env.LEAGUE_LIVE_CRF || 20);
const x264CaptureCrf = String(process.env.LEAGUE_LIVE_CAPTURE_CRF || 32);
const captureBitrate = String(process.env.LEAGUE_LIVE_CAPTURE_BITRATE || "3500k");
const captureMaxrate = String(process.env.LEAGUE_LIVE_CAPTURE_MAXRATE || "5000k");
const captureBufsize = String(process.env.LEAGUE_LIVE_CAPTURE_BUFSIZE || "7000k");
const captureScale = String(process.env.LEAGUE_LIVE_CAPTURE_SCALE || "1280:-2").trim();
const capturePriority = String(process.env.LEAGUE_LIVE_PRIORITY || "Idle").trim();
const captureWindowTitle = String(process.env.LEAGUE_LIVE_WINDOW_TITLE || "League of Legends (TM) Client").trim();
const publishAfterGame = process.env.LEAGUE_LIVE_PUBLISH !== "0";
const npmBin = process.platform === "win32" ? "npm.cmd" : "npm";
let encoderProfilePromise;

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
  return await new Promise((resolve, reject) => {
    const child = execFile(command, args, {
      cwd: appRoot,
      maxBuffer: 64 * 1024 * 1024,
      shell: process.platform === "win32" && /\.cmd$/i.test(command),
      windowsHide: true,
      ...options
    }, (error, stdout, stderr) => {
      if (error) {
        error.stdout = stdout;
        error.stderr = stderr;
        reject(error);
        return;
      }
      resolve(stdout || "");
    });
    if (/^ffmpeg(?:\.exe)?$/i.test(path.basename(command))) {
      lowerProcessPriority(child.pid).catch(() => {});
    }
  });
}

async function ffmpegEncoders() {
  try {
    return await run("ffmpeg", ["-hide_banner", "-encoders"]);
  } catch {
    return "";
  }
}

function encoderArgs(profile, purpose = "review") {
  const isCapture = purpose === "capture";
  if (profile.name === "h264_nvenc") {
    return [
      "-c:v", "h264_nvenc",
      "-preset", isCapture ? "p1" : "p5",
      "-tune", isCapture ? "ll" : "hq",
      "-rc", "vbr",
      "-cq", isCapture ? liveCaptureCq : liveCq,
      "-b:v", captureBitrate,
      "-maxrate", captureMaxrate,
      "-bufsize", captureBufsize,
      "-pix_fmt", "yuv420p"
    ];
  }
  const preset = isCapture ? "ultrafast" : "veryfast";
  return [
    "-c:v", "libx264",
    "-preset", preset,
    "-crf", isCapture ? x264CaptureCrf : x264Crf,
    "-threads", isCapture ? "1" : "0",
    "-pix_fmt", "yuv420p"
  ];
}

async function encoderWorks(profile) {
  const testPath = path.join(analysisRoot, `encoder-test-${profile.name}.mp4`);
  await fs.mkdir(analysisRoot, { recursive: true });
  try {
    await run("ffmpeg", [
      "-y",
      "-hide_banner",
      "-loglevel", "error",
      "-f", "lavfi",
      "-i", "color=size=320x180:rate=30:duration=0.2",
      "-frames:v", "6",
      ...encoderArgs(profile, "review"),
      "-an",
      testPath
    ]);
    return true;
  } catch {
    return false;
  } finally {
    await fs.unlink(testPath).catch(() => {});
  }
}

async function encoderProfile() {
  if (!encoderProfilePromise) {
    encoderProfilePromise = (async () => {
      const encoders = await ffmpegEncoders();
      const wantsNvenc = encoderPreference === "auto" || encoderPreference === "nvenc" || encoderPreference === "h264_nvenc";
      if (wantsNvenc && /\bh264_nvenc\b/i.test(encoders)) {
        const nvenc = { name: "h264_nvenc", label: `NVIDIA hardware H.264, CQ ${liveCq}` };
        if (await encoderWorks(nvenc)) return nvenc;
      }
      return { name: "libx264", label: `CPU H.264 fallback, CRF ${x264Crf}` };
    })();
  }
  return encoderProfilePromise;
}

async function lowerProcessPriority(pid) {
  if (process.platform !== "win32" || !pid) return;
  const safePriority = /^(Idle|BelowNormal)$/i.test(capturePriority) ? capturePriority : "Idle";
  try {
    await run("powershell.exe", [
      "-NoProfile",
      "-WindowStyle", "Hidden",
      "-Command",
      `$p = Get-Process -Id ${Number(pid)} -ErrorAction SilentlyContinue; if ($p) { $p.PriorityClass = '${safePriority}' }`
    ]);
  } catch {
    await log(`Could not lower ffmpeg priority for pid ${pid}; capture continues.`);
  }
}

function processIsAlive(pid) {
  const id = Number(pid);
  if (!Number.isFinite(id) || id <= 0) return false;
  try {
    process.kill(id, 0);
    return true;
  } catch {
    return false;
  }
}

async function acquireLock() {
  await fs.mkdir(analysisRoot, { recursive: true });
  try {
    const handle = await fs.open(lockPath, "wx");
    await handle.writeFile(String(process.pid), "utf8");
    await handle.close();
  } catch {
    const lockPid = (await fs.readFile(lockPath, "utf8").catch(() => "")).trim();
    const stat = await fs.stat(lockPath).catch(() => null);
    if ((lockPid && !processIsAlive(lockPid)) || (stat && Date.now() - stat.mtimeMs > 24 * 60 * 60 * 1000)) {
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
      mtimeMs: stat.mtimeMs,
      matchSource: "League replay file"
    });
  }
  return candidates.sort((a, b) => b.mtimeMs - a.mtimeMs)[0] || null;
}

async function leagueClientCredentials() {
  const text = (await fs.readFile(leagueLockfile, "utf8").catch(() => "")).trim();
  const parts = text.split(":");
  const port = Number(parts[2]);
  const password = parts[3];
  if (!Number.isFinite(port) || !password) return null;
  return { port, password };
}

async function localLeagueJson(endpoint) {
  const credentials = await leagueClientCredentials();
  if (!credentials) return null;
  return await new Promise((resolve) => {
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    const request = https.request({
      hostname: "127.0.0.1",
      port: credentials.port,
      path: endpoint,
      method: "GET",
      rejectUnauthorized: false,
      auth: `riot:${credentials.password}`,
      timeout: 3000
    }, (response) => {
      let body = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => {
        body += chunk;
      });
      response.on("end", () => {
        try {
          finish(JSON.parse(body));
        } catch {
          finish(null);
        }
      });
    });
    request.on("error", () => finish(null));
    request.on("timeout", () => {
      request.destroy();
      finish(null);
    });
    request.end();
  });
}

async function latestLocalMatch(startMs, endMs) {
  const history = await localLeagueJson("/lol-match-history/v1/products/lol/current-summoner/matches?begIndex=0&endIndex=10");
  const games = Array.isArray(history?.games?.games) ? history.games.games : [];
  const windowStart = startMs - 20 * 60 * 1000;
  const windowEnd = endMs + 10 * 60 * 1000;
  const candidates = games
    .map((game) => ({
      matchId: `NA1-${game.gameId}`,
      gameCreationMs: Number(game.gameCreation) || 0
    }))
    .filter((game) => /^NA1-\d+$/i.test(game.matchId))
    .filter((game) => game.gameCreationMs >= windowStart && game.gameCreationMs <= windowEnd)
    .sort((a, b) => b.gameCreationMs - a.gameCreationMs);
  return candidates[0] ? { matchId: candidates[0].matchId, matchSource: "League Client match history" } : null;
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
  const encoder = await encoderProfile();
  const inputTarget = captureWindowTitle ? `title=${captureWindowTitle}` : "desktop";
  const filters = [];
  if (captureScale && !/^(0|none|off)$/i.test(captureScale)) {
    filters.push(`scale=${captureScale}:flags=fast_bilinear`);
  }
  const args = [
    "-y",
    "-hide_banner",
    "-loglevel", "error",
    "-f", "gdigrab",
    "-framerate", fps,
    "-rtbufsize", "64M",
    "-draw_mouse", "1",
    "-i", inputTarget,
    "-an",
    ...(filters.length ? ["-vf", filters.join(",")] : []),
    ...encoderArgs(encoder, "capture"),
    "-force_key_frames", `expr:gte(t,n_forced*${segmentSeconds})`,
    "-f", "segment",
    "-segment_time", String(segmentSeconds),
    "-segment_format", "matroska",
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
  child.once("exit", (code, signal) => {
    if (code || signal) {
      fs.appendFile(path.join(sessionRoot, "ffmpeg.log"), `\nffmpeg exited with code ${code ?? ""} signal ${signal ?? ""}\n`).catch(() => {});
    }
  });
  await lowerProcessPriority(child.pid);
  await log(`Started low-impact League window capture in ${sessionRoot} using ${encoder.label} at ${fps} fps, ${captureScale || "source"} scale, ${capturePriority} priority, input ${inputTarget}.`);
  return {
    child,
    sessionRoot,
    encoder: encoder.name,
    inputTarget,
    startedAt,
    startedMs: startedAt.getTime(),
    lastSeenMs: Date.now()
  };
}

async function waitForNoGame(reason) {
  let logged = false;
  while (await gameIsRunning()) {
    if (!logged) {
      await log(`${reason}; waiting because a League game is running.`);
      logged = true;
    }
    await delay(10000);
  }
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
  const encoder = await encoderProfile();
  const outputPath = path.join(sessionRoot, `processed-${String(segment.index).padStart(4, "0")}.mp4`);
  await run("ffmpeg", [
    "-y",
    "-hide_banner",
    "-loglevel", "error",
    "-i", segment.filePath,
    "-vf", `setpts=PTS/${speed},fps=${fps}`,
    "-an",
    ...encoderArgs(encoder, "review"),
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

  const replay = await latestReplay(session.startedMs, session.endedMs) || await latestLocalMatch(session.startedMs, session.endedMs);
  const outputPath = await nextOutputPath(replay?.matchId);
  const importantIndexes = importantSegmentIndexes(segments);
  const processed = [];
  for (const segment of segments) {
    await waitForNoGame("Post-game video processing paused");
    processed.push(await processSegment(segment, importantIndexes, session.sessionRoot));
  }
  const listPath = path.join(session.sessionRoot, "processed.txt");
  const joinedPath = path.join(session.sessionRoot, "processed.mp4");
  await writeConcatList(listPath, processed.map((item) => item.outputPath));
  await waitForNoGame("Post-game video join paused");
  await run("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", listPath, "-c", "copy", joinedPath]);
  await fs.mkdir(sourceDir, { recursive: true });
  const encoder = await encoderProfile();
  await waitForNoGame("Post-game final encode paused");
  await run("ffmpeg", [
    "-y",
    "-hide_banner",
    "-loglevel", "error",
    "-i", joinedPath,
    ...encoderArgs(encoder, "review"),
    "-an",
    "-movflags", "+faststart",
    outputPath
  ]);
  const duration = await probeDuration(outputPath);
  const sidecar = {
    createdAt: new Date().toISOString(),
    source: "AO Labs League live recorder",
    matchId: replay?.matchId || "",
    matchSource: replay?.matchSource || "",
    startedAt: session.startedAt.toISOString(),
    endedAt: session.endedAt.toISOString(),
    outputPath,
    durationSeconds: duration,
    sourceDurationSeconds: elapsedSeconds,
    encoder: encoder.name,
    videoQuality: encoder.name === "h264_nvenc" ? `capture CQ ${liveCaptureCq}, review CQ ${liveCq}` : `capture CRF ${x264CaptureCrf}, review CRF ${x264Crf}`,
    segmentSeconds,
    fastForwardSpeed,
    captureFps: Number(fps),
    captureScale,
    capturePriority,
    captureInput: session.inputTarget,
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
    await waitForNoGame("Publishing paused");
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
