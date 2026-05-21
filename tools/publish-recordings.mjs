import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { clearEtaFields, etaFields, recordPublishComplete } from "./league-post-game-eta.mjs";

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, "..");
const analysisRoot = path.join(appRoot, "_recording-analysis");
const statePath = path.join(analysisRoot, "source-state.json");
const lockPath = path.join(analysisRoot, "publish-recordings.lock");
const retryStatePath = path.join(analysisRoot, "analysis-retry-state.json");
const statusPath = path.join(analysisRoot, "recording-status.json");
const sourceDir = process.env.LEAGUE_RECORDINGS_DIR || "C:\\Users\\phama\\Documents\\League of Legends\\Highlights";
const npmBin = process.platform === "win32" ? "npm.cmd" : "npm";
const railwayBin = process.platform === "win32" ? "railway.cmd" : "railway";
const liveBase = (process.env.LEAGUE_SITE_URL || "https://league.aolabs.io").replace(/\/+$/, "");
const statusEndpoint = String(process.env.LEAGUE_STATUS_ENDPOINT || `${liveBase}/api/recording-status`).trim();
const statusToken = String(process.env.LEAGUE_STATUS_TOKEN || process.env.LEAGUE_WRITE_TOKEN || "").trim();
const livePublishWaitMs = Number(process.env.LEAGUE_LIVE_PUBLISH_WAIT_MS || 5 * 60 * 1000);
const sourceVideoPattern = /\.(webm|mp4)$/i;
const fallbackRetryMs = Number(process.env.LEAGUE_ANALYSIS_RETRY_MINUTES || 60) * 60 * 1000;
const expectedSourceFile = String(process.env.LEAGUE_EXPECT_SOURCE_FILE || "").trim();
const recordingPublishPaths = [
  "public/recordings"
];
const codePublishPaths = [
  "public/app.js",
  "public/index.html",
  "public/styles.css",
  "public/league-practice-room.pdf",
  "public/league-practice-room.tex",
  "server.js",
  "tools/sync-recordings.mjs",
  "tools/league-live-recorder.mjs",
  "tools/publish-recordings.mjs",
  "tools/publish-recordings.ps1",
  "tools/install-live-recorder-task.ps1",
  "tools/install-league-automation.ps1",
  "README.md"
];
const publishPaths = process.env.LEAGUE_PUBLISH_INCLUDE_CODE === "1"
  ? [...recordingPublishPaths, ...codePublishPaths]
  : recordingPublishPaths;
const ignoredSourceVideoPattern = /\.with-desktop-pauses\.(webm|mp4)$/i;

function commandNeedsShell(command) {
  return process.platform === "win32" && /\.cmd$/i.test(command);
}

