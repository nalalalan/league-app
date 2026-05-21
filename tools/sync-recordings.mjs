import { execFile } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, "..");
const publicRoot = path.join(appRoot, "public");
const recordingRoot = path.join(publicRoot, "recordings");
const posterRoot = path.join(recordingRoot, "posters");
const analysisRoot = path.join(appRoot, "_recording-analysis");
const manifestPath = path.join(recordingRoot, "recordings.json");
const sourceDir = process.env.LEAGUE_RECORDINGS_DIR || "C:\\Users\\phama\\Documents\\League of Legends\\Highlights";
const replayDir = process.env.LEAGUE_REPLAY_DIR || path.join(path.dirname(sourceDir), "Replays");
const leagueLogsRoot = process.env.LEAGUE_LOGS_DIR || "C:\\Riot Games\\League of Legends\\Logs";
const model = process.env.LEAGUE_ANALYSIS_MODEL || "gpt-4.1";
const timeZone = "America/New_York";
const analysisVersion = "2026-05-21-useful-timestamp-evidence-v1";
const clockAnchorVersion = "2026-05-21-visible-clock-balanced-v2";
const coachEvidenceVersion = "2026-05-21-coach-evidence-useful-v2";
const largeRecordingBytes = Number(process.env.LEAGUE_LARGE_RECORDING_BYTES || 45 * 1024 * 1024);
const targetPublicVideoBytes = Number(process.env.LEAGUE_TARGET_PUBLIC_VIDEO_BYTES || 92 * 1024 * 1024);
const minPublicVideoRatio = Number(process.env.LEAGUE_MIN_PUBLIC_VIDEO_RATIO || 0.5);
const minAutoBytesPerSecond = Number(process.env.LEAGUE_MIN_AUTO_BYTES_PER_SECOND || 5000);
const minAutoSidecarCoverage = Number(process.env.LEAGUE_MIN_AUTO_SIDECAR_COVERAGE || 0.6);
const minSanitizedAutoSeconds = Number(process.env.LEAGUE_MIN_SANITIZED_AUTO_SECONDS || 90);
const maxClockReadFrames = Number(process.env.LEAGUE_MAX_CLOCK_READ_FRAMES || 34);
const maxAnalysisFrames = Number(process.env.LEAGUE_MAX_ANALYSIS_FRAMES || 36);
const sourceVideoPattern = /\.(webm|mp4)$/i;
const ignoredSourceVideoPattern = /\.with-desktop-pauses\.(webm|mp4)$/i;

function clean(value, fallback = "") {
  return String(value || fallback).replace(/\s+/g, " ").trim();
}

function coachClean(value, fallback = "") {
  return clean(value, fallback)
    .replace(/\bhigh[-\s]?elo\s+Samira\b/gi, "strong Samira player")
    .replace(/\bhigh[-\s]?elo\b/gi, "stronger games")
    .replace(/\bmaster[-\s]?facing\b/gi, "")
    .replace(/\s+as per lesson\b/gi, "")
    .replace(/\(\s*around\s+(\d{1,2}:[0-5]\d),\s*last\s+\w+\s+frames?\s*\)/gi, "around $1")
    .replace(/\s+/g, " ")
    .trim();
}

function isGenericEvidenceText(value) {
  const text = clean(value).toLowerCase();
  if (!text) return true;
  return [
    "generated from sampled replay frames",
    "match-level samira read from sampled replay frames",
    "evidence is limited to sampled replay context",
    "conservative read until"
  ].some((phrase) => text.includes(phrase));
}

function slugify(value) {
  return clean(value)
    .toLowerCase()
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

function toPosixPath(value) {
  return value.split(path.sep).join("/");
}

function publicPath(absolutePath) {
  return `/${toPosixPath(path.relative(publicRoot, absolutePath))}`;
}

function publicRecordingName(name, stat) {
  const parsed = path.parse(name);
  return stat.size > largeRecordingBytes ? `${parsed.name}.mp4` : name;
}

function mmss(seconds) {
  const rounded = Math.max(0, Math.round(Number(seconds) || 0));
  return `${Math.floor(rounded / 60)}:${String(rounded % 60).padStart(2, "0")}`;
}

function shortDateTime(value) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone
  }).format(value);
}

function shortDate(value) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone
  }).format(value);
}

function shortTime(value) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone
  }).format(value);
}

async function localLeagueJson(endpoint) {
  const lockPath = process.env.LEAGUE_LOCKFILE || "C:\\Riot Games\\League of Legends\\lockfile";
  const lock = clean(await readTextSafe(lockPath));
  const parts = lock.split(":");
  if (parts.length < 5) return null;
  const port = parts[2];
  const password = parts[3];
  try {
    const { stdout } = await execFileAsync("curl.exe", [
      "-k",
      "-s",
      "-u", `riot:${password}`,
      `https://127.0.0.1:${port}${endpoint}`
    ], {
      windowsHide: true,
      maxBuffer: 32 * 1024 * 1024
    });
    if (!stdout || !stdout.trim().startsWith("{")) return null;
    return JSON.parse(stdout);
  } catch {
    return null;
  }
}

function reviewPhase(index, total) {
  if (total <= 0) return "current form";
  if (index >= Math.max(0, total - 3)) return "current form";
  if (index >= Math.floor(total / 2)) return "implementation";
  return "baseline";
}

function capturedRange(files) {
  if (!files.length) return "";
  const sorted = [...files].sort((a, b) => a.mtimeMs - b.mtimeMs);
  const first = new Date(sorted[0].mtimeMs);
  const last = new Date(sorted[sorted.length - 1].mtimeMs);
  if (shortDate(first) === shortDate(last)) {
    return `${shortDate(first)}, ${shortTime(first)}-${shortTime(last)} ET`;
  }
  return `${shortDateTime(first)} to ${shortDateTime(last)} ET`;
}

function recordingParts(file) {
  const match = file.match(/^([^_]+)_(NA1-\d+)_(\d+)\.(webm|mp4)$/i);
  if (!match) {
    return {
      score: "",
      matchId: "",
      numericMatchId: "",
      clipNumber: 0
    };
  }
  return {
    score: match[1],
    matchId: match[2],
    numericMatchId: match[2].replace(/^NA1-/i, ""),
    clipNumber: Number(match[3]) || 0
  };
}

function queueLabel(queueId) {
  const labels = {
    400: "Draft Pick",
    420: "Ranked Solo",
    430: "Blind Pick",
    440: "Ranked Flex",
    450: "ARAM",
    480: "Swiftplay",
    490: "Quickplay",
    830: "Co-op vs AI Intro",
    840: "Co-op vs AI Beginner",
    850: "Co-op vs AI Intermediate",
    870: "Co-op vs AI Intro",
    880: "Co-op vs AI Beginner",
    890: "Co-op vs AI Intermediate",
    900: "ARURF",
    2000: "Tutorial 1",
    2010: "Tutorial 2",
    2020: "Tutorial 3"
  };
  return labels[Number(queueId)] || "Type unknown";
}

function shortClock(seconds) {
  if (!Number.isFinite(seconds)) return "";
  return mmss(seconds);
}

async function recentFiles(root, predicate, maxFiles = 36) {
  const found = [];
  async function walk(dir) {
    let entries = [];
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const filePath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(filePath);
      } else if (predicate(entry.name, filePath)) {
        const stat = await fs.stat(filePath).catch(() => null);
        if (stat) found.push({ filePath, stat });
      }
    }
  }
  await walk(root);
  return found
    .sort((a, b) => b.stat.mtimeMs - a.stat.mtimeMs)
    .slice(0, maxFiles);
}

async function readTextSafe(filePath) {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch {
    return "";
  }
}

async function loadReplayTimes(matchIds) {
  const times = new Map();
  for (const matchId of matchIds) {
    const replayPath = path.join(replayDir, `${matchId}.rofl`);
    const stat = await fs.stat(replayPath).catch(() => null);
    if (stat) {
      times.set(matchId, {
        matchTimeMs: stat.mtimeMs,
        gameHappenedAt: new Date(stat.mtimeMs).toISOString(),
        gameHappenedAtLabel: shortDateTime(new Date(stat.mtimeMs))
      });
    }
  }
  return times;
}

async function loadQueueMetadata(matchIds) {
  const numericIds = new Map(matchIds.map((matchId) => [matchId.replace(/^NA1-/i, ""), matchId]));
  const queues = new Map();
  const logRoot = path.join(leagueLogsRoot, "LeagueClient Logs");
  const logs = await recentFiles(logRoot, (name) => /LeagueClient(?:Ux)?\.log$/i.test(name), 12);
  for (const { filePath } of logs) {
    const text = await readTextSafe(filePath);
    if (!text) continue;
    for (const [numericId, matchId] of numericIds) {
      if (queues.has(matchId) || !text.includes(numericId)) continue;
      const escaped = numericId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const patterns = [
        new RegExp(`gameId["':=\\s]+${escaped}[\\s\\S]{0,500}?queueId["':=\\s]+(\\d+)`, "i"),
        new RegExp(`queueId["':=\\s]+(\\d+)[\\s\\S]{0,500}?gameId["':=\\s]+${escaped}`, "i")
      ];
      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
          const queueId = Number(match[1]);
          queues.set(matchId, {
            queueId,
            gameType: queueLabel(queueId),
            gameTypeSource: "LeagueClient log"
          });
          break;
        }
      }
    }
  }
  return queues;
}

async function loadMatchStats(matchIds) {
  const current = await localLeagueJson("/lol-summoner/v1/current-summoner");
  const currentPuuid = clean(current?.puuid);
  if (!currentPuuid) return new Map();
  const stats = new Map();
  for (const matchId of matchIds) {
    const numericId = matchId.replace(/^NA1-/i, "");
    const game = await localLeagueJson(`/lol-match-history/v1/games/${numericId}`);
    if (!game?.participants?.length) continue;
    const participantId = game.participantIdentities
      ?.find((identity) => clean(identity?.player?.puuid) === currentPuuid)
      ?.participantId;
    const participant = game.participants.find((item) => item.participantId === participantId);
    const itemStats = participant?.stats;
    if (!itemStats) continue;
    const cs = Number(itemStats.totalMinionsKilled || 0) + Number(itemStats.neutralMinionsKilled || 0);
    const gameLengthSeconds = Number(game.gameDuration || 0);
    const gameCreationMs = Number(game.gameCreation || 0);
    stats.set(matchId, {
      matchTimeMs: gameCreationMs || null,
      gameHappenedAt: gameCreationMs ? new Date(gameCreationMs).toISOString() : "",
      gameHappenedAtLabel: gameCreationMs ? shortDateTime(new Date(gameCreationMs)) : "",
      gameLength: gameLengthSeconds ? mmss(gameLengthSeconds) : "",
      gameLengthSeconds: gameLengthSeconds || null,
      kills: Number(itemStats.kills || 0),
      deaths: Number(itemStats.deaths || 0),
      assists: Number(itemStats.assists || 0),
      kda: `${Number(itemStats.kills || 0)}/${Number(itemStats.deaths || 0)}/${Number(itemStats.assists || 0)}`,
      cs,
      statsSource: "League Client match history"
    });
  }
  return stats;
}

async function loadCaptureMetadata(matchIds) {
  const capture = new Map();
  const logRoot = path.join(leagueLogsRoot, "GameLogs");
  const logs = await recentFiles(logRoot, (name) => /_r3dlog\.txt$/i.test(name), 48);
  for (const { filePath } of logs) {
    const text = await readTextSafe(filePath);
    if (!text) continue;
    if (!matchIds.some((matchId) => text.includes(`${matchId}.rofl`))) continue;
    for (const line of text.split(/\r?\n/)) {
      if (!line.includes("Beginning Video Capture")) continue;
      const secondsMatch = line.match(/^(\d{6}\.\d+)/);
      const fileMatch = line.match(/Highlights[\\/]+([^:]+?\.(?:webm|mp4))\b/i);
      if (!secondsMatch || !fileMatch) continue;
      const seconds = Number(secondsMatch[1]);
      capture.set(fileMatch[1], {
        clipTimestampSeconds: seconds,
        clipTimestamp: shortClock(seconds)
      });
    }
  }
  return capture;
}

