import { spawn, execFile } from "node:child_process";
import fsSync from "node:fs";
import fs from "node:fs/promises";
import https from "node:https";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { clearEtaFields, etaFields } from "./league-post-game-eta.mjs";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, "..");
const analysisRoot = path.join(appRoot, "_recording-analysis");
const sourceDir = process.env.LEAGUE_RECORDINGS_DIR || "C:\\Users\\phama\\Documents\\League of Legends\\Highlights";
const replayDir = process.env.LEAGUE_REPLAY_DIR || path.join(path.dirname(sourceDir), "Replays");
const captureRoot = process.env.LEAGUE_AUTO_CAPTURE_DIR || path.join(path.dirname(sourceDir), "AO Labs Live Captures");
const leagueLockfile = process.env.LEAGUE_LOCKFILE || "C:\\Riot Games\\League of Legends\\lockfile";
const lockPath = path.join(analysisRoot, "league-live-recorder.lock");
const logPath = path.join(analysisRoot, "league-live-recorder.log");
const pollMs = Number(process.env.LEAGUE_LIVE_POLL_MS || 2500);
const endGraceMs = Number(process.env.LEAGUE_LIVE_END_GRACE_MS || 35000);
const segmentSeconds = Number(process.env.LEAGUE_LIVE_SEGMENT_SECONDS || 15);
const fastForwardSpeed = Number(process.env.LEAGUE_LIVE_FAST_FORWARD || 8);
const minGameSeconds = Number(process.env.LEAGUE_LIVE_MIN_GAME_SECONDS || 90);
const minCaptureSegmentBytes = Number(process.env.LEAGUE_LIVE_MIN_SEGMENT_BYTES || 16 * 1024);
const minCaptureCoverage = Number(process.env.LEAGUE_LIVE_MIN_CAPTURE_COVERAGE || 0.6);
const maxCaptureRestarts = Number(process.env.LEAGUE_LIVE_MAX_CAPTURE_RESTARTS || 20);
const captureStallMs = Number(process.env.LEAGUE_LIVE_CAPTURE_STALL_MS || 45000);
const minCaptureGrowthBytes = Number(process.env.LEAGUE_LIVE_MIN_GROWTH_BYTES || 8 * 1024);
// Defaults favor in-game FPS over review smoothness. The site review only needs readable decisions.
const fps = String(process.env.LEAGUE_LIVE_FPS || 1);
const encoderPreference = String(process.env.LEAGUE_LIVE_ENCODER || "auto").toLowerCase();
const liveCq = String(process.env.LEAGUE_LIVE_CQ || 20);
const liveCaptureCq = String(process.env.LEAGUE_LIVE_CAPTURE_CQ || 30);
const x264Crf = String(process.env.LEAGUE_LIVE_CRF || 20);
const x264CaptureCrf = String(process.env.LEAGUE_LIVE_CAPTURE_CRF || 36);
const captureBitrate = String(process.env.LEAGUE_LIVE_CAPTURE_BITRATE || "2500k");
const captureMaxrate = String(process.env.LEAGUE_LIVE_CAPTURE_MAXRATE || "3500k");
const captureBufsize = String(process.env.LEAGUE_LIVE_CAPTURE_BUFSIZE || "4500k");
const captureGop = String(Math.max(1, Math.round((Number(fps) || 4) * (Number(segmentSeconds) || 10))));
const captureScale = String(process.env.LEAGUE_LIVE_CAPTURE_SCALE || "960:-2").trim();
const capturePriority = String(process.env.LEAGUE_LIVE_PRIORITY || "Idle").trim();
const captureApiPreference = String(process.env.LEAGUE_LIVE_CAPTURE_API || "dda").trim().toLowerCase();
const captureWindowTitle = String(process.env.LEAGUE_LIVE_WINDOW_TITLE || "League of Legends (TM) Client").trim();
const captureModePreference = String(process.env.LEAGUE_LIVE_CAPTURE_MODE || "region").trim().toLowerCase();
const reviewBuildMode = String(process.env.LEAGUE_REVIEW_BUILD_MODE || "copy").trim().toLowerCase();
const publishAfterGame = process.env.LEAGUE_LIVE_PUBLISH !== "0";
const skipCurrentGameOnRestart = process.env.LEAGUE_LIVE_SKIP_CURRENT_GAME !== "0";
const statusEndpoint = String(process.env.LEAGUE_STATUS_ENDPOINT || "https://league.aolabs.io/api/recording-status").trim();
const liveBase = String(process.env.LEAGUE_SITE_URL || "https://league.aolabs.io").replace(/\/+$/, "");
const statusToken = String(process.env.LEAGUE_STATUS_TOKEN || process.env.LEAGUE_WRITE_TOKEN || "").trim();
const statusPath = path.join(analysisRoot, "recording-status.json");
const postGameQueuePath = path.join(analysisRoot, "post-game-queue.json");
const postGameStatusHoldMs = Number(process.env.LEAGUE_POST_GAME_STATUS_HOLD_MS || 3 * 60 * 1000);
const postGameEtaFallbackSeconds = Number(process.env.LEAGUE_POST_GAME_ETA_FALLBACK_SECONDS || 6 * 60);
const clipToLiveEtaFallbackSeconds = Number(process.env.LEAGUE_CLIP_TO_LIVE_ETA_FALLBACK_SECONDS || 5 * 60);
const npmBin = process.platform === "win32" ? "npm.cmd" : "npm";
let encoderProfilePromise;
let lastStatusKey = "";
let lastStatusPostMs = 0;
let lastStatusErrorMs = 0;
let idleHoldStatus = null;
let postGameQueue = [];
let postGameQueueRunning = false;
let activeQueueSessionRoot = "";
let activeQueueStage = "";
let activeQueueStageLabel = "";
let activeQueueStartedAt = "";
let activeQueueEta = {};
let activeQueueProgress = null;
let activeRecordingSession = null;
let gameLengthEstimateCache = null;
let shuttingDownForLostLock = false;