function shellArg(arg) {
  const value = String(arg);
  if (!/[\s"]/u.test(value)) return value;
  return `"${value.replace(/"/g, '\\"')}"`;
}

async function run(command, args, options = {}) {
  const useShell = commandNeedsShell(command);
  const result = await execFileAsync(command, useShell ? args.map(shellArg) : args, {
    cwd: appRoot,
    maxBuffer: 64 * 1024 * 1024,
    shell: useShell,
    windowsHide: true,
    ...options
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  return result;
}

async function runWithStatusHeartbeat(command, args, status, fields = {}, options = {}) {
  let posting = null;
  const intervalMs = Number(options.intervalMs || 30000);
  const post = () => {
    if (posting) return;
    posting = publishStatus(status, fields).finally(() => {
      posting = null;
    });
  };
  await publishStatus(status, fields);
  const timer = setInterval(post, intervalMs);
  timer.unref?.();
  try {
    return await run(command, args, options.runOptions || {});
  } finally {
    clearInterval(timer);
    if (posting) await posting.catch(() => {});
  }
}

function clean(value, limit = 180) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, limit);
}

async function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function cleanEtaSeconds(value) {
  if (value === null || value === undefined || value === "") return null;
  const seconds = Number(value);
  if (!Number.isFinite(seconds)) return null;
  return Math.max(0, Math.min(60 * 60, Math.round(seconds)));
}

async function publishStatus(status, fields = {}) {
  const existing = JSON.parse(await fs.readFile(statusPath, "utf8").catch(() => "{}"));
  const hasEtaSeconds = Object.prototype.hasOwnProperty.call(fields, "etaSeconds");
  const hasEstimatedReadyAt = Object.prototype.hasOwnProperty.call(fields, "estimatedReadyAt");
  const hasEtaBasis = Object.prototype.hasOwnProperty.call(fields, "etaBasis");
  const payload = {
    ...existing,
    status,
    label: clean(fields.label || status, 80),
    detail: clean(fields.detail || "", 180),
    mode: clean(fields.mode || existing.mode || "publisher", 40),
    matchId: clean(fields.matchId || existing.matchId || "", 40),
    startedAt: clean(fields.startedAt || existing.startedAt || "", 40),
    progress: Number.isFinite(Number(fields.progress)) ? Math.max(0, Math.min(100, Number(fields.progress))) : existing.progress,
    etaSeconds: hasEtaSeconds ? cleanEtaSeconds(fields.etaSeconds) : cleanEtaSeconds(existing.etaSeconds),
    estimatedReadyAt: hasEstimatedReadyAt ? clean(fields.estimatedReadyAt, 40) : clean(existing.estimatedReadyAt, 40),
    etaBasis: hasEtaBasis ? clean(fields.etaBasis, 100) : clean(existing.etaBasis, 100),
    updatedAt: new Date().toISOString()
  };
  await fs.mkdir(analysisRoot, { recursive: true });
  await fs.writeFile(statusPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  if (!statusToken || !/^https?:\/\//i.test(statusEndpoint)) return;
  await fetch(statusEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${statusToken}`
    },
    body: JSON.stringify(payload)
  }).catch(() => {});
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
    return true;
  } catch {
    const lockPid = (await fs.readFile(lockPath, "utf8").catch(() => "")).trim();
    const stat = await fs.stat(lockPath).catch(() => null);
    const stale = stat && Date.now() - stat.mtimeMs > 45 * 60 * 1000;
    if ((lockPid && !processIsAlive(lockPid)) || stale) {
      await fs.unlink(lockPath).catch(() => {});
      return acquireLock();
    }
    console.log("League recording publish already running.");
    return false;
  }
}

async function releaseLock() {
  await fs.unlink(lockPath).catch(() => {});
}

async function sourceState() {
  const entries = await fs.readdir(sourceDir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (!entry.isFile() || !sourceVideoPattern.test(entry.name) || ignoredSourceVideoPattern.test(entry.name)) continue;
    const absolute = path.join(sourceDir, entry.name);
    const stat = await fs.stat(absolute);
    files.push({
      name: entry.name,
      size: stat.size,
      mtimeMs: Math.round(stat.mtimeMs)
    });
  }
  files.sort((a, b) => a.mtimeMs - b.mtimeMs || a.name.localeCompare(b.name));
  return {
    version: 1,
    sourceDir,
    files
  };
}

async function readPreviousState() {
  try {
    return JSON.parse(await fs.readFile(statePath, "utf8"));
  } catch {
    return null;
  }
}

function sameState(a, b) {
  return JSON.stringify(a || null) === JSON.stringify(b || null);
}

async function hasGitChanges() {
  const { stdout } = await execFileAsync("git", ["status", "--porcelain"], {
    cwd: appRoot,
    maxBuffer: 16 * 1024 * 1024
  });
  return stdout.trim().length > 0;
}

async function hasStagedChanges() {
  const { stdout } = await execFileAsync("git", ["diff", "--cached", "--name-only"], {
    cwd: appRoot,
    maxBuffer: 16 * 1024 * 1024
  });
  return stdout.trim().length > 0;
}

async function stagedPathList(paths = []) {
  const args = ["diff", "--cached", "--name-only"];
  if (paths.length) args.push("--", ...paths);
  const { stdout } = await execFileAsync("git", args, {
    cwd: appRoot,
    maxBuffer: 16 * 1024 * 1024
  });
  return stdout.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

async function hasPublishPathChanges() {
  const { stdout } = await execFileAsync("git", ["status", "--porcelain=v1", "--ignored=no", "--", ...publishPaths], {
    cwd: appRoot,
    maxBuffer: 16 * 1024 * 1024
  });
  return stdout.trim().length > 0;
}

async function gitPorcelain() {
  const { stdout } = await execFileAsync("git", ["status", "--porcelain=v1", "--ignored=no"], {
    cwd: appRoot,
    maxBuffer: 16 * 1024 * 1024
  });
  return stdout.trim();
}

async function needsAnalysisRetry() {
  if (!process.env.OPENAI_API_KEY) return false;
  if (process.env.LEAGUE_RETRY_FALLBACK !== "1" && process.env.LEAGUE_FORCE_ANALYSIS !== "1") return false;
  try {
    const manifest = JSON.parse(await fs.readFile(path.join(appRoot, "public", "recordings", "recordings.json"), "utf8"));
    const hasFallback = Array.isArray(manifest.recordings) && manifest.recordings.some((item) => item.analysisSource === "fallback");
    if (!hasFallback) return false;
    if (process.env.LEAGUE_FORCE_ANALYSIS === "1") return true;
    const state = JSON.parse(await fs.readFile(retryStatePath, "utf8").catch(() => "{}"));
    return Date.now() - Number(state.lastAttemptMs || 0) > fallbackRetryMs;
  } catch {
    return false;
  }
}

async function markAnalysisRetry() {
  await fs.writeFile(retryStatePath, `${JSON.stringify({
    lastAttemptAt: new Date().toISOString(),
    lastAttemptMs: Date.now()
  }, null, 2)}\n`, "utf8");
}

function newestSourceFile(state) {
  const files = Array.isArray(state?.files) ? state.files : [];
  return [...files].sort((a, b) => Number(b.mtimeMs || 0) - Number(a.mtimeMs || 0) || String(a.name).localeCompare(String(b.name)))[0] || null;
}

async function sourceFileContext(fileName) {
  if (!fileName) return {};
  const sidecar = await readJson(path.join(sourceDir, `${fileName}.json`), {}).catch(() => ({}));
  const stat = await fs.stat(path.join(sourceDir, fileName)).catch(() => null);
  return {
    sourceDurationSeconds: Number(sidecar.sourceDurationSeconds) || null,
    reviewDurationSeconds: Number(sidecar.durationSeconds) || null,
    segmentCount: Array.isArray(sidecar.segments) ? sidecar.segments.length : null,
    sourceBytes: stat?.size || null
  };
}

async function etaFor(stage, fallbackSeconds, startedAt, context = {}) {
  return await etaFields({
    analysisRoot,
    sourceDir,
    stage,
    fallbackSeconds,
    startedAt,
    context
  });
}

async function liveManifestContains(fileName) {
  if (!fileName) return false;
  const response = await fetch(`${liveBase}/recordings/recordings.json?verify=${Date.now()}`, {
    headers: { Accept: "application/json" },
    cache: "no-store"
  });
  if (!response.ok) return false;
  const manifest = await response.json();
  const recordings = Array.isArray(manifest.recordings) ? manifest.recordings : [];
  return recordings.some((item) => {
    const src = String(item.src || "");
    return item.file === fileName || item.publicFile === fileName || src.endsWith(`/${fileName}`);
  });
}

async function waitForLiveRecording(currentState, options = {}) {
  const latest = newestSourceFile(currentState);
  if (!latest?.name) return false;
  const deadline = Date.now() + livePublishWaitMs;
  while (Date.now() < deadline) {
    await publishStatus("publishing", {
      label: "publishing review",
      detail: "Waiting for league.aolabs.io to serve the new recording.",
      progress: 98,
      ...(await etaFor("deploy_to_live", 4 * 60, options.deployStartedAt, options.context))
    });
    if (await liveManifestContains(latest.name).catch(() => false)) return true;
    await new Promise((resolve) => setTimeout(resolve, 10000));
  }
  return false;
}

async function main() {
  if (!(await acquireLock())) return;
  await fs.mkdir(analysisRoot, { recursive: true });
  try {
    const publishStartedAt = new Date();
    const currentState = await sourceState();
    const latest = newestSourceFile(currentState);
    const latestContext = await sourceFileContext(latest?.name);
    const previousState = await readPreviousState();
    const retryAnalysis = await needsAnalysisRetry();
    const expectedMissingLive = expectedSourceFile
      ? !(await liveManifestContains(expectedSourceFile).catch(() => false))
      : false;
    if (sameState(currentState, previousState) && process.env.LEAGUE_FORCE_ANALYSIS !== "1" && !retryAnalysis && !expectedMissingLive) {
      console.log("No new League recordings.");
      return;
    }

    const stagedBefore = await stagedPathList();
    if (stagedBefore.length && process.env.LEAGUE_FORCE_PUBLISH_DIRTY !== "1") {
      const detail = `Publish blocked because staged local edits exist: ${stagedBefore.slice(0, 4).join(", ")}`;
      await publishStatus("blocked", {
        label: "publish blocked",
        detail,
        progress: 100,
        ...clearEtaFields()
      });
      throw new Error(detail);
    }

    const before = await gitPorcelain();
    if (before && process.env.LEAGUE_FORCE_PUBLISH_DIRTY !== "1") {
      console.log(`League publish continuing with active local edits; only recording publish paths will be staged:\n${before}`);
      await publishStatus("publishing", {
        label: "publishing review",
        detail: "Local edits are present; publishing recording files only.",
        progress: 82,
        ...(await etaFor("publisher_to_live", 12 * 60, publishStartedAt, latestContext))
      });
    }

    await run("git", ["pull", "--rebase", "--autostash", "origin", "main"]);
    if (retryAnalysis) await markAnalysisRetry();
    await publishStatus("processing", {
      label: "analyzing review",
      detail: "Reading the recording and writing the site feedback.",
      progress: 84,
      ...(await etaFor("publisher_to_live", 12 * 60, publishStartedAt, latestContext))
    });
    await runWithStatusHeartbeat(npmBin, ["run", "sync:recordings"], "processing", {
      label: "analyzing review",
      detail: "Still reading the recording and writing the site feedback.",
      progress: 84,
      ...(await etaFor("publisher_to_live", 12 * 60, publishStartedAt, latestContext))
    });
    if (!(await hasPublishPathChanges())) {
      await fs.writeFile(statePath, `${JSON.stringify(currentState, null, 2)}\n`, "utf8");
      console.log("League recordings synced; no public recording changes.");
      return;
    }

    await publishStatus("publishing", {
      label: "publishing review",
      detail: "Saving the analyzed recording for the site.",
      progress: 92,
      ...(await etaFor("publisher_to_live", 12 * 60, publishStartedAt, latestContext))
    });
    await run("git", ["add", "-f", "--", ...publishPaths]);
    if (!(await hasStagedChanges())) {
      console.log("League recordings synced; no publishable changes.");
      return;
    }
    await run("git", ["commit", "-m", `Update League recordings ${new Date().toISOString().slice(0, 10)}`]);
    await run("git", ["pull", "--rebase", "--autostash", "origin", "main"]);
    await run("git", ["push", "origin", "main"]);
    const deployStartedAt = new Date();
    await publishStatus("publishing", {
      label: "deploying review",
      detail: "Deploying the updated recording page.",
      progress: 96,
      ...(await etaFor("deploy_to_live", 4 * 60, deployStartedAt, latestContext))
    });
    await run(railwayBin, ["up", "--detach", "--message", "Update League recordings"]);
    if (!(await waitForLiveRecording(currentState, { deployStartedAt, context: latestContext }))) {
      throw new Error("Timed out waiting for league.aolabs.io to serve the new recording.");
    }
    const liveAt = new Date();
    if (latest?.name) {
      await recordPublishComplete({
        analysisRoot,
        sourceDir,
        fileName: latest.name,
        publishStartedAt: publishStartedAt.toISOString(),
        deployStartedAt: deployStartedAt.toISOString(),
        liveAt: liveAt.toISOString()
      }).catch(() => {});
    }
    await publishStatus("published", {
      label: "review live",
      detail: "The new recording is on league.aolabs.io.",
      progress: 100,
      ...clearEtaFields()
    });
    await fs.writeFile(statePath, `${JSON.stringify(currentState, null, 2)}\n`, "utf8");
    console.log("League recordings published.");
  } finally {
    await releaseLock();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