async function loadRecordingMetadata(matchIds) {
  const [replayTimes, queues, captureTimes] = await Promise.all([
    loadReplayTimes(matchIds),
    loadQueueMetadata(matchIds),
    loadCaptureMetadata(matchIds)
  ]);
  const matchStats = await loadMatchStats(matchIds);
  return { replayTimes, queues, captureTimes, matchStats };
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function run(command, args) {
  const { stdout } = await execFileAsync(command, args, { maxBuffer: 16 * 1024 * 1024 });
  return stdout;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

async function probeVideoHealth(filePath) {
  const stdout = await run("ffprobe", [
    "-v", "error",
    "-show_entries", "format=duration,size,bit_rate:stream=codec_type,width,height,nb_frames,duration,bit_rate",
    "-of", "json",
    filePath
  ]);
  const parsed = JSON.parse(stdout);
  const duration = Number(parsed?.format?.duration) || 0;
  const size = Number(parsed?.format?.size) || 0;
  const bitRate = Number(parsed?.format?.bit_rate) || 0;
  const video = Array.isArray(parsed?.streams)
    ? parsed.streams.find((stream) => stream.codec_type === "video")
    : null;
  return {
    duration,
    size,
    bitRate,
    bytesPerSecond: duration > 0 ? size / duration : 0,
    width: Number(video?.width) || 0,
    height: Number(video?.height) || 0,
    frames: Number(video?.nb_frames) || 0
  };
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

async function videoVisibility(filePath, duration) {
  const total = Number(duration) || 0;
  if (!(total > 0)) return null;
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
  if (!stats.length) return null;
  return {
    visible: stats.some((item) => item.mean > 8 && item.stdev > 4),
    samples: stats
  };
}

async function readJsonSafe(filePath) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch {
    return null;
  }
}

function screenSize(value) {
  const match = String(value || "").match(/(\d+)\s*x\s*(\d+)/i);
  return match ? { width: Number(match[1]), height: Number(match[2]) } : null;
}

function trustedAutoSidecar(sidecar, health) {
  if (!sidecar || sidecar.validForPublish === false) return false;
  if (sidecar.source !== "AO Labs League live recorder") return false;
  const preservesLeagueOnly = sidecar.allSegmentsPreserved === true ||
    (sidecar.desktopSegmentsExcluded === true && sidecar.allLeagueForegroundSegmentsPreserved === true);
  if (!preservesLeagueOnly) return false;
  const sourceSeconds = Number(sidecar.sourceDurationSeconds || health?.duration || 0);
  if (!(sourceSeconds > 0)) return false;
  const segmentSeconds = Array.isArray(sidecar.segments)
    ? sidecar.segments.reduce((sum, segment) => sum + (Number(segment.durationSeconds) || 0), 0)
    : 0;
  const outputSeconds = Number(sidecar.durationSeconds || health?.duration || 0);
  if (sidecar.desktopSegmentsExcluded === true && sidecar.allLeagueForegroundSegmentsPreserved === true) {
    return Math.max(segmentSeconds, outputSeconds) >= minSanitizedAutoSeconds;
  }
  const expectedSeconds = Number(sidecar.expectedForegroundSeconds || sourceSeconds);
  return Math.max(segmentSeconds, outputSeconds) >= expectedSeconds * minAutoSidecarCoverage;
}

function autoCaptureRejectReason(name, health, sidecar, visual) {
  if (!/^auto_/i.test(name)) return "";
  if (visual && visual.visible === false) return "sampled frames are black";
  const hasTrustedSidecar = trustedAutoSidecar(sidecar, health);
  if (!hasTrustedSidecar && health?.duration > 300 && health.bytesPerSecond > 0 && health.bytesPerSecond < minAutoBytesPerSecond) {
    return `${Math.round(health.duration)}s but only ${Math.round(health.bytesPerSecond)} bytes/s`;
  }
  if (!sidecar) return "";
  if (sidecar.validForPublish === false) return "recorder sidecar marked it invalid";
  const rect = sidecar.captureRect || {};
  const logical = screenSize(rect.logicalScreen);
  const physical = screenSize(rect.physicalScreen);
  const width = Number(rect.width || 0);
  const height = Number(rect.height || 0);
  const scaledDesktop = logical && physical && physical.width > logical.width + 8 && physical.height > logical.height + 8;
  if (scaledDesktop && width <= logical.width + 16 && height <= logical.height + 16) {
    return `DPI-scaled crop risk ${width}x${height} on physical ${physical.width}x${physical.height}`;
  }
  const pauseSeconds = Number(sidecar.foregroundPauseSeconds || 0);
  const sourceSeconds = Number(sidecar.sourceDurationSeconds || health?.duration || 0);
  if (!hasTrustedSidecar && sourceSeconds > 0 && pauseSeconds > Math.max(90, sourceSeconds * 0.35)) {
    return `${Math.round(pauseSeconds)}s foreground pause during ${Math.round(sourceSeconds)}s game`;
  }
  return "";
}

async function extractFrame(input, output, second, width = 640) {
  await fs.mkdir(path.dirname(output), { recursive: true });
  await run("ffmpeg", [
    "-y",
    "-v", "error",
    "-ss", String(Math.max(0, second)),
    "-i", input,
    "-frames:v", "1",
    "-vf", `scale=${width}:-1`,
    output
  ]);
}

async function encodePublicVideo(input, output, sourceStat) {
  await fs.mkdir(path.dirname(output), { recursive: true });
  const attempts = [
    { crf: "20", maxrate: "9000k", bufsize: "18000k", audio: "128k" },
    { crf: "22", maxrate: "6500k", bufsize: "13000k", audio: "128k" },
    { crf: "24", maxrate: "4200k", bufsize: "8400k", audio: "96k" },
    { crf: "26", maxrate: "2800k", bufsize: "5600k", audio: "96k" },
    { crf: "28", maxrate: "1900k", bufsize: "3800k", audio: "80k" },
    { crf: "30", maxrate: "1400k", bufsize: "2800k", audio: "80k" },
    { crf: "32", maxrate: "1050k", bufsize: "2100k", audio: "64k" }
  ];
  for (const attempt of attempts) {
    await run("ffmpeg", [
      "-y",
      "-v", "error",
      "-i", input,
      "-map", "0:v:0",
      "-map", "0:a?",
      "-c:v", "libx264",
      "-preset", "veryfast",
      "-crf", attempt.crf,
      "-maxrate", attempt.maxrate,
      "-bufsize", attempt.bufsize,
      "-c:a", "aac",
      "-b:a", attempt.audio,
      "-movflags", "+faststart",
      output
    ]);
    await waitForValidVideo(output);
    const encoded = await fs.stat(output);
    if (encoded.size <= targetPublicVideoBytes) {
      await fs.utimes(output, sourceStat.atime, sourceStat.mtime);
      return encoded.size;
    }
  }
  const encoded = await fs.stat(output);
  throw new Error(`${path.basename(output)} is still ${encoded.size} bytes after compression`);
}

async function waitForValidVideo(filePath) {
  let lastSize = -1;
  let stableReads = 0;
  for (let attempt = 0; attempt < 180; attempt += 1) {
    const stat = await fs.stat(filePath).catch(() => null);
    if (stat?.size > 0 && stat.size === lastSize) {
      stableReads += 1;
    } else {
      stableReads = 0;
      lastSize = stat?.size || -1;
    }
    if (stableReads >= 2) {
      try {
        await probeDuration(filePath);
        return;
      } catch {
        stableReads = 0;
      }
    }
    await delay(1000);
  }
  throw new Error(`${path.basename(filePath)} did not become a valid video after encoding`);
}

async function ensurePublicVideo(sourcePath, destPath, sourceStat) {
  const needsEncode = path.extname(destPath).toLowerCase() === ".mp4";
  const parsedDest = path.parse(destPath);
  const alternateExt = needsEncode ? ".webm" : ".mp4";
  const alternatePath = path.join(parsedDest.dir, `${parsedDest.name}${alternateExt}`);
  const current = await exists(destPath) ? await fs.stat(destPath) : null;
  const stale = !current || Math.round(current.mtimeMs) < Math.round(sourceStat.mtimeMs) || current.size === 0;
  if (!needsEncode) {
    if (!current || current.size !== sourceStat.size) {
      await fs.copyFile(sourcePath, destPath);
      await fs.utimes(destPath, sourceStat.atime, sourceStat.mtime);
    }
    if (await exists(alternatePath)) {
      await fs.unlink(alternatePath);
    }
    return sourceStat.size;
  }
  if (stale || current.size > targetPublicVideoBytes) {
    const bytes = await encodePublicVideo(sourcePath, destPath, sourceStat);
    if (await exists(alternatePath)) {
      await fs.unlink(alternatePath);
    }
    return bytes;
  }
  if (await exists(alternatePath)) {
    await fs.unlink(alternatePath);
  }
  return current.size;
}

function sampleTimesFor(duration) {
  if (duration < 3) return [Math.max(0.2, duration * 0.5)];
  const count = duration > 240 ? 24 : duration > 90 ? 18 : duration > 35 ? 12 : duration > 12 ? 8 : 5;
  const start = Math.min(Math.max(0.3, duration * 0.04), 4);
  const end = Math.max(start + 0.2, duration - Math.min(Math.max(0.3, duration * 0.04), 4));
  if (count === 1) return [duration * 0.5];
  return Array.from({ length: count }, (_, index) => start + ((end - start) * index) / (count - 1))
    .map((time) => Math.max(0.2, Math.min(duration - 0.2, time)));
}

function cleanList(value, maxItems = 5) {
  const values = Array.isArray(value) ? value : String(value || "").split(/\n+|;\s*/);
  return values
    .map((item) => clean(String(item).replace(/^\s*(?:[-*]\s+|\d+[.)]\s*)/, "")))
    .filter(Boolean)
    .slice(0, maxItems);
}

function normalizeClock(value) {
  const match = String(value || "").match(/\b(\d{1,2}):([0-5]\d)\b/);
  if (!match) return "";
  return `${Number(match[1])}:${match[2]}`;
}

function cleanClockAnchors(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((anchor) => {
      const clock = normalizeClock(anchor?.clock || anchor?.timestamp || anchor?.gameClock || "");
      const videoSeconds = Number(anchor?.videoSeconds ?? anchor?.video ?? anchor?.seekSeconds);
      if (!clock || !Number.isFinite(videoSeconds)) return null;
      const description = coachClean(anchor?.description || anchor?.event || anchor?.label || "");
      return {
        clock,
        videoSeconds: Math.round(videoSeconds * 1000) / 1000,
        ...(description ? { description } : {})
      };
    })
    .filter(Boolean);
}

function clockSeconds(clock) {
  const normalized = normalizeClock(clock);
  if (!normalized) return null;
  const [minutes, seconds] = normalized.split(":").map(Number);
  return minutes * 60 + seconds;
}

function timestampSecondsInText(text) {
  return (String(text || "").match(/\b\d{1,2}:[0-5]\d\b/g) || [])
    .map(clockSeconds)
    .filter((seconds) => Number.isFinite(seconds));
}

function dedupeClockAnchors(...groups) {
  const anchors = cleanClockAnchors(groups.flat());
  const byClock = new Map();
  for (const anchor of anchors) {
    const seconds = clockSeconds(anchor.clock);
    if (!Number.isFinite(seconds)) continue;
    const current = byClock.get(anchor.clock);
    if (!current || (anchor.description && !current.description)) {
      byClock.set(anchor.clock, anchor);
    }
  }
  return [...byClock.values()]
    .sort((a, b) => a.videoSeconds - b.videoSeconds || clockSeconds(a.clock) - clockSeconds(b.clock))
    .slice(0, maxClockReadFrames);
}

function importantSegmentGroups(sidecar) {
  const segments = Array.isArray(sidecar?.segments) ? sidecar.segments : [];
  if (!segments.length) return [];
  const groups = [];
  let currentGroup = null;
  let outputTime = 0;
  for (const segment of segments) {
    const sourceDuration = Number(segment.durationSeconds) || Number(sidecar.segmentSeconds) || 0;
    const speed = Math.max(1, Number(segment.speed) || 1);
    const outputDuration = sourceDuration > 0 ? sourceDuration / speed : 0;
    const start = outputTime;
    const end = outputTime + outputDuration;
    const important = segment.important === true || speed <= 1.05;
    if (important) {
      if (!currentGroup) currentGroup = { start, end };
      currentGroup.end = end;
    } else if (currentGroup) {
      groups.push(currentGroup);
      currentGroup = null;
    }
    outputTime = end;
  }
  if (currentGroup) groups.push(currentGroup);
  return groups;
}

function importantSegmentTimes(sidecar, duration) {
  const groups = importantSegmentGroups(sidecar);
  if (!groups.length) return [];
  return groups.flatMap((group) => {
    const midpoint = group.start + ((group.end - group.start) / 2);
    const start = group.start + Math.min(1, Math.max(0.1, (group.end - group.start) * 0.15));
    const end = group.end - Math.min(1, Math.max(0.1, (group.end - group.start) * 0.15));
    return [start, midpoint, end];
  }).filter((time) => Number.isFinite(time) && time >= 0.2 && time <= Math.max(0.2, duration - 0.2));
}

function dedupeTimes(times, minGapSeconds = 2.5) {
  const deduped = [];
  for (const time of times
    .map(Number)
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => a - b)) {
    if (deduped.some((existing) => Math.abs(existing - time) < minGapSeconds)) continue;
    deduped.push(Math.round(time * 1000) / 1000);
  }
  return deduped;
}

function inVideoTimes(times, duration) {
  return times
    .map(Number)
    .filter((time) => Number.isFinite(time) && time >= 0.2 && time <= Math.max(0.2, duration - 0.2));
}

function analysisSampleTimes(duration, sidecar) {
  const base = sampleTimesFor(duration);
  const groups = importantSegmentGroups(sidecar);
  const groupMidpoints = groups.map((group) => group.start + ((group.end - group.start) / 2));
  const groupEdges = groups.flatMap((group) => {
    const span = Math.max(0, group.end - group.start);
    if (span < 12) return [];
    return [
      group.start + Math.min(1, span * 0.15),
      group.end - Math.min(1, span * 0.15)
    ];
  });
  const prioritized = dedupeTimes([...groupMidpoints, ...base, ...groupEdges])
    .filter((time) => time >= 0.2 && time <= Math.max(0.2, duration - 0.2));
  if (prioritized.length <= maxAnalysisFrames) return prioritized;
  const kept = dedupeTimes([...groupMidpoints, ...base])
    .filter((time) => time >= 0.2 && time <= Math.max(0.2, duration - 0.2))
    .slice(0, maxAnalysisFrames);
  for (const time of prioritized) {
    if (kept.length >= maxAnalysisFrames) break;
    if (kept.some((existing) => Math.abs(existing - time) < 2.5)) continue;
    kept.push(time);
  }
  return kept.sort((a, b) => a - b);
}

function clockReadTimes(duration, sidecar, candidateTimes = []) {
  const prioritizedTimes = inVideoTimes(candidateTimes, duration);
  const groups = importantSegmentGroups(sidecar);
  const groupMidpoints = inVideoTimes(groups.map((group) => group.start + ((group.end - group.start) / 2)), duration);
  const groupEdges = inVideoTimes(groups.flatMap((group) => {
    const span = Math.max(0, group.end - group.start);
    if (span < 12) return [];
    return [
      group.start + Math.min(1, Math.max(0.1, span * 0.15)),
      group.end - Math.min(1, Math.max(0.1, span * 0.15))
    ];
  }), duration);
  const candidates = [
    ...prioritizedTimes,
    ...groupMidpoints,
    ...sampleTimesFor(duration),
    ...groupEdges
  ].filter((time) => Number.isFinite(time) && time >= 0.2 && time <= Math.max(0.2, duration - 0.2));
  const deduped = dedupeTimes(candidates);
  if (deduped.length <= maxClockReadFrames) return deduped;
  const kept = dedupeTimes([...prioritizedTimes, ...groupMidpoints]).slice(0, maxClockReadFrames);
  for (const time of [...sampleTimesFor(duration), ...groupEdges, ...deduped]) {
    if (kept.length >= maxClockReadFrames) break;
    if (kept.some((existing) => Math.abs(existing - time) < 2.5)) continue;
    kept.push(time);
  }
  return kept.sort((a, b) => a - b);
}

function sourceSecondForVideoSecond(sidecar, videoSeconds) {
  const segments = Array.isArray(sidecar?.segments) ? sidecar.segments : [];
  if (!segments.length || !Number.isFinite(videoSeconds)) return null;
  let sourceTime = 0;
  let outputTime = 0;
  for (const segment of segments) {
    const sourceDuration = Number(segment.durationSeconds) || Number(sidecar.segmentSeconds) || 0;
    const speed = Math.max(1, Number(segment.speed) || 1);
    const outputDuration = sourceDuration > 0 ? sourceDuration / speed : 0;
    if (videoSeconds <= outputTime + outputDuration + 0.001) {
      return sourceTime + Math.max(0, videoSeconds - outputTime) * speed;
    }
    sourceTime += sourceDuration;
    outputTime += outputDuration;
  }
  return sourceTime;
}