function clean(value, fallback = "") {
  return String(value || fallback).replace(/\s+/g, " ").trim();
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function serializeSession(session) {
  return {
    sessionRoot: session.sessionRoot,
    encoder: session.encoder || "",
    inputTarget: session.inputTarget || "desktop",
    captureMode: session.captureMode || captureModePreference,
    captureRect: session.captureRect || null,
    startedAt: session.startedAt?.toISOString?.() || new Date(session.startedMs || Date.now()).toISOString(),
    endedAt: session.endedAt?.toISOString?.() || new Date(session.endedMs || Date.now()).toISOString(),
    startedMs: Number(session.startedMs || Date.parse(session.startedAt || "")),
    endedMs: Number(session.endedMs || Date.parse(session.endedAt || "")),
    foregroundPauseMs: Number(session.foregroundPauseMs || 0),
    taintedSegmentIndexes: [...(session.taintedSegmentIndexes instanceof Set ? session.taintedSegmentIndexes : new Set(session.taintedSegmentIndexes || []))],
    queuedAt: new Date().toISOString()
  };
}

function deserializeSession(item) {
  const startedAt = new Date(item.startedAt || item.startedMs || Date.now());
  const endedAt = new Date(item.endedAt || item.endedMs || Date.now());
  return {
    sessionRoot: item.sessionRoot,
    encoder: item.encoder || "",
    inputTarget: item.inputTarget || "desktop",
    captureMode: item.captureMode || captureModePreference,
    captureRect: item.captureRect || null,
    startedAt,
    endedAt,
    startedMs: Number.isFinite(Number(item.startedMs)) ? Number(item.startedMs) : startedAt.getTime(),
    endedMs: Number.isFinite(Number(item.endedMs)) ? Number(item.endedMs) : endedAt.getTime(),
    foregroundPauseMs: Number(item.foregroundPauseMs || 0),
    foregroundPauseStartedMs: null,
    pausedForForeground: false,
    taintedSegmentIndexes: new Set(Array.isArray(item.taintedSegmentIndexes) ? item.taintedSegmentIndexes : [])
  };
}

async function loadPostGameQueue() {
  const raw = (await fs.readFile(postGameQueuePath, "utf8").catch(() => "[]")).replace(/^\uFEFF/, "");
  const parsed = JSON.parse(raw);
  const rows = Array.isArray(parsed) ? parsed : (parsed?.sessionRoot ? [parsed] : []);
  postGameQueue = rows.filter((item) => item?.sessionRoot);
  if (!Array.isArray(parsed)) await savePostGameQueue();
}

async function savePostGameQueue() {
  await fs.mkdir(analysisRoot, { recursive: true });
  await fs.writeFile(postGameQueuePath, `${JSON.stringify(postGameQueue, null, 2)}\n`, "utf8");
}

function sourceDurationSecondsForQueueItem(item) {
  const startedMs = Number(item?.startedMs || Date.parse(item?.startedAt || ""));
  const endedMs = Number(item?.endedMs || Date.parse(item?.endedAt || ""));
  if (!Number.isFinite(startedMs) || !Number.isFinite(endedMs) || endedMs <= startedMs) return null;
  return Math.max(0, Math.round((endedMs - startedMs) / 1000));
}

async function estimateQueuedReviewSeconds(item) {
  const sourceDurationSeconds = sourceDurationSecondsForQueueItem(item);
  const fields = await etaFor("post_game_total", postGameEtaFallbackSeconds, new Date().toISOString(), { sourceDurationSeconds });
  return {
    seconds: Math.max(20, Number(fields.etaSeconds) || postGameEtaFallbackSeconds),
    basis: fields.etaBasis || "trained from recent post-game history"
  };
}

async function estimatedGameLengthSeconds() {
  const now = Date.now();
  if (gameLengthEstimateCache && now - gameLengthEstimateCache.readAt < 60 * 1000) return gameLengthEstimateCache;
  const values = [];
  const history = JSON.parse(await fs.readFile(path.join(analysisRoot, "post-game-eta-history.json"), "utf8").catch(() => "{}"));
  for (const sample of Array.isArray(history.samples) ? history.samples : []) {
    const seconds = Number(sample?.sourceDurationSeconds);
    if (Number.isFinite(seconds) && seconds >= 8 * 60 && seconds <= 70 * 60) values.push(seconds);
  }
  const sidecars = await fs.readdir(sourceDir).catch(() => []);
  for (const name of sidecars.filter((entry) => /\.mp4\.json$/i.test(entry)).slice(-30)) {
    const sidecar = JSON.parse(await fs.readFile(path.join(sourceDir, name), "utf8").catch(() => "{}"));
    const seconds = Number(sidecar?.sourceDurationSeconds || sidecar?.gameLengthSeconds);
    if (Number.isFinite(seconds) && seconds >= 8 * 60 && seconds <= 70 * 60) values.push(seconds);
  }
  values.sort((a, b) => a - b);
  const index = values.length ? Math.min(values.length - 1, Math.max(0, Math.floor((values.length - 1) * 0.65))) : -1;
  gameLengthEstimateCache = {
    readAt: now,
    seconds: index >= 0 ? Math.round(values[index]) : 30 * 60,
    basis: index >= 0 ? `trained on ${values.length} recent game lengths` : "using 30m game fallback until more games finish"
  };
  return gameLengthEstimateCache;
}

async function queueStatusFields() {
  const now = Date.now();
  let cumulativeSeconds = 0;
  const items = [];
  for (let index = 0; index < postGameQueue.length; index += 1) {
    const item = postGameQueue[index];
    const isActive = item.sessionRoot === activeQueueSessionRoot;
    const estimate = isActive
      ? {
          seconds: Math.max(20, Number(activeQueueEta.etaSeconds) || 60),
          basis: activeQueueEta.etaBasis || "live stage estimate"
        }
      : await estimateQueuedReviewSeconds(item);
    const startEtaSeconds = cumulativeSeconds;
    const stageEtaSeconds = estimate.seconds;
    const etaSeconds = startEtaSeconds + stageEtaSeconds;
    const estimatedStartAt = new Date(now + startEtaSeconds * 1000).toISOString();
    const estimatedReadyAt = new Date(now + etaSeconds * 1000).toISOString();
    items.push({
      label: `review ${index + 1}`,
      status: isActive ? "processing" : "queued",
      stage: isActive ? activeQueueStage || "processing" : "queued",
      stageLabel: isActive ? activeQueueStageLabel || "processing review" : (index === 0 ? "next to process" : "waiting behind earlier review"),
      startedAt: clean(item.startedAt, ""),
      endedAt: clean(item.endedAt, ""),
      queuedAt: clean(item.queuedAt, ""),
      estimatedStartAt,
      estimatedReadyAt,
      startEtaSeconds,
      etaSeconds,
      stageEtaSeconds,
      etaBasis: estimate.basis,
      progress: isActive && Number.isFinite(Number(activeQueueProgress)) ? Math.round(Number(activeQueueProgress)) : null
    });
    cumulativeSeconds = etaSeconds;
  }
  if (activeRecordingSession?.startedMs) {
    const gameEstimate = await estimatedGameLengthSeconds();
    const elapsedSeconds = Math.max(0, Math.round((now - Number(activeRecordingSession.startedMs || now)) / 1000));
    const targetGameSeconds = Math.max(gameEstimate.seconds, elapsedSeconds + 5 * 60);
    const gameEtaSeconds = Math.max(60, targetGameSeconds - elapsedSeconds);
    const reviewEstimate = await estimateQueuedReviewSeconds({
      startedMs: activeRecordingSession.startedMs,
      endedMs: Number(activeRecordingSession.startedMs) + targetGameSeconds * 1000
    });
    const startEtaSeconds = Math.max(cumulativeSeconds, gameEtaSeconds);
    const etaSeconds = startEtaSeconds + reviewEstimate.seconds;
    items.push({
      label: "current game",
      status: "recording",
      stage: "recording",
      stageLabel: "recording current game; review waits for game end",
      startedAt: clean(activeRecordingSession.startedAt?.toISOString?.() || activeRecordingSession.startedAt, ""),
      endedAt: "",
      queuedAt: "",
      estimatedGameEndAt: new Date(now + gameEtaSeconds * 1000).toISOString(),
      estimatedStartAt: new Date(now + startEtaSeconds * 1000).toISOString(),
      estimatedReadyAt: new Date(now + etaSeconds * 1000).toISOString(),
      gameEtaSeconds,
      startEtaSeconds,
      etaSeconds,
      stageEtaSeconds: gameEtaSeconds,
      etaBasis: `${gameEstimate.basis}; ${reviewEstimate.basis}`,
      progress: Math.max(6, Math.min(88, Math.round((elapsedSeconds / targetGameSeconds) * 100)))
    });
  }
  return {
    queueCount: items.length,
    queueItems: items.slice(0, 5)
  };
}

async function enqueuePostGameSession(session) {
  const item = serializeSession(session);
  if (!postGameQueue.some((queued) => queued.sessionRoot === item.sessionRoot)) {
    postGameQueue.push(item);
    await savePostGameQueue();
    await log(`Queued post-game processing for ${item.sessionRoot}.`);
  }
  processPostGameQueue().catch((error) => {
    log(`Post-game queue worker failed: ${error.stack || error.message}`).catch(() => {});
  });
}

function holdIdleStatus(status, fields = {}) {
  idleHoldStatus = {
    status,
    fields: { ...fields },
    untilMs: Date.now() + postGameStatusHoldMs
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
    cache: "no-store",
    signal: AbortSignal.timeout(7000)
  });
  if (!response.ok) return false;
  const manifest = await response.json();
  const recordings = Array.isArray(manifest.recordings) ? manifest.recordings : [];
  return recordings.some((item) => {
    const src = String(item.src || "");
    return item.file === fileName || item.publicFile === fileName || src.endsWith(`/${fileName}`);
  });
}