function expectedGameClockSeconds(sidecar, matchTimeMs, videoSeconds) {
  const captureStartMs = Date.parse(sidecar?.startedAt || "");
  const matchStartMs = Number(matchTimeMs || 0);
  if (!Number.isFinite(captureStartMs) || !Number.isFinite(matchStartMs) || matchStartMs <= 0) return null;
  const sourceSecond = sourceSecondForVideoSecond(sidecar, videoSeconds);
  if (!Number.isFinite(sourceSecond)) return null;
  return ((captureStartMs - matchStartMs) / 1000) + sourceSecond;
}

function clockFitsCurrentMatch(anchor, sidecar, matchTimeMs, gameLengthSeconds) {
  const visibleClock = clockSeconds(anchor.clock);
  if (!Number.isFinite(visibleClock)) return false;
  const gameLength = Number(gameLengthSeconds || 0);
  if (gameLength > 0 && visibleClock > gameLength + 120) return false;
  const expected = expectedGameClockSeconds(sidecar, matchTimeMs, Number(anchor.videoSeconds));
  if (!Number.isFinite(expected)) return true;
  return Math.abs(visibleClock - expected) <= 90;
}

function nearestClockReadTime(videoSeconds, readTimes) {
  const target = Number(videoSeconds);
  if (!Number.isFinite(target)) return null;
  const nearest = readTimes
    .map((time) => ({ time, delta: Math.abs(time - target) }))
    .sort((a, b) => a.delta - b.delta)[0];
  return nearest && nearest.delta <= 0.35 ? nearest.time : null;
}

function clockWithinSeconds(first, second, tolerance = 2.5) {
  const firstSeconds = clockSeconds(first);
  const secondSeconds = clockSeconds(second);
  return Number.isFinite(firstSeconds) && Number.isFinite(secondSeconds) && Math.abs(firstSeconds - secondSeconds) <= tolerance;
}

function anchorMatchesClock(clock, clockAnchors, toleranceSeconds = 2.5) {
  const seconds = clockSeconds(clock);
  if (!Number.isFinite(seconds)) return false;
  return cleanClockAnchors(clockAnchors).some((anchor) => {
    const anchorSeconds = clockSeconds(anchor.clock);
    return Number.isFinite(anchorSeconds) && Math.abs(anchorSeconds - seconds) <= toleranceSeconds;
  });
}

function stripUnverifiedClockReferences(value, clockAnchors) {
  const text = String(value || "");
  if (!text) return "";
  const verified = cleanClockAnchors(clockAnchors);
  const sentences = text.match(/[^.!?]+[.!?]*/g) || [text];
  const kept = sentences.filter((sentence) => {
    const clocks = String(sentence).match(/\b\d{1,2}:[0-5]\d\b/g) || [];
    return clocks.every((clock) => anchorMatchesClock(clock, verified));
  });
  return coachClean(kept.join(" "))
    .replace(/\s+([,.;:])/g, "$1")
    .replace(/\(\s*\)/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function stripUnverifiedTimelineItems(value, clockAnchors) {
  return cleanList(value, 6)
    .map((item) => stripUnverifiedClockReferences(item, clockAnchors))
    .filter(Boolean);
}

function analysisCoachText(analysis) {
  return [
    analysis?.feedbackTitle,
    analysis?.feedback,
    analysis?.gameDetail,
    analysis?.eventEvidence,
    analysis?.pattern,
    analysis?.diamondRule,
    analysis?.drill,
    analysis?.focusTag
  ].map((value) => clean(value).toLowerCase()).join(" ");
}

function coachEvidenceTags(text) {
  const source = String(text || "").toLowerCase();
  const tags = new Set();
  const groups = [
    ["reset", /\b(reset|recall|spend|gold|shop|base|fountain|cash\s*out)\b/],
    ["overstay", /\b(overstay|overstayed|stay|stayed|linger|re-?engage|second fight|again|after the win|respawn|shutdown|low hp|lethal)\b/],
    ["structure", /\b(tower|turret|inhib|inhibitor|nexus|structure|end|ending|base open)\b/],
    ["wave", /\b(wave|crash|minion|farm|cs|shove|push)\b/],
    ["objective", /\b(dragon|baron|objective|tempo|map)\b/],
    ["vision", /\b(fog|vision|ward|facecheck|unknown)\b/],
    ["entry", /\b(cc|crowd control|stun|hook|ult|cooldown|second in|choke|dash|e\/r|combo|entry)\b/],
    ["numbers", /\b(numbers|outnumber|team|ally|alone|support|collapse|gank)\b/]
  ];
  for (const [tag, pattern] of groups) {
    if (pattern.test(source)) tags.add(tag);
  }
  return tags;
}

function tagOverlapScore(first, second) {
  let count = 0;
  for (const tag of first) {
    if (second.has(tag)) count += 1;
  }
  return count;
}

function anchorDescriptionLooksWeak(anchorText) {
  return /\b(player|champion)\s+(uses ability|casts abilities|begins walking out|moving in river|farming minions|last-hits minions|is moving alone|walks toward|running down)\b/i.test(anchorText) ||
    /\b(scuttle crab|scoreboard open|shop open)\b/i.test(anchorText);
}

function coachWantsEnemyStructureEvidence(analysisText) {
  return /\b(base|inhib|inhibitor|nexus|end|ending|open structure|structure conversion)\b/i.test(analysisText);
}

function anchorShowsEnemyStructure(anchorText) {
  return /\b(enemy|their|opponent|open|base|inhib|inhibitor|nexus)\b.{0,40}\b(tower|turret|structure|base|inhib|inhibitor|nexus)\b/i.test(anchorText) ||
    /\b(tower|turret|structure|base|inhib|inhibitor|nexus)\b.{0,40}\b(enemy|their|opponent|open)\b/i.test(anchorText);
}

function anchorConflictsWithStructureEvidenceNeed(anchorText, analysisText) {
  if (!coachWantsEnemyStructureEvidence(analysisText)) return false;
  if (/\b(allied|friendly|own)\b.{0,24}\b(tower|turret|base|fountain)\b/i.test(anchorText)) return true;
  return /\b(tower|turret|structure|base|inhib|nexus)\b/i.test(analysisText) &&
    !anchorShowsEnemyStructure(anchorText) &&
    !/\b(chase|chasing|sideways|away|retreat|fleeing|overextend|overstay)\b/i.test(anchorText);
}

function anchorEvidenceScore(anchor, analysis, index = 0) {
  const coachTags = coachEvidenceTags(analysisCoachText(analysis));
  const anchorText = [anchor.clock, anchor.description].map((value) => clean(value).toLowerCase()).join(" ");
  const anchorTags = coachEvidenceTags(anchorText);
  const coachText = analysisCoachText(analysis);
  let score = 0;
  score += tagOverlapScore(anchorTags, coachTags) * 7;
  const anchorSeconds = clockSeconds(anchor.clock);
  const explicitTexts = [analysis?.gameDetail, analysis?.eventEvidence, analysis?.evidence, analysis?.pattern, ...(Array.isArray(analysis?.timeline) ? analysis.timeline : [])];
  if (Number.isFinite(anchorSeconds) && explicitTexts.some((text) => timestampSecondsInText(text).some((seconds) => Math.abs(seconds - anchorSeconds) <= 2.5))) {
    score += 12;
  }
  if (/\b(low hp|low-health|lethal|shutdown|overstay|overstaying|re-?engage|recall|reset|gold|tower|turret|inhib|nexus|structure|wave|dragon|baron|fog|cc|crowd control|stun|hook|chase|chasing|sideways|enemy base|open base)\b/i.test(anchorText)) {
    score += 4;
  }
  if (anchorDescriptionLooksWeak(anchorText)) score -= 8;
  if (anchorConflictsWithStructureEvidenceNeed(anchorText, coachText)) score -= 12;
  if (anchorTags.size === 0 || tagOverlapScore(anchorTags, coachTags) === 0) score -= 5;
  return score - (index * 0.01);
}

function normalizeEvidenceDescription(description, champion = "Samira") {
  const name = clean(champion, "Samira");
  return coachClean(description)
    .replace(/\benemy champion\b/gi, "enemy")
    .replace(/\bchampion damage\b/gi, `${name} damage`)
    .replace(/\bPlayer\b/g, name)
    .replace(/\bplayer\b/g, name)
    .replace(/\bChampion\b/g, name)
    .replace(/\bchampion\b/g, name)
    .replace(/\bChamp\b/g, name)
    .replace(/\bchamp\b/g, name)
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeVisibleCoachText(text, champion = "Samira") {
  return normalizeEvidenceDescription(text, champion);
}

function usefulEvidenceMoment(anchor, analysis, threshold = 8) {
  return anchorEvidenceScore(anchor, analysis) >= threshold;
}

function contextualFallbackDescription(anchor, analysis) {
  const champion = clean(analysis?.champion, "Samira");
  const description = normalizeEvidenceDescription(anchor.description || "", champion).replace(/[.!?]+$/g, "");
  const coachText = analysisCoachText(analysis);
  if (coachWantsEnemyStructureEvidence(coachText)) {
    return `${description}; setup for the structure decision, where the next check is tower, inhibitor, nexus, or no chase.`;
  }
  if (coachEvidenceTags(coachText).has("reset")) {
    return `${description}; setup for the reset decision, where the next check is recall, spend, or keep risking the shutdown.`;
  }
  if (coachEvidenceTags(coachText).has("overstay")) {
    return `${description}; setup for the overstay decision, where the next check is leave now or accept another risky fight.`;
  }
  return `${description}; setup for the same coaching decision.`;
}

function ensureMinimumEvidenceMoments(analysis, anchors, moments, minItems = 2) {
  const allowed = cleanClockAnchors(anchors);
  const selected = cleanClockAnchors(moments);
  if (selected.length >= Math.min(minItems, allowed.length)) return selected;
  const selectedKeys = new Set(selected.map((moment) => `${moment.clock}@${moment.videoSeconds}`));
  const reference = selected.length ? selected[0].videoSeconds : null;
  const candidates = allowed
    .filter((anchor) => !selectedKeys.has(`${anchor.clock}@${anchor.videoSeconds}`))
    .map((anchor, index) => {
      const contextual = { ...anchor, description: contextualFallbackDescription(anchor, analysis) };
      return {
        anchor: contextual,
        score: anchorEvidenceScore(contextual, analysis, index),
        distance: Number.isFinite(reference) ? Math.abs(anchor.videoSeconds - reference) : anchor.videoSeconds
      };
    })
    .sort((a, b) => b.score - a.score || a.distance - b.distance || a.anchor.videoSeconds - b.anchor.videoSeconds);
  const out = [...selected];
  for (const candidate of candidates) {
    if (out.length >= Math.min(minItems, allowed.length)) break;
    out.push(candidate.anchor);
  }
  return dedupeClockAnchors(out).sort((a, b) => a.videoSeconds - b.videoSeconds);
}

function selectUsefulEvidenceMoments(analysis, anchors, proposed = [], maxItems = 4, threshold = 8) {
  const allowed = cleanClockAnchors(anchors);
  const byKey = new Map(allowed.map((anchor) => [`${anchor.clock}@${anchor.videoSeconds}`, anchor]));
  const champion = clean(analysis?.champion, "Samira");
  const selected = cleanClockAnchors(proposed)
    .map((moment) => {
      const match = byKey.get(`${moment.clock}@${moment.videoSeconds}`) ||
        allowed.find((anchor) => anchor.clock === moment.clock && Math.abs(Number(anchor.videoSeconds) - Number(moment.videoSeconds)) <= 0.01);
      return match ? { ...match, description: normalizeEvidenceDescription(moment.description || match.description || "", champion) } : null;
    })
    .filter(Boolean)
    .filter((moment) => usefulEvidenceMoment(moment, analysis, threshold));
  const selectedKeys = new Set(selected.map((moment) => `${moment.clock}@${moment.videoSeconds}`));
  const fill = allowed
    .map((anchor, index) => ({ anchor: { ...anchor, description: normalizeEvidenceDescription(anchor.description || "", champion) }, score: anchorEvidenceScore(anchor, analysis, index) }))
    .filter((item) => item.score >= threshold)
    .filter((item) => !selectedKeys.has(`${item.anchor.clock}@${item.anchor.videoSeconds}`))
    .sort((a, b) => b.score - a.score || a.anchor.videoSeconds - b.anchor.videoSeconds)
    .map((item) => item.anchor);
  return dedupeClockAnchors([...selected, ...fill])
    .slice(0, maxItems)
    .sort((a, b) => a.videoSeconds - b.videoSeconds);
}

function fallbackEvidenceClockMoments(analysis, clockAnchors, maxItems = 4) {
  return selectUsefulEvidenceMoments(analysis, clockAnchors, [], maxItems);
}

function anchorsSignature(clockAnchors) {
  return cleanClockAnchors(clockAnchors)
    .map((anchor) => `${anchor.clock}@${anchor.videoSeconds}:${anchor.description || ""}`)
    .join("|");
}

async function selectEvidenceClockMoments({ file, analysis, clockAnchors, frameDir, cacheKey }) {
  const anchors = cleanClockAnchors(clockAnchors).filter((anchor) => anchor.description);
  if (!anchors.length) return [];
  const signature = anchorsSignature(anchors);
  const cachePath = path.join(frameDir, "coach-evidence-moments.json");
  if (analysis?.analysisSource === "manual") {
    const manualMoments = ensureMinimumEvidenceMoments(analysis, anchors, evidenceMomentsFromText(analysis, anchors));
    if (manualMoments.length >= Math.min(2, anchors.length)) return manualMoments.slice(0, 4);
  }
  const cached = await readJsonSafe(cachePath);
  if (cached?.cacheKey === cacheKey && cached?.coachEvidenceVersion === coachEvidenceVersion && cached?.anchorsSignature === signature) {
    const cachedMoments = ensureMinimumEvidenceMoments(
      analysis,
      anchors,
      selectUsefulEvidenceMoments(analysis, anchors, cached.clockMoments)
    );
    if (cachedMoments.length) return cachedMoments;
  }
  if (!process.env.OPENAI_API_KEY) return fallbackEvidenceClockMoments(analysis, anchors);
  const allowed = anchors.map((anchor) => ({
    clock: anchor.clock,
    videoSeconds: anchor.videoSeconds,
    description: anchor.description || ""
  }));
  const prompt = [
    "Choose the clickable timestamp moments that are actual evidence for the coaching claim, not just random readable game clocks.",
    "Alan uses these timestamps to study what he did wrong or what he should repeat. If the advice is overstay/reset, choose frames that show staying, low HP, respawns, gold/recall context, or the reset window. If the advice is structure conversion, choose frames that show tower/inhib/nexus or a chase away from it. If the advice is wave/objective/vision/CC, choose frames that visibly support that claim.",
    "Use only the allowed anchors below. Do not invent clocks, videoSeconds, or events. Choose 2-4 moments when at least 2 allowed anchors can show setup, mistake, consequence, or the correct contrasting habit.",
    "Only return 1 moment if there is genuinely only 1 connected anchor. A setup anchor plus a consequence anchor is better than one perfect anchor.",
    "If an allowed anchor is only normal gameplay, walking, farming, shop, respawn, or a random fight unrelated to the coaching claim, reject it.",
    "Descriptions should be short evidence labels tied to the lesson, not generic frame captions. Say Samira, not Player or Champion.",
    "Return only JSON with this shape:",
    '{"clockMoments":[{"clock":"MM:SS","videoSeconds":0,"description":"why this frame is evidence for the lesson"}]}',
    `Recording file: ${file}.`,
    `Feedback title: ${coachClean(analysis?.feedbackTitle, "")}`,
    `Feedback: ${coachClean(analysis?.feedback, "")}`,
    `Game story: ${coachClean(analysis?.gameDetail, "")}`,
    `Event evidence: ${coachClean(analysis?.eventEvidence, "")}`,
    `Allowed anchors: ${JSON.stringify(allowed)}`
  ].join("\n");
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        store: false,
        max_output_tokens: 900,
        input: [
          {
            role: "user",
            content: [{ type: "input_text", text: prompt }]
          }
        ]
      })
    });
    if (!response.ok) throw new Error(`OpenAI evidence moment response ${response.status}`);
    const parsed = parseJsonText(extractOutputText(await response.json()));
    const selected = selectUsefulEvidenceMoments(analysis, anchors, parsed.clockMoments, 4);
    const clockMoments = ensureMinimumEvidenceMoments(
      analysis,
      anchors,
      selected.length ? selected : fallbackEvidenceClockMoments(analysis, anchors)
    ).slice(0, 4);
    await fs.writeFile(cachePath, `${JSON.stringify({
      cacheKey,
      coachEvidenceVersion,
      anchorsSignature: signature,
      generatedAt: new Date().toISOString(),
      clockMoments
    }, null, 2)}\n`, "utf8");
    return clockMoments;
  } catch (error) {
    console.warn(`Coach evidence moment fallback for ${file}: ${error.message}`);
    return fallbackEvidenceClockMoments(analysis, anchors);
  }
}

function evidenceTextFromMoments(clockMoments) {
  const moments = cleanClockAnchors(clockMoments)
    .filter((moment) => moment.description)
    .slice(0, 3);
  if (!moments.length) return "";
  return moments.map((moment) => `${moment.clock} ${coachClean(moment.description)}`).join("; ");
}

function annotateClockAnchorsWithMoments(clockAnchors, clockMoments) {
  const moments = cleanClockAnchors(clockMoments);
  return cleanClockAnchors(clockAnchors).map((anchor) => {
    if (anchor.description) return anchor;
    const anchorSeconds = clockSeconds(anchor.clock);
    const match = moments.find((moment) => {
      const momentSeconds = clockSeconds(moment.clock);
      return Number.isFinite(anchorSeconds) && Number.isFinite(momentSeconds) && Math.abs(anchorSeconds - momentSeconds) <= 2.5;
    });
    return match?.description ? { ...anchor, description: match.description } : anchor;
  });
}

function evidenceMomentsFromText(analysis, anchors, maxItems = 4) {
  const allowed = cleanClockAnchors(anchors);
  if (!allowed.length) return [];
  const champion = clean(analysis?.champion, "Samira");
  const text = coachClean([analysis?.eventEvidence, analysis?.gameDetail, analysis?.timeline?.join("; ")].filter(Boolean).join("; "));
  const chunks = text.match(/[^.;!?]+(?:[.;!?]+|$)/g) || [];
  const moments = [];
  for (const chunk of chunks) {
    const clocks = String(chunk).match(/\b\d{1,2}:[0-5]\d\b/g) || [];
    for (const clock of clocks) {
      const clockValue = clockSeconds(clock);
      if (!Number.isFinite(clockValue)) continue;
      const match = allowed
        .map((anchor) => ({
          anchor,
          delta: Math.abs(clockSeconds(anchor.clock) - clockValue)
        }))
        .filter((item) => Number.isFinite(item.delta) && item.delta <= 2.5)
        .sort((a, b) => a.delta - b.delta || (b.anchor.description ? 1 : 0) - (a.anchor.description ? 1 : 0))[0]?.anchor;
      if (!match) continue;
      const description = normalizeEvidenceDescription(
        String(chunk).replace(/\b\d{1,2}:[0-5]\d\b\s*-?\s*/g, "").trim() || match.description || "",
        champion
      );
      moments.push({ ...match, description });
    }
  }
  return dedupeClockAnchors(moments).slice(0, maxItems);
}