async function reconcileBlockedHoldIfLive() {
  if (!idleHoldStatus || idleHoldStatus.status !== "blocked") return false;
  const fileName = idleHoldStatus.fields?.outputFile || "";
  const matchId = idleHoldStatus.fields?.matchId || "";
  const inferredFile = fileName || (matchId ? `auto_${matchId}_01.mp4` : "");
  if (!inferredFile || !(await liveManifestContains(inferredFile).catch(() => false))) return false;
  const fields = {
    ...idleHoldStatus.fields,
    label: "review live",
    detail: "The new recording is on league.aolabs.io.",
    progress: 100,
    ...clearEtaFields()
  };
  idleHoldStatus = {
    status: "published",
    fields,
    untilMs: Date.now() + postGameStatusHoldMs
  };
  await publishRecorderStatus("published", fields, { force: true });
  return true;
}

async function log(message) {
  const line = `${new Date().toISOString()} ${message}\n`;
  await fs.mkdir(analysisRoot, { recursive: true });
  await fs.appendFile(logPath, line, "utf8");
  process.stdout.write(line);
}

async function publishRecorderStatus(status, fields = {}, options = {}) {
  const queue = await queueStatusFields();
  const payload = {
    status,
    updatedAt: new Date().toISOString(),
    mode: captureModePreference,
    recorderPid: process.pid,
    ...fields,
    ...queue
  };
  await fs.mkdir(analysisRoot, { recursive: true });
  await fs.writeFile(statusPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8").catch(() => {});

  const key = JSON.stringify({
    status: payload.status,
    label: payload.label,
    detail: payload.detail,
    progress: payload.progress,
    mode: payload.mode,
    matchId: payload.matchId,
    startedAt: payload.startedAt,
    queueCount: payload.queueCount,
    queueFirstEndedAt: payload.queueItems?.[0]?.endedAt || ""
  });
  const throttleMs = Number(options.throttleMs ?? 15000);
  if (!options.force && key === lastStatusKey && Date.now() - lastStatusPostMs < throttleMs) return;
  lastStatusKey = key;
  lastStatusPostMs = Date.now();
  if (!statusEndpoint || !statusToken) return;

  try {
    const response = await fetch(statusEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-League-Status-Token": statusToken
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(3500)
    });
    if (!response.ok && Date.now() - lastStatusErrorMs > 120000) {
      lastStatusErrorMs = Date.now();
      await log(`Recording status update returned HTTP ${response.status}; capture continues.`);
    }
  } catch (error) {
    if (Date.now() - lastStatusErrorMs > 120000) {
      lastStatusErrorMs = Date.now();
      await log(`Recording status update failed; capture continues.`);
    }
  }
}

function sessionStatusFields(session, detail = "") {
  return {
    label: "recording",
    detail,
    mode: session.captureMode || captureModePreference,
    startedAt: session.startedAt?.toISOString?.() || "",
    matchId: "",
    progress: 35
  };
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
      ...(isCapture ? ["-g", captureGop, "-bf", "0"] : []),
      "-pix_fmt", "yuv420p"
    ];
  }
  const preset = isCapture ? "ultrafast" : "veryfast";
  return [
    "-c:v", "libx264",
    "-preset", preset,
    "-crf", isCapture ? x264CaptureCrf : x264Crf,
    "-threads", isCapture ? "1" : "0",
    ...(isCapture ? ["-g", captureGop, "-keyint_min", captureGop, "-sc_threshold", "0"] : []),
    "-pix_fmt", "yuv420p"
  ];
}