function sentenceParts(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .trim()
    .match(/[^.!?]+[.!?]+(?:["')\]]+)?|[^.!?]+$/g) || [];
}

function clockSetInText(text) {
  return new Set(timestampSecondsInText(text).map((seconds) => Math.round(seconds)));
}

function sentenceUsesMomentClock(sentence, clockMoments) {
  const sentenceClocks = clockSetInText(sentence);
  return cleanClockAnchors(clockMoments)
    .map((moment) => clockSeconds(moment.clock))
    .some((seconds) => Number.isFinite(seconds) && sentenceClocks.has(Math.round(seconds)));
}

function usefulMomentCountInText(text, clockMoments) {
  const textClocks = clockSetInText(text);
  return cleanClockAnchors(clockMoments)
    .map((moment) => clockSeconds(moment.clock))
    .filter((seconds) => Number.isFinite(seconds) && textClocks.has(Math.round(seconds)))
    .length;
}

function clauseDescription(description, champion) {
  const cleaned = normalizeEvidenceDescription(description, champion)
    .replace(/[.!?]+$/g, "")
    .replace(/^at\s+\d{1,2}:[0-5]\d,?\s*/i, "")
    .replace(/^shows\b/i, "shows")
    .replace(/^team\b/i, "the team")
    .replace(/^open\b/i, "open")
    .replace(/^safe\b/i, "safe")
    .replace(/^wave\b/i, "the wave")
    .replace(/^blue\b/i, "blue")
    .replace(/^post-fight\b/i, "post-fight")
    .trim();
  if (/^(Samira|Jinx|Braum|Lux|Kayle|Garen|Mordekaiser|Ashe|Fizz|Diana|Gragas|Caitlyn|Summoner's Rift)\b/.test(cleaned)) {
    return cleaned;
  }
  return cleaned.replace(/^([A-Z])/, (_, letter) => letter.toLowerCase());
}

function momentEvidenceSentence(clockMoments, champion = "Samira") {
  const moments = cleanClockAnchors(clockMoments)
    .filter((moment) => moment.description)
    .slice(0, 3);
  if (moments.length < 2) return "";
  const leadWords = ["Around", "By", "Then around"];
  const clauses = moments.map((moment, index) => {
    const description = clauseDescription(moment.description, champion);
    return `${leadWords[index] || "Around"} ${moment.clock}, ${description}`;
  });
  return `${clauses.join("; ")}.`;
}

function integrateMomentEvidence(gameDetail, clockMoments, champion = "Samira") {
  const cleaned = normalizeVisibleCoachText(gameDetail, champion);
  const moments = cleanClockAnchors(clockMoments).filter((moment) => moment.description);
  if (moments.length < 2) return cleaned;
  const strippedSentences = sentenceParts(cleaned).filter((sentence) => {
    const clocks = timestampSecondsInText(sentence);
    return !(clocks.length >= 2 && sentenceUsesMomentClock(sentence, moments));
  });
  const base = normalizeVisibleCoachText(strippedSentences.join(" "), champion);
  if (usefulMomentCountInText(base, moments) >= Math.min(2, moments.length)) return base;
  const evidenceSentence = momentEvidenceSentence(moments, champion);
  if (!evidenceSentence) return base;
  const sentences = sentenceParts(base);
  if (!sentences.length) return evidenceSentence;
  const lessonIndex = sentences.findIndex((sentence) => /\b(the\s+)?(big|simple|core|main)?\s*lesson\b/i.test(sentence));
  const insertAt = lessonIndex >= 0 ? lessonIndex : Math.max(1, sentences.length - 1);
  sentences.splice(insertAt, 0, evidenceSentence);
  return coachClean(sentences.join(" "));
}

async function readExistingManifest() {
  try {
    return JSON.parse(await fs.readFile(manifestPath, "utf8"));
  } catch {
    return null;
  }
}

function stableManifest(manifest) {
  if (!manifest) return null;
  return {
    ...manifest,
    generatedAt: ""
  };
}

function sameManifestContent(a, b) {
  return JSON.stringify(stableManifest(a)) === JSON.stringify(stableManifest(b));
}

function cacheKeyFor(stat) {
  return `${stat.size}:${Math.round(stat.mtimeMs)}`;
}

function cachedRecording(existing, fileName, cacheKey) {
  const cached = existing?.recordings?.find((item) => (
    item.file === fileName &&
    item.cacheKey === cacheKey &&
    item.analysisVersion === analysisVersion
  ));
  if (!cached) return null;
  if (manualFeedback(fileName)) return null;
  if (cached.analysisSource === "fallback" && process.env.LEAGUE_RETRY_FALLBACK === "1" && process.env.OPENAI_API_KEY) return null;
  if (process.env.LEAGUE_FORCE_ANALYSIS === "1") return null;
  return cached;
}

function manualFeedback(file) {
  if (file === "16-10_NA1-5564259818_01.webm") {
    return {
      champion: "Samira",
      confidence: "high",
      feedbackTitle: "Finish-window all-in",
      feedback: "Mistake: over-learning this clip would make you throw; the same dash is bad if it starts without wave, teammate body, or nexus pressure. Fix: full send only when every reset moves toward the payout.",
      gameDetail: "At 14:21 the fight is already in their base, not in river or a side lane: allies and minions are in front, enemy defenders are packed near nexus, and Samira is close enough to chain resets without walking into fog. At 14:27 the first two kills land and the play becomes a real cleanup instead of a random chase. At 14:33 the chain reaches triple, at 14:38 the quadra happens beside the nexus area, and at 14:41 the penta lands because the fight never leaves the ending window. Learn this exactly: the all-in is good when the map is already ending; outside that condition, cash out first.",
      whyTrust: "The penta is not random: the clip shows the conditions that made it valid, with allies and minions already in base and every reset moving toward nexus.",
      eventEvidence: "14:21 fight starts inside the enemy base with multiple enemy defenders still alive; 14:27 double kill; 14:33 triple; 14:38 quadra near nexus; 14:41 penta as the base remains open.",
      goodThing: "The strong part is the finish discipline: once the enemy line collapses, Samira stays with the ally/minion push and cleans through the defenders instead of drifting sideways.",
      focusTag: "finish-only all-in",
      evidence: "Manual storyboard review of the May 20 highlight: visible base fight from 14:21 to 14:41, double/triple/quadra/penta sequence, and enemy base already open.",
      pattern: "Samira's best-looking fight here works because the map already gives the exit and the payout. The dangerous habit would be copying the same depth when the fight is not already a base finish.",
      diamondRule: "All-in only when the reset path and the payout are the same direction.",
      drill: "Before E/R, ask: does every reset move me toward nexus, tower, dragon, Baron, or safety?",
      timeline: [
        "14:21 - Samira is already inside the enemy base with several defenders alive and allied pressure in front.",
        "14:27 - The first two kills land, turning the base fight into a cleanup instead of a loose chase.",
        "14:33 - The reset chain reaches triple while the wave and allies still hold the base area.",
        "14:38 - The quadra happens near nexus instead of in a side lane or fog pocket.",
        "14:41 - The penta lands with the enemy base open, which is the correct payoff condition."
      ],
      clockAnchors: [
        { clock: "14:21", videoSeconds: 0.9 },
        { clock: "14:27", videoSeconds: 6.7 },
        { clock: "14:30", videoSeconds: 9.6 },
        { clock: "14:33", videoSeconds: 12.5 },
        { clock: "14:38", videoSeconds: 18.3 },
        { clock: "14:41", videoSeconds: 21.2 }
      ],
      nuance: [
        "The clip starts after the decision to enter, so it cannot prove whether the first click was disciplined.",
        "The visible reason the play works is base geometry plus allies and minions, not just raw damage.",
        "The penta is good evidence that the cleanup mechanics are there.",
        "The next improvement is knowing when not to copy this same depth outside a finish window."
      ],
      reviewLimit: "The Riot highlight is only about 22 seconds, so the review claims the visible base fight and does not invent the earlier setup.",
      analysisSource: "manual"
    };
  }
  if (file === "auto_NA1-5563660362_01.mp4") {
    return {
      champion: "Samira",
      confidence: "high",
      feedbackTitle: "You drift after base opens",
      feedback: "Mistake: you chase sideways after the base is already open. Fix: stand behind the first body in and hit the structure as soon as space is made.",
      gameDetail: "Honest read: the useful footage starts after a desktop-capture section, and the lesson is still clear. Around 12:10 Samira is low below the enemy base entrance while allies are already fighting inside the cracked base; the next valuable movement is backward-to-safe or forward-to-structure with the team, not a solo side angle. Around 13:05 the map slows down: Mordekaiser walks away mid, an ally is channeling recall, and Samira is full HP with the lane already open, which is exactly the moment to choose wave/base route before another target appears. Around 13:15 the camera follows Mordekaiser again and Samira casts Q/Flair into him from close range; the spell connects, but the important part is that the fight is sideways while the open base is still the real payout. Around 14:19 the clean version finally shows up: multiple enemies are dead, minions are in the base, Samira is behind the front body, and the team is hitting the ending area instead of wandering after another duel.",
      whyTrust: "The win came from returning to the open base, not from a cleaner combo. Your damage was not the limiting factor; target discipline was.",
      eventEvidence: "12:10 low Samira below the open enemy base entrance; 13:15 Q/Flair into Mordekaiser during a sideways mid fight; 14:19 team and minions are back inside the base to end.",
      goodThing: "You did group back toward the base and finish the game instead of letting the push fully dissolve.",
      focusTag: "end the push",
      evidence: "Review clip frames with visible game clock: base pressure near 12:10, Mordekaiser Q/Flair around 13:15, final base push around 14:19.",
      pattern: "The winning pressure was already available. The mistake is treating a nearby champion like the win condition after the actual win condition is already open.",
      diamondRule: "If a base structure is available, a chase is wrong unless it directly removes the body blocking the structure.",
      drill: "Next game: when inhibitor or nexus is open, say front line, structure, no chase.",
      timeline: [
        "12:10 - Samira is low below the enemy base entrance while allies are already inside the cracked base.",
        "13:15 - Samira Q/Flair follows Mordekaiser mid instead of immediately routing the open lane back to base.",
        "14:19 - The team has minions inside the base and Samira is behind the first body, which is the clean ending shape."
      ],
      clockAnchors: [
        { clock: "11:51", videoSeconds: 9.300 },
        { clock: "12:10", videoSeconds: 27.800 },
        { clock: "13:05", videoSeconds: 83.300 },
        { clock: "13:15", videoSeconds: 92.500 },
        { clock: "13:52", videoSeconds: 129.500 },
        { clock: "14:01", videoSeconds: 138.800 },
        { clock: "14:10", videoSeconds: 148.000 },
        { clock: "14:19", videoSeconds: 157.300 }
      ],
      nuance: [
        "The most useful footage is the late-game base decision, not the scoreboard line.",
        "The mistake is drifting after the base route is already available.",
        "Samira's cleanest role here is finisher behind the first body, not fight starter.",
        "The recording still contains desktop-capture segments from before the window-only recorder fix."
      ],
      reviewLimit: "The clip has desktop-capture segments mixed with game footage, so the narrative only claims the visible game moments.",
      analysisSource: "manual"
    };
  }
  if (file === "16-10_NA1-5563352800_01.webm") {
    return {
      champion: "Samira",
      confidence: "high",
      feedbackTitle: "You re-fight after winning",
      feedback: "Mistake: you keep playing for another fight after the first win. Fix: cash out wave, tower, reset, or end before touching another champion.",
      gameDetail: "Honest read: this is improved, but the same leak keeps coming back after the good moment. Around 1:24 Samira is fighting under the friendly bot tower with Jinx and Braum still on screen; the movement is forward into a contested lane pocket while the safer value is to thin the wave, hold the tower line, and make them walk into you. Around 7:58 the good version happens: the bot push is already under enemy tower, the wave is with you, and the won pressure turns into turret damage instead of another random chase. Around 10:32 Samira is low in bot lane while Braum and Jinx can still answer, so every extra step forward is a shutdown invitation unless the next click is reset or structure. Around 12:44 the punishment is visible: the fight is still extended near the enemy side, crowd control lands, and the screen shows a shutdown instead of a clean cashout. The lesson is not to fight less; it is to make the first won fight buy the wave, turret, reset, or end before accepting the second one.",
      whyTrust: "The same game shows both sides: turret conversion is the right version, and the later low-health re-fight is how stronger opponents get shutdown gold back.",
      eventEvidence: "1:24 contested fight under friendly bot tower; 7:58 won bot push becomes turret damage; 10:32 low-health lane stay; 12:44 crowd control and shutdown punish the extended fight.",
      goodThing: "The good part was real: you turned one bot-side win into turret pressure instead of only chasing kills.",
      focusTag: "payout before dash",
      evidence: "Manual storyboard review of the May 18 8:10 PM game: early bot pressure, double-kill conversion, turret take, inhibitor take, and nexus pressure.",
      pattern: "The damage is already there. The leak is the second decision: after the first win, you often accept another fight before the map payout is locked.",
      diamondRule: "First win buys wave, tower, reset, or end before the next fight is allowed.",
      drill: "After the first kill or forced recall, say cash out before moving forward.",
      timeline: [
        "1:24 - Early bot fight is still near friendly tower with both lane enemies able to answer.",
        "7:58 - Bot pressure becomes turret, which is the good conversion.",
        "10:32-12:44 - Low-health extended fighting replaces the clean cashout/reset."
      ],
      clockAnchors: [
        { clock: "0:19", videoSeconds: 4.000 },
        { clock: "1:09", videoSeconds: 20.902 },
        { clock: "1:24", videoSeconds: 35.816 },
        { clock: "1:26", videoSeconds: 37.805 },
        { clock: "1:42", videoSeconds: 54.707 },
        { clock: "2:20", videoSeconds: 71.610 },
        { clock: "3:00", videoSeconds: 88.512 },
        { clock: "3:35", videoSeconds: 105.415 },
        { clock: "4:08", videoSeconds: 122.317 },
        { clock: "4:42", videoSeconds: 139.220 },
        { clock: "5:16", videoSeconds: 156.122 },
        { clock: "6:11", videoSeconds: 173.025 },
        { clock: "7:06", videoSeconds: 189.927 },
        { clock: "7:39", videoSeconds: 206.830 },
        { clock: "7:58", videoSeconds: 216.100 },
        { clock: "8:15", videoSeconds: 223.732 },
        { clock: "8:47", videoSeconds: 240.635 },
        { clock: "9:31", videoSeconds: 257.537 },
        { clock: "10:05", videoSeconds: 274.440 },
        { clock: "10:32", videoSeconds: 288.269 },
        { clock: "10:38", videoSeconds: 291.342 },
        { clock: "11:38", videoSeconds: 308.245 },
        { clock: "11:54", videoSeconds: 325.147 },
        { clock: "12:08", videoSeconds: 342.050 },
        { clock: "12:42", videoSeconds: 358.952 },
        { clock: "12:44", videoSeconds: 359.946 },
        { clock: "13:16", videoSeconds: 375.855 },
        { clock: "14:25", videoSeconds: 392.757 }
      ],
      nuance: [
        "At 3:40 the bot fight becomes a double kill because Samira stays near the wave and ally pressure.",
        "At 7:58 the won lane becomes turret gold instead of more random fighting.",
        "At 10:32 Samira is low while Braum is still present; that is a cashout moment, not a retest moment.",
        "At 12:44 Samira is still in the extended lane fight with enemy tools active; that habit gets punished fast.",
        "Beginner bot games reward extra fighting, so the transferable skill is conversion first, second fight only if it protects the payout."
      ],
      reviewLimit: "Manual review used sampled replay frames and log timing, not raw inputs or full cooldown telemetry.",
      analysisSource: "manual"
    };
  }
  if (file !== "16-10_NA1-5563301586_01.webm") return null;
  return {
    champion: "Samira",
    confidence: "high",
    feedbackTitle: "You stay when one hit kills you",
    feedback: "Mistake: you keep playing the wave when one auto or spell kills you. Fix: give the wave and recall before the lane turns into a death timer.",
    gameDetail: "Honest read: this is not a mechanics issue; it is a health-gate issue. At 2:43 Samira is under bot tower with the enemy wave arriving, Ashe still visible to the right, and enough missing HP that the lane should already be treated as dangerous instead of playable. At 3:27 the real mistake is clearer: Samira is still beside the bot wave at lethal health, the camera and movement are staying with minions, and the recall path has not been taken even though one clean enemy touch can turn the wave into a death timer. At 4:57 the good version is visible after the reset: Samira is back on the map with enough HP to walk forward, Q/auto from range, and choose the next trade instead of begging not to be hit. By 14:28 the team is ending with Samira alive around the base fight, which proves the champion damage is not the blocker. The blocker is staying in lane after the health bar says the next decision should be recall.",
    whyTrust: "This is not vague advice: the reviewed frames show the exact one-hit-health lane stay, and removing that habit protects the aggression that already works later.",
    eventEvidence: "2:43 Samira is under bot tower with Ashe still visible and the wave arriving; 3:27 Samira is still in lane at lethal health; 4:57 reset gives enough HP to re-enter; 14:28 the later team ending works.",
    goodThing: "After the bad early health decision, you still got back into the game and converted later pressure into the ending push.",
    focusTag: "lethal hp reset",
    evidence: "Manual storyboard review of the May 18 full recording: early lane death at lethal HP, later kills and turret/base conversion after grouping.",
    pattern: "The new game is better at converting once Samira has items, but the early lane still has a lethal-HP greed point: staying for the wave while one hit from death turns a manageable recall into a death timer.",
    diamondRule: "Below one enemy auto or spell, the wave is no longer the objective; reset first, then play the next item spike.",
    drill: "At low HP, say one hit kills me and recall unless the enemy bot lane is dead or fully gone.",
    timeline: [
      "2:43 - Samira is under bot tower with Ashe still visible and the wave arriving.",
      "3:27 - Samira is still in lane at lethal health instead of already reset.",
      "4:57 - Samira is back with enough HP to re-enter and choose the next trade.",
      "14:28 - The later ending works, which makes the early health-gate mistake the cleaner thing to remove."
    ],
    clockAnchors: [
      { clock: "0:57", videoSeconds: 4.000 },
      { clock: "1:20", videoSeconds: 26.561 },
      { clock: "1:42", videoSeconds: 49.123 },
      { clock: "2:05", videoSeconds: 71.684 },
      { clock: "2:27", videoSeconds: 94.246 },
      { clock: "2:43", videoSeconds: 109.941 },
      { clock: "2:50", videoSeconds: 116.807 },
      { clock: "3:13", videoSeconds: 139.368 },
      { clock: "3:27", videoSeconds: 153.726 },
      { clock: "3:35", videoSeconds: 161.930 },
      { clock: "4:21", videoSeconds: 184.491 },
      { clock: "4:44", videoSeconds: 207.053 },
      { clock: "4:57", videoSeconds: 220.385 },
      { clock: "5:06", videoSeconds: 229.614 },
      { clock: "5:51", videoSeconds: 252.175 },
      { clock: "6:13", videoSeconds: 274.737 },
      { clock: "6:36", videoSeconds: 297.298 },
      { clock: "7:43", videoSeconds: 319.860 },
      { clock: "8:09", videoSeconds: 342.421 },
      { clock: "8:42", videoSeconds: 364.982 },
      { clock: "9:04", videoSeconds: 387.544 },
      { clock: "9:53", videoSeconds: 410.105 },
      { clock: "11:18", videoSeconds: 432.667 },
      { clock: "12:57", videoSeconds: 455.228 },
      { clock: "13:20", videoSeconds: 477.789 },
      { clock: "14:13", videoSeconds: 500.351 },
      { clock: "14:28", videoSeconds: 505.800 },
      { clock: "14:45", videoSeconds: 522.912 }
    ],
    nuance: [
      "At 2:43 the wave is not worth more than the death timer.",
      "At 3:27 the lane is still being played from one-hit health, which better enemies punish immediately.",
      "Later frames show better conversion: kills become turret pressure, inhibitor pressure, and nexus pressure.",
      "The improvement is to keep the later aggression while removing the early death that delays the first real item window."
    ],
    reviewLimit: "Manual review used sampled replay frames and close-up storyboard sheets, not raw inputs or complete cooldown telemetry.",
    analysisSource: "manual"
  };
}

function fallbackFeedback(file, duration, context = {}) {
  const clipNumber = Number(file.match(/_(\d+)\.webm$/i)?.[1]) || 0;
  if (duration < 3) {
    return {
      champion: "Samira",
      confidence: "low",
      feedbackTitle: "Make clips reviewable",
      feedback: "Keep at least five seconds before and after the fight so the trigger, cooldowns, and exit can be judged.",
      gameDetail: "The clip is too short to show the setup, so the review cannot honestly separate a good death, a late dash, or a missed exit. The next useful rep is evidence quality first: record enough before and after the fight so the next review can judge the decision, not just the result.",
      whyTrust: "The advice is low-confidence on gameplay and high-confidence on review quality because a one-second clip hides the decision that caused the outcome.",
      eventEvidence: "The visible clip is shorter than three seconds, so the important pre-fight setup is missing.",
      goodThing: "",
      focusTag: "recording context",
      evidence: "The recording is shorter than three seconds.",
      pattern: "The clip is too short to show the decision before the result.",
      diamondRule: "Record the trigger, the fight, and the exit so the review can judge the decision instead of the scoreboard.",
      drill: "Capture five seconds before and after the next fight.",
      nuance: ["The visible result is not enough evidence for a confident gameplay diagnosis."],
      reviewLimit: "Low gameplay confidence because the recording lacks pre-fight context.",
      analysisSource: "fallback"
    };
  }
  if (duration > 90) {
    return {
      champion: "Samira",
      confidence: "medium",
      feedbackTitle: "16/10 means conversion gap",
      feedback: "The full-game read says damage is enough; the next useful rep is ending won fights through wave, tower, dragon, Baron, nexus, or recall.",
      gameDetail: "This full review shows Samira can already create kills, so the climb gap is what happens right after the first win. The next useful rep is converting the won fight into wave, tower, objective, nexus, or recall before the next fight gives shutdown gold back.",
      whyTrust: "A 16/10 Samira can already create leads; reducing deaths after wins keeps shutdown gold and turns mechanics into rank pressure.",
      eventEvidence: "",
      goodThing: "You are finding fights and creating damage pressure; the fix is cashing those wins out cleaner.",
      focusTag: "overstay control",
      evidence: "",
      pattern: "The carry score says damage is available, so the rank leak is likely conversion after the first winning moment.",
      diamondRule: "After a won fight, take the guaranteed payout before looking for the next fight.",
      drill: "Say the payout out loud after every kill: wave, tower, dragon, Baron, nexus, or recall.",
      nuance: ["High kills only matter when the map state changes.", "Shutdown deaths after a win erase the lead Samira already created."],
      reviewLimit: "",
      analysisSource: "fallback"
    };
  }
  const samiraFallbacks = [
    {
      feedbackTitle: "Ask for the payout first",
      feedback: "Before committing, know what the win buys: crash, plate, tower, dragon move, recall, or end.",
      gameDetail: "The useful question in this clip is not whether Samira can win the fight; it is what the fight buys immediately after. The next useful rep is naming the payout before the commit so pressure becomes a wave crash, plate, tower, objective move, recall, or end.",
      whyTrust: "Strong ADC games climb by turning pressure into tempo; a kill with no payout is just a higher-risk fight.",
      pattern: "The fight needs a planned map payout before the commit.",
      diamondRule: "Commit only when the win has an immediate conversion path.",
      drill: "Name the payout before pressing the engage button.",
      nuance: ["A good-looking kill is still low value if the wave or objective stays unchanged."],
      focusTag: "commit timing"
    },
    {
      feedbackTitle: "Name the CC before going in",
      feedback: "Before E/R, identify the one spell that cancels the play; enter only after it is spent, blocked by W, or aimed elsewhere.",
      gameDetail: "This clip is about the spell that can stop Samira before the reset starts. The next useful rep is entering only after that crowd-control spell is spent, blocked, or aimed elsewhere, which keeps aggression while removing the easiest shutdown path.",
      whyTrust: "This is the highest-value check because one untracked stun, root, knock-up, or hook turns Samira's whole reset plan off.",
      pattern: "The dangerous moment is entering before the enemy's fight-stopping spell is accounted for.",
      diamondRule: "No full commit until the one spell that stops Samira is gone or aimed elsewhere.",
      drill: "Name one enemy CC spell before every fight.",
      nuance: ["The check is not passive; it preserves aggression by waiting for the real opening."],
      focusTag: "reset discipline"
    },
    {
      feedbackTitle: "Stop chasing at fog",
      feedback: "A low target past vision is not free; shove the wave or take plate unless the next enemy position is known.",
      gameDetail: "The low target is tempting, but fog removes the information needed to know whether the next dash is a reset or a bait. The next useful rep is stopping at vision loss and taking wave or plate unless enemy positions are known.",
      whyTrust: "The rule is trustworthy because fog removes the information Samira needs to decide whether the next E is a reset or a bait.",
      pattern: "Chasing past fog turns a won trade into an information gamble.",
      diamondRule: "Stop at fog unless the next enemy positions are known.",
      drill: "When the target leaves vision, look at wave and objective before moving forward.",
      nuance: ["Fog is not just darkness; it removes reset and exit information."],
      focusTag: "chase discipline"
    },
    {
      feedbackTitle: "Turn bot kills into tempo",
      feedback: "After the first kill or forced recall, crash wave first, then choose plate, dragon move, reset, or support roam.",
      gameDetail: "The lane win matters only if the enemy loses minions, plates, tempo, or map space after it. The next useful rep is touching the wave before looking for more fighting, because the crash makes every next option safer.",
      whyTrust: "This is how a won lane becomes rank progress: the enemy loses minions and map space even if no second kill happens.",
      pattern: "Lane wins need to become minion loss, plate pressure, or objective tempo.",
      diamondRule: "Crash before chasing the second reward.",
      drill: "After a bot kill, touch the wave before looking for another fight.",
      nuance: ["The crash makes the next play safer because the enemy loses time answering the wave."],
      focusTag: "objective conversion"
    },
    {
      feedbackTitle: "Fight from the edge first",
      feedback: "Let Q, autos, and W collect cooldowns before entering; Samira should clean the fight, not start it blind.",
      gameDetail: "This clip points to Samira's best entry shape: use the edge of the fight to collect cooldown information, then dash when the reset path is real. The next useful rep is staying aggressive while delaying the full commit by one beat.",
      whyTrust: "This lowers anxiety without lowering aggression because edge play gathers real cooldown evidence before the all-in.",
      pattern: "The edge of the fight gives Samira information without spending the dash.",
      diamondRule: "Fight the first second from range, then enter after the enemy spends tools.",
      drill: "Q-auto once before committing unless the target is already isolated and lethal.",
      nuance: ["This is still aggressive because it prepares the reset instead of canceling the fight."],
      focusTag: "crowd-control tracking"
    },
    {
      feedbackTitle: "Do not review one-second clips",
      feedback: "This moment needs pre-fight context; future highlight capture should include the decision before the kill screen.",
      gameDetail: "The important decision happened before the visible moment, so the clip cannot support a confident mechanics diagnosis. The next useful rep is making the reviewable window longer so the next note can tie the mistake to positioning, cooldowns, or wave state.",
      whyTrust: "The feedback is about evidence quality, not blame; better clips make the review less guessy and easier to trust.",
      pattern: "The recording starts after the important decision.",
      diamondRule: "Review needs the setup, not only the outcome.",
      drill: "Use longer highlight capture for the next fight.",
      nuance: ["The missing seconds may contain the cooldown or positioning mistake."],
      focusTag: "reset discipline"
    },
    {
      feedbackTitle: "Protect the shutdown",
      feedback: "After a tower or multi-kill, leave with the shutdown value instead of retesting the fight.",
      gameDetail: "Once Samira has the payout, the risk changes: another fight is no longer worth the same as the gold already held. The next useful rep is leaving with shutdown value unless the next objective is already free.",
      whyTrust: "This is worth practicing because it does not ask for less carry pressure; it keeps the carry gold from being handed back.",
      pattern: "The risk shifts after Samira has gold; the next death is more expensive than the next kill is valuable.",
      diamondRule: "Protect shutdown gold after the first payout.",
      drill: "Recall after the payout unless an objective is already free.",
      nuance: ["This preserves carry pressure by making the next item arrive sooner."],
      focusTag: "cash-out timing"
    },
    {
      feedbackTitle: "Count before helping",
      feedback: "If a teammate dies nearby, count visible enemies before spending E to rescue a fight.",
      gameDetail: "This moment is about the rescue instinct that can pull Samira into a fight already lost on numbers. The next useful rep is counting visible enemies before using E toward trouble, because skipping a bad rescue protects carry gold.",
      whyTrust: "Counting visible enemies gives anxiety a concrete check; if the numbers are bad, skipping the rescue is discipline, not fear.",
      pattern: "Rescue instincts can drag Samira into a fight that is already numerically lost.",
      diamondRule: "Count visible enemies before answering a teammate death.",
      drill: "Say the number count before using E toward a fight.",
      nuance: ["Skipping the rescue can be the correct carry decision when the fight is already gone."],
      focusTag: "safe gold"
    },
    {
      feedbackTitle: "Leave after the wave",
      feedback: "Catching side farm is fine; leave toward teammates unless mid has priority or three enemies are visible.",
      gameDetail: "Side farm is useful income until it disconnects the fed carry from the next map play. The next useful rep is taking the wave, then immediately pathing back through safe vision unless enemy positions are visible.",
      whyTrust: "This turns side farm into safe income instead of isolation, which is the difference between carrying with gold and dying with gold.",
      pattern: "Side farm is useful until it isolates the fed carry from the next map play.",
      diamondRule: "Catch the wave, then leave unless the enemy positions are visible.",
      drill: "Take the wave and immediately path back through safe vision.",
      nuance: ["Gold only helps if the next movement keeps the map connected."],
      focusTag: "late entry"
    },
    {
      feedbackTitle: "Objective before duel",
      feedback: "When an enemy catches a wave, pressure the objective first; take the duel only with ult, summoner info, and a walk-out.",
      gameDetail: "The side duel can look like the game, but objective pressure forces the enemy to answer on worse terms. The next useful rep is making the map ask the question first, then dueling only when ult, summoners, and exit are known.",
      whyTrust: "Objectives force the enemy to answer on your terms; random duels make the game hinge on mechanics under uncertainty.",
      pattern: "A side duel can distract from the objective that would make the enemy respond.",
      diamondRule: "Objective pressure before isolated duels.",
      drill: "Ping or path to the objective before matching the side target.",
      nuance: ["Making the enemy answer the map lowers the need for perfect mechanics."],
      focusTag: "exit planning"
    },
    {
      feedbackTitle: "Second in at chokes",
      feedback: "Hold the edge until enemy CC is used so Samira stays the finisher instead of the target.",
      gameDetail: "Chokes punish the first champion in, especially when the enemy still has the spell that stops Samira. The next useful rep is being second in at jungle walls so the dash starts after the first cooldown exchange.",
      whyTrust: "This preserves the aggression while removing the single easiest way enemies stop Samira.",
      pattern: "Chokes punish the first champion in; Samira gets more value as the second entry.",
      diamondRule: "Second in at jungle walls unless the enemy CC is already gone.",
      drill: "Pause at the choke edge and enter after the first cooldown exchange.",
      nuance: ["The pause is a setup for resets, not hesitation."],
      focusTag: "objective conversion"
    },
    {
      feedbackTitle: "Hit the structure",
      feedback: "At inhib or nexus, the next useful rep is ending as soon as the structure is available.",
      gameDetail: "Once the base structure is available, kills are only a way to clear space for hitting it. The next useful rep is moving the cursor to the structure first, because structure damage is the lowest-variance conversion of the won fight.",
      whyTrust: "This is reliable because structures are guaranteed progress; extra fighting after the base is open adds variance without adding win condition.",
      pattern: "Base fights become lower value once the structure is open.",
      diamondRule: "Hit the structure as soon as the fight is won.",
      drill: "After a base kill, move the cursor to the structure first.",
      nuance: ["The structure is the lowest-variance way to convert the lead."],
      focusTag: "overstay control"
    }
  ];
  const fallback = samiraFallbacks[Math.max(0, clipNumber - 1) % samiraFallbacks.length];
  return {
    champion: "Samira",
    confidence: "medium",
    ...fallback,
    whyTrust: fallback.whyTrust || "This rule is tied to the repeated recording pattern, not a vague style preference.",
    eventEvidence: fallback.eventEvidence || "",
    goodThing: fallback.goodThing || "The useful positive sign is that Samira is creating pressure; the next step is making that pressure safer and more repeatable.",
    evidence: fallback.eventEvidence || "",
    pattern: fallback.pattern || "The recording points to one repeatable decision leak.",
    diamondRule: fallback.diamondRule || "Convert the first win before taking the next fight.",
    drill: fallback.drill || "Name the payout before committing.",
    timeline: fallback.timeline || [],
    nuance: fallback.nuance || ["Conservative analysis until the model can read the sampled frames."],
    reviewLimit: fallback.reviewLimit || "",
    analysisSource: "fallback"
  };
}

function extractOutputText(response) {
  if (typeof response?.output_text === "string") return response.output_text;
  const parts = [];
  for (const item of response?.output || []) {
    for (const content of item.content || []) {
      if (typeof content.text === "string") parts.push(content.text);
    }
  }
  return parts.join("\n");
}

function parseJsonText(text) {
  const trimmed = clean(text);
  const stripped = trimmed.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const match = stripped.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON object returned");
  return JSON.parse(match[0]);
}

async function verifyVisibleClockAnchors({ file, sourcePath, anchors, frameDir }) {
  const candidates = cleanClockAnchors(anchors);
  if (!candidates.length) return [];
  if (!process.env.OPENAI_API_KEY) return [];
  const verifyDir = path.join(frameDir, "clock-verify");
  await fs.mkdir(verifyDir, { recursive: true });
  const images = [];
  for (let index = 0; index < candidates.length; index += 1) {
    const anchor = candidates[index];
    const framePath = path.join(verifyDir, `verify-${String(index + 1).padStart(2, "0")}-${normalizeClock(anchor.clock).replace(":", "-")}.jpg`);
    await extractFrame(sourcePath, framePath, Number(anchor.videoSeconds), 1280);
    images.push({
      type: "input_text",
      text: `Frame ${index + 1}: expected League game clock ${anchor.clock}; review-video seek ${mmss(anchor.videoSeconds)} (${anchor.videoSeconds}s). Pass only if this exact frame visibly shows the expected League in-game clock or a clock within two seconds of it.`
    });
    images.push({
      type: "input_image",
      image_url: `data:image/jpeg;base64,${(await fs.readFile(framePath)).toString("base64")}`,
      detail: "high"
    });
  }
  const prompt = [
    "Verify clickable timestamp anchors for league.aolabs.io.",
    "For each frame, read only the current League of Legends in-game HUD clock. Ignore browser/player overlays and any other clocks.",
    "Return pass=true only when the expected game clock is visibly readable in that exact frame, allowing at most two seconds of visual/OCR tolerance.",
    "If the frame is blurry, cropped, alt-tabbed, green-blocked, or the clock is not visible/readable, pass=false.",
    "Return only JSON:",
    '{"checks":[{"index":1,"expected":"MM:SS","visibleClock":"MM:SS or unreadable","pass":true,"description":"what is visible"}]}',
    `Recording file: ${file}.`
  ].join("\n");
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        store: false,
        max_output_tokens: 1000,
        input: [
          {
            role: "user",
            content: [
              { type: "input_text", text: prompt },
              ...images
            ]
          }
        ]
      })
    });
    if (!response.ok) throw new Error(`OpenAI clock verification ${response.status}`);
    const parsed = parseJsonText(extractOutputText(await response.json()));
    const checks = Array.isArray(parsed.checks) ? parsed.checks : [];
    return candidates.filter((anchor, index) => {
      const check = checks.find((item) => Number(item?.index) === index + 1);
      if (!check || check.pass !== true) return false;
      if (!clockWithinSeconds(anchor.clock, check.visibleClock)) return false;
      return true;
    });
  } catch (error) {
    console.warn(`Clock anchor verification fallback for ${file}: ${error.message}`);
    return [];
  }
}

async function detectVisibleClockAnchors({ file, sourcePath, duration, sidecar, cacheKey, frameDir, matchTimeMs, gameLengthSeconds, candidateAnchors = [] }) {
  const cachePath = path.join(frameDir, "visible-clock-anchors.json");
  const cached = await readJsonSafe(cachePath);
  if (cached?.cacheKey === cacheKey && cached?.clockAnchorVersion === clockAnchorVersion) {
    return cleanClockAnchors(cached.clockAnchors)
      .filter((anchor) => clockFitsCurrentMatch(anchor, sidecar, matchTimeMs, gameLengthSeconds));
  }
  if (!process.env.OPENAI_API_KEY) return [];
  const candidateTimes = cleanClockAnchors(candidateAnchors).map((anchor) => anchor.videoSeconds);
  const readTimes = clockReadTimes(duration, sidecar, candidateTimes);
  if (!readTimes.length) return [];
  const clockDir = path.join(frameDir, "clock");
  await fs.mkdir(clockDir, { recursive: true });
  const images = [];
  for (let index = 0; index < readTimes.length; index += 1) {
    const videoSeconds = Math.round(readTimes[index] * 1000) / 1000;
    const framePath = path.join(clockDir, `clock-${String(index + 1).padStart(2, "0")}.jpg`);
    await extractFrame(sourcePath, framePath, videoSeconds, 1280);
    const expected = expectedGameClockSeconds(sidecar, matchTimeMs, videoSeconds);
    const expectedHint = Number.isFinite(expected)
      ? ` The current match clock should be near ${mmss(expected)}; ignore other visible clocks from browser/player overlays.`
      : "";
    images.push({
      type: "input_text",
      text: `Frame ${index + 1}: review-video time ${mmss(videoSeconds)} (${videoSeconds}s). If the current League match in-game clock is visible in this frame, return that game clock with this exact videoSeconds value.${expectedHint}`
    });
    images.push({
      type: "input_image",
      image_url: `data:image/jpeg;base64,${(await fs.readFile(framePath)).toString("base64")}`,
      detail: "high"
    });
  }
  const prompt = [
    "Read visible League of Legends in-game clock timestamps from these video frames.",
    "The clock is the game clock shown in the League HUD, usually near the top center/top right, formatted M:SS or MM:SS.",
    "Return an anchor only when the game clock is actually visible and readable in that exact frame. Do not infer from match length, file time, frame order, nearby frames, story text, file name, or expected hints.",
    "Some frames may contain desktop/browser/video-player overlays from alt-tabbed capture. Ignore those clocks. Only return the clock from the current League match HUD.",
    "Try to return at least two different game-clock moments if at least two are visible.",
    "For each returned anchor, use the exact review-video time printed in that frame label as videoSeconds. Include a short description of what is visibly happening in that same frame. Keep the description factual and compact, not advice.",
    "If the frame is desktop/browser/launcher or the clock is not readable, omit it.",
    "Return only JSON with this shape:",
    '{"clockAnchors":[{"clock":"MM:SS","videoSeconds":0,"description":"short visible event in this frame"}]}',
    `Recording file: ${file}.`
  ].join("\n");
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        store: false,
        max_output_tokens: 2000,
        input: [
          {
            role: "user",
            content: [
              { type: "input_text", text: prompt },
              ...images
            ]
          }
        ]
      })
    });
    if (!response.ok) throw new Error(`OpenAI clock response ${response.status}`);
    const parsed = parseJsonText(extractOutputText(await response.json()));
    const anchors = dedupeClockAnchors(
      cleanClockAnchors(parsed.clockAnchors)
        .map((anchor) => {
          const videoSeconds = nearestClockReadTime(anchor.videoSeconds, readTimes);
          return videoSeconds === null ? null : { ...anchor, videoSeconds };
        })
        .filter(Boolean)
    )
      .filter((anchor) => anchor.videoSeconds >= 0 && anchor.videoSeconds <= Math.max(0.25, duration))
      .filter((anchor) => clockFitsCurrentMatch(anchor, sidecar, matchTimeMs, gameLengthSeconds));
    const verifiedAnchors = await verifyVisibleClockAnchors({ file, sourcePath, anchors, frameDir });
    await fs.writeFile(cachePath, `${JSON.stringify({
      cacheKey,
      clockAnchorVersion,
      generatedAt: new Date().toISOString(),
      clockAnchors: verifiedAnchors
    }, null, 2)}\n`, "utf8");
    return verifiedAnchors;
  } catch (error) {
    console.warn(`Clock anchor fallback for ${file}: ${error.message}`);
    return [];
  }
}