function finalReviewEncoderArgs() {
  return [
    "-c:v", "libx264",
    "-preset", "veryfast",
    "-crf", x264Crf,
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
  if (await stillOwnsLock()) await fs.unlink(lockPath).catch(() => {});
}

async function stillOwnsLock() {
  const lockPid = (await fs.readFile(lockPath, "utf8").catch(() => "")).trim();
  return lockPid === String(process.pid);
}

async function stopForLostLock(session) {
  if (shuttingDownForLostLock) return true;
  shuttingDownForLostLock = true;
  await log(`Live recorder lock moved to another pid; recorder ${process.pid} is exiting.`);
  if (session) {
    await stopCapture(session).catch(() => {});
    activeRecordingSession = null;
  }
  process.exit(0);
  return true;
}

async function gameIsRunning() {
  try {
    const stdout = await run("tasklist", ["/FI", "IMAGENAME eq League of Legends.exe", "/FO", "CSV", "/NH"]);
    if (/League of Legends\.exe/i.test(stdout)) return true;
  } catch {
    // Fall through to the League Client gameflow state below.
  }
  const phase = clean(await localLeagueJson("/lol-gameflow/v1/gameflow-phase"));
  return /^(InProgress|Reconnect)$/i.test(phase);
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

async function frameVisibility(filePath, second) {
  try {
    const { stdout } = await execFileAsync("ffmpeg", [
      "-v", "error",
      "-ss", String(Math.max(0, second)),
      "-i", filePath,
      "-frames:v", "1",
      "-vf", "scale=32:18,format=gray",
      "-f", "rawvideo",
      "-"
    ], {
      windowsHide: true,
      encoding: "buffer",
      maxBuffer: 1024 * 1024
    });
    const pixels = Buffer.from(stdout || []);
    if (!pixels.length) return null;
    let sum = 0;
    let squared = 0;
    for (const value of pixels) {
      sum += value;
      squared += value * value;
    }
    const mean = sum / pixels.length;
    const variance = Math.max(0, (squared / pixels.length) - (mean * mean));
    return { mean, stdev: Math.sqrt(variance) };
  } catch {
    return null;
  }
}

async function frameGreenArtifactRatio(filePath, second) {
  try {
    const { stdout } = await execFileAsync("ffmpeg", [
      "-v", "error",
      "-ss", String(Math.max(0, second)),
      "-i", filePath,
      "-frames:v", "1",
      "-vf", "scale=96:60,format=rgb24",
      "-f", "rawvideo",
      "-"
    ], {
      windowsHide: true,
      encoding: "buffer",
      maxBuffer: 1024 * 1024
    });
    const pixels = Buffer.from(stdout || []);
    if (pixels.length < 3) return null;
    let greenBlocks = 0;
    const total = Math.floor(pixels.length / 3);
    for (let offset = 0; offset + 2 < pixels.length; offset += 3) {
      const r = pixels[offset];
      const g = pixels[offset + 1];
      const b = pixels[offset + 2];
      if (g > 90 && r < 55 && b < 55 && g > r * 1.8 && g > b * 1.8) {
        greenBlocks += 1;
      }
    }
    return total ? greenBlocks / total : null;
  } catch {
    return null;
  }
}

async function videoHasVisibleFrames(filePath, duration) {
  const total = Number(duration) || 0;
  if (!(total > 0)) return true;
  const samples = [
    Math.min(20, total * 0.2),
    total * 0.5,
    total * 0.8
  ];
  const stats = [];
  for (const second of samples) {
    const stat = await frameVisibility(filePath, second);
    if (stat) stats.push(stat);
  }
  if (!stats.length) return true;
  return stats.some((item) => item.mean > 8 && item.stdev > 4);
}

async function videoHasGreenArtifacts(filePath, duration) {
  const total = Number(duration) || 0;
  if (!(total > 0)) return false;
  const samples = [
    total * 0.12,
    total * 0.22,
    total * 0.35,
    total * 0.5,
    total * 0.65,
    total * 0.8
  ];
  const ratios = [];
  for (const second of samples) {
    const ratio = await frameGreenArtifactRatio(filePath, second);
    if (Number.isFinite(ratio)) ratios.push(ratio);
  }
  if (!ratios.length) return false;
  const badFrames = ratios.filter((ratio) => ratio > 0.08).length;
  return badFrames >= 2 || ratios.some((ratio) => ratio > 0.2);
}

function captureModes() {
  if (/^(desktop|screen|full|full-screen|fullscreen)$/i.test(captureModePreference)) return ["desktop"];
  if (/^(title|window|window-title)$/i.test(captureModePreference)) return ["title"];
  if (/^(region|window-region)$/i.test(captureModePreference)) return ["region"];
  return ["desktop", "title", "region"];
}

async function leagueWindowRect() {
  if (process.platform !== "win32") return null;
  const script = `
$ErrorActionPreference = 'SilentlyContinue'
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public static class LeagueWindowCaptureNative {
  [StructLayout(LayoutKind.Sequential)]
  public struct RECT { public int Left; public int Top; public int Right; public int Bottom; }
  [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Auto)]
  public struct DEVMODE {
    private const int CCHDEVICENAME = 32;
    private const int CCHFORMNAME = 32;
    [MarshalAs(UnmanagedType.ByValTStr, SizeConst = CCHDEVICENAME)]
    public string dmDeviceName;
    public short dmSpecVersion;
    public short dmDriverVersion;
    public short dmSize;
    public short dmDriverExtra;
    public int dmFields;
    public int dmPositionX;
    public int dmPositionY;
    public int dmDisplayOrientation;
    public int dmDisplayFixedOutput;
    public short dmColor;
    public short dmDuplex;
    public short dmYResolution;
    public short dmTTOption;
    public short dmCollate;
    [MarshalAs(UnmanagedType.ByValTStr, SizeConst = CCHFORMNAME)]
    public string dmFormName;
    public short dmLogPixels;
    public int dmBitsPerPel;
    public int dmPelsWidth;
    public int dmPelsHeight;
  }
  [DllImport("user32.dll")]
  public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")]
  public static extern bool SetProcessDPIAware();
  [DllImport("user32.dll")]
  public static extern bool SetProcessDpiAwarenessContext(IntPtr dpiContext);
  [DllImport("dwmapi.dll")]
  public static extern int DwmGetWindowAttribute(IntPtr hwnd, int dwAttribute, out RECT pvAttribute, int cbAttribute);
  [DllImport("user32.dll")]
  public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);
  [DllImport("user32.dll", CharSet=CharSet.Auto)]
  public static extern bool EnumDisplaySettings(string deviceName, int modeNum, ref DEVMODE devMode);
}
"@
[void][LeagueWindowCaptureNative]::SetProcessDpiAwarenessContext([intptr](-4))
[void][LeagueWindowCaptureNative]::SetProcessDPIAware()
Add-Type -AssemblyName System.Windows.Forms
$p = Get-Process -ErrorAction SilentlyContinue | Where-Object { $_.ProcessName -eq 'League of Legends' -and $_.MainWindowHandle -ne 0 } | Select-Object -First 1
if (-not $p) { '{}'; exit 0 }
$r = New-Object LeagueWindowCaptureNative+RECT
$dwmRect = New-Object LeagueWindowCaptureNative+RECT
$dwmResult = [LeagueWindowCaptureNative]::DwmGetWindowAttribute($p.MainWindowHandle, 9, [ref]$dwmRect, [System.Runtime.InteropServices.Marshal]::SizeOf($dwmRect))
if ($dwmResult -eq 0 -and ($dwmRect.Right -gt $dwmRect.Left) -and ($dwmRect.Bottom -gt $dwmRect.Top)) {
  $r = $dwmRect
} else {
  [void][LeagueWindowCaptureNative]::GetWindowRect($p.MainWindowHandle, [ref]$r)
}
$screen = [System.Windows.Forms.Screen]::FromHandle($p.MainWindowHandle)
$mode = New-Object LeagueWindowCaptureNative+DEVMODE
$mode.dmSize = [System.Runtime.InteropServices.Marshal]::SizeOf($mode)
[void][LeagueWindowCaptureNative]::EnumDisplaySettings($screen.DeviceName, -1, [ref]$mode)
$scaleX = if ($screen.Bounds.Width -gt 0 -and $mode.dmPelsWidth -gt $screen.Bounds.Width) { $mode.dmPelsWidth / $screen.Bounds.Width } else { 1 }
$scaleY = if ($screen.Bounds.Height -gt 0 -and $mode.dmPelsHeight -gt $screen.Bounds.Height) { $mode.dmPelsHeight / $screen.Bounds.Height } else { 1 }
$width = $r.Right - $r.Left
$height = $r.Bottom - $r.Top
if ($scaleX -gt 1 -and $width -le ($screen.Bounds.Width + 8)) {
  $r.Left = [int][math]::Round($r.Left * $scaleX)
  $r.Right = [int][math]::Round($r.Right * $scaleX)
}
if ($scaleY -gt 1 -and $height -le ($screen.Bounds.Height + 8)) {
  $r.Top = [int][math]::Round($r.Top * $scaleY)
  $r.Bottom = [int][math]::Round($r.Bottom * $scaleY)
}
[pscustomobject]@{
  left = $r.Left
  top = $r.Top
  right = $r.Right
  bottom = $r.Bottom
  width = ($r.Right - $r.Left)
  height = ($r.Bottom - $r.Top)
  title = $p.MainWindowTitle
  logicalScreen = "$($screen.Bounds.Width)x$($screen.Bounds.Height)"
  physicalScreen = "$($mode.dmPelsWidth)x$($mode.dmPelsHeight)"
  dpiScale = "$scaleX,$scaleY"
  isForeground = ([LeagueWindowCaptureNative]::GetForegroundWindow() -eq $p.MainWindowHandle)
} | ConvertTo-Json -Compress
`;
  const rectStdout = await run("powershell.exe", [
    "-NoProfile",
    "-WindowStyle", "Hidden",
    "-Command", script
  ]).catch(() => "");
  try {
    const rect = JSON.parse(rectStdout.trim() || "{}");
    const width = Number(rect.width);
    const height = Number(rect.height);
    if (!Number.isFinite(width) || !Number.isFinite(height) || width < 320 || height < 240) return null;
    return {
      left: Math.max(0, Math.round(Number(rect.left) || 0)),
      top: Math.max(0, Math.round(Number(rect.top) || 0)),
      width: Math.round(width),
      height: Math.round(height),
      title: String(rect.title || ""),
      isForeground: Boolean(rect.isForeground),
      logicalScreen: String(rect.logicalScreen || ""),
      physicalScreen: String(rect.physicalScreen || ""),
      dpiScale: String(rect.dpiScale || "")
    };
  } catch {
    return null;
  }
}

async function nextSegmentIndex(sessionRoot) {
  const entries = await fs.readdir(sessionRoot, { withFileTypes: true }).catch(() => []);
  const indexes = entries
    .map((entry) => entry.isFile() ? Number(entry.name.match(/^segment-(\d+)\.mkv$/i)?.[1]) : NaN)
    .filter((index) => Number.isFinite(index));
  return indexes.length ? Math.max(...indexes) + 1 : 0;
}

async function latestSegmentIndex(sessionRoot) {
  const nextIndex = await nextSegmentIndex(sessionRoot);
  return nextIndex > 0 ? nextIndex - 1 : null;
}

async function segmentFootprint(sessionRoot) {
  const entries = await fs.readdir(sessionRoot, { withFileTypes: true }).catch(() => []);
  let bytes = 0;
  let count = 0;
  for (const entry of entries) {
    if (!entry.isFile() || !/^segment-\d+\.mkv$/i.test(entry.name)) continue;
    const stat = await fs.stat(path.join(sessionRoot, entry.name)).catch(() => null);
    if (!stat) continue;
    bytes += stat.size;
    count += 1;
  }
  return { bytes, count };
}

async function startCaptureChild(sessionRoot, startNumber = 0, mode = "desktop") {
  const outputPattern = path.join(sessionRoot, "segment-%04d.mkv");
  let encoder = await encoderProfile();
  const filters = [];
  const useDda = /^(dda|ddagrab|desktop-duplication|desktop_duplication)$/i.test(captureApiPreference) && mode !== "title";
  let inputPrefixArgs = ["-f", "gdigrab", "-framerate", fps, "-rtbufsize", "64M", "-draw_mouse", "1"];
  let inputTarget = "desktop";
  let inputArgs = ["-i", inputTarget];
  let captureMode = mode;
  let captureRect = null;
  if (mode === "title") {
    inputTarget = captureWindowTitle ? `title=${captureWindowTitle}` : "desktop";
    inputArgs = ["-i", inputTarget];
  }
  if (mode === "region") {
    const rect = await leagueWindowRect();
    if (rect?.isForeground) {
      captureRect = rect;
      inputTarget = `desktop region ${rect.left},${rect.top} ${rect.width}x${rect.height}`;
      inputArgs = [
        "-offset_x", String(rect.left),
        "-offset_y", String(rect.top),
        "-video_size", `${rect.width}x${rect.height}`,
        "-i", "desktop"
      ];
    } else {
      const reason = rect ? "League window is not foreground" : "League window rectangle is unavailable";
      throw new Error(`${reason}; waiting instead of capturing desktop content.`);
    }
  }
  if (useDda) {
    const ddaOptions = [
      `framerate=${fps}`,
      "draw_mouse=1",
      "output_fmt=8bit"
    ];
    if (captureRect) {
      ddaOptions.push(`video_size=${captureRect.width}x${captureRect.height}`);
      ddaOptions.push(`offset_x=${captureRect.left}`);
      ddaOptions.push(`offset_y=${captureRect.top}`);
    }
    inputPrefixArgs = ["-f", "lavfi"];
    inputArgs = ["-i", `ddagrab=${ddaOptions.join(":")}`];
    inputTarget = captureRect
      ? `desktop duplication region ${captureRect.left},${captureRect.top} ${captureRect.width}x${captureRect.height}`
      : "desktop duplication";
    filters.push("hwdownload", "format=bgra");
    if (encoder.name === "h264_nvenc") {
      encoder = { name: "libx264", label: `CPU H.264 capture, CRF ${x264CaptureCrf}` };
    }
  }
  if (captureScale && !/^(0|none|off)$/i.test(captureScale)) {
    filters.push(`scale=${captureScale}:flags=fast_bilinear`);
  }
  await fs.mkdir(sessionRoot, { recursive: true });
  const args = [
    "-y",
    "-hide_banner",
    "-loglevel", "error",
    ...inputPrefixArgs,
    ...inputArgs,
    "-an",
    ...(filters.length ? ["-vf", filters.join(",")] : []),
    ...encoderArgs(encoder, "capture"),
    "-force_key_frames", `expr:gte(t,n_forced*${segmentSeconds})`,
    "-f", "segment",
    "-segment_time", String(segmentSeconds),
    "-segment_format", "matroska",
    "-segment_start_number", String(startNumber),
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
    child.exited = true;
    child.exitCode = code;
    child.exitSignal = signal;
    if (code || signal) {
      fs.appendFile(path.join(sessionRoot, "ffmpeg.log"), `\nffmpeg exited with code ${code ?? ""} signal ${signal ?? ""}\n`).catch(() => {});
    }
  });
  await lowerProcessPriority(child.pid);
  const rectNote = captureRect
    ? `, rect ${captureRect.width}x${captureRect.height}, screen ${captureRect.logicalScreen}/${captureRect.physicalScreen}, dpi ${captureRect.dpiScale}`
    : "";
  await log(`Started low-impact League capture in ${sessionRoot} using ${encoder.label} at ${fps} fps, ${captureScale || "source"} scale, ${capturePriority} priority, mode ${captureMode}, input ${inputTarget}${rectNote}, segment ${startNumber}.`);
  return { child, encoder: encoder.name, inputTarget, captureMode, captureRect };
}

async function startSession() {
  const startedAt = new Date();
  const sessionRoot = path.join(captureRoot, stamp(startedAt));
  const modes = captureModes();
  const capture = await startCaptureChild(sessionRoot, 0, modes[0]);
  const session = {
    sessionRoot,
    child: capture.child,
    encoder: capture.encoder,
    inputTarget: capture.inputTarget,
    captureMode: capture.captureMode,
    captureRect: capture.captureRect,
    captureModes: modes,
    startedAt,
    startedMs: startedAt.getTime(),
    lastSeenMs: Date.now(),
    lastSegmentBytes: 0,
    lastSegmentGrowthMs: Date.now(),
    pausedForForeground: false,
    foregroundPauseMs: 0,
    foregroundPauseStartedMs: null,
    resumeAfterForegroundPause: false,
    taintedSegmentIndexes: new Set(),
    captureRestarts: 0
  };
  activeRecordingSession = session;
  await publishRecorderStatus("recording", sessionStatusFields(session, session.captureMode === "desktop" ? "Full desktop capture active for this League game." : "League window capture active."), { force: true });
  return session;
}

async function stopCaptureChild(child, graceMs = 5000) {
  if (!child || child.exited || child.killed) return;
  child.stdin?.write("q");
  child.stdin?.end();
  await Promise.race([
    new Promise((resolve) => child.once("exit", resolve)),
    delay(graceMs).then(() => {
      if (!child.killed) child.kill("SIGTERM");
    })
  ]);
  child.exited = true;
}

async function restartCaptureIfNeeded(session) {
  if (session.captureMode === "region") {
    const rect = await leagueWindowRect();
    if (!rect?.isForeground) {
      const hadActiveChild = Boolean(session.child && !session.child.exited && !session.child.killed);
      if (!session.pausedForForeground) {
        await log("League window is not foreground; pausing capture so desktop/browser content is not recorded.");
        await publishRecorderStatus("paused", { ...sessionStatusFields(session, "Region fallback is paused while League is not foreground."), progress: 20 }, { force: true });
        session.pausedForForeground = true;
        session.foregroundPauseStartedMs = Date.now();
      }
      await stopCaptureChild(session.child);
      if (hadActiveChild) {
        const taintedIndex = await latestSegmentIndex(session.sessionRoot);
        if (Number.isFinite(taintedIndex)) {
          session.taintedSegmentIndexes.add(taintedIndex);
          if (taintedIndex > 0) session.taintedSegmentIndexes.add(taintedIndex - 1);
          await log(`Segment ${taintedIndex}${taintedIndex > 0 ? ` and ${taintedIndex - 1}` : ""} touched non-League foreground time and will be excluded from the review clip.`);
        }
      }
      session.lastSegmentGrowthMs = Date.now();
      return;
    }
    if (session.pausedForForeground) {
      session.foregroundPauseMs += Date.now() - Number(session.foregroundPauseStartedMs || Date.now());
      session.foregroundPauseStartedMs = null;
      session.pausedForForeground = false;
      session.resumeAfterForegroundPause = true;
      session.child.exited = true;
      await log("League window is foreground again; resuming capture.");
      await publishRecorderStatus("recording", sessionStatusFields(session, "League window capture active."), { force: true });
    }
  }
  await publishRecorderStatus("recording", sessionStatusFields(session, session.captureMode === "desktop" ? "Full desktop capture active for this League game." : "League window capture active."), { throttleMs: 30000 });
  const footprint = await segmentFootprint(session.sessionRoot);
  if (footprint.bytes > session.lastSegmentBytes + minCaptureGrowthBytes) {
    session.lastSegmentBytes = footprint.bytes;
    session.lastSegmentGrowthMs = Date.now();
  }
  if (!session.child?.exited && Date.now() - session.lastSegmentGrowthMs > captureStallMs) {
    await log(`League capture has not produced new video data for ${Math.round(captureStallMs / 1000)}s; restarting capture.`);
    session.child.kill("SIGTERM");
    await Promise.race([
      new Promise((resolve) => session.child.once("exit", resolve)),
      delay(5000)
    ]);
    session.child.exited = true;
  }
  if (!session?.child?.exited) return;
  const resumeAfterForegroundPause = Boolean(session.resumeAfterForegroundPause);
  session.resumeAfterForegroundPause = false;
  if (!resumeAfterForegroundPause && session.captureRestarts >= maxCaptureRestarts) {
    await log("League capture stopped too many times during the same game; keeping existing segments and waiting for game end.");
    return;
  }
  if (!resumeAfterForegroundPause) {
    session.captureRestarts += 1;
  }
  const startNumber = await nextSegmentIndex(session.sessionRoot);
  const modes = session.captureModes?.length ? session.captureModes : captureModes();
  const mode = resumeAfterForegroundPause
    ? session.captureMode || modes[0] || "desktop"
    : modes[Math.min(session.captureRestarts, modes.length - 1)] || modes[0] || "desktop";
  const restartReason = resumeAfterForegroundPause
    ? "League window is foreground again; capture is resuming"
    : "League window capture stopped while game is still running; restarting capture";
  await log(`${restartReason} at segment ${startNumber} with ${mode} mode.`);
  let capture;
  try {
    capture = await startCaptureChild(session.sessionRoot, startNumber, mode);
  } catch (error) {
    if (mode === "region" && /League window/i.test(error.message || "")) {
      session.pausedForForeground = true;
      session.foregroundPauseStartedMs = session.foregroundPauseStartedMs || Date.now();
      session.lastSegmentGrowthMs = Date.now();
      await log(`Capture restart waiting: ${error.message}`);
      await publishRecorderStatus("paused", { ...sessionStatusFields(session, "Region fallback is waiting for the League window to stay foreground."), progress: 20 }, { force: true });
      return;
    }
    throw error;
  }
  session.child = capture.child;
  session.encoder = capture.encoder;
  session.inputTarget = capture.inputTarget;
  session.captureMode = capture.captureMode;
  session.captureRect = capture.captureRect;
  session.lastSegmentBytes = footprint.bytes;
  session.lastSegmentGrowthMs = Date.now();
  await publishRecorderStatus("recording", sessionStatusFields(session, session.captureMode === "desktop" ? "Full desktop capture active for this League game." : "League window capture active."), { force: true });
}

async function stopSession(session) {
  await log("Stopping League screen capture.");
  session.endedAt = new Date();
  session.endedMs = session.endedAt.getTime();
  const sourceDurationSeconds = Math.round((session.endedMs - session.startedMs) / 1000);
  await publishRecorderStatus("processing", {
    ...sessionStatusFields(session, "Building review clip."),
    progress: 70,
    ...(await etaFor("post_game_total", postGameEtaFallbackSeconds, session.endedAt.toISOString(), { sourceDurationSeconds }))
  }, { force: true });
  if (session.pausedForForeground && session.foregroundPauseStartedMs) {
    session.foregroundPauseMs += Date.now() - Number(session.foregroundPauseStartedMs || Date.now());
    session.foregroundPauseStartedMs = null;
  }
  await stopCaptureChild(session.child, 20000);
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

async function processSegment(segment, importantIndexes, sessionRoot, previousSegment = null) {
  const isImportant = importantIndexes.has(segment.index);
  const speed = isImportant ? 1 : Math.max(1, fastForwardSpeed);
  const encoder = await encoderProfile();
  const outputPath = path.join(sessionRoot, `processed-${String(segment.index).padStart(4, "0")}.mp4`);
  const inputArgs = [];
  const filterParts = [];
  const duration = Number(segment.duration) || segmentSeconds;
  if (previousSegment?.filePath) {
    const preRollDuration = Number(previousSegment.duration) || segmentSeconds;
    const preRollListPath = path.join(sessionRoot, `preroll-${String(segment.index).padStart(4, "0")}.txt`);
    await writeConcatList(preRollListPath, [previousSegment.filePath, segment.filePath]);
    inputArgs.push("-f", "concat", "-safe", "0", "-i", preRollListPath);
    filterParts.push(`trim=start=${preRollDuration.toFixed(3)}:duration=${duration.toFixed(3)}`);
    filterParts.push("setpts=PTS-STARTPTS");
  } else {
    inputArgs.push("-i", segment.filePath);
  }
  filterParts.push(`setpts=PTS/${speed}`);
  filterParts.push(`fps=${fps}`);
  await run("ffmpeg", [
    "-y",
    "-hide_banner",
    "-loglevel", "error",
    ...inputArgs,
    "-vf", filterParts.join(","),
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

async function copySegmentsToReviewClip(segments, outputPath, sessionRoot) {
  const listPath = path.join(sessionRoot, "clean-segments.txt");
  await writeConcatList(listPath, segments.map((item) => item.filePath));
  await fs.mkdir(sourceDir, { recursive: true });
  await run("ffmpeg", [
    "-y",
    "-hide_banner",
    "-loglevel", "error",
    "-fflags", "+genpts",
    "-f", "concat",
    "-safe", "0",
    "-i", listPath,
    "-map", "0:v:0",
    "-c:v", "copy",
    "-an",
    "-avoid_negative_ts", "make_zero",
    "-movflags", "+faststart",
    outputPath
  ]);
  return segments.map((item) => ({
    ...item,
    outputPath: item.filePath,
    speed: 1,
    important: true,
    streamCopied: true
  }));
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
  const foregroundPauseSeconds = Math.round(Number(session.foregroundPauseMs || 0) / 1000);
  const expectedForegroundSeconds = Math.max(minGameSeconds, elapsedSeconds - foregroundPauseSeconds);
  if (elapsedSeconds < minGameSeconds) {
    await log(`Capture was ${elapsedSeconds}s, below ${minGameSeconds}s; keeping raw segments only.`);
    await publishRecorderStatus("blocked", { ...sessionStatusFields(session, `Capture was ${elapsedSeconds}s, below the ${minGameSeconds}s minimum. No review clip was created.`), progress: 100, ...clearEtaFields() }, { force: true });
    return;
  }
  const entries = await fs.readdir(session.sessionRoot, { withFileTypes: true });
  const segments = [];
  const taintedSegmentIndexes = session.taintedSegmentIndexes instanceof Set
    ? session.taintedSegmentIndexes
    : new Set();
  for (const entry of entries) {
    if (!entry.isFile() || !/^segment-\d+\.mkv$/i.test(entry.name)) continue;
    const filePath = path.join(session.sessionRoot, entry.name);
    const stat = await fs.stat(filePath);
    const index = Number(entry.name.match(/segment-(\d+)/i)?.[1]) || 0;
    const duration = await probeDuration(filePath).catch(() => 0);
    segments.push({ filePath, size: stat.size, duration, index, tainted: taintedSegmentIndexes.has(index) });
  }
  segments.sort((a, b) => a.index - b.index);
  if (!segments.length) {
    await log("No usable segments were created.");
    await publishRecorderStatus("blocked", { ...sessionStatusFields(session, "No usable video segments were created. No review clip was published."), progress: 100, ...clearEtaFields() }, { force: true });
    return;
  }
  const cleanSegments = segments.filter((item) => !item.tainted);
  if (!cleanSegments.length) {
    await log("Every capture segment touched non-League foreground time; no review clip was created.");
    await publishRecorderStatus("blocked", { ...sessionStatusFields(session, "Capture only had alt-tab-tainted segments, so no review was published."), progress: 100, ...clearEtaFields() }, { force: true });
    return;
  }
  const usableSegments = cleanSegments.filter((item) => item.size >= minCaptureSegmentBytes && Number(item.duration) > 0);
  const estimatedCoverageSeconds = usableSegments.reduce((sum, item) => sum + (Number(item.duration) || segmentSeconds), 0);
  if (estimatedCoverageSeconds < expectedForegroundSeconds * minCaptureCoverage) {
    await log(`Capture incomplete: ${usableSegments.length}/${cleanSegments.length} clean usable segments cover about ${Math.round(estimatedCoverageSeconds)}s of ${expectedForegroundSeconds}s foreground time (${elapsedSeconds}s game, ${foregroundPauseSeconds}s paused). Not creating a misleading auto review clip.`);
    await publishRecorderStatus("blocked", { ...sessionStatusFields(session, "Capture looked incomplete, so it was rejected instead of publishing a misleading review."), progress: 100, ...clearEtaFields() }, { force: true });
    return;
  }

  const replay = await latestReplay(session.startedMs, session.endedMs) || await latestLocalMatch(session.startedMs, session.endedMs);
  const outputPath = await nextOutputPath(replay?.matchId);
  const joinedPath = path.join(session.sessionRoot, "processed.mp4");
  let processed = [];
  let reviewBuild = "stream-copy";
  let reviewEncoderName = session.encoder || "capture";
  let reviewVideoQuality = `capture ${fps} fps, stream-copied review`;
  if (/^(copy|stream|stream-copy|concat)$/i.test(reviewBuildMode)) {
    try {
      processed = await copySegmentsToReviewClip(usableSegments, outputPath, session.sessionRoot);
    } catch (error) {
      await log(`Stream-copy review build failed; falling back to processed review: ${error.message}`);
      processed = [];
      reviewBuild = "processed";
    }
  }
  if (!processed.length) {
    reviewBuild = "processed";
    const importantIndexes = importantSegmentIndexes(usableSegments);
    for (let index = 0; index < usableSegments.length; index += 1) {
      const segment = usableSegments[index];
      const previousSegment = usableSegments[index - 1] || null;
      try {
        processed.push(await processSegment(segment, importantIndexes, session.sessionRoot, previousSegment));
      } catch (error) {
        await log(`Skipping corrupt segment ${segment.index}: ${error.message}`);
      }
    }
  }
  if (!processed.length) {
    await log("No segments survived post-game processing.");
    await publishRecorderStatus("blocked", { ...sessionStatusFields(session, "No review clip could be built from the usable segments."), progress: 100, ...clearEtaFields() }, { force: true });
    return;
  }
  if (reviewBuild === "processed") {
    const listPath = path.join(session.sessionRoot, "processed.txt");
    await writeConcatList(listPath, processed.map((item) => item.outputPath));
    await fs.mkdir(sourceDir, { recursive: true });
    const encoder = await encoderProfile();
    reviewEncoderName = encoder.name;
    reviewVideoQuality = encoder.name === "h264_nvenc" ? `capture CQ ${liveCaptureCq}, intermediate CQ ${liveCq}, final CRF ${x264Crf}` : `capture CRF ${x264CaptureCrf}, final CRF ${x264Crf}`;
    await run("ffmpeg", [
      "-y",
      "-hide_banner",
      "-loglevel", "error",
      "-f", "concat",
      "-safe", "0",
      "-i", listPath,
      ...finalReviewEncoderArgs(),
      "-an",
      "-movflags", "+faststart",
      outputPath
    ]);
  }
  await fs.copyFile(outputPath, joinedPath).catch(() => {});
  const duration = await probeDuration(outputPath);
  if (!(await videoHasVisibleFrames(outputPath, duration))) {
    await fs.unlink(outputPath).catch(() => {});
    await log("Review clip was black-screen capture; rejected before publish.");
    await publishRecorderStatus("blocked", { ...sessionStatusFields(session, "Capture was black, so no review was published."), progress: 100, ...clearEtaFields() }, { force: true });
    return;
  }
  if (await videoHasGreenArtifacts(outputPath, duration)) {
    await fs.unlink(outputPath).catch(() => {});
    await log("Review clip had green block corruption; rejected before publish.");
    await publishRecorderStatus("blocked", { ...sessionStatusFields(session, "Capture had video corruption, so no review was published."), progress: 100, ...clearEtaFields() }, { force: true });
    return;
  }
  const clipCreatedAt = new Date();
  const outputStat = await fs.stat(outputPath).catch(() => null);
  const publishEtaContext = {
    sourceDurationSeconds: elapsedSeconds,
    reviewDurationSeconds: duration,
    segmentCount: processed.length,
    sourceBytes: outputStat?.size || null
  };
  const sidecar = {
    createdAt: clipCreatedAt.toISOString(),
    source: "AO Labs League live recorder",
    matchId: replay?.matchId || "",
    matchSource: replay?.matchSource || "",
    startedAt: session.startedAt.toISOString(),
    endedAt: session.endedAt.toISOString(),
    outputPath,
    durationSeconds: duration,
    sourceDurationSeconds: elapsedSeconds,
    encoder: reviewEncoderName,
    videoQuality: reviewVideoQuality,
    reviewBuildMode: reviewBuild,
    segmentSeconds,
    fastForwardSpeed,
    captureFps: Number(fps),
    captureScale,
    capturePriority,
    captureInput: session.inputTarget,
    captureMode: session.captureMode,
    captureRect: session.captureRect || null,
    foregroundPauseSeconds,
    expectedForegroundSeconds,
    allSegmentsPreserved: taintedSegmentIndexes.size === 0,
    allLeagueForegroundSegmentsPreserved: true,
    desktopSegmentsExcluded: taintedSegmentIndexes.size > 0,
    excludedSegments: segments
      .filter((item) => item.tainted)
      .map((item) => ({
        index: item.index,
        size: item.size,
        durationSeconds: Math.round(Number(item.duration || 0) * 1000) / 1000,
        reason: "non-League foreground during region capture"
      })),
    segments: processed.map((item) => ({
      index: item.index,
      size: item.size,
      durationSeconds: Math.round(Number(item.duration || 0) * 1000) / 1000,
      speed: item.speed,
      important: item.important,
      streamCopied: Boolean(item.streamCopied)
    })),
    validForPublish: true,
    privacyPolicy: session.captureMode === "desktop"
      ? "Full desktop capture was used for reliability, so alt-tabbed desktop or browser content during the game can appear in the source clip."
      : "Region capture records the League window area when League is foreground. If alt-tab happens during a capture segment, that segment is excluded before the review clip is published.",
    inputPolicy: "Screen and mouse cursor are recorded. Raw keyboard text is not logged."
  };
  await fs.writeFile(path.join(session.sessionRoot, "review-clip.json"), `${JSON.stringify(sidecar, null, 2)}\n`, "utf8");
  await fs.writeFile(`${outputPath}.json`, `${JSON.stringify(sidecar, null, 2)}\n`, "utf8");
  await log(`Created review clip ${outputPath}`);

  if (publishAfterGame) {
    await log("Publishing updated League recordings.");
    const publishingFields = {
      ...sessionStatusFields(session, "Uploading review."),
      label: "publishing review",
      progress: 90,
      matchId: replay?.matchId || "",
      ...(await etaFor("clip_to_live", clipToLiveEtaFallbackSeconds, clipCreatedAt.toISOString(), publishEtaContext))
    };
    if (session.sessionRoot === activeQueueSessionRoot) {
      activeQueueStage = "publishing";
      activeQueueStageLabel = "uploading review to site";
      activeQueueStartedAt = clipCreatedAt.toISOString();
      activeQueueEta = {
        etaSeconds: publishingFields.etaSeconds,
        estimatedReadyAt: publishingFields.estimatedReadyAt,
        etaBasis: publishingFields.etaBasis
      };
      activeQueueProgress = publishingFields.progress;
    }
    await publishRecorderStatus("publishing", publishingFields, { force: true });
    try {
      await run(npmBin, ["run", "publish:recordings"], {
        env: {
          ...process.env,
          LEAGUE_EXPECT_SOURCE_FILE: path.basename(outputPath)
        }
      });
      const publishedFields = {
        ...sessionStatusFields(session, "Review sent to site."),
        label: "review live",
        progress: 100,
        matchId: replay?.matchId || "",
        ...clearEtaFields()
      };
      await publishRecorderStatus("published", publishedFields, { force: true });
      holdIdleStatus("published", publishedFields);
    } catch (error) {
      const outputFile = path.basename(outputPath);
      if (await liveManifestContains(outputFile).catch(() => false)) {
        const publishedFields = {
          ...sessionStatusFields(session, "Review sent to site."),
          label: "review live",
          progress: 100,
          matchId: replay?.matchId || "",
          outputFile,
          ...clearEtaFields()
        };
        await publishRecorderStatus("published", publishedFields, { force: true });
        holdIdleStatus("published", publishedFields);
        return;
      }
      const combinedOutput = `${error.stdout || ""}\n${error.stderr || ""}`;
      const blockedLine = combinedOutput.match(/Publish blocked[^\r\n]*/i)?.[0];
      const detail = blockedLine || "Review clip created, but the site publish failed. Check publisher log.";
      await log(`Publish failed after review clip creation: ${error.message}`);
      const blockedFields = {
        ...sessionStatusFields(session, detail),
        label: "publish blocked",
        progress: 100,
        matchId: replay?.matchId || "",
        outputFile,
        ...clearEtaFields()
      };
      await publishRecorderStatus("blocked", blockedFields, { force: true });
      holdIdleStatus("blocked", blockedFields);
    }
  } else {
    const localFields = {
      ...sessionStatusFields(session, "Review clip created locally."),
      label: "review saved",
      progress: 100,
      ...clearEtaFields()
    };
    await publishRecorderStatus("published", localFields, { force: true });
    holdIdleStatus("published", localFields);
  }
}

async function processPostGameQueue() {
  if (postGameQueueRunning) return;
  postGameQueueRunning = true;
  try {
    while (postGameQueue.length) {
      const item = postGameQueue[0];
      const session = deserializeSession(item);
      await log(`Processing queued review ${session.sessionRoot}.`);
      activeQueueSessionRoot = session.sessionRoot;
      activeQueueStage = "processing";
      activeQueueStageLabel = "building review clip";
      activeQueueStartedAt = new Date().toISOString();
      activeQueueEta = await etaFor("post_game_total", postGameEtaFallbackSeconds, session.endedAt.toISOString(), {
        sourceDurationSeconds: Math.max(0, Math.round((session.endedMs - session.startedMs) / 1000))
      });
      activeQueueProgress = 65;
      await publishRecorderStatus("processing", {
        ...sessionStatusFields(session, "Building queued review while the next game can continue."),
        label: "processing queued review",
        progress: 65,
        ...activeQueueEta
      }, { force: true });
      try {
        await finalizeSession(session);
        await log(`Queued review finished ${session.sessionRoot}.`);
      } catch (error) {
        await log(`Queued review failed and will not block later reviews: ${error.stack || error.message}`);
        await publishRecorderStatus("blocked", {
          ...sessionStatusFields(session, "Queued review failed while building the clip; the next queued review will continue."),
          progress: 100,
          ...clearEtaFields()
        }, { force: true });
      } finally {
        postGameQueue.shift();
        await savePostGameQueue();
        activeQueueSessionRoot = "";
        activeQueueStage = "";
        activeQueueStageLabel = "";
        activeQueueStartedAt = "";
        activeQueueEta = {};
        activeQueueProgress = null;
      }
    }
  } finally {
    postGameQueueRunning = false;
  }
}

async function main() {
  await acquireLock();
  process.on("exit", () => {
    try {
      if (fsSync.readFileSync(lockPath, "utf8").trim() === String(process.pid)) fsSync.unlinkSync(lockPath);
    } catch {
      // Process exit cannot wait on async cleanup.
    }
  });
  process.on("SIGINT", async () => {
    await releaseLock();
    process.exit(0);
  });

  await loadPostGameQueue();
  processPostGameQueue().catch((error) => {
    log(`Post-game queue worker failed: ${error.stack || error.message}`).catch(() => {});
  });
  await log("League live recorder is watching for game process.");
  let skipCurrentGame = skipCurrentGameOnRestart && await gameIsRunning();
  await publishRecorderStatus(skipCurrentGame ? "waiting" : "watching", {
    label: skipCurrentGame ? "waiting for next game" : "recorder ready",
    detail: skipCurrentGame ? "restarted mid-game; current game ignored" : "waiting for League",
    mode: captureModePreference,
    progress: skipCurrentGame ? 10 : 0
  }, { force: true });
  let session = null;
  while (true) {
    if (!(await stillOwnsLock())) {
      await stopForLostLock(session);
      break;
    }
    const running = await gameIsRunning();
    if (skipCurrentGame) {
      if (!running) {
        skipCurrentGame = false;
        await publishRecorderStatus("watching", {
          label: "recorder ready",
          detail: "waiting for League",
          mode: captureModePreference,
          progress: 0
        }, { force: true });
      } else if (!postGameQueueRunning) {
        await publishRecorderStatus("waiting", {
          label: "waiting for next game",
          detail: "restarted mid-game; current game ignored",
          mode: captureModePreference,
          progress: 10
        }, { throttleMs: 60000 });
      }
      await delay(pollMs);
      continue;
    }
    if (running && !session) {
      idleHoldStatus = null;
      try {
        session = await startSession();
      } catch (error) {
        await log(`Capture waiting: ${error.message}`);
        await publishRecorderStatus("waiting", {
          label: "waiting for League window",
          detail: "game found; window not captured yet",
          mode: captureModePreference,
          progress: 10
        }, { force: true });
      }
    }
    if (running && session) {
      session.lastSeenMs = Date.now();
      await restartCaptureIfNeeded(session);
    }
    if (!running && session && Date.now() - session.lastSeenMs > endGraceMs) {
      const current = session;
      session = null;
      activeRecordingSession = null;
      try {
        await stopSession(current);
        await enqueuePostGameSession(current);
      } catch (error) {
        await log(`Finalize failed: ${error.message}`);
        const errorFields = { ...sessionStatusFields(current, "Post-game processing failed. Check recorder log."), label: "recorder error", progress: 100 };
        await publishRecorderStatus("error", errorFields, { force: true });
        holdIdleStatus("error", errorFields);
      }
    }
    if (!running && !session && postGameQueueRunning) {
      await delay(pollMs);
      continue;
    }
    if (!running && !session) {
      if (idleHoldStatus && Date.now() < idleHoldStatus.untilMs) {
        await reconcileBlockedHoldIfLive();
        await publishRecorderStatus(idleHoldStatus.status, idleHoldStatus.fields, { throttleMs: 60000 });
      } else {
        idleHoldStatus = null;
        await publishRecorderStatus("watching", {
          label: "recorder ready",
          detail: "waiting for League",
          mode: captureModePreference,
          progress: 0
        }, { throttleMs: 60000 });
      }
    }
    await delay(pollMs);
  }
}

main().catch(async (error) => {
  await log(`Live recorder failed: ${error.stack || error.message}`);
  await publishRecorderStatus("error", {
    label: "recorder error",
    detail: "The live recorder stopped unexpectedly.",
    mode: captureModePreference,
    progress: 100
  }, { force: true }).catch(() => {});
  await releaseLock();
  process.exitCode = 1;
});