async function analyzeRecording({ file, duration, framePaths, frameTimes, sequenceLabel, reviewPhase: phase }) {
  const manual = manualFeedback(file);
  if (manual) return { ...manual, sampledFrames: framePaths.length };
  if (!process.env.OPENAI_API_KEY) return fallbackFeedback(file, duration, { reviewPhase: phase });
  const images = [];
  for (let index = 0; index < framePaths.length; index += 1) {
    const framePath = framePaths[index];
    const videoSeconds = Math.round(Number(frameTimes[index] || 0) * 1000) / 1000;
    images.push({
      type: "input_text",
      text: `Frame ${index + 1} is review-video time ${mmss(videoSeconds)} (${videoSeconds}s). If you mention a visible in-game clock from this frame, add a clockAnchors entry with that exact clock and this videoSeconds value.`
    });
    images.push({
      type: "input_image",
      image_url: `data:image/jpeg;base64,${(await fs.readFile(framePath)).toString("base64")}`,
      detail: "high"
    });
  }
  const frameList = frameTimes.map((time, index) => `${index + 1}:${mmss(time)}`).join(", ");

  const prompt = [
    "Analyze these League of Legends replay frames extremely carefully for Alan, currently around Silver 4 and trying to build stronger decision quality.",
    "Images are chronological sampled frames from the recording. Read them in order and use every visible clue: followed champion, team list/nameplate, health bars, minimap shape when visible, wave state, structure/objective context, fight numbers, target selection, spacing, fog, recalls, base state, and obvious crowd-control or cooldown evidence.",
    "The player champion is usually the champion the replay camera follows most. Use the side list/nameplate when visible. If uncertain, say low confidence and state the limit.",
    "Use capture order internally to distinguish earlier leak evidence from later implementation attempts, but do not mention recency weighting in visible output.",
    `This recording is ${sequenceLabel}. Review phase: ${phase}.`,
    `Sampled frame times: ${frameList}. Duration: ${mmss(duration)}.`,
    "Coach like a blunt but serious League coach: name the actual mistake, do not soften it, and do not insult Alan. Be direct enough that he knows exactly where he messed up.",
    "Give exactly one highest-value improvement for this recording, plus the specific visible mistake moments that make the advice trustworthy. The top advice must stay direct, narrow, and playable in the next queue.",
    "The feedback field must be one boldable coach sentence in this exact shape: 'Mistake: ... Fix: ...'. It must say what he did wrong and what to do differently.",
    "Also include eventEvidence: one compact sentence naming the actual visible things that prove the coaching claim. If the advice is overstay/reset, the evidence must show the overstay, low-health stay, respawn danger, or missed reset window; if the advice is structure conversion, the evidence must show structure access or the chase away from it. This is proof, not advice.",
    "Also include goodThing: one honest positive thing Alan did well if the footage supports it. If nothing positive is visible, use an empty string rather than inventing praise.",
    "Write gameDetail like a short game-story recap, not a stat audit: one compact paragraph, two or three notable visible moments where the decision got risky, at most three light timestamps, no K/D/A, no CS count, no numbered timeline, and one final simple lesson sentence.",
    "Do not use 'high elo', 'master-facing', or rank-label coaching language; name the exact visible habit and exact in-game payoff.",
    "If the visible frames are too sparse for a claim, say that in reviewLimit instead of inventing certainty.",
    "For specific game events, include the visible game-clock timestamp from the top right when it is visible, but use timestamps only as reference points. Do not turn the recap into a numbered timeline, and do not invent timestamps for unseen moments.",
    "If any visible game-clock timestamp appears in gameDetail, eventEvidence, timeline, evidence, or pattern, include a matching clockAnchors item: {\"clock\":\"MM:SS\",\"videoSeconds\":number}. Use the review-video time from the labeled frame where that clock is visible. Timestamps should be evidence anchors for the lesson, not decorative time labels. If you are not sure the clock is visible or useful for the lesson, do not include the timestamp in visible copy.",
    "Prioritize repeatable habits that stop the gameplay from transferring to harder ranked games: lethal-HP lane stays, re-entering after the first win, chasing away from open structures, wave crash, recall timing, objective conversion, shutdown protection, numbers before joining, second entry, cooldown/CC accounting, vision/fog discipline, target choice, structure hitting, and reset discipline.",
    "If this is an implementation or current-form clip, evaluate the next constraint after the attempted improvement instead of only repeating the old diagnosis.",
    "Also include whyTrust: one concrete reason Alan should trust and try the feedback, grounded in Samira mechanics, map conversion, recording evidence, or anxiety-reducing decision rules.",
    "Visible page copy should be concise and operational. Second person is allowed here because this is a personal coaching surface, but avoid vague 'you should' advice and broad motivational coaching.",
    "Return only JSON with this shape:",
    '{"champion":"detected champion","confidence":"high|medium|low","feedbackTitle":"short title","feedback":"Mistake: what Alan did wrong. Fix: what to do differently.","gameDetail":"one concise narrative paragraph with notable visible moments and one simple lesson sentence","eventEvidence":"compact proof of what visibly happened in the game","goodThing":"one honest positive thing Alan did well, or empty string","whyTrust":"one concrete reason to trust this feedback","focusTag":"short tag","evidence":"short visual basis","pattern":"fuller read of the visible pattern, 1-2 sentences","diamondRule":"one exact rule that would still matter as games get harder","drill":"one next-game repetition","timeline":["00:00 - exact visible event from the frame, for internal evidence only"],"clockAnchors":[{"clock":"MM:SS","videoSeconds":0}],"nuance":["3-5 specific nuance bullets from the frames"],"reviewLimit":"what the sampled frames cannot prove"}',
    `Recording file: ${file}.`
  ].join("\n");

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        store: false,
        max_output_tokens: 1400,
        input: [
          {
            role: "user",
            content: [
              { type: "input_text", text: prompt },
              ...images
            ]
          }
        ]
      })
    });
    if (!response.ok) throw new Error(`OpenAI response ${response.status}`);
    const parsed = parseJsonText(extractOutputText(await response.json()));
    return {
      champion: clean(parsed.champion, "Unknown"),
      confidence: clean(parsed.confidence, "low").toLowerCase(),
      feedbackTitle: coachClean(parsed.feedbackTitle, "Focus"),
      feedback: coachClean(parsed.feedback, "Review the clip and choose one safer next action."),
      gameDetail: coachClean(parsed.gameDetail, `${coachClean(parsed.pattern, "The recording points to one repeatable decision pattern.")} ${coachClean(parsed.feedback, "Choose one safer next action.")}`),
      eventEvidence: coachClean(parsed.eventEvidence, coachClean(parsed.evidence, "Generated from sampled replay frames.")),
      goodThing: coachClean(parsed.goodThing, ""),
      whyTrust: coachClean(parsed.whyTrust, "This feedback is tied to the visible replay pattern and one controllable in-game decision."),
      focusTag: coachClean(parsed.focusTag, "review"),
      evidence: coachClean(parsed.evidence, "Generated from sampled replay frames."),
      pattern: coachClean(parsed.pattern, "The recording points to one repeatable decision pattern."),
      diamondRule: coachClean(parsed.diamondRule, "Convert the first winning moment before taking the next fight."),
      drill: coachClean(parsed.drill, "Name the payout before committing."),
      timeline: cleanList(parsed.timeline, 6).map((item) => coachClean(item)),
      clockAnchors: cleanClockAnchors(parsed.clockAnchors),
      nuance: cleanList(parsed.nuance, 5).map((item) => coachClean(item)),
      reviewLimit: coachClean(parsed.reviewLimit, "The review is based on sampled frames, not full input/cooldown telemetry."),
      sampledFrames: framePaths.length,
      analysisSource: "openai"
    };
  } catch (error) {
    console.warn(`Feedback fallback for ${file}: ${error.message}`);
    return fallbackFeedback(file, duration, { reviewPhase: phase });
  }
}

async function summarizeRecordings(recordings, detectedChampions) {
  const latest = recordings.at(-1);
  const simplePayoutFocus = {
    title: "Samira",
    focus: "Name the payout before the dash.",
    rule: "Before E/R: wave, tower, dragon, recall, or nexus. If none is real, hold the dash.",
    nextRep: "Next game: payout first.",
    whyTrust: "The newest recording already shows kills turning into turret, inhibitor, and nexus pressure; repeating that without handing shutdowns back is the ranked-transfer skill.",
    pattern: "The damage is already enough for beginner bots. Samira is not more fighting; it is choosing the fight that creates a map payout, then leaving or ending cleanly.",
    checklist: ["Name the payout.", "Enter second if CC is unknown.", "After the payout, reset or hit the next structure."],
    reviewLimit: "Main read combines manual storyboard review, replay timing, and visible frame evidence."
  };
  const fallback = latest?.focusTag === "finish-only all-in" ? {
    title: "Samira: all-in only when it pays",
    focus: "The newest clip is the good version: the penta works because the fight is already inside their base, with allies and minions pushing toward nexus.",
    rule: "Only take the full Samira all-in when the reset path and the payout point the same direction.",
    nextRep: "Next game: before E/R, ask whether the reset moves toward tower, nexus, objective, or safety.",
    whyTrust: "The penta clip shows real cleanup mechanics, but the condition that made it reliable was the map: enemy base open, defenders trapped, allies and minions in front.",
    pattern: "Earlier games showed the leak: extra fights after the win. The newest highlight shows the upgrade: when the fight is already a finish, staying in and cleaning is exactly the right job.",
    checklist: ["Base or objective must be real.", "Allies/minions in front.", "Each reset moves toward payout."],
    reviewLimit: "The newest Riot highlight is only about 22 seconds, so this summary trusts the visible base-fight cleanup and does not invent the lane setup."
  } : latest?.focusTag === "payout before dash" ? simplePayoutFocus : latest?.focusTag === "lethal hp reset" ? {
    title: "Samira: reset before lethal HP",
    focus: "The new game already shows better conversion later; the next climb rep is leaving lane when one enemy auto or spell kills Samira.",
    rule: "Below lethal HP, the wave is no longer the objective: recall unless the enemy bot lane is dead or fully gone.",
    nextRep: "Next game: one hit kills me -> reset.",
    whyTrust: "This targets the visible early death without nerfing the later aggression that produced kills, turret pressure, inhibitor pressure, and the win.",
    pattern: "The latest recording is not a damage problem. It shows a lane health-gate problem early, followed by much better conversion once Samira has items and teammates nearby.",
    checklist: ["At low HP, count enemy autos before minions.", "Give the crash if one hit kills Samira.", "Return with the item, then convert kills into structures."],
    reviewLimit: "Main read combines generated clip review with manual storyboard review of the newest full recording."
  } : {
    title: "Samira: stop giving wins back",
    focus: "Honest read: your biggest leak is not damage. It is refusing to cash out: staying at lethal HP, re-fighting after winning, and chasing sideways when structure is already open.",
    rule: "If the next action does not create HP safety, wave crash, turret, or nexus pressure, do not take it.",
    nextRep: "Next game: cash out before the second fight.",
    whyTrust: "The clips show the same leak in three forms: lethal-HP lane stay, low-health re-fight, and open-base drift. That is specific enough to practice immediately.",
    pattern: "You already find fights. The coachable problem is making the second decision boring enough to actually win: reset, crash, hit tower, hit nexus, then fight again only if it protects that payout.",
    checklist: ["One-hit HP means recall.", "First win becomes wave or structure.", "Open base means no sideways chase."],
    reviewLimit: "Replay review is based on sampled frames and visible state, not raw inputs or full cooldown telemetry."
  };
  if (!recordings.length || detectedChampions.some((item) => championId(item.name) === "samira")) return fallback;
  const notes = recordings.map((item, index) => (
    `${index + 1}. ${item.title} [${item.reviewPhase || "baseline"}] (${item.champion}, ${item.duration}): ${item.feedbackTitle} - ${item.feedback}. Pattern: ${item.pattern || ""} Rule: ${item.diamondRule || ""}`
  )).join("\n");
  const prompt = [
    "Given these deeply analyzed League recording feedback notes, produce one simple focus for Alan's next queue.",
    "He wants a blunt coach read. Name the recurring mistake directly, without insults or motivational filler.",
    "Keep the summary narrow enough to remember while playing.",
    "Use capture order internally to distinguish earlier leak evidence from implementation attempts. Do not mention recency weighting in visible output.",
    "If the newer clips show an earlier rule being attempted, choose the next simple constraint that preserves the improvement instead of repeating only the old leak.",
    "Do not summarize everything. Choose the single improvement with the highest climb value from the recordings and explain the evidence behind it.",
    "Include whyTrust: one concrete reason Alan should trust and try this focus even if skeptical or anxious.",
    "Avoid phrases like 'you should'. Return only JSON:",
    '{"title":"short title","focus":"one sentence","rule":"one in-game rule","nextRep":"one tiny next-game check","whyTrust":"one concrete reason to trust the focus","pattern":"fuller read of the cross-recording pattern","checklist":["3 tiny checks for the next queue"],"reviewLimit":"short limit of the evidence"}',
    `Detected champions: ${detectedChampions.map((item) => item.name).join(", ") || "unknown"}.`,
    notes
  ].join("\n");

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        store: false,
        max_output_tokens: 500,
        input: prompt
      })
    });
    if (!response.ok) throw new Error(`OpenAI response ${response.status}`);
    const parsed = parseJsonText(extractOutputText(await response.json()));
    return {
      title: clean(parsed.title, fallback.title),
      focus: clean(parsed.focus, fallback.focus),
      rule: clean(parsed.rule, fallback.rule),
      nextRep: clean(parsed.nextRep, fallback.nextRep),
      whyTrust: clean(parsed.whyTrust, fallback.whyTrust),
      pattern: clean(parsed.pattern, fallback.pattern),
      checklist: cleanList(parsed.checklist, 3),
      reviewLimit: clean(parsed.reviewLimit, fallback.reviewLimit)
    };
  } catch (error) {
    console.warn(`Summary fallback: ${error.message}`);
    return fallback;
  }
}

function championId(name) {
  const normalized = clean(name, "unknown").toLowerCase().replace(/[^a-z]/g, "");
  const aliases = {
    kaisa: "kaisa",
    kai: "kaisa",
    missfortune: "missfortune"
  };
  return aliases[normalized] || normalized || "unknown";
}

function aggregateChampions(recordings) {
  const byChampion = new Map();
  for (const item of recordings) {
    const key = championId(item.champion);
    const current = byChampion.get(key) || {
      id: key,
      name: clean(item.champion, "Unknown"),
      confidence: item.confidence,
      recordings: 0,
      evidence: item.evidence,
      improvementTitle: item.feedbackTitle,
      improvement: item.feedback
    };
    current.recordings += 1;
    if (current.confidence !== "high" && item.confidence === "high") {
      current.confidence = "high";
      current.evidence = item.evidence;
    }
    byChampion.set(key, current);
  }
  return [...byChampion.values()].sort((a, b) => b.recordings - a.recordings);
}

async function main() {
  await fs.mkdir(recordingRoot, { recursive: true });
  await fs.mkdir(posterRoot, { recursive: true });
  await fs.mkdir(analysisRoot, { recursive: true });
  const existing = await readExistingManifest();
  const discoveredEntries = await Promise.all((await fs.readdir(sourceDir, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && sourceVideoPattern.test(entry.name) && !ignoredSourceVideoPattern.test(entry.name))
    .map(async (entry) => {
      const sourcePath = path.join(sourceDir, entry.name);
      const stat = await fs.stat(sourcePath);
      const health = await probeVideoHealth(sourcePath).catch(() => null);
      const sidecar = await readJsonSafe(`${sourcePath}.json`);
      const visual = /^auto_/i.test(entry.name) && health?.duration > 60
        ? await videoVisibility(sourcePath, health.duration)
        : null;
      return {
        name: entry.name,
        sourcePath,
        stat,
        health,
        sidecar,
        visual
      };
    }));
  const sourceEntries = discoveredEntries
    .filter((entry) => {
      const rejectReason = autoCaptureRejectReason(entry.name, entry.health, entry.sidecar, entry.visual);
      if (!rejectReason) return true;
      console.log(`Skipping invalid auto capture ${entry.name}: ${rejectReason}.`);
      return false;
    })
    .sort((a, b) => a.stat.mtimeMs - b.stat.mtimeMs || a.name.localeCompare(b.name));
  const sourceMatchIds = [...new Set(sourceEntries.map((entry) => recordingParts(entry.name).matchId).filter(Boolean))];
  const recordingMetadata = await loadRecordingMetadata(sourceMatchIds);

  const sourceStats = [];
  const recordings = [];
  let totalSeconds = 0;
  let highlightCount = 0;
  let fullGameCount = 0;

  for (let index = 0; index < sourceEntries.length; index += 1) {
    const entry = sourceEntries[index];
    const { name, sourcePath, stat } = entry;
    const parts = recordingParts(name);
    const replayMeta = recordingMetadata.replayTimes.get(parts.matchId) || {};
    const queueMeta = recordingMetadata.queues.get(parts.matchId) || {
      gameType: "Unverified",
      gameTypeSource: "No queue id found in local logs"
    };
    const matchStats = recordingMetadata.matchStats.get(parts.matchId) || {};
    const captureMeta = recordingMetadata.captureTimes.get(name) || {};
    const phase = reviewPhase(index, sourceEntries.length);
    const sequenceLabel = `${index + 1} of ${sourceEntries.length}`;
    const slug = slugify(name);
    const frameDir = path.join(analysisRoot, slug);
    const destName = publicRecordingName(name, stat);
    const destPath = path.join(recordingRoot, destName);
    const posterPath = path.join(posterRoot, `${slug}.jpg`);
    const cacheKey = cacheKeyFor(stat);
    const cached = cachedRecording(existing, name, cacheKey);

    const publicVideoBytes = await ensurePublicVideo(sourcePath, destPath, stat);
    const duration = Number(entry.health?.duration) || await probeDuration(sourcePath);
    totalSeconds += duration;
    if (!(await exists(posterPath)) || !cached) {
      await extractFrame(sourcePath, posterPath, Math.max(0.2, duration * 0.5), 640);
    }

    let analysis = cached;
    if (!analysis) {
      await fs.mkdir(frameDir, { recursive: true });
      const sampleTimes = analysisSampleTimes(duration, entry.sidecar);
      const framePaths = [];
      for (let sampleIndex = 0; sampleIndex < sampleTimes.length; sampleIndex += 1) {
        const framePath = path.join(frameDir, `frame-${sampleIndex + 1}.jpg`);
        await extractFrame(sourcePath, framePath, sampleTimes[sampleIndex], duration > 90 ? 960 : 1024);
        framePaths.push(framePath);
      }
      analysis = await analyzeRecording({ file: name, duration, framePaths, frameTimes: sampleTimes, sequenceLabel, reviewPhase: phase });
    }
    const matchTimeMs = matchStats.matchTimeMs || replayMeta.matchTimeMs || stat.mtimeMs;
    const candidateClockAnchors = cleanClockAnchors(analysis.clockAnchors)
      .filter((anchor) => clockFitsCurrentMatch(anchor, entry.sidecar, matchTimeMs, matchStats.gameLengthSeconds || null));
    const shouldReadVisibleClock = duration >= 3;
    const visibleClockAnchors = shouldReadVisibleClock
      ? await detectVisibleClockAnchors({
        file: name,
        sourcePath,
        duration,
        sidecar: entry.sidecar,
        cacheKey,
        frameDir,
        matchTimeMs,
        gameLengthSeconds: matchStats.gameLengthSeconds || null,
        candidateAnchors: candidateClockAnchors
      })
      : [];
    const clockAnchors = dedupeClockAnchors(
      visibleClockAnchors,
      analysis.analysisSource === "manual" ? candidateClockAnchors : []
    );
    const clockMoments = await selectEvidenceClockMoments({
      file: name,
      analysis,
      clockAnchors,
      frameDir,
      cacheKey
    });
    const annotatedClockAnchors = annotateClockAnchorsWithMoments(clockAnchors, clockMoments);
    const narrativeClockAnchors = clockMoments;
    const championName = clean(analysis.champion, "Samira");
    const clockMomentEvidence = evidenceTextFromMoments(clockMoments);
    const rawGameDetail = coachClean(analysis.gameDetail, `${coachClean(analysis.pattern, "The recording points to one repeatable decision pattern.")} ${coachClean(analysis.feedback, "Choose one safer next action.")} ${coachClean(analysis.whyTrust, "The feedback is tied to visible replay evidence.")}`);
    const cleanedGameDetail = stripUnverifiedClockReferences(rawGameDetail, narrativeClockAnchors);
    const integratedGameDetail = integrateMomentEvidence(cleanedGameDetail, clockMoments, championName);
    const cleanedEventEvidence = normalizeVisibleCoachText(stripUnverifiedClockReferences(coachClean(analysis.eventEvidence, analysis.evidence || ""), narrativeClockAnchors), championName);
    const cleanedEvidence = normalizeVisibleCoachText(stripUnverifiedClockReferences(coachClean(analysis.evidence, "Generated from sampled replay frames."), narrativeClockAnchors), championName);

    const isFullReview = duration > 90;
    const shortTitle = isFullReview
      ? `full review ${String(++fullGameCount).padStart(2, "0")}`
      : `highlight ${String(++highlightCount).padStart(2, "0")}`;
    const fingerprint = crypto.createHash("sha1").update(`${name}:${cacheKey}`).digest("hex").slice(0, 12);
    const sidecarRecordedMs = Date.parse(entry.sidecar?.createdAt || entry.sidecar?.endedAt || "");
    const recordedDate = new Date(Number.isFinite(sidecarRecordedMs) ? sidecarRecordedMs : stat.mtimeMs);
    sourceStats.push({ mtimeMs: recordedDate.getTime() });
    const clipStart = Number(captureMeta.clipTimestampSeconds);
    const clipWindow = Number.isFinite(clipStart)
      ? `${shortClock(clipStart)}-${shortClock(clipStart + duration)}`
      : "";
    recordings.push({
      file: name,
      publicFile: destName,
      cacheKey,
      fingerprint,
      matchId: parts.matchId,
      score: parts.score,
      clipNumber: parts.clipNumber,
      matchTimeMs,
      gameHappenedAt: matchStats.gameHappenedAt || replayMeta.gameHappenedAt || recordedDate.toISOString(),
      gameHappenedAtLabel: matchStats.gameHappenedAtLabel || replayMeta.gameHappenedAtLabel || shortDateTime(recordedDate),
      recordedAt: recordedDate.toISOString(),
      recordedAtLabel: shortDateTime(recordedDate),
      recordedAtTimeLabel: shortTime(recordedDate),
      clipTimestampSeconds: Number.isFinite(clipStart) ? Math.round(clipStart * 1000) / 1000 : null,
      clipTimestamp: captureMeta.clipTimestamp || "",
      clipWindow,
      timestamp: captureMeta.clipTimestamp || "",
      queueId: queueMeta.queueId || null,
      gameType: queueMeta.gameType,
      gameTypeSource: queueMeta.gameTypeSource,
      title: clean(analysis.feedbackTitle, shortTitle),
      duration: mmss(duration),
      durationSeconds: Math.round(duration * 1000) / 1000,
      gameLength: matchStats.gameLength || "",
      gameLengthSeconds: matchStats.gameLengthSeconds || null,
      kda: matchStats.kda || "",
      kills: Number.isFinite(matchStats.kills) ? matchStats.kills : null,
      deaths: Number.isFinite(matchStats.deaths) ? matchStats.deaths : null,
      assists: Number.isFinite(matchStats.assists) ? matchStats.assists : null,
      cs: Number.isFinite(matchStats.cs) ? matchStats.cs : null,
      statsSource: matchStats.statsSource || "",
      kind: isFullReview ? "full review" : "highlight",
      reviewPhase: phase,
      champion: clean(analysis.champion, "Unknown"),
      confidence: clean(analysis.confidence, "low"),
      feedbackTitle: normalizeVisibleCoachText(analysis.feedbackTitle || "Focus", championName),
      feedback: normalizeVisibleCoachText(analysis.feedback || "Review the clip and choose one safer next action.", championName),
      gameDetail: integratedGameDetail,
      eventEvidence: clockMomentEvidence || (isGenericEvidenceText(cleanedEventEvidence) ? "" : cleanedEventEvidence),
      goodThing: normalizeVisibleCoachText(analysis.goodThing || "", championName),
      whyTrust: normalizeVisibleCoachText(analysis.whyTrust || "This feedback is tied to the visible replay pattern and one controllable in-game decision.", championName),
      focusTag: normalizeVisibleCoachText(analysis.focusTag || "review", championName),
      evidence: clockMomentEvidence || (isGenericEvidenceText(cleanedEvidence) ? "" : cleanedEvidence),
      pattern: normalizeVisibleCoachText(stripUnverifiedClockReferences(coachClean(analysis.pattern, "The recording points to one repeatable decision pattern."), narrativeClockAnchors), championName),
      diamondRule: normalizeVisibleCoachText(analysis.diamondRule || "Convert the first winning moment before taking the next fight.", championName),
      drill: normalizeVisibleCoachText(analysis.drill || "Name the payout before committing.", championName),
      timeline: stripUnverifiedTimelineItems(analysis.timeline, narrativeClockAnchors),
      clockAnchors: annotatedClockAnchors,
      clockMoments,
      nuance: cleanList(analysis.nuance, 5).map((item) => normalizeVisibleCoachText(item, championName)),
      reviewLimit: normalizeVisibleCoachText(analysis.reviewLimit || "The review is based on sampled frames, not full input/cooldown telemetry.", championName),
      analysisSource: analysis.analysisSource || "cache",
      analysisVersion,
      sampledFrames: analysis.sampledFrames || (cached ? cached.sampledFrames : analysisSampleTimes(duration, entry.sidecar).length),
      publicVideoBytes,
      src: publicPath(destPath),
      poster: publicPath(posterPath)
    });
    console.log(`${name}: ${recordings.at(-1).reviewPhase} - ${recordings.at(-1).champion} - ${recordings.at(-1).feedbackTitle}`);
  }

  const detectedChampions = aggregateChampions(recordings);
  const mainFeedback = await summarizeRecordings(recordings, detectedChampions);
  const matches = [...new Set(recordings.map((item) => item.file.match(/NA1-\d+/)?.[0]).filter(Boolean))];
  const displayRecordings = [...recordings].sort((a, b) => (
    (b.matchTimeMs || 0) - (a.matchTimeMs || 0) ||
    (b.durationSeconds || 0) - (a.durationSeconds || 0) ||
    (b.clipNumber || 0) - (a.clipNumber || 0) ||
    a.file.localeCompare(b.file)
  ));
  const manifest = {
    generatedAt: new Date().toISOString(),
    source: "League of Legends Highlights folder",
    match: matches.length === 1 ? matches[0] : `${matches.length} matches`,
    matches,
    captured: capturedRange(sourceStats),
    totalDuration: mmss(totalSeconds),
    totalRecordings: recordings.length,
    reviewBasis: "Newest match first; recordings inside a match are sorted by length.",
    mainFeedback,
    detectedChampions,
    recordings: displayRecordings
  };
  if (sameManifestContent(manifest, existing)) {
    console.log(`${path.relative(appRoot, manifestPath)} already has ${recordings.length} current recordings.`);
  } else {
    await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
    console.log(`Wrote ${path.relative(appRoot, manifestPath)} with ${recordings.length} recordings.`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
