import { execFile } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { hasExactJungleBuffName, unverifiedChampionNames } from "./review-text-guards.mjs";

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
const model = process.env.LEAGUE_ANALYSIS_MODEL || "gpt-5-mini";
const timeZone = "America/New_York";
const fightEntryRep = "Rep: after 15 minutes, before stepping into a fight, ask: tower, wave, objective, or ally front? If none is visible, click one step back and re-enter only from behind an ally.";
const fightEntryDrill = "After 15 minutes, before stepping into a fight: tower, wave, objective, or ally front? If none is visible, click one step back and re-enter only from behind an ally.";
const cleanerWinExitRep = "Rep: after 15 minutes, before stepping forward after a wave, tower hit, or fight start, ask: tower, wave, objective, or ally front? If none is visible, click one step back and reset/group; re-enter only when an ally is between you and them and the target is CC'd, low, or already committed.";
const deathExitRep = "Rep: after any low-HP fight or death-heavy sequence, take the first safe exit: recall, wave under tower, or one step behind an ally; do not re-enter while you are catchable.";
const laneDeathExitRep = "Rep: after any low-HP fight or death-heavy lane sequence, take the first safe exit: recall, wave under tower, or one step behind support. No E toward an enemy under tower unless support is between me and them and the wave still protects me.";
const objectiveFightRep = "Rep: after every objective fight, ask: did we already get the value? If yes, choose dragon, wave, recall, or group. Do not take a second fight while low or unsupported unless an ally is still in front and the enemy is already CC'd or low.";
const firstWinCashoutRep = "Rep: after the first won exchange, choose one result before another fight: objective, tower, wave crash, or recall; if none is visible, click back behind ally front.";
const basePushRep = "Rep: in every base push, say structure, blocker, wave, or exit before the forward click; hit the structure if free, hit only the blocker if safe, otherwise leave.";
const sideFarmDefenseRep = "Rep: after 15 minutes, before a camp or side wave, check nearest threatened turret and ally deaths; if either is bad, leave the farm and defend or group.";
const jungleFightExitRep = "Rep: after a jungle fight gives first value, ask: exit to turret, catch mid wave, reset, or regroup? Do not keep chasing through jungle unless an ally is still in front and the target is already CC'd or low.";
const midRiverChaseRep = "Rep: after mid wave gives value, ask: wave, turret, reset, or river? River is legal only if an ally is clearly in front and the target is already CC'd/low or an objective is active. If not, catch the wave and take one step back.";
const analysisVersion = "2026-05-25-forensic-performance-rank-v25";
const compatibleAnalysisVersions = new Set([
  analysisVersion,
  "2026-05-24-command-lane-rep-v24",
  "2026-05-24-lane-specific-rep-v23",
  "2026-05-24-game-specific-rep-v22",
  "2026-05-24-dense-click-review-v21",
  "2026-05-24-tight-click-review-v20",
  "2026-05-24-example-review-v19",
  "2026-05-24-key-click-rule-v18",
  "2026-05-23-decision-branch-coaching-v17",
  "2026-05-23-deterministic-publish-fallback-v16",
  "2026-05-23-champion-source-coaching-v15",
  "2026-05-22-action-script-coaching-v13",
  "2026-05-22-challenger-direct-coaching-v12",
  "2026-05-22-two-focus-coaching-v11",
  "2026-05-22-nonredundant-macro-review-v10",
  "2026-05-22-full-game-sampling-v9",
  "2026-05-22-primary-mistake-timestamp-v8",
  "2026-05-21-visible-paragraph-teaching-standard-v7",
  "2026-05-21-visible-paragraph-standard-v6",
  "2026-05-21-specific-decision-chain-v5",
  "2026-05-21-specific-decision-chain-v4"
]);
const rankEstimateVersion = "2026-05-25-performance-rank-v7";
const performanceRankVersion = "2026-05-25-performance-rank-v5";
const clockAnchorVersion = "2026-05-22-visible-clock-coverage-v6";
const coachEvidenceVersion = "2026-05-22-evidence-score-order-v6";
const forceAnalysisFile = clean(process.env.LEAGUE_FORCE_ANALYSIS_FILE || "");
const refreshedManualFeedbackFiles = new Set([
  "auto_NA1-5568316539_01.mp4",
  "auto_NA1-5568185590_01.mp4",
  "auto_NA1-5568079693_01.mp4",
  "auto_NA1-5567953154_01.mp4",
  "auto_NA1-5567787430_01.mp4",
  "auto_NA1-5567367431_01.mp4",
  "auto_NA1-5567223507_01.mp4",
  "auto_NA1-5566943774_01.mp4",
  "auto_NA1-5566860300_01.mp4",
  "auto_NA1-5566823161_01.mp4",
  "auto_NA1-5566786855_01.mp4",
  "auto_NA1-5566726915_01.mp4",
  "auto_NA1-5566563083_01.mp4",
  "auto_NA1-5566620104_01.mp4",
  "auto_NA1-5565387627_01.mp4",
  "auto_NA1-5565911037_01.mp4",
  "auto_NA1-5565964482_01.mp4",
  "auto_NA1-5565818690_01.mp4",
  "auto_NA1-5566120017_01.mp4"
]);
const largeRecordingBytes = Number(process.env.LEAGUE_LARGE_RECORDING_BYTES || 45 * 1024 * 1024);
const targetPublicVideoBytes = Number(process.env.LEAGUE_TARGET_PUBLIC_VIDEO_BYTES || 92 * 1024 * 1024);
const minPublicVideoRatio = Number(process.env.LEAGUE_MIN_PUBLIC_VIDEO_RATIO || 0.5);
const minAutoBytesPerSecond = Number(process.env.LEAGUE_MIN_AUTO_BYTES_PER_SECOND || 5000);
const minAutoSidecarCoverage = Number(process.env.LEAGUE_MIN_AUTO_SIDECAR_COVERAGE || 0.6);
const minSanitizedAutoSeconds = Number(process.env.LEAGUE_MIN_SANITIZED_AUTO_SECONDS || 90);
const maxClockReadFrames = Number(process.env.LEAGUE_MAX_CLOCK_READ_FRAMES || 12);
const maxAnalysisFrames = Number(process.env.LEAGUE_MAX_ANALYSIS_FRAMES || 14);
const fastMacroReview = process.env.LEAGUE_FAST_MACRO_REVIEW !== "0";
const sourceVideoPattern = /\.(webm|mp4)$/i;
const ignoredSourceVideoPattern = /\.with-desktop-pauses\.(webm|mp4)$/i;

function clean(value, fallback = "") {
  return String(value || fallback).replace(/\s+/g, " ").trim();
}

function coachClean(value, fallback = "") {
  return clean(value, fallback)
    .replace(/^\s*(?:Failure evidence|Other mistake types|Second focus)\s*:\s*/i, "")
    .replace(/^\s*Second focus\s+is\s+/i, "")
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

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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

function knownChampionName(id) {
  const championIds = {
    51: "Cait",
    105: "Fizz",
    360: "Samira"
  };
  return championIds[Number(id)] || "";
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
    const winValue = itemStats.win;
    const hasWin = typeof winValue === "boolean" || /^(true|false|win|loss|victory|defeat)$/i.test(String(winValue || ""));
    const didWin = typeof winValue === "boolean" ? winValue : /^(true|win|victory)$/i.test(String(winValue || ""));
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
      win: hasWin ? didWin : null,
      outcome: hasWin ? (didWin ? "victory" : "defeat") : "",
      outcomeLabel: hasWin ? (didWin ? "VICTORY" : "DEFEAT") : "",
      outcomeSource: hasWin ? "League Client match history" : "",
      championName: clean(participant.championName || knownChampionName(participant.championId)),
      championId: Number(participant.championId) || null,
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

async function lowerProcessPriority(pid) {
  if (process.platform !== "win32" || !pid) return;
  await execFileAsync("powershell.exe", [
    "-NoProfile",
    "-WindowStyle", "Hidden",
    "-Command",
    `$p = Get-Process -Id ${Number(pid)} -ErrorAction SilentlyContinue; if ($p) { $p.PriorityClass = 'Idle'; try { $p.PriorityBoostEnabled = $false } catch {} }`
  ], { windowsHide: true }).catch(() => {});
}

async function run(command, args) {
  return await new Promise((resolve, reject) => {
    const child = execFile(command, args, {
      maxBuffer: 16 * 1024 * 1024,
      windowsHide: true
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
      lowerProcessPriority(child.pid);
    }
  });
}

async function runBuffer(command, args, options = {}) {
  return await new Promise((resolve, reject) => {
    const child = execFile(command, args, {
      windowsHide: true,
      encoding: "buffer",
      maxBuffer: 1024 * 1024,
      ...options
    }, (error, stdout, stderr) => {
      if (error) {
        error.stdout = stdout;
        error.stderr = stderr;
        reject(error);
        return;
      }
      resolve(stdout || Buffer.alloc(0));
    });
    if (/^ffmpeg(?:\.exe)?$/i.test(path.basename(command))) {
      lowerProcessPriority(child.pid);
    }
  });
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
    const stdout = await runBuffer("ffmpeg", [
      "-v", "error",
      "-ss", String(Math.max(0, second)),
      "-i", filePath,
      "-frames:v", "1",
      "-vf", "scale=32:18,format=gray",
      "-f", "rawvideo",
      "-"
    ]);
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
  const namedMatchId = recordingParts(name).matchId;
  const sidecarMatchId = clean(sidecar?.matchId || "");
  if (!sidecarMatchId || !/^NA1-\d+$/.test(sidecarMatchId)) {
    return "sidecar missing real match id";
  }
  if (namedMatchId && sidecarMatchId && namedMatchId !== sidecarMatchId) {
    return `sidecar match mismatch ${sidecarMatchId}`;
  }
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

function sourceEntryDuration(entry = {}) {
  return Number(entry.health?.duration) ||
    Number(entry.existingEntry?.durationSeconds) ||
    Number(entry.sidecar?.durationSeconds) ||
    Number(entry.sidecar?.sourceDurationSeconds) ||
    0;
}

function compareSameMatchAutoKeeper(a, b) {
  const durationDelta = sourceEntryDuration(a) - sourceEntryDuration(b);
  if (Math.abs(durationDelta) > 1) return durationDelta;
  const aClip = recordingParts(a.name).clipNumber || Number.MAX_SAFE_INTEGER;
  const bClip = recordingParts(b.name).clipNumber || Number.MAX_SAFE_INTEGER;
  if (aClip !== bClip) return bClip - aClip;
  if (a.stat?.mtimeMs !== b.stat?.mtimeMs) return Number(a.stat?.mtimeMs || 0) - Number(b.stat?.mtimeMs || 0);
  return a.name.localeCompare(b.name) <= 0 ? 1 : -1;
}

function collapseSameMatchDuplicateSources(entries) {
  const autoKeeperByMatch = new Map();
  for (const entry of entries) {
    const parts = recordingParts(entry.name);
    if (!parts.matchId || !/^auto_/i.test(entry.name)) continue;
    if (sourceEntryDuration(entry) < minSanitizedAutoSeconds) continue;
    const current = autoKeeperByMatch.get(parts.matchId);
    if (!current || compareSameMatchAutoKeeper(entry, current) > 0) {
      autoKeeperByMatch.set(parts.matchId, entry);
    }
  }
  if (!autoKeeperByMatch.size) return entries;
  return entries.filter((entry) => {
    const parts = recordingParts(entry.name);
    const keeper = parts.matchId ? autoKeeperByMatch.get(parts.matchId) : null;
    if (!keeper || keeper.name === entry.name) return true;
    console.log(`Skipping duplicate same-match recording ${entry.name}: keeping ${keeper.name} for ${parts.matchId}.`);
    return false;
  });
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
  const sourceIsMp4 = path.extname(sourcePath).toLowerCase() === ".mp4";
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
  if (sourceIsMp4 && sourceStat.size <= targetPublicVideoBytes) {
    if (stale || current.size !== sourceStat.size) {
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
  const count = duration > 240 ? 14 : duration > 90 ? 12 : duration > 35 ? 8 : duration > 12 ? 5 : 4;
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

function dedupeClockAnchorsPreserveOrder(anchors, maxItems = maxClockReadFrames) {
  const kept = [];
  const seen = new Set();
  for (const anchor of cleanClockAnchors(anchors)) {
    const key = `${anchor.clock}@${anchor.videoSeconds}`;
    if (seen.has(key)) continue;
    seen.add(key);
    kept.push(anchor);
    if (kept.length >= maxItems) break;
  }
  return kept;
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
  const kept = dedupeTimes(base)
    .filter((time) => time >= 0.2 && time <= Math.max(0.2, duration - 0.2))
    .slice(0, maxAnalysisFrames);
  for (const time of [...groupMidpoints, ...groupEdges, ...prioritized]) {
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
  const kept = dedupeTimes([...prioritizedTimes, ...sampleTimesFor(duration)]).slice(0, maxClockReadFrames);
  for (const time of [...groupMidpoints, ...groupEdges, ...deduped]) {
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
  return Math.abs(visibleClock - expected) <= 360;
}

function captureFpsForEntry(entry, fallback = null) {
  const sidecarFps = Number(entry?.sidecar?.captureFps);
  if (Number.isFinite(sidecarFps) && sidecarFps > 0) return sidecarFps;
  const fallbackFps = Number(fallback);
  if (Number.isFinite(fallbackFps) && fallbackFps > 0) return fallbackFps;
  return null;
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

function expectedClockAnchorsFromTimes(readTimes, sidecar, matchTimeMs, gameLengthSeconds) {
  const gameLength = Number(gameLengthSeconds || 0);
  const anchors = [];
  for (const videoSeconds of readTimes) {
    const expected = expectedGameClockSeconds(sidecar, matchTimeMs, Number(videoSeconds));
    if (!Number.isFinite(expected) || expected < 0) continue;
    if (gameLength > 0 && expected > gameLength + 120) continue;
    anchors.push({
      clock: mmss(expected),
      videoSeconds: Math.round(Number(videoSeconds) * 1000) / 1000
    });
  }
  return dedupeClockAnchors(anchors);
}

function computedClockDescription(clock, champion = "Samira") {
  const name = clean(champion, "Samira");
  const seconds = clockSeconds(clock);
  if (Number.isFinite(seconds) && seconds >= 20 * 60) {
    return `shows ${name} in a current-match late-game map-state review frame`;
  }
  if (Number.isFinite(seconds) && seconds >= 14 * 60) {
    return `shows ${name} in a current-match mid-game rotation and objective review frame`;
  }
  if (Number.isFinite(seconds) && seconds >= 8 * 60) {
    return `shows ${name} in a current-match lane-to-map transition review frame`;
  }
  return `shows ${name} in a current-match lane review frame`;
}

function computedTimelineClockAnchors({ duration, sidecar, matchTimeMs, gameLengthSeconds, candidateAnchors = [], champion = "Samira" }) {
  const candidateTimes = cleanClockAnchors(candidateAnchors).map((anchor) => anchor.videoSeconds);
  const readTimes = clockReadTimes(duration, sidecar, candidateTimes);
  const anchors = spacedClockAnchors(
    expectedClockAnchorsFromTimes(readTimes, sidecar, matchTimeMs, gameLengthSeconds),
    8
  ).map((anchor) => ({
    ...anchor,
    description: computedClockDescription(anchor.clock, champion)
  }));
  const later = anchors.filter((anchor) => Number(clockSeconds(anchor.clock)) >= 8 * 60);
  return later.length ? later : anchors;
}

function spacedClockAnchors(anchors, maxItems = 10, minClockGapSeconds = 35) {
  const sorted = cleanClockAnchors(anchors)
    .sort((a, b) => a.videoSeconds - b.videoSeconds);
  const kept = [];
  for (const anchor of sorted) {
    const seconds = clockSeconds(anchor.clock);
    if (!Number.isFinite(seconds)) continue;
    if (kept.some((item) => Math.abs(clockSeconds(item.clock) - seconds) < minClockGapSeconds)) continue;
    kept.push(anchor);
    if (kept.length >= maxItems) break;
  }
  return kept;
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

function stripUnmatchedClockTokens(value, clockAnchors) {
  const verified = cleanClockAnchors(clockAnchors);
  return coachClean(String(value || "").replace(/\b(?:at|around|by|after|before|from|until|to)?\s*\d{1,2}:[0-5]\d\b/gi, (match) => {
    const clock = match.match(/\d{1,2}:[0-5]\d/)?.[0];
    if (clock && anchorMatchesClock(clock, verified, 5)) return match;
    return "";
  }))
    .replace(/\s+([,.;:])/g, "$1")
    .replace(/\b(after|before|by|around|at)\s+([,.;:]|when|while|and|but)\b/gi, "$2")
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
    /\bcurrent-match\b/i.test(anchorText) ||
    /\breview frame\b/i.test(anchorText) ||
    /\b(minions have spawned|scuttle crab|scoreboard open|shop open|item shop|shop interface|stealth ward selected|loaded into the game at fountain|game start|standing at (the )?fountain|leaving (?:base|fountain)|near base fountain|running from fountain|fountain at game start|normal gameplay)\b/i.test(anchorText);
}

function anchorIsConsequenceOnly(anchorText) {
  return /\b(dead|death|respawn timer|revive timer|grey screen|gray screen|shop open, player dead|player dead|death timer)\b/i.test(anchorText || "");
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
    .replace(new RegExp(`\\ballied\\s+${escapeRegExp(name)}\\b`, "gi"), name)
    .replace(/\bat\s*,\s*/gi, "")
    .replace(/\benemy champion\b/gi, "enemy")
    .replace(/\bchampion damage\b/gi, `${name} damage`)
    .replace(/\bPlayer\b/g, name)
    .replace(/\bplayer\b/g, name)
    .replace(/\bChampion\b/g, name)
    .replace(/\bchampion\b/g, name)
    .replace(/\bChamp\b/g, name)
    .replace(/\bchamp\b/g, name)
    .replace(/\s*;+\s*([.!?])/g, "$1")
    .replace(/\s*;+\s*$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeVisibleCoachText(text, champion = "Samira") {
  return normalizeEvidenceDescription(text, champion);
}

const supportChampionNames = new Set([
  "Alistar",
  "Bard",
  "Blitzcrank",
  "Brand",
  "Braum",
  "Janna",
  "Karma",
  "Leona",
  "Lulu",
  "Lux",
  "Milio",
  "Morgana",
  "Nami",
  "Nautilus",
  "Pyke",
  "Rakan",
  "Rell",
  "Renata Glasc",
  "Senna",
  "Seraphine",
  "Sona",
  "Soraka",
  "Tahm Kench",
  "Taric",
  "Thresh",
  "Yuumi",
  "Zilean",
  "Zyra"
]);

const jungleChampionNames = new Set([
  "Amumu",
  "Bel'Veth",
  "Briar",
  "Diana",
  "Ekko",
  "Elise",
  "Evelynn",
  "Fiddlesticks",
  "Gragas",
  "Graves",
  "Hecarim",
  "Ivern",
  "Jarvan IV",
  "Karthus",
  "Kayn",
  "Kha'Zix",
  "Kindred",
  "Lee Sin",
  "Lillia",
  "Master Yi",
  "Nidalee",
  "Nocturne",
  "Nunu",
  "Rammus",
  "Rek'Sai",
  "Rengar",
  "Sejuani",
  "Shaco",
  "Shyvana",
  "Skarner",
  "Taliyah",
  "Talon",
  "Udyr",
  "Vi",
  "Viego",
  "Volibear",
  "Warwick",
  "Wukong",
  "Xin Zhao",
  "Zac"
]);

function genericChampionRole(name) {
  if (supportChampionNames.has(name)) return "support";
  if (jungleChampionNames.has(name)) return "jungler";
  return "champion";
}

function replaceChampionName(value, name, replacement) {
  const pattern = escapeRegExp(name)
    .replace(/\\'/g, "['\u2019]")
    .replace(/\s+/g, "\\s+");
  return String(value || "").replace(new RegExp(`(^|[^A-Za-z0-9'])${pattern}(?=$|[^A-Za-z0-9'])`, "gi"), (_match, prefix) => `${prefix}${replacement}`);
}

function repairUnverifiedVisibleNames(value, champion = "Samira") {
  let text = String(value || "");
  const unverifiedNames = unverifiedChampionNames(text, [champion || "Samira"]);
  for (const name of unverifiedNames) {
    text = replaceChampionName(text, name, genericChampionRole(name));
  }
  return coachClean(text
    .replace(/\b(?:red|blue)\s+buff\b/gi, "jungle camp")
    .replace(/\benemy\s+enemy\b/gi, "enemy")
    .replace(/\bally\s+ally\b/gi, "ally")
    .replace(/\bsupport\s+support\b/gi, "support")
    .replace(/\bjungler\s+jungler\b/gi, "jungler"));
}

function visibleReviewStringFields() {
  return [
    "title",
    "feedbackTitle",
    "feedback",
    "gameDetail",
    "secondaryFocus",
    "eventEvidence",
    "failureEvidence",
    "goodThing",
    "whyTrust",
    "focusTag",
    "evidence",
    "pattern",
    "diamondRule",
    "drill",
    "reviewLimit"
  ];
}

function sanitizeVisibleReviewNames(recording, champion = "Samira") {
  for (const field of visibleReviewStringFields()) {
    if (recording[field]) recording[field] = repairUnverifiedVisibleNames(recording[field], champion);
  }
  for (const field of ["mistakeTypes", "timeline", "nuance"]) {
    if (Array.isArray(recording[field])) {
      recording[field] = recording[field].map((item) => repairUnverifiedVisibleNames(item, champion)).filter(Boolean);
    }
  }
  for (const field of ["clockAnchors", "clockMoments"]) {
    if (Array.isArray(recording[field])) {
      recording[field] = recording[field].map((item) => ({
        ...item,
        description: repairUnverifiedVisibleNames(item.description || "", champion)
      }));
    }
  }
}

function sanitizeTemplateResidue(recording) {
  const replaceResidue = (value) => coachClean(String(value || "")
    .replace(/\bstaying on farm after the map needed defense\b/gi, "continuing the old task after the visible state changed")
    .replace(/\btake the visible payout now, or click back if none is guaranteed\b/gi, "choose the visible result now: structure, wave, recall, group, or one step back if none is safe"));
  for (const field of visibleReviewStringFields()) {
    if (recording[field]) recording[field] = replaceResidue(recording[field]);
  }
  for (const field of ["mistakeTypes", "timeline", "nuance"]) {
    if (Array.isArray(recording[field])) {
      recording[field] = recording[field].map((item) => replaceResidue(item)).filter(Boolean);
    }
  }
  for (const field of ["clockAnchors", "clockMoments"]) {
    if (Array.isArray(recording[field])) {
      recording[field] = recording[field].map((item) => ({
        ...item,
        description: replaceResidue(item.description || "")
      }));
    }
  }
}

function firstUsefulReviewAnchor(recording = {}) {
  const anchors = dedupeClockAnchors([
    ...(Array.isArray(recording.clockMoments) ? recording.clockMoments : []),
    ...(Array.isArray(recording.clockAnchors) ? recording.clockAnchors : [])
  ]).filter((anchor) => anchor.clock && anchor.description && !anchorDescriptionLooksWeak(anchor.description));
  if (!anchors.length) return null;
  const reviewAnchors = anchors;
  const firstDetailSecond = timestampSecondsInText(recording.gameDetail)[0];
  if (Number.isFinite(firstDetailSecond)) {
    const direct = reviewAnchors.find((anchor) => {
      const anchorSeconds = clockSeconds(anchor.clock);
      return Number.isFinite(anchorSeconds) && Math.abs(anchorSeconds - firstDetailSecond) <= 5;
    });
    if (direct && !anchorIsConsequenceOnly(direct.description)) return direct;
    if (direct && anchorIsConsequenceOnly(direct.description)) {
      const previous = reviewAnchors
        .filter((anchor) => !anchorIsConsequenceOnly(anchor.description))
        .filter((anchor) => Number(anchor.videoSeconds) < Number(direct.videoSeconds))
        .sort((a, b) => Number(b.videoSeconds) - Number(a.videoSeconds))[0];
      if (previous) return previous;
    }
  }
  const primarySeconds = [
    ...primaryMistakeTimestampSeconds(recording.gameDetail, recording.eventEvidence || recording.evidence || recording.pattern),
    ...keyClickRuleTimestampSeconds(recording.gameDetail)
  ].map((seconds) => Math.round(seconds));
  if (primarySeconds.length) {
    const matching = reviewAnchors.find((anchor) => {
      const anchorSeconds = clockSeconds(anchor.clock);
      return Number.isFinite(anchorSeconds) &&
        !anchorIsConsequenceOnly(anchor.description) &&
        primarySeconds.some((seconds) => Math.abs(seconds - anchorSeconds) <= 5);
    });
    if (matching) return matching;
  }
  const consequence = reviewAnchors.find((anchor) => anchorIsConsequenceOnly(anchor.description));
  if (consequence) {
    const previous = reviewAnchors
      .filter((anchor) => !anchorIsConsequenceOnly(anchor.description))
      .filter((anchor) => Number(anchor.videoSeconds) < Number(consequence.videoSeconds))
      .sort((a, b) => Number(b.videoSeconds) - Number(a.videoSeconds))[0];
    if (previous) return previous;
  }
  return reviewAnchors.find((anchor) => !anchorIsConsequenceOnly(anchor.description)) || reviewAnchors[0];
}

function actionScriptForAnchor(recording = {}, anchor = null) {
  if (!anchor?.clock) return "";
  const keyRule = keyClickRuleSentence(recording, anchor, recording.champion || "Samira");
  if (keyRule) return keyRule;
  const text = [
    recording.feedback,
    recording.gameDetail,
    recording.secondaryFocus,
    recording.failureEvidence,
    recording.pattern,
    recording.eventEvidence,
    anchor.description
  ].join(" ").toLowerCase();
  const anchorText = String(anchor.description || "").toLowerCase();
  if (/\b(tower|turret|structure|inhib|inhibitor|nexus|wave|minion)\b/i.test(text)) {
    return `At ${anchor.clock}, run the branch before any forward click: check closest threatened turret, ally deaths, and who can stand in front; if enemy tower is free, hit it; if one enemy body blocks it and an ally can front, hit that body safely; if only the wave is guaranteed, push or clear it then recall; if none of those are true, leave.`;
  }
  if (/\b(base|inhib|inhibitor|nexus|tower|turret|structure|open structure|end)\b/i.test(text)) {
    return `At ${anchor.clock}, if the structure is free, click the structure; if one defender blocks it and an ally can stand in front, hit only that defender; if neither is true, click out and reset instead of chasing away from the payout.`;
  }
  if (/\b(side|jungle|camp|farm|defend|defense|turret has fallen|base defense|wave|inhibitor turret)\b/i.test(text) && !/\b(low hp|low-health|half hp)\b/i.test(anchorText)) {
    return `At ${anchor.clock}, your next job is to stop the camp or side-wave click, check death timers and the nearest threatened turret, then walk to the defensive wave, group, or reset instead of trading base defense for small farm.`;
  }
  if (/\b(low hp|low-health|half hp|recall|reset|shop|spend|shutdown|overstay|stay|stayed|greed|death|dead|died)\b/i.test(text)) {
    return `At ${anchor.clock}, your next job is to leave the lane or fight, recall on the first safe screen, and spend before touching another wave instead of farming while one engage can kill you.`;
  }
  if (/\b(fight|spacing|entry|cc|crowd control|hook|target|kite|collapse|fog|vision)\b/i.test(text)) {
    return `At ${anchor.clock}, your next job is to wait outside engage range until the first enemy tool is used, then enter behind an ally or kite back instead of being the first catchable target.`;
  }
  return `At ${anchor.clock}, your next job is to pause the forward click, check allies, enemy threat, and the nearest objective, then choose defend, reset, or hit structure instead of taking a loose fight.`;
}

function ensureTimestampedReplacementAction(recording, champion = "Samira") {
  if (hasTimestampedActionScript(recording.gameDetail) && !primaryActionTimestampNeedsRepair(recording)) return;
  const anchor = firstUsefulReviewAnchor(recording);
  if (!anchor) return;
  const action = repairUnverifiedVisibleNames(actionScriptForAnchor(recording, anchor), champion);
  if (!action) return;
  const wrongActionSentences = new Set(timestampedActionScriptSentences(recording.gameDetail).map((sentence) => coachClean(sentence)));
  const sentences = sentenceParts(recording.gameDetail)
    .filter((sentence) => !wrongActionSentences.has(coachClean(sentence)));
  if (!sentences.length) {
    recording.gameDetail = action;
    return;
  }
  const insertAt = 0;
  sentences.splice(insertAt, 0, action);
  recording.gameDetail = normalizeCoachPunctuation(sentences.join(" "));
}

function ensureKeyTimestampClickRule(recording, champion = "Samira") {
  const firstSentence = sentenceParts(recording.gameDetail)[0] || "";
  const firstDetailSecond = timestampSecondsInText(recording.gameDetail)[0];
  const hasNonOpeningVisibleAnchor = [
    ...(Array.isArray(recording.clockMoments) ? recording.clockMoments : []),
    ...(Array.isArray(recording.clockAnchors) ? recording.clockAnchors : [])
  ].some((anchor) => Number(clockSeconds(anchor.clock)) >= 180 && anchor.description && !anchorDescriptionLooksWeak(anchor.description));
  const needsOpeningAnchorRepair = hasNonOpeningVisibleAnchor && Number.isFinite(firstDetailSecond) && firstDetailSecond < 120;
  const needsLeadKeyRule = !hasKeyTimestampClickRule(firstSentence);
  if (!needsOpeningAnchorRepair && !needsLeadKeyRule && hasKeyTimestampClickRule(recording.gameDetail) && !/\b(?:mistake category|correct next click)\s*:/i.test(recording.gameDetail || "")) return;
  const anchor = firstUsefulReviewAnchor(recording);
  if (!anchor?.clock) return;
  const rule = repairUnverifiedVisibleNames(keyClickRuleSentence(recording, anchor, champion), champion);
  if (!rule) return;
  const anchorSeconds = clockSeconds(anchor.clock);
  const sentences = sentenceParts(recording.gameDetail);
  const filtered = sentences.filter((sentence, index) => {
    const sentenceClocks = timestampSecondsInText(sentence);
    return !sentenceClocks.some((seconds) => Number.isFinite(anchorSeconds) && Math.abs(seconds - anchorSeconds) <= 5);
  });
  recording.gameDetail = normalizeCoachPunctuation([rule, ...filtered].join(" "));
}

function stripDuplicateLeadClockEcho(recording) {
  const sentences = sentenceParts(recording.gameDetail);
  if (sentences.length < 2) return;
  const leadClock = normalizeClock(sentences[0]);
  if (!leadClock) return;
  recording.gameDetail = normalizeCoachPunctuation(sentences
    .filter((sentence, index) => {
      if (index === 0) return true;
      const clocks = timestampSecondsInText(sentence);
      const leadSeconds = clockSeconds(leadClock);
      if (!Number.isFinite(leadSeconds)) return true;
      return !clocks.some((seconds) => Math.abs(seconds - leadSeconds) <= 5);
    })
    .join(" "));
}

function ensureFailureEvidence(recording, champion = "Samira") {
  const failure = coachClean(recording.failureEvidence, "");
  if (failure.length >= 80 && /\b(leak|cost|punish|punished|death|died|gave|lost|risk|consequence|window|failed|failure|tempo|shutdown)\b/i.test(failure)) return;
  const anchor = firstUsefulReviewAnchor(recording);
  const clockLead = anchor?.clock ? `At ${anchor.clock}, ` : "";
  const description = anchor?.description ? `${clauseDescription(anchor.description, champion)}; ` : "";
  recording.failureEvidence = repairUnverifiedVisibleNames(
    `${clockLead}${description}the failure is staying in pressure mode after the safe payout is no longer proven, which leaks time, safety, or defense and gives the enemy another fight or push window.`,
    champion
  );
}

function ensureMistakeTypes(recording) {
  const existing = cleanList(recording.mistakeTypes, 5);
  const text = [recording.feedback, recording.gameDetail, recording.secondaryFocus, recording.failureEvidence, recording.pattern].join(" ").toLowerCase();
  const fills = [];
  if (/\b(reset|recall|shop|spend|overstay|stayed|shutdown|low hp|death|dead)\b/i.test(text)) fills.push("reset/overstay discipline");
  if (/\b(side|jungle|camp|farm|wave|defend|defense|turret)\b/i.test(text)) fills.push("side farm over map defense");
  if (/\b(fight|entry|cc|hook|target|kite|spacing|collapse)\b/i.test(text)) fills.push("spacing/entry discipline");
  if (/\b(base|inhib|inhibitor|nexus|tower|structure|objective)\b/i.test(text)) fills.push("wave/objective conversion");
  if (/\b(fog|vision|camera|map|timer|timers)\b/i.test(text)) fills.push("camera/map-state check");
  const fallback = ["camera/map-state check", "spacing/entry discipline", "reset/overstay discipline", "wave/objective conversion"];
  recording.mistakeTypes = [...new Set([...existing, ...fills, ...fallback])].slice(0, 5);
}

function kdaParts(recording = {}) {
  const parsed = String(recording.kda || "").match(/(\d+)\s*\/\s*(\d+)\s*\/\s*(\d+)/);
  return {
    kills: Number.isFinite(Number(recording.kills)) ? Number(recording.kills) : (parsed ? Number(parsed[1]) : NaN),
    deaths: Number.isFinite(Number(recording.deaths)) ? Number(recording.deaths) : (parsed ? Number(parsed[2]) : NaN),
    assists: Number.isFinite(Number(recording.assists)) ? Number(recording.assists) : (parsed ? Number(parsed[3]) : NaN)
  };
}

function reviewRepCategory(recording = {}) {
  const text = [
    recording.feedbackTitle,
    recording.feedback,
    recording.gameDetail,
    recording.goodThing,
    recording.failureEvidence,
    recording.pattern,
    Array.isArray(recording.mistakeTypes) ? recording.mistakeTypes.join(" ") : "",
    recording.eventEvidence,
    recording.evidence
  ].join(" ").toLowerCase();
  const { kills, deaths } = kdaParts(recording);
  const cs = Number(recording.cs);
  const gameLengthSeconds = Number(recording.gameLengthSeconds || recording.durationSeconds || 0);
  const csPerMinute = Number.isFinite(cs) && gameLengthSeconds > 0 ? cs / (gameLengthSeconds / 60) : NaN;
  const won = recording.outcome === "victory" || recording.outcomeLabel === "VICTORY" || recording.win === true;
  const isSamira = /\bsamira\b/i.test([recording.champion, recording.championSlug, recording.title, text].join(" "));
  const hasSpecificObjectiveFight = /\b(dragon|baron|objective fight|objective entry|objective pit|pit fight)\b/i.test(text);

  if (Number.isFinite(kills) && kills >= 18 && /\b(defeat|loss|lost|eight deaths|death|objective|won exchange|first useful damage|reset)\b/i.test(text)) {
    return "firstWinCashout";
  }
  if (/\bcleaner win\b/i.test(text) &&
      won &&
      Number.isFinite(deaths) &&
      deaths <= 3 &&
      Number.isFinite(csPerMinute) &&
      csPerMinute >= 5) {
    return "cleanerWinExit";
  }
  if (isSamira &&
      /\b(bot|lane|outer turret|under turret|support|wave is already thin|samira e|dash\/chase|tower dive)\b/i.test(text) &&
      ((Number.isFinite(kills) && Number.isFinite(deaths) && kills <= 2 && deaths >= 5) || /\bdeath-heavy lane\b/i.test(text))) {
    return "laneDeathExit";
  }
  if (/\bmid[-\s]?wave\b/i.test(text) &&
      /\briver\b/i.test(text) &&
      /\b(chase|entry|front|collapse|ally[-\s]?front)\b/i.test(text)) {
    return "midRiverChase";
  }
  if (!won &&
      Number.isFinite(deaths) &&
      deaths <= 4 &&
      /\b(blue-side jungle|jungle fight|jungle value|jungle-exit|first jungle value)\b/i.test(text)) {
    return "sideFarmDefense";
  }
  if (hasSpecificObjectiveFight &&
      /\b(fight|entry|engaged|committed|first value|second fight|value window|state flip|re-entry|reenter|exit)\b/i.test(text)) {
    return "objectiveFight";
  }
  if (!won && Number.isFinite(kills) && Number.isFinite(deaths) && kills <= 2 && deaths >= 5) {
    return "deathExit";
  }
  if (!won && Number.isFinite(deaths) && deaths <= 4 && /\b(side wave|side-wave|blue-side jungle|jungle fight|side\/jungle|nearest threatened turret)\b/i.test(text)) {
    return "sideFarmDefense";
  }
  if ((Number.isFinite(deaths) && deaths >= 9) || /\b(low hp|low-health|death-heavy|ten deaths|thirteen deaths|death timer|death-state|catchable death)\b/i.test(text)) {
    return "deathExit";
  }
  if (/\b(base|inhib|inhibitor|nexus|structure|exposed structures|enemy base|base push)\b/i.test(text)) {
    return "basePush";
  }
  if (won && Number.isFinite(deaths) && deaths <= 3 && Number.isFinite(csPerMinute) && csPerMinute >= 5) {
    return "cleanerWinExit";
  }
  if (/\b(side|jungle|camp|farm|side wave|side-wave|defend|defense|threatened turret|base defense)\b/i.test(text)) {
    return "sideFarmDefense";
  }
  if (/\b(fight|entry|front|catchable|collapse|cc|crowd control|target|kite)\b/i.test(text)) {
    return "fightEntry";
  }
  return "cleanerWinExit";
}

function specificRepForRecording(recording = {}) {
  const text = analysisCoachText(recording);
  switch (reviewRepCategory(recording)) {
    case "basePush":
      return basePushRep;
    case "firstWinCashout":
      return firstWinCashoutRep;
    case "laneDeathExit":
      return laneDeathExitRep;
    case "objectiveFight":
      return objectiveFightRep;
    case "deathExit":
      return deathExitRep;
    case "sideFarmDefense":
      if (/\b(blue-side jungle|jungle fight|jungle value|jungle-exit)\b/i.test(text)) {
        return jungleFightExitRep;
      }
      return sideFarmDefenseRep;
    case "midRiverChase":
      return midRiverChaseRep;
    case "fightEntry":
      return fightEntryRep;
    case "cleanerWinExit":
    default:
      return cleanerWinExitRep;
  }
}

function specificDrillForRecording(recording = {}) {
  return specificRepForRecording(recording).replace(/^Rep\s*:\s*/i, "");
}

function repMatchesGameCategory(recording = {}) {
  const rep = coachClean(recording.secondaryFocus || recording.secondaryImprovement || recording.drill || "");
  if (!rep) return false;
  switch (reviewRepCategory(recording)) {
    case "basePush":
      return /\bstructure,\s*blocker,\s*wave,\s*or\s*exit\b/i.test(rep);
    case "firstWinCashout":
      return /\bfirst won exchange\b|\bobjective,\s*tower,\s*wave crash,\s*or\s*recall\b/i.test(rep);
    case "laneDeathExit":
      return /\bdeath-heavy lane sequence\b|\bNo E toward\b|\bDo not E\/dash\b|\bwave still protects (?:me|you)\b|\bone step behind support\b/i.test(rep);
    case "objectiveFight":
      return /\bdid we already get the value\b|\bdragon,\s*wave,\s*recall,\s*or\s*group\b|\bsecond fight\b[\s\S]{0,100}\blow or unsupported\b/i.test(rep);
    case "deathExit":
      return /\blow[-\s]?HP\b|\bdeath-heavy\b|\bfirst safe exit\b|\bdo not re-enter while you are catchable\b|\bbefore Samira E\b|\bforward lane click\b|\bclick back behind support\b/i.test(rep);
    case "sideFarmDefense":
      return /\bcamp or side wave\b|\bnearest threatened turret\b|\bleave the farm\b|\bjungle fight gives first value\b|\bexit to turret,\s*catch mid wave,\s*reset,\s*or\s*regroup\b|\bDo not keep chasing through jungle\b/i.test(rep);
    case "midRiverChase":
      return /\bafter mid wave gives value\b|\bwave,\s*turret,\s*reset,\s*or\s*river\b|\bRiver is legal only if\b|\bcatch the wave and take one step back\b/i.test(rep);
    case "fightEntry":
      return /\btower,\s*wave,\s*objective,\s*or\s*ally[-\s]?front\b/i.test(rep);
    case "cleanerWinExit":
    default:
      return /\bwave,\s*tower hit,\s*or\s*fight start\b|\btower,\s*wave,\s*objective,\s*or\s*ally[-\s]?front\b|\bwave,\s*recall,\s*or\s*regroup\b|\bno second forward E\b|\bmid fight gives one\b/i.test(rep);
  }
}

function ensureSecondaryFocus(recording, champion = "Samira") {
  const issues = secondaryFocusStandardIssues(recording);
  if (!issues.length && repMatchesGameCategory(recording)) return;
  recording.secondaryFocus = repairUnverifiedVisibleNames(
    specificRepForRecording(recording),
    champion
  );
}

function ensurePinkRep(recording, champion = "Samira") {
  const current = coachClean(recording.secondaryFocus || recording.secondaryImprovement || "");
  const categoryRep = specificRepForRecording(recording);
  if (current && !repMatchesGameCategory(recording)) {
    recording.secondaryFocus = repairUnverifiedVisibleNames(categoryRep, champion);
    return;
  }
  if (/^Rep\s*:/i.test(current) && repMatchesGameCategory(recording) && !secondaryFocusStandardIssues({ ...recording, secondaryFocus: current }).length && !/\bwhat permanent thing\b/i.test(current)) {
    return;
  }
  const visibleText = [
    recording.feedback,
    recording.gameDetail,
    recording.secondaryFocus,
    recording.failureEvidence,
    recording.pattern,
    recording.eventEvidence,
    recording.goodThing
  ].join(" ");
  if (/\b(fight|entry|front|enter|re-enter|collapse|catchable)\b/i.test(visibleText) && !/\btower,\s*wave,\s*objective,\s*or\s*ally[-\s]?front\b/i.test(current)) {
    recording.secondaryFocus = repairUnverifiedVisibleNames(categoryRep, champion);
    return;
  }
  if (/^Rep\s*:/i.test(current) && !secondaryFocusStandardIssues({ ...recording, secondaryFocus: current }).length && !/\bwhat permanent thing\b/i.test(current)) return;
  const drill = coachClean(recording.drill || "");
  let source = (drill || current || categoryRep)
    .replace(/^Rep\s*:\s*/i, "")
    .replace(/^next game[:,]?\s*/i, "")
    .trim();
  if (/\bwhat permanent thing\b/i.test(source) || source.length < 70 || !/\b(click|check|ask|front|tower|wave|objective|reset|recall|leave|enter|back)\b/i.test(source)) {
    source = categoryRep.replace(/^Rep\s*:\s*/i, "");
  }
  recording.secondaryFocus = repairUnverifiedVisibleNames(
    `Rep: ${source}`,
    champion
  );
}

function ensureTeachingReasonAndLength(recording) {
  const detail = coachClean(recording.gameDetail, "");
  const additions = [];
  if (!/\b(leak|cost|punish|punished|shutdown|tempo|missed|risk|risky|death|died|gave|lost|blocked|blocker|mistake|danger|punishment|consequence|window|delay|stall|throw)\b/i.test(detail)) {
    additions.push("The leak is that the won or playable moment turns back into enemy tempo before your lead becomes a permanent map result.");
  }
  if (!/\b(because|so that|this matters because|the reason|which makes|which means|which proves|meaning|means|so\s+(?:the|a|every|your|you))\b/i.test(detail)) {
    additions.push("This matters because the climb comes from clean damage windows, spent gold, and protected entries, not through loose seconds where the enemy gets another collapse.");
  }
  if (detail.length < 240 && recording.failureEvidence) {
    additions.push(recording.failureEvidence);
  }
  if (additions.length) {
    recording.gameDetail = normalizeCoachPunctuation([detail, ...additions].filter(Boolean).join(" "));
  }
}

function ensureMistakeFixFeedback(recording, champion = "Samira") {
  const feedback = recording.feedback || "";
  const hasLegacyMistakeFix = /Mistake:\s*\S+[\s\S]*Fix:\s*\S+/i.test(feedback);
  const hasNaturalLeak = /\bThe leak is(?:\s+that)?\b[\s\S]{40,}\b(?:if|when|so|because|instead|by|after)\b/i.test(feedback);
  if ((!hasLegacyMistakeFix && !hasNaturalLeak) || hasAbstractCashoutReview(recording)) {
    recording.feedback = deterministicFallbackFeedback(recording, champion);
  }
  if (/^\d+\s*\/\s*\d+\s+means\b/i.test(recording.feedbackTitle || "") || /\bmap cash[-\s]?out|cash[-\s]?out/i.test(recording.feedbackTitle || "")) {
    recording.feedbackTitle = "Pressure mode after payout vanished";
  }
}

function replaceAbstractBranchLanguage(value) {
  return String(value || "")
    .replace(/\bcash[-\s]?out after the first win\b/gi, "take value after the first win")
    .replace(/\bcash[-\s]?out after first win\b/gi, "take value after first win")
    .replace(/\bcash(?:ing)? out the winning push\b/gi, "turning the winning push into structure or reset")
    .replace(/\bcash out wave, tower, reset, or end\b/gi, "take wave, tower, reset, or end")
    .replace(/\bclean cashout\/reset\b/gi, "clean wave/tower/reset branch")
    .replace(/\bcashout\/reset\b/gi, "wave/tower/reset branch")
    .replace(/\bcashout moment\b/gi, "wave/tower/reset moment")
    .replace(/\bcash out first\b/gi, "take tower, wave, objective, or recall first")
    .replace(/\bwrong task after the map state changes\b/gi, "pressure mode after the safe value disappeared")
    .replace(/\bmap cash[-\s]?outs?\b/gi, "map payout")
    .replace(/\bcash[-\s]?out timing\b/gi, "exit timing")
    .replace(/\bcleaner map cash[-\s]?out\b/gi, "cleaner wave, tower, objective, or reset branch")
    .replace(/\bcashing the win out safely\b/gi, "turning the win into recall, structure, or wave")
    .replace(/\bcash[-\s]?out\b/gi, "take the permanent value")
    .replace(/\bcashout\b/gi, "permanent-value branch");
}

function sanitizeAbstractBranchLanguage(recording = {}) {
  const scalarFields = [
    "title",
    "feedbackTitle",
    "feedback",
    "gameDetail",
    "eventEvidence",
    "failureEvidence",
    "goodThing",
    "whyTrust",
    "focusTag",
    "evidence",
    "pattern",
    "diamondRule",
    "drill",
    "secondaryFocus",
    "secondaryImprovement",
    "reviewLimit"
  ];
  for (const field of scalarFields) {
    if (recording[field]) recording[field] = normalizeCoachPunctuation(replaceAbstractBranchLanguage(recording[field]));
  }
  if (/^take value after/i.test(recording.feedbackTitle || "")) recording.feedbackTitle = "Take value after the first win";
  if (/^take value after/i.test(recording.title || "")) recording.title = "Take value after the first win";
  for (const field of ["timeline", "nuance", "mistakeTypes"]) {
    if (Array.isArray(recording[field])) {
      recording[field] = recording[field].map((item) => normalizeCoachPunctuation(replaceAbstractBranchLanguage(item)));
    }
  }
  if (Array.isArray(recording.clockAnchors)) {
    recording.clockAnchors = recording.clockAnchors.map((anchor) => ({
      ...anchor,
      description: anchor?.description ? normalizeCoachPunctuation(replaceAbstractBranchLanguage(anchor.description)) : anchor?.description
    }));
  }
  if (Array.isArray(recording.clockMoments)) {
    recording.clockMoments = recording.clockMoments.map((moment) => ({
      ...moment,
      description: moment?.description ? normalizeCoachPunctuation(replaceAbstractBranchLanguage(moment.description)) : moment?.description
    }));
  }
}

function detailStartsWithEvidence(detail) {
  return /^(?:At|Around|By|Then|In|During|After|When|Samira|Cait|Caitlyn|Fizz|You|\d{1,2}:[0-5]\d)\b/i.test(coachClean(detail, ""));
}

function ensureEvidenceLeadSentence(recording, champion = "Samira") {
  if (detailStartsWithEvidence(recording.gameDetail)) return;
  const anchor = firstUsefulReviewAnchor(recording);
  if (!anchor?.clock || !anchor.description) return;
  const lead = `Around ${anchor.clock}, ${clauseDescription(anchor.description, champion)}; this is the start or nearest visible start of the main mistake window.`;
  recording.gameDetail = normalizeCoachPunctuation(`${lead} ${recording.gameDetail || ""}`);
}

function repairVisibleReviewForStandard(recording, fileName) {
  if (!requiresVisibleParagraphStandard(fileName, recording)) return;
  const champion = recording.champion || "Samira";
  sanitizeVisibleReviewNames(recording, champion);
  ensureMistakeFixFeedback(recording, champion);
  if (recording.analysisSource === "fallback") {
    applyDeterministicVisibleReviewFallback(recording, fileName);
  }
  if (recording.analysisSource !== "manual" && primaryActionTimestampNeedsRepair(recording)) {
    const repairedDetail = teachingDetailFromMoments(
      recording,
      Array.isArray(recording.clockMoments) && recording.clockMoments.length ? recording.clockMoments : recording.clockAnchors,
      champion
    );
    if (repairedDetail) {
      recording.gameDetail = stripRedundantLessonEcho(stripRepeatedConversionGlossary(repairedDetail));
    }
  }
  ensureMistakeTypes(recording);
  ensureSecondaryFocus(recording, champion);
  ensurePinkRep(recording, champion);
  ensureFailureEvidence(recording, champion);
  ensureTimestampedReplacementAction(recording, champion);
  ensureKeyTimestampClickRule(recording, champion);
  stripDuplicateLeadClockEcho(recording);
  ensureTeachingReasonAndLength(recording);
  ensureEvidenceLeadSentence(recording, champion);
  sanitizeVisibleReviewNames(recording, champion);
  recording.gameDetail = stripUnmatchedClockTokens(recording.gameDetail, recording.clockAnchors);
  recording.eventEvidence = stripUnmatchedClockTokens(recording.eventEvidence || recording.evidence || "", recording.clockAnchors);
  recording.evidence = stripUnmatchedClockTokens(recording.evidence || recording.eventEvidence || "", recording.clockAnchors);
  if (recording.analysisSource !== "manual" && visibleParagraphStandardIssues(recording).length) {
    applyDeterministicVisibleReviewFallback(recording, fileName);
    ensureMistakeFixFeedback(recording, champion);
    ensureMistakeTypes(recording);
    ensureSecondaryFocus(recording, champion);
    ensurePinkRep(recording, champion);
    ensureFailureEvidence(recording, champion);
    ensureTimestampedReplacementAction(recording, champion);
    ensureKeyTimestampClickRule(recording, champion);
    stripDuplicateLeadClockEcho(recording);
    ensureTeachingReasonAndLength(recording);
    ensureEvidenceLeadSentence(recording, champion);
    sanitizeVisibleReviewNames(recording, champion);
    recording.gameDetail = stripUnmatchedClockTokens(recording.gameDetail, recording.clockAnchors);
    recording.eventEvidence = stripUnmatchedClockTokens(recording.eventEvidence || recording.evidence || "", recording.clockAnchors);
    recording.evidence = stripUnmatchedClockTokens(recording.evidence || recording.eventEvidence || "", recording.clockAnchors);
  }
  sanitizeAbstractBranchLanguage(recording);
}

function repairPublishAuditRequirements(recording, fileName) {
  const isAuto = /^auto_/i.test(fileName || recording?.file || "");
  if (!isAuto || Number(recording?.durationSeconds || 0) < 90) return;
  const champion = recording.champion || "Samira";
  if (!hasTimestampedActionScript(recording.gameDetail)) {
    ensureTimestampedReplacementAction(recording, champion);
  }
  ensureKeyTimestampClickRule(recording, champion);
  stripDuplicateLeadClockEcho(recording);
  sanitizeVisibleReviewNames(recording, champion);
  recording.gameDetail = stripUnmatchedClockTokens(recording.gameDetail, recording.clockAnchors);
  recording.eventEvidence = stripUnmatchedClockTokens(recording.eventEvidence || recording.evidence || "", recording.clockAnchors);
  recording.evidence = stripUnmatchedClockTokens(recording.evidence || recording.eventEvidence || "", recording.clockAnchors);
}

function hasRepeatedConversionGlossary(recording = {}) {
  return /\b(?:A\s+)?conversion\s+(?:just\s+)?means\b/i.test(recording.gameDetail || "");
}

function hasAbstractCashoutReview(recording = {}) {
  const text = [
    recording.feedbackTitle,
    recording.feedback,
    recording.gameDetail,
    recording.goodThing,
    recording.failureEvidence,
    recording.pattern,
    recording.drill
  ].join(" ");
  return /\b(?:map cash[-\s]?outs?|cash(?:ing)? (?:those )?(?:wins|moments|it)? ?out(?:s)? cleaner|cash[-\s]?out timing|cleaner map|wrong task after the map state changes|call free structure, blocked structure, or reset)\b/i.test(text);
}

function normalizeCoachPunctuation(text) {
  return coachClean(text)
    .replace(/([.!?])\s*;/g, "$1")
    .replace(/\s*;\s*([.!?])/g, "$1")
    .replace(/([.!?])\1+/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function stripDetailRefreshFailureNotes(text) {
  return normalizeCoachPunctuation(String(text || "")
    .replace(/Detail refresh kept the previous review because model analysis failed:[^.]+\.?\s*/gi, " "));
}

function stripRepeatedConversionGlossary(text) {
  return normalizeCoachPunctuation(String(text || "")
    .replace(/\s*Conversion means turning a fight win or gold lead into something that remains after the fight ends: tower damage, base damage, dragon\/Baron setup, or a safe reset with spent gold\.\s*/gi, " ")
    .replace(/\s*A conversion just means turning your lead into a concrete payout: tower damage, base damage, dragon\/Baron setup, or a safe reset with spent gold\.\s*/gi, " "));
}

function stripRedundantLessonEcho(text) {
  const sentences = sentenceParts(text).filter((sentence) => !/^\s*(Mistake|Fix):/i.test(sentence));
  return normalizeCoachPunctuation(sentences.join(" "));
}

function hasRedundantLessonEcho(recording = {}) {
  return sentenceParts(recording.gameDetail || "").some((sentence) => /^\s*(Mistake|Fix):/i.test(sentence));
}

function hasDuplicateLeadClockEcho(recording = {}) {
  const sentences = sentenceParts(recording.gameDetail || "");
  if (sentences.length < 2) return false;
  const leadClock = normalizeClock(sentences[0]);
  if (!leadClock) return false;
  const leadSeconds = clockSeconds(leadClock);
  if (!Number.isFinite(leadSeconds)) return false;
  return sentences.slice(1).some((sentence) => (
    timestampSecondsInText(sentence).some((seconds) => Math.abs(seconds - leadSeconds) <= 5)
  ));
}

function primaryActionTimestampNeedsRepair(recording = {}) {
  if (!requiresVisibleParagraphStandard(recording.file || "", recording)) return false;
  const anchors = cleanClockAnchors([
    ...(Array.isArray(recording.clockMoments) ? recording.clockMoments : []),
    ...(Array.isArray(recording.clockAnchors) ? recording.clockAnchors : [])
  ]).filter((anchor) => anchor.clock && anchor.description);
  if (!anchors.length) return false;
  const firstDetailSecond = timestampSecondsInText(recording.gameDetail)[0];
  if (Number.isFinite(firstDetailSecond)) {
    const firstAnchor = anchors.find((anchor) => {
      const anchorSeconds = clockSeconds(anchor.clock);
      return Number.isFinite(anchorSeconds) && Math.abs(anchorSeconds - firstDetailSecond) <= 5;
    });
    if (firstAnchor && anchorIsConsequenceOnly(firstAnchor.description)) {
      const hasEarlierDecision = anchors.some((anchor) => (
        !anchorIsConsequenceOnly(anchor.description) &&
        Number(anchor.videoSeconds) < Number(firstAnchor.videoSeconds)
      ));
      if (hasEarlierDecision) return true;
    }
  }
  const actionSeconds = timestampedActionScriptSentences(recording.gameDetail)
    .flatMap((sentence) => timestampSecondsInText(sentence))
    .map((seconds) => Math.round(seconds));
  const actionAnchor = firstUsefulReviewAnchor(recording);
  const actionAnchorSeconds = clockSeconds(actionAnchor?.clock);
  const actionText = timestampedActionScriptSentences(recording.gameDetail).join(" ");
  const actionContext = [actionAnchor?.description, recording.feedback, recording.failureEvidence, recording.pattern].join(" ");
  if (
    /\b(side|jungle|camp|farm|defend|defense|turret has fallen|base defense|wave|inhibitor turret)\b/i.test(actionContext) &&
    /\brecall on the first safe screen\b/i.test(actionText) &&
    !/\blow[-\s]?hp|half hp\b/i.test(actionAnchor?.description || "")
  ) {
    return true;
  }
  return Number.isFinite(actionAnchorSeconds) &&
    actionSeconds.length > 0 &&
    !actionSeconds.some((seconds) => Math.abs(seconds - actionAnchorSeconds) <= 5);
}

function needsCachedTextRepair(recording = {}) {
  const text = [
    recording.gameDetail,
    recording.secondaryFocus || recording.secondaryImprovement,
    recording.failureEvidence,
    recording.eventEvidence,
    recording.evidence
  ].filter(Boolean).join(" ");
  return (
    hasRepeatedConversionGlossary(recording) ||
    hasAbstractCashoutReview(recording) ||
    hasRedundantLessonEcho(recording) ||
    hasDuplicateLeadClockEcho(recording) ||
    primaryActionTimestampNeedsRepair(recording) ||
    (requiresVisibleParagraphStandard(recording.file || "", recording) && !repMatchesGameCategory(recording)) ||
    /Detail refresh kept the previous review because model analysis failed:/i.test(recording.reviewLimit || "") ||
    /\b(?:Failure evidence|Other mistake types|Second focus)\s*:/i.test(text) ||
    /[.!?]\s*;|;\s*[.!?]|[.!?]{2,}/.test(text)
  );
}

function usefulEvidenceMoment(anchor, analysis, threshold = 8) {
  return anchorEvidenceScore(anchor, analysis) >= threshold;
}

function primaryMistakeTextPattern() {
  return /\b(biggest|primary|main|clearest|real|actual|big)?\s*(mistake|leak|overstay|overstaying|stayed|stay|chase|chasing|chased|duel|dueling|side[-\s]?lane|sideline|re-?engage|re-?enter|fight|fighting|accepted|accepting|drift|drifted|low[-\s]?hp|lethal|unspent|shutdown|reset|tempo|collapse|overextend|overextended|missed|delayed|risky|risk|danger|gave|died|death|stall|throw|window|blocked|alone|side fight)\b/i;
}

function primaryMistakeTimestampSeconds(...texts) {
  const pattern = primaryMistakeTextPattern();
  const sentences = texts
    .flatMap((text) => sentenceParts(text))
    .map((sentence) => coachClean(sentence, ""))
    .filter(Boolean);
  return sentences
    .filter((sentence) => pattern.test(sentence) && timestampSecondsInText(sentence).length)
    .flatMap((sentence) => timestampSecondsInText(sentence));
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
  return selected;
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
  return dedupeClockAnchorsPreserveOrder([...selected, ...fill], maxItems)
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
  if (fastMacroReview) {
    const textMoments = evidenceMomentsFromText(analysis, anchors, 3);
    const deterministicMoments = ensureMinimumEvidenceMoments(
      analysis,
      anchors,
      selectUsefulEvidenceMoments(analysis, anchors, textMoments, 3, 5),
      1
    ).slice(0, 3);
    if (deterministicMoments.length) return deterministicMoments;
    const bestAnchor = anchors
      .map((anchor, index) => ({ anchor, score: anchorEvidenceScore(anchor, analysis, index) }))
      .sort((a, b) => b.score - a.score || a.anchor.videoSeconds - b.anchor.videoSeconds)[0]?.anchor;
    if (bestAnchor) return [bestAnchor];
  }
  if (!process.env.OPENAI_API_KEY) return fallbackEvidenceClockMoments(analysis, anchors);
  const allowed = anchors.map((anchor) => ({
    clock: anchor.clock,
    videoSeconds: anchor.videoSeconds,
    description: anchor.description || ""
  }));
  const prompt = [
    "Choose the clickable timestamp moments that are actual evidence for the coaching claim, not just random readable game clocks.",
    "The only mandatory timestamp is the beginning or nearest visible beginning of Alan's biggest mistake window. It does not have to be the exact click, but it must point him to the part of the game where the mistake starts.",
    "Alan uses timestamps to study what he did, what leaked, what happened next, and what he should do differently. If the advice is overstay/reset, choose the first visible stay/reset-decision frame. If the advice is structure conversion, choose the first visible frame where structure access turns into delay, chase, or blocked conversion. If the advice is wave/objective/vision/CC, choose the first visible frame where that mistake begins.",
    "Use only the allowed anchors below. Do not invent clocks, videoSeconds, or events. Return the primary mistake-start moment first. Add extra moments only when they genuinely clarify setup, consequence, or the correct contrasting habit.",
    "One strong mistake-start timestamp is enough. Do not include weak extra timestamps just to pad the review.",
    "If an allowed anchor is only normal gameplay, walking, farming, shop, respawn, or a random fight unrelated to the coaching claim, reject it.",
    "Reject shop, fountain, scoreboard, game-start, or item-selection anchors unless the coaching claim is literally about buying, recalling, or spending.",
    "Descriptions should be short evidence labels tied to the lesson, not generic frame captions. Say the detected player champion, not Player or Champion. A good structure/objective moment should be labeled as good evidence, not treated as a chase.",
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
    .replace(/[.;!?]+$/g, "")
    .replace(/^at\s+\d{1,2}:[0-5]\d,?\s*/i, "")
    .replace(/^shows\s+/i, "")
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
  if (!moments.length) return "";
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
  if (!moments.length) return cleaned;
  if (primaryMistakeTimestampSeconds(cleaned).length) return cleaned;
  const strippedSentences = sentenceParts(cleaned).filter((sentence) => {
    const clocks = timestampSecondsInText(sentence);
    return !(clocks.length >= 2 && sentenceUsesMomentClock(sentence, moments));
  });
  const base = normalizeVisibleCoachText(strippedSentences.join(" "), champion);
  if (primaryMistakeTimestampSeconds(base).length) return base;
  const evidenceSentence = momentEvidenceSentence(moments, champion);
  if (!evidenceSentence) return base;
  const sentences = sentenceParts(base);
  if (!sentences.length) return evidenceSentence;
  const lessonIndex = sentences.findIndex((sentence) => /\b(the\s+)?(big|simple|core|main)?\s*lesson\b/i.test(sentence));
  const insertAt = lessonIndex >= 0 ? lessonIndex : Math.max(1, sentences.length - 1);
  sentences.splice(insertAt, 0, evidenceSentence);
  return coachClean(sentences.join(" "));
}

function adviceTextForTeaching(analysis, champion = "Samira") {
  return normalizeVisibleCoachText(
    coachClean(analysis?.feedback, "Mistake: the lead did not become a concrete map payout. Fix: use the next safe wave, tower, base, objective, or reset before taking another fight."),
    champion
  );
}

function shorthandTeachingSentence(analysis, champion = "Samira") {
  const text = analysisCoachText(analysis);
  const parts = [];
  const subject = clean(champion, "your champion");
  if (/\b(grouped mid|group mid|mid pressure)\b/i.test(text)) {
    parts.push(`Grouped mid is better only when the visible state supports it, because mid is the shortest lane to towers/base, allies can stand between ${subject} and the collapse, and enemies have to defend structure instead of chasing through fog.`);
  }
  return parts.join(" ");
}

function statContextSentence(recording = {}, champion = "Samira") {
  const kills = Number(recording.kills);
  const deaths = Number(recording.deaths);
  const assists = Number(recording.assists);
  const cs = Number(recording.cs);
  const gameLengthSeconds = Number(recording.gameLengthSeconds);
  if (![kills, deaths, assists, cs, gameLengthSeconds].every(Number.isFinite) || gameLengthSeconds <= 0) return "";
  const minutes = Math.max(1, gameLengthSeconds / 60);
  const csPerMinute = cs / minutes;
  const roundedMinutes = Math.round(minutes);
  const subject = clean(champion, "your champion");
  if (csPerMinute < 4.2 && deaths <= 4) {
    return `The ${kills}/${deaths}/${assists}, ${cs} CS in ${roundedMinutes} minutes says ${subject} is affecting fights, but income is low; the bigger issue is stable wave, tower, objective, or reset value before another forward click erases it.`;
  }
  if (deaths >= 6) {
    return `The ${kills}/${deaths}/${assists}, ${cs} CS in ${roundedMinutes} minutes says the biggest cost is death-state exposure: the damage exists, but too many decisions end in timers before the result is locked.`;
  }
  return `The ${kills}/${deaths}/${assists}, ${cs} CS in ${roundedMinutes} minutes says ${subject} can fight, so the review should judge the next decision after pressure.`;
}

function inferredStatsFromAnalysis(analysis = {}) {
  const text = [
    analysis.gameDetail,
    analysis.feedback,
    analysis.goodThing,
    analysis.failureEvidence,
    analysis.pattern,
    analysis.whyTrust,
    analysis.evidence,
    Array.isArray(analysis.nuance) ? analysis.nuance.join(" ") : ""
  ].join(" ");
  const kdaMatch = text.match(/\b(\d+)\s*\/\s*(\d+)\s*\/\s*(\d+)\b[\s\S]{0,80}?\b(\d+)\s*CS\b/i) ||
    text.match(/\b(\d+)\s*CS\b[\s\S]{0,80}?\b(\d+)\s*\/\s*(\d+)\s*\/\s*(\d+)\b/i);
  let kills = Number(analysis.kills);
  let deaths = Number(analysis.deaths);
  let assists = Number(analysis.assists);
  let cs = Number(analysis.cs);
  if (kdaMatch) {
    if (kdaMatch[4] && /\bCS\b/i.test(kdaMatch[0].slice(kdaMatch[0].indexOf(kdaMatch[4])))) {
      kills = Number(kdaMatch[1]);
      deaths = Number(kdaMatch[2]);
      assists = Number(kdaMatch[3]);
      cs = Number(kdaMatch[4]);
    } else {
      cs = Number(kdaMatch[1]);
      kills = Number(kdaMatch[2]);
      deaths = Number(kdaMatch[3]);
      assists = Number(kdaMatch[4]);
    }
  }
  const minutesMatch = text.match(/\b(\d+)\s*(?:min|minute)[-\s]*(?:game|line|ranked|full-game|full game|victory|defeat|minutes)?\b/i);
  const minutes = Number(analysis.gameLengthMinutes || (minutesMatch ? minutesMatch[1] : NaN));
  return {
    kda: [kills, deaths, assists].every(Number.isFinite) ? `${kills}/${deaths}/${assists}` : "",
    kills: Number.isFinite(kills) ? kills : null,
    deaths: Number.isFinite(deaths) ? deaths : null,
    assists: Number.isFinite(assists) ? assists : null,
    cs: Number.isFinite(cs) ? cs : null,
    gameLength: Number.isFinite(minutes) ? `${minutes} min` : "",
    gameLengthSeconds: Number.isFinite(minutes) ? minutes * 60 : null,
    statsSource: [kills, deaths, assists, cs].every(Number.isFinite) ? "Manual review stat context" : ""
  };
}

function mistakeCategoryForAnalysis(analysis = {}) {
  const text = analysisCoachText(analysis);
  const deaths = Number(analysis.deaths);
  if (/\b(blue-side jungle|jungle fight|jungle value|jungle-exit|first jungle value)\b/i.test(text)) {
    return "jungle fight exit after first value";
  }
  if (/\b(side|jungle|camp|farm)\b/i.test(text) && /\b(defend|defense|base|turret|tower|wave)\b/i.test(text)) {
    return "side value over map defense";
  }
  if (/\b(tower|turret|structure|inhib|inhibitor|nexus|wave|payout|pressure)\b/i.test(text)) {
    return "pressure mode after safe payout vanished";
  }
  if (/\b(low hp|low-health|recall|reset|shop|spend|overstay|stay|stayed|shutdown)\b/i.test(text) || deaths >= 6) {
    return "death-state or reset discipline";
  }
  if (/\b(fight|spacing|entry|cc|crowd control|target|kite|collapse|fog|vision)\b/i.test(text)) {
    return "catchable fight entry";
  }
  return "loose forward click after state changed";
}

function anchorOrAnalysisHasJungleFight(analysis = {}, anchor = null) {
  const anchorText = clean(anchor?.description || "");
  if (/\b(blue-side jungle|bot-side jungle fight|jungle fight|jungle value|jungle-exit|first jungle value)\b/i.test(anchorText)) {
    return true;
  }
  return !anchor && /\b(blue-side jungle|jungle fight|jungle value|jungle-exit|first jungle value)\b/i.test(analysisCoachText(analysis));
}

function correctNextClickForAnalysis(analysis = {}, anchor = null) {
  const text = analysisCoachText(analysis);
  if (anchorOrAnalysisHasJungleFight(analysis, anchor)) {
    return "exit to turret, catch mid wave, reset, or regroup";
  }
  if (/\b(tower|turret|structure|inhib|inhibitor|nexus|wave|payout|pressure)\b/i.test(text)) {
    return "choose the visible result now: structure, wave, recall, group, or one step back if none is safe";
  }
  if (/\b(side|jungle|camp|farm|defend|defense|turret has fallen|base defense|inhibitor turret)\b/i.test(text)) {
    return "drop the farm click and walk to the threatened wave, ally line, or reset";
  }
  if (/\b(low hp|low-health|death|dead|died|shutdown|reset|recall|spend|shop|gold)\b/i.test(text)) {
    return "recall on the first safe screen before touching another wave or fight";
  }
  if (/\b(fight|spacing|entry|cc|crowd control|target|kite|collapse|fog|vision)\b/i.test(text)) {
    return "hold behind the ally line and re-enter only after the enemy commits";
  }
  return "stop the forward click, check ally front and nearest objective, then choose defend, reset, or hit a free structure";
}

function wrongDecisionForAnalysis(analysis = {}, anchor = null) {
  const text = analysisCoachText(analysis);
  if (anchorOrAnalysisHasJungleFight(analysis, anchor)) {
    return "continuing the same jungle fight after first value";
  }
  if (/\b(side|jungle|camp|farm)\b/i.test(text) && /\b(defend|defense|base|turret|tower|wave)\b/i.test(text)) {
    return "continuing the old task after the visible state changed";
  }
  if (/\b(tower|turret|structure|inhib|inhibitor|nexus|wave|payout|pressure)\b/i.test(text)) {
    return "stepping forward after the safe payout disappeared";
  }
  if (/\b(low hp|low-health|recall|reset|shop|spend|overstay|stay|stayed|shutdown|death|dead|died)\b/i.test(text)) {
    return "playing one more screen before the reset";
  }
  if (/\b(fight|spacing|entry|cc|crowd control|target|kite|collapse|fog|vision)\b/i.test(text)) {
    return "entering when the screen only offers a catchable fight";
  }
  return "letting the old plan continue after the state changed";
}

function keyVisibleStateForAnchor(anchor, champion = "Samira") {
  if (!anchor?.description || anchorDescriptionLooksWeak(anchor.description)) {
    return "the fallback cannot verify enough visible state to name a safe payout";
  }
  return clauseDescription(anchor.description, champion);
}

function keyClickRuleSentence(analysis = {}, anchor = null, champion = "Samira") {
  if (!anchor?.clock) return "";
  const state = keyVisibleStateForAnchor(anchor, champion);
  const wrong = wrongDecisionForAnalysis(analysis, anchor);
  const click = correctNextClickForAnalysis(analysis, anchor);
  return `At ${anchor.clock}, ${state}, so the wrong click is ${wrong} and the next click is to ${click}.`;
}

function branchActionSentence(clock) {
  return `At ${clock}, if no tower, wave, objective, or ally front is visible, the next click is one step back; re-enter only from behind an ally.`;
}

function teachingDetailFromMoments(analysis, clockMoments, champion = "Samira") {
  const moments = cleanClockAnchors(clockMoments)
    .filter((moment) => moment.description)
    .slice(0, 4);
  if (!moments.length) return "";
  const firstConsequence = moments.find((moment) => anchorIsConsequenceOnly(moment.description));
  const preConsequencePrimary = firstConsequence
    ? moments
      .filter((moment) => !anchorIsConsequenceOnly(moment.description))
      .filter((moment) => Number(moment.videoSeconds) < Number(firstConsequence.videoSeconds))
      .sort((a, b) => Number(b.videoSeconds) - Number(a.videoSeconds))[0]
    : null;
  const primary = preConsequencePrimary || moments
    .map((moment, index) => ({
      moment,
      score: anchorEvidenceScore(moment, analysis, index) +
        (primaryMistakeTextPattern().test(moment.description || "") ? 6 : 0) -
        (anchorIsConsequenceOnly(moment.description) ? 18 : 0)
    }))
    .sort((a, b) => b.score - a.score || a.moment.videoSeconds - b.moment.videoSeconds)[0]?.moment || moments[0];
  const rest = moments.filter((moment) => moment !== primary);
  const clauses = [
    keyClickRuleSentence(analysis, primary, champion)
  ].filter(Boolean);
  for (const moment of rest.slice(0, 1)) {
    const lead = Number(moment.videoSeconds) < Number(primary.videoSeconds) ? `earlier at ${moment.clock}` : `by ${moment.clock}`;
    clauses.push(`${lead}, ${clauseDescription(moment.description, champion)}.`);
  }
  const advice = stripUnmatchedClockTokens(adviceTextForTeaching(analysis, champion), moments);
  const shorthand = shorthandTeachingSentence(analysis, champion);
  const subject = clean(champion, "your champion");
  const leadSubject = subject === "Unknown" ? "your lead" : `a ${subject} lead`;
  const stats = statContextSentence(analysis, champion);
  const why = `The sharper leak is staying in pressure mode after the safe payout is no longer proven; ${leadSubject} climbs when the next click turns the wave or fight into a stable result before enemies get another collapse window.`;
  return coachClean([
    clauses.join(" "),
    hasTimestampedActionScript(clauses.join(" ")) ? "" : branchActionSentence(primary.clock) || advice,
    stats,
    shorthand,
    why
  ].filter(Boolean).join(" "));
}

function eventEvidenceFromMoments(clockMoments, champion = "Samira") {
  const moments = cleanClockAnchors(clockMoments)
    .filter((moment) => moment.description)
    .slice(0, 4);
  if (!moments.length) return "";
  const evidence = coachClean(moments
    .map((moment) => `${moment.clock} shows ${clauseDescription(moment.description, champion)}`)
    .join(". ") + ".");
  if (evidence.length >= 60) return evidence;
  return coachClean(`${evidence.replace(/[.!?]+$/g, "")}; this anchors the visible start of the mistake window.`);
}

function standardRepairMoments(analysis, clockAnchors, clockMoments, champion = "Samira") {
  const allAnchors = [
    ...cleanClockAnchors(clockMoments),
    ...cleanClockAnchors(clockAnchors)
  ];
  const minimumUsefulClock = 0;
  const isUsefulClock = (anchor) => Number(clockSeconds(anchor.clock)) >= minimumUsefulClock;
  const existing = cleanClockAnchors(clockMoments)
    .filter(isUsefulClock)
    .filter((moment) => moment.description)
    .map((moment) => ({ ...moment, description: normalizeEvidenceDescription(moment.description, champion) }))
    .filter((moment) => !anchorDescriptionLooksWeak(moment.description));
  if (existing.length) {
    const existingKeys = new Set(existing.map((anchor) => `${anchor.clock}@${anchor.videoSeconds}`));
    const fill = cleanClockAnchors(clockAnchors)
      .filter(isUsefulClock)
      .filter((anchor) => anchor.description)
      .map((anchor, index) => ({
        anchor: { ...anchor, description: normalizeEvidenceDescription(anchor.description, champion) },
        score: anchorEvidenceScore(anchor, analysis, index) +
          (Number(clockSeconds(anchor.clock)) >= 900 ? 6 : 0) +
          (Number(clockSeconds(anchor.clock)) >= 1200 ? 5 : 0)
      }))
      .filter((item) => item.anchor.description && !anchorDescriptionLooksWeak(item.anchor.description))
      .filter((item) => !existingKeys.has(`${item.anchor.clock}@${item.anchor.videoSeconds}`))
      .sort((a, b) => b.score - a.score || a.anchor.videoSeconds - b.anchor.videoSeconds)
      .map((item) => item.anchor)
      .slice(0, Math.max(0, 4 - existing.length));
    return [...existing, ...fill]
      .map((anchor, index) => ({
        anchor,
        score: anchorEvidenceScore(anchor, analysis, index) +
          (Number(clockSeconds(anchor.clock)) >= 900 ? 6 : 0) +
          (Number(clockSeconds(anchor.clock)) >= 1200 ? 6 : 0)
      }))
      .sort((a, b) => b.score - a.score || a.anchor.videoSeconds - b.anchor.videoSeconds)
      .map((item) => item.anchor)
      .slice(0, 4);
  }
  const candidates = cleanClockAnchors(clockAnchors)
    .filter(isUsefulClock)
    .filter((anchor) => anchor.description)
    .map((anchor, index) => ({
      anchor: { ...anchor, description: normalizeEvidenceDescription(anchor.description, champion) },
      score: anchorEvidenceScore(anchor, analysis, index) +
        (Number(clockSeconds(anchor.clock)) >= 900 ? 6 : 0) +
        (Number(clockSeconds(anchor.clock)) >= 1200 ? 6 : 0)
    }))
    .filter((item) => item.anchor.description);
  const nonWeak = candidates.filter((item) => !anchorDescriptionLooksWeak(item.anchor.description));
  const scored = nonWeak.filter((item) => item.score >= -4);
  const pool = scored.length ? scored : (nonWeak.length ? nonWeak : candidates);
  return pool
    .sort((a, b) => b.score - a.score || a.anchor.videoSeconds - b.anchor.videoSeconds)
    .map((item) => item.anchor)
    .slice(0, 4);
}

function deterministicFallbackFeedback(recording, champion = "Samira") {
  const text = [recording.gameDetail, recording.feedback, recording.pattern, recording.eventEvidence].join(" ").toLowerCase();
  if (/\b(base|inhib|inhibitor|nexus|tower|turret|structure|end)\b/i.test(text)) {
    return "The leak is staying in pressure mode after the safe result stops being clear, so the next forward click gives enemies another collapse window.";
  }
  if (/\b(side|jungle|camp|farm|wave|defend|defense|turret)\b/i.test(text)) {
    return "The leak is keeping the side or farm click after the map has already asked for defense, so small gold trades into lost wave or turret time.";
  }
  if (/\b(low hp|low-health|death|dead|died|shutdown|reset|recall|spend|shop|gold)\b/i.test(text)) {
    return "The leak is playing one more screen after the safe reset appears, so the gold or health lead stays exposed.";
  }
  if (/\b(fight|spacing|entry|cc|crowd control|target|kite|collapse|fog|vision)\b/i.test(text)) {
    return "The leak is entering before the enemy threat is spent or blocked, so a playable fight becomes a catchable death.";
  }
  return `The leak is that ${champion} keeps taking a loose next click after the visible map state changes, so pressure does not become a stable result.`;
}

function applyDeterministicVisibleReviewFallback(recording, fileName) {
  if (!requiresVisibleParagraphStandard(fileName, recording)) return;
  const champion = recording.champion || "Samira";
  const moments = standardRepairMoments(
    recording,
    Array.isArray(recording.clockAnchors) ? recording.clockAnchors : [],
    Array.isArray(recording.clockMoments) ? recording.clockMoments : [],
    champion
  );
  if (!moments.length) return;
  recording.clockMoments = dedupeClockAnchorsPreserveOrder([
    ...moments,
    ...(Array.isArray(recording.clockMoments) ? recording.clockMoments : [])
  ], 4);
  recording.clockAnchors = annotateClockAnchorsWithMoments(recording.clockAnchors, recording.clockMoments);
  const fallbackFeedback = deterministicFallbackFeedback(recording, champion);
  if (!/Mistake:\s*\S+[\s\S]*Fix:\s*\S+/i.test(recording.feedback || "")) {
    recording.feedback = fallbackFeedback;
  }
  const repairedDetail = teachingDetailFromMoments(recording, recording.clockMoments, champion);
  if (repairedDetail) {
    recording.gameDetail = stripRedundantLessonEcho(stripRepeatedConversionGlossary(repairedDetail));
  }
  const repairedEvidence = eventEvidenceFromMoments(recording.clockMoments, champion);
  if (repairedEvidence) {
    recording.eventEvidence = repairedEvidence;
    recording.evidence = repairedEvidence;
  }
  const primaryMoment = cleanClockAnchors(recording.clockMoments)[0];
  if (primaryMoment?.clock && primaryMoment.description) {
    recording.failureEvidence = repairUnverifiedVisibleNames(
      `At ${primaryMoment.clock}, ${clauseDescription(primaryMoment.description, champion)}; the failure is staying in pressure mode after the safe payout is no longer proven, which leaks time, safety, or objective pressure and gives the enemy another fight or defense window.`,
      champion
    );
  }
  if (!recording.goodThing) {
    recording.goodThing = `${champion} found at least one visible lane, fight, structure, or objective state to work from; keep the willingness to move with the map, but make the next click safer.`;
  }
  recording.pattern = recording.pattern || "The visible pattern is the next-click branch after a fight, wave, camp, structure, or defense state changes: free tower, safe blocker, wave then recall, or leave.";
  recording.diamondRule = recording.diamondRule || "After 15 minutes, every forward click needs a visible payout branch before the click happens.";
  recording.drill = recording.drill || specificDrillForRecording(recording);
  const usesComputedClock = [...cleanClockAnchors(recording.clockMoments), ...cleanClockAnchors(recording.clockAnchors)]
    .some((anchor) => /\bcurrent-match\b/i.test(anchor.description || ""));
  const fallbackLimit = usesComputedClock
    ? "The detailed AI or clock-reading pass failed, so this review uses computed game-clock labels from match/capture timing and conservative current-match frames."
    : "The detailed AI pass failed, so this review is a conservative timestamped fallback from verified visible frames.";
  if (!recording.whyTrust || /\b\d+\s*\/\s*\d+\s+Samira\b/i.test(recording.whyTrust)) {
    recording.whyTrust = usesComputedClock
      ? "This fallback review avoids invented champion names, guessed jungle camps, and unverified events; the clock labels come from the recorded match timeline when clock OCR failed."
      : "This fallback review uses verified game-clock frames from the recording instead of invented champion names, guessed jungle camps, or unverified events.";
  }
  const baseLimit = coachClean(String(recording.reviewLimit || "")
    .replace(/The detailed AI(?: or clock-reading)? pass failed, so this review (?:uses computed game-clock labels from match\/capture timing and conservative current-match frames|is a conservative timestamped fallback from verified visible frames)\.\s*/gi, ""));
  recording.reviewLimit = coachClean(
    [baseLimit, fallbackLimit].filter(Boolean).join(" "),
    "Conservative timestamped fallback from verified visible frames."
  );
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

function uniqueTimestampCount(text) {
  return new Set(timestampSecondsInText(text).map((seconds) => Math.round(seconds))).size;
}

function matchingClockAnchorCount(text, anchors) {
  const anchorSeconds = cleanClockAnchors(anchors)
    .map((anchor) => clockSeconds(anchor.clock))
    .filter((seconds) => Number.isFinite(seconds));
  const textSeconds = [...new Set(timestampSecondsInText(text).map((seconds) => Math.round(seconds)))];
  return textSeconds.filter((seconds) => anchorSeconds.some((anchorSecond) => Math.abs(anchorSecond - seconds) <= 2.5)).length;
}

function hasMatchingPrimaryMistakeAnchor(recording) {
  const primarySeconds = [...new Set([
    ...primaryMistakeTimestampSeconds(recording.gameDetail, recording.eventEvidence || recording.evidence),
    ...keyClickRuleTimestampSeconds(recording.gameDetail)
  ].map((seconds) => Math.round(seconds)))];
  if (!primarySeconds.length) return false;
  const anchorSeconds = cleanClockAnchors(recording.clockAnchors)
    .map((anchor) => clockSeconds(anchor.clock))
    .filter((seconds) => Number.isFinite(seconds));
  return primarySeconds.some((seconds) => anchorSeconds.some((anchorSecond) => Math.abs(anchorSecond - seconds) <= 5));
}

function hasUsablePrimaryMistakeAnchor(recording, champion = "Samira") {
  const primarySeconds = [...new Set([
    ...primaryMistakeTimestampSeconds(recording.gameDetail, recording.eventEvidence || recording.evidence || recording.pattern),
    ...keyClickRuleTimestampSeconds(recording.gameDetail)
  ].map((seconds) => Math.round(seconds)))];
  if (!primarySeconds.length) return false;
  return cleanClockAnchors(recording.clockAnchors)
    .map((anchor) => ({
      seconds: clockSeconds(anchor.clock),
      description: normalizeEvidenceDescription(anchor.description || "", champion)
    }))
    .some((anchor) => (
      Number.isFinite(anchor.seconds) &&
      primarySeconds.some((seconds) => Math.abs(anchor.seconds - seconds) <= 5) &&
      anchor.description &&
      !anchorDescriptionLooksWeak(anchor.description)
    ));
}

function requiresVisibleParagraphStandard(fileName, recording = {}) {
  const isAuto = /^auto_/i.test(fileName || recording?.file || "");
  const duration = Number(recording?.durationSeconds || 0);
  const isNewStandard = recording?.analysisVersion === analysisVersion || !recording?.analysisVersion || manualFeedback(fileName || recording?.file);
  return isAuto && duration >= 90 && isNewStandard;
}

function visibleParagraphStandardIssues(recording = {}) {
  const detail = coachClean(recording.gameDetail, "");
  const eventEvidence = coachClean(recording.eventEvidence || recording.evidence, "");
  const allVisibleText = [recording.feedbackTitle, recording.feedback, detail, eventEvidence, recording.failureEvidence, recording.pattern, recording.goodThing, recording.secondaryFocus || recording.secondaryImprovement].filter(Boolean).join(" ");
  const issues = [];
  const needsTightReview = (recording.analysisVersion === analysisVersion || !recording.analysisVersion) &&
    (recording.analysisSource !== "manual" || recording.file === "auto_NA1-5566943774_01.mp4");
  const needsTeachingReason = recording.analysisSource !== "manual" || recording.file === "auto_NA1-5565387627_01.mp4";
  const needsSecondaryFocus = recording.analysisVersion === analysisVersion || !recording.analysisVersion;
  const needsActionScript = recording.analysisVersion === analysisVersion || !recording.analysisVersion;
  const needsEvidenceLanes = recording.analysisVersion === analysisVersion || !recording.analysisVersion;
  const failureEvidence = coachClean(recording.failureEvidence, "");
  const mistakeTypes = Array.isArray(recording.mistakeTypes) ? recording.mistakeTypes.filter(Boolean) : [];
  const hasStats = Number.isFinite(Number(recording.kills)) &&
    Number.isFinite(Number(recording.deaths)) &&
    Number.isFinite(Number(recording.assists)) &&
    Number.isFinite(Number(recording.cs));
  if (detail.length < 240) {
    issues.push("visible paragraph is too short");
  }
  if (needsTightReview && detail.length > 850) {
    issues.push("visible paragraph is too long for the tight review standard");
  }
  const firstDetailSecond = timestampSecondsInText(detail)[0];
  const hasNonOpeningVisibleAnchor = [
    ...(Array.isArray(recording.clockMoments) ? recording.clockMoments : []),
    ...(Array.isArray(recording.clockAnchors) ? recording.clockAnchors : [])
  ].some((anchor) => Number(clockSeconds(anchor.clock)) >= 180 && anchor.description && !anchorDescriptionLooksWeak(anchor.description));
  if (needsTightReview && hasNonOpeningVisibleAnchor && Number.isFinite(firstDetailSecond) && firstDetailSecond < 120) {
    issues.push("key timestamp should use the decision window, not an opening-game frame");
  }
  const firstSentence = sentenceParts(detail)[0] || "";
  if (needsTightReview && firstSentence && !hasKeyTimestampClickRule(firstSentence)) {
    issues.push("visible paragraph must start with the key timestamp click rule");
  }
  const primaryReviewSeconds = [
    ...primaryMistakeTimestampSeconds(detail, eventEvidence),
    ...keyClickRuleTimestampSeconds(detail)
  ];
  if (!primaryReviewSeconds.length) {
    issues.push("primary mistake window must have a game-clock timestamp");
  }
  if (!/\b(leak|cost|punish|punished|shutdown|tempo|missed|risk|risky|death|died|gave|lost|blocked|blocker|mistake|danger|punishment|consequence|window|delay|stall|throw)\b/i.test(detail)) {
    issues.push("visible paragraph must name the leak or consequence");
  }
  if (!/\b(instead|because|so|which|then|after|before|when)\b/i.test(detail)) {
    issues.push("visible paragraph must explain the decision chain");
  }
  if (needsTeachingReason && !/\b(because|so that|this matters because|the reason|which makes|which means|which proves|meaning|means|so\s+(?:the|a|every|your|you))\b/i.test(detail)) {
    issues.push("visible paragraph must explain why the advice is correct");
  }
  if (needsTeachingReason && /\b(sync(?:ed|ing)?|grouped mid|group mid|mid pressure)\b/i.test(detail) && !/\b(mean|means|meaning|because|so that|the reason|this matters because)\b/i.test(detail)) {
    issues.push("visible paragraph must define coaching shorthand in plain terms");
  }
  if (needsActionScript && !hasTimestampedActionScript(detail)) {
    issues.push("visible paragraph must include a timestamped replacement action script");
  }
  if (needsActionScript && !hasKeyTimestampClickRule(detail)) {
    issues.push("visible paragraph must include one natural key timestamp with visible state and the exact next click");
  }
  if (needsActionScript && /\b(?:mistake category|correct next click)\s*:/i.test(detail)) {
    issues.push("visible paragraph uses labels instead of a natural key timestamp click rule");
  }
  if (needsTightReview && repeatedPayoutChecklistCount(allVisibleText) > 1) {
    issues.push("visible paragraph repeats the payout checklist instead of saying it once");
  }
  if (needsActionScript && !/^Rep\s*:/i.test(coachClean(recording.secondaryFocus || recording.drill || ""))) {
    issues.push("pink next-game instruction must be one Rep sentence");
  }
  if (needsActionScript && /\bcurrent-match\b|\breview frame\b|\bbranch before any forward click\b/i.test(allVisibleText)) {
    issues.push("visible paragraph uses generic review-frame or broad branch wording");
  }
  if (needsActionScript && /\b(?:map cash[-\s]?outs?|cash(?:ing)? (?:those )?(?:wins|moments|it)? ?out(?:s)? cleaner|cash[-\s]?out timing|cleaner map|wrong task after the map state changes|call free structure, blocked structure, or reset)\b/i.test(allVisibleText)) {
    issues.push("visible paragraph uses abstract cash-out wording instead of exact branch rules");
  }
  if (needsActionScript && recording.analysisSource !== "manual" && /\b(tower|turret|structure|wave|inhib|inhibitor|nexus|payout|pressure)\b/i.test(allVisibleText) && !/\b(?:free tower|tower is free|hit tower|body blocks|blocker|push or clear|clear the wave|wave then recall|leave if none|closest threatened turret|who can stand in front)\b/i.test(allVisibleText)) {
    issues.push("visible paragraph must separate concrete branch options");
  }
  if (needsActionScript && recording.analysisSource !== "manual" && hasStats && !/\b\d+\s*\/\s*\d+\s*\/\s*\d+\b[\s\S]{0,120}\bCS\b|\bCS\b[\s\S]{0,120}\b\d+\s*\/\s*\d+\s*\/\s*\d+\b/i.test(allVisibleText)) {
    issues.push("visible paragraph must include K/D/A and CS context when client stats exist");
  }
  const unverifiedNames = unverifiedChampionNames(allVisibleText, [recording.champion || "Samira"]);
  if (needsActionScript && unverifiedNames.length) {
    issues.push(`visible review names unverified champion(s): ${unverifiedNames.join(", ")}; use ally/enemy/team unless roster evidence is verified`);
  }
  if (needsActionScript && hasExactJungleBuffName(allVisibleText)) {
    issues.push("visible review names an exact jungle buff without verified camp evidence; use jungle camp unless the camp label is verified");
  }
  if (recording.analysisSource !== "manual" && /\b(shop interface|shop open|item shop|stealth ward selected|standing at (the )?fountain|leaving (?:base|fountain)|near base fountain|running from fountain|fountain at game start|game start)\b/i.test([detail, eventEvidence].join(" "))) {
    issues.push("uses non-evidence shop/fountain/game-start timestamp as proof");
  }
  if (needsTeachingReason && /\b(grouped mid|group mid|mid pressure)\b/i.test(detail) && !/\b(mid[^.]*because|because[^.]*mid|mid[^.]*shortest|mid[^.]*team|mid[^.]*allies|mid[^.]*base|mid[^.]*tower|mid[^.]*fog|mid[^.]*collapse)\b/i.test(detail)) {
    issues.push("visible paragraph must explain why mid/grouping is better in this state");
  }
  if (hasRedundantLessonEcho(recording)) {
    issues.push("visible paragraph repeats the Mistake/Fix feedback instead of adding new evidence");
  }
  if (eventEvidence.length < 60) {
    issues.push("eventEvidence must name visible proof");
  }
  if (needsEvidenceLanes) {
    if (failureEvidence.length < 80) {
      issues.push("failureEvidence must explain what visibly failed and what it cost");
    }
    if (mistakeTypes.length < 3) {
      issues.push("mistakeTypes must name at least three distinct mistake lanes");
    }
  }
  const unverifiedClockCount = (allVisibleText.match(/\b\d{1,2}:[0-5]\d\b/g) || [])
    .filter((clock) => !anchorMatchesClock(clock, recording.clockAnchors, 5)).length;
  if (unverifiedClockCount) {
    issues.push("visible paragraph must not use unverified game-clock timestamps");
  }
  if (!hasUsablePrimaryMistakeAnchor(recording, recording.champion || "Samira")) {
    issues.push("primary mistake timestamp must have a matching verified clock anchor");
  }
  if (/\b(this leads|the consequence|the better play|the core lesson|the critical lesson|the simple lesson)\b/i.test(detail.slice(0, 80))) {
    issues.push("visible paragraph starts with a conclusion instead of evidence");
  }
  if (!detailStartsWithEvidence(detail)) {
    issues.push("visible paragraph starts with a broken fragment instead of evidence");
  }
  if (needsSecondaryFocus) {
    issues.push(...secondaryFocusStandardIssues(recording));
  }
  if (needsTightReview && !repMatchesGameCategory(recording)) {
    issues.push("pink Rep must match the game-specific mistake type");
  }
  return issues;
}

function secondaryFocusStandardIssues(recording = {}) {
  const issues = [];
  const secondaryFocus = coachClean(recording.secondaryFocus || recording.secondaryImprovement || "");
  if (!secondaryFocus) {
    issues.push("secondaryFocus must name a second improvement area");
    return issues;
  }
  if (secondaryFocus.length < 70) {
    issues.push("secondaryFocus is too thin");
  }
  if (secondaryFocus.length > 380) {
    issues.push("secondaryFocus is too long");
  }
  if (/\bAlan\b/.test(secondaryFocus)) {
    issues.push("secondaryFocus refers to Alan in third person");
  }
  if (!/\b(second|also|another|extra|mechanic|mechanics|camera|spacing|position|target|path|wave|vision|fog|click|cursor|kite|entry|cooldown|hp|health|trade|lane|map|objective|reset|recall|timing|pattern)\b/i.test(secondaryFocus)) {
    issues.push("secondaryFocus must name a distinct improvement lane");
  }
  if (!/\b(next|rep|drill|work|practice|hold|keep|stop|watch|check|click|space|kite|reset|path|use|wait|leave|enter)\b/i.test(secondaryFocus)) {
    issues.push("secondaryFocus must include an easy next-game action");
  }
  if (/\b(frame[-\s]?perfect|animation cancel|exact combo|reaction time|orbwalk)\b/i.test(secondaryFocus) && Number(recording.captureFps || 1) < 10) {
    issues.push("secondaryFocus overclaims micro-mechanics from low-FPS capture");
  }
  return issues;
}

function timestampedActionScriptSentences(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .match(/[^.!?]+[.!?]+(?:["')\]]+)?|[^.!?]+$/g)?.filter((sentence) => (
      /\b(?:At|Around|By)\s+\d{1,2}:[0-5]\d\b/i.test(sentence) &&
      /\b(?:next\s+(?:click|move|job|decision|check)|job\s+is|is\s+to|should|do|walk|path|move|stand|hold|wait|recall|reset|base|leave|back|kite|hit|clear|catch|push|defend|hover|group|stop|stay|enter|save|let|keep)\b/i.test(sentence)
    )) || [];
}

function hasTimestampedActionScript(text) {
  return timestampedActionScriptSentences(text).some((sentence) => (
    /\b(?:instead|rather than|not|never|should|job\s+is|is\s+to|next\s+(?:click|move|job|decision|check)|do|walk|stand|hold|wait|recall|reset|leave|back|kite|hit|clear|catch|push|defend|stop|stay|save|let|keep)\b/i.test(sentence)
  ));
}

function repeatedPayoutChecklistCount(text) {
  const source = String(text || "").toLowerCase();
  const matches = source.match(/\b(?:no\s+)?(?:tower|turret)\s*,\s*(?:safe\s+)?wave\s*,\s*(?:dragon\s+or\s+baron|objective)\s*(?:setup)?\s*,?\s*(?:and|or)\s*(?:no\s+clear\s+)?ally[-\s]?front\b|\btower\/wave\/objective\/ally[-\s]?front\b|\btower,\s*wave,\s*objective,\s*or\s*ally[-\s]?front\b/g) || [];
  return matches.length;
}

function hasKeyTimestampClickRule(text) {
  return sentenceParts(text).some((sentence) => (
    /\b(?:At|Around|By)\s+\d{1,2}:[0-5]\d\b/i.test(sentence) &&
    (
      (/\bmistake category\s*:/i.test(sentence) && /\bcorrect next click\s*:/i.test(sentence)) ||
      /\bso\s+(?:the\s+)?next\s+click\s+is\b|\bthe\s+next\s+click\s+is\b|\bclick\s+(?:back|out|away|toward|only)\b/i.test(sentence)
    ) &&
    /\b(tower|turret|structure|wave|objective|dragon|baron|ally front|ally-front|front|payout|visible|screen|enemy|enemies|collapse|safe|free)\b/i.test(sentence) &&
    /\b(hit|clear|recall|leave|hold|wait|walk|drop|stop|defend|reset|enter|click|kite|back)\b/i.test(sentence)
  ));
}

function keyClickRuleTimestampSeconds(text) {
  return sentenceParts(text)
    .filter((sentence) => hasKeyTimestampClickRule(sentence))
    .flatMap(timestampSecondsInText);
}

function enforceVisibleParagraphStandard(recording, fileName) {
  if (!requiresVisibleParagraphStandard(fileName, recording)) return;
  const issues = visibleParagraphStandardIssues(recording);
  if (issues.length) {
    throw new Error(`${fileName} failed visible feedback standard: ${issues.join("; ")}`);
  }
}

function scoreRankBand(score) {
  const bands = [
    { min: 98, label: "Challenger", range: "Grandmaster-Challenger", percentile: "elite ladder" },
    { min: 95, label: "Grandmaster", range: "Master-Grandmaster", percentile: "top 0.1%" },
    { min: 91, label: "Master", range: "Diamond I-Master", percentile: "top 1%" },
    { min: 85, label: "Diamond", range: "Emerald I-Diamond III", percentile: "top 4%" },
    { min: 77, label: "Emerald", range: "Platinum I-Emerald II", percentile: "top 10%" },
    { min: 68, label: "Platinum", range: "Gold I-Platinum II", percentile: "top 22%" },
    { min: 56, label: "Gold", range: "Silver I-Gold II", percentile: "upper middle" },
    { min: 40, label: "Silver", range: "Bronze I-Silver II", percentile: "middle" },
    { min: 24, label: "Bronze", range: "Iron I-Bronze II", percentile: "developing" },
    { min: 0, label: "Iron", range: "Iron IV-Iron II", percentile: "new ranked fundamentals" }
  ];
  return bands.find((band) => score >= band.min) || bands.at(-1);
}

const exactRankScale = [
  "Iron IV", "Iron III", "Iron II", "Iron I",
  "Bronze IV", "Bronze III", "Bronze II", "Bronze I",
  "Silver IV", "Silver III", "Silver II", "Silver I",
  "Gold IV", "Gold III", "Gold II", "Gold I",
  "Platinum IV", "Platinum III", "Platinum II", "Platinum I",
  "Emerald IV", "Emerald III", "Emerald II", "Emerald I",
  "Diamond IV", "Diamond III", "Diamond II", "Diamond I",
  "Master", "Grandmaster", "Challenger"
];

const exactRankBands = [
  { tier: "Challenger", min: 98, value: 30 },
  { tier: "Grandmaster", min: 95, value: 29 },
  { tier: "Master", min: 91, value: 28 },
  { tier: "Diamond", min: 85, cuts: [85, 87, 89, 90] },
  { tier: "Emerald", min: 77, cuts: [77, 79, 81, 83] },
  { tier: "Platinum", min: 68, cuts: [68, 70, 72, 75] },
  { tier: "Gold", min: 56, cuts: [56, 59, 61, 65] },
  { tier: "Silver", min: 40, cuts: [40, 44, 48, 52] },
  { tier: "Bronze", min: 24, cuts: [24, 28, 32, 36] },
  { tier: "Iron", min: 0, cuts: [0, 6, 12, 18] }
];

function exactRankForScore(score) {
  const safeScore = Math.max(0, Math.min(100, Math.round(Number(score) || 0)));
  for (const band of exactRankBands) {
    if (safeScore < band.min) continue;
    if (Number.isFinite(band.value)) {
      const name = exactRankScale[band.value] || band.tier;
      return { name, value: band.value };
    }
    const divisions = ["IV", "III", "II", "I"];
    let divisionIndex = 0;
    for (let index = band.cuts.length - 1; index >= 0; index -= 1) {
      if (safeScore >= band.cuts[index]) {
        divisionIndex = index;
        break;
      }
    }
    const name = `${band.tier} ${divisions[divisionIndex]}`;
    const value = exactRankScale.indexOf(name);
    return { name, value: value >= 0 ? value : 0 };
  }
  return { name: "Iron IV", value: 0 };
}

const rankCalibrationResearch = [
  {
    id: "riot-ranked-tiers-2026",
    title: "Riot ranked tiers, divisions, and queue restrictions",
    url: "https://support-leagueoflegends.riotgames.com/hc/en-us/articles/4406004330643-Ranked-Tiers-Divisions-and-Queues",
    use: "official current tier ladder, solo/duo queue meaning, and rank-neighbor restrictions"
  },
  {
    id: "riot-apex-tiers-2026",
    title: "Riot Master, Grandmaster, and Challenger apex tier rules",
    url: "https://support-leagueoflegends.riotgames.com/hc/en-us/articles/4405776545427-Master-Grandmaster-and-Challenger-The-Apex-Tiers",
    use: "apex tiers are below one percent, single-division, decay-sensitive, and require daily ranked pressure"
  },
  {
    id: "bennett-poulus-novak-2025",
    title: "The Practice Behaviors of Expert League of Legends Players",
    url: "https://opus.lib.uts.edu.au/handle/10453/189269",
    use: "high-skill players show more frequent and consistent ranked practice across recent match windows"
  },
  {
    id: "srl-league-2021",
    title: "Because I'm Bad at the Game: self-regulated learning in League of Legends",
    url: "https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2021.780234/full",
    use: "CS, gold, kill counts, and post-game statistics support self-monitoring and review"
  },
  {
    id: "kpi-objective-vision-2025",
    title: "League of Legends KPI, map navigation, and vision-control study",
    url: "https://doaj.org/article/dc43dcec52764f6fbd06ce940fd9ae72",
    use: "higher-skill play is associated with objective proximity, map movement, and vision-control behavior"
  }
];

function isFullReviewRecording(recording = {}) {
  return recording.kind === "full review" || Number(recording.durationSeconds || 0) > 90;
}

function rankQueueClass(recording = {}) {
  const queueId = Number(recording.queueId);
  const queueText = clean(`${recording.gameType || ""} ${recording.kind || ""}`).toLowerCase();
  if (queueId === 420 || /ranked solo/.test(queueText)) return "ranked_solo";
  if (queueId === 440 || /ranked flex/.test(queueText)) return "ranked_flex";
  if ([400, 430, 480, 490].includes(queueId) || /\b(draft|blind|quickplay|swiftplay|normal)\b/i.test(queueText)) return "pvp";
  if ([830, 840, 850, 870, 880, 890].includes(queueId) || /\b(co-?op|ai|beginner|intro|intermediate|bot)\b/i.test(queueText)) return "bot";
  return "unknown";
}

function rankCalibrationContext(recordings = []) {
  const full = recordings.filter(isFullReviewRecording);
  const queueCounts = {};
  const labels = {};
  for (const recording of full) {
    const queueClass = rankQueueClass(recording);
    queueCounts[queueClass] = (queueCounts[queueClass] || 0) + 1;
    const label = clean(recording.rankEstimate?.label);
    if (label) labels[label] = (labels[label] || 0) + 1;
  }
  const rankedFullGames = full.filter((recording) => /^ranked/.test(rankQueueClass(recording))).length;
  const pvpFullGames = full.filter((recording) => ["ranked_solo", "ranked_flex", "pvp"].includes(rankQueueClass(recording))).length;
  const anchoredFullGames = full.filter((recording) => Array.isArray(recording.clockAnchors) && recording.clockAnchors.length > 0).length;
  const statFullGames = full.filter((recording) => (
    Number.isFinite(Number(recording.kills)) &&
    Number.isFinite(Number(recording.deaths)) &&
    Number.isFinite(Number(recording.assists)) &&
    Number.isFinite(Number(recording.cs)) &&
    Number.isFinite(Number(recording.gameLengthSeconds))
  )).length;
  return {
    version: rankEstimateVersion,
    fullReviewGames: full.length,
    queueCounts,
    rankedFullGames,
    pvpFullGames,
    botFullGames: queueCounts.bot || 0,
    anchoredFullGames,
    statFullGames,
    rankLabelCounts: labels,
    highConfidenceRequirements: {
      rankedFullGames: 3,
      pvpFullGames: 5,
      perGame: [
        "full game or near-full macro recording",
        "K/D/A, CS, and game length from the League client",
        "visible timestamped main mistake window",
        "PvP or ranked opponent pressure, not only Co-op vs AI"
      ]
    },
    currentLimitation: full.length > 0 && pvpFullGames === 0
      ? "No current full review has PvP or ranked opponent pressure, so the system can be confident about repeated review evidence but cannot honestly make a high-confidence ranked-MMR claim yet."
      : ""
  };
}

function rankCalibrationSummary(recordings = []) {
  const context = rankCalibrationContext(recordings);
  const highConfidenceReady = context.rankedFullGames >= context.highConfidenceRequirements.rankedFullGames ||
    context.pvpFullGames >= context.highConfidenceRequirements.pvpFullGames;
  return {
    version: rankEstimateVersion,
    method: "forensic performance-grade estimate with CS/min, death timing, entry legality, exit quality, conversion, queue, timestamp, and cross-game confidence gates",
    highConfidenceReady,
    currentLimitation: context.currentLimitation,
    fullReviewGames: context.fullReviewGames,
    queueCounts: context.queueCounts,
    rankedFullGames: context.rankedFullGames,
    pvpFullGames: context.pvpFullGames,
    botFullGames: context.botFullGames,
    anchoredFullGames: context.anchoredFullGames,
    statFullGames: context.statFullGames,
    rankLabelCounts: context.rankLabelCounts,
    exactRankScale,
    highConfidenceRequirements: context.highConfidenceRequirements,
    researchBasis: rankCalibrationResearch
  };
}

function rankTextFlags(recording) {
  const text = [
    recording.feedbackTitle,
    recording.feedback,
    recording.gameDetail,
    recording.eventEvidence || recording.evidence,
    recording.pattern,
    recording.diamondRule,
    ...(Array.isArray(recording.nuance) ? recording.nuance : [])
  ].filter(Boolean).join(" ").toLowerCase();
  return {
    text,
    lethalHp: /\b(lethal hp|low[-\s]?hp|low health|one hit|one enemy auto|one spell|death timer)\b/i.test(text),
    overstayReset: /\b(overstay|overstayed|stayed|lingering|missed reset|missed recall|reset window|recall window|refight|re-fight|re-enter|reentry|re-entry)\b/i.test(text),
    conversion: /\b(missed structure|structure conversion|conversion gap|free structure|open (?:inhibitor|tower|base|nexus)|hit (?:the )?(?:tower|structure|inhibitor|nexus)|objective conversion)\b/i.test(text),
    chaseDrift: /\b(chase|chasing|side chase|side jungle|side[-\s]?lane|drift|fog|away from (?:structure|tower|base)|solo bot|alone)\b/i.test(text),
    shutdownGold: /\b(shutdown|unspent gold|big gold|spend|spent|shop|item tempo)\b/i.test(text),
    syncedTeamplay: /\b(grouped|with allies|behind allies|sync|synced|team|body-block|body block)\b/i.test(text),
    positiveConversion: /\b(good|correctly|converted|created real|base pressure|tower damage|structure pressure|ending pressure|did spend|did group|ended)\b/i.test(text),
    objectiveFight: /\b(dragon|baron|objective|pit)\b/i.test(text),
    legalEntry: /\b(legal entry|partly legal|mostly legal|not automatically wrong|allies? (?:are )?(?:already )?(?:engaged|committed)|enemies? (?:are )?(?:already )?committed|ally front|allied body|front body)\b/i.test(text),
    illegalEntry: /\b(illegal entry|illegal re-entry|wrong click|dash\/chase|forward dash|no ally(?: is)? in front|wave\/front\/body no longer protects|wave is already thin|catchable)\b/i.test(text),
    stateFlipExit: /\b(state flip|state flips|first value window|after the first value|after first value|second fight|second forward fight|re-enter|re-entry|reenter|exit check|setup expires|setup is gone)\b/i.test(text)
  };
}

function rankedEquivalentForRecording(recording = {}, calibrationContext = null) {
  const duration = Number(recording.durationSeconds || 0);
  if (!isFullReviewRecording(recording)) return null;

  const flags = rankTextFlags(recording);
  const reviewCategory = reviewRepCategory(recording);
  const queueClass = rankQueueClass(recording);
  const beginnerBot = queueClass === "bot";
  const won = recording.outcome === "victory" || recording.outcomeLabel === "VICTORY" || recording.win === true;
  const deaths = Number(recording.deaths);
  const kills = Number(recording.kills);
  const assists = Number(recording.assists);
  const cs = Number(recording.cs);
  const gameLengthSeconds = Number(recording.gameLengthSeconds);
  const csPerMinute = Number.isFinite(cs) && Number.isFinite(gameLengthSeconds) && gameLengthSeconds > 0
    ? cs / (gameLengthSeconds / 60)
    : null;
  const kda = Number.isFinite(kills) || Number.isFinite(assists) || Number.isFinite(deaths)
    ? (Math.max(0, kills || 0) + Math.max(0, assists || 0)) / Math.max(1, deaths || 0)
    : null;
  const context = calibrationContext || rankCalibrationContext([recording]);
  const hasClientStats = [kills, deaths, assists, cs, gameLengthSeconds].every(Number.isFinite);
  const hasClockAnchor = Array.isArray(recording.clockAnchors) && recording.clockAnchors.length > 0;
  const currentReviewStandard = recording.analysisVersion === analysisVersion || recording.analysisSource === "manual";
  const nearFullGame = duration >= 540 || (Number.isFinite(gameLengthSeconds) && gameLengthSeconds > 0 && duration / gameLengthSeconds >= 0.55);

  let score = 50;
  let confidenceScore = 0;
  const strengths = [];
  const leaks = [];
  const confidenceSignals = [];
  const confidenceBlockers = [];

  if (nearFullGame) {
    confidenceScore += 14;
    confidenceSignals.push("near-full macro recording");
  } else {
    confidenceBlockers.push("recording is not long enough to prove full-game macro");
  }
  if (hasClientStats) {
    confidenceScore += 20;
    confidenceSignals.push("K/D/A, CS, and game length are available");
  } else {
    confidenceBlockers.push("missing one or more client stats: K/D/A, CS, game length");
  }
  if (hasClockAnchor) {
    confidenceScore += 16;
    confidenceSignals.push("visible timestamp anchors exist");
  } else {
    confidenceBlockers.push("no verified visible timestamp anchor");
  }
  if (currentReviewStandard) {
    confidenceScore += 10;
    confidenceSignals.push("review passed the current evidence standard or manual frame review");
  }
  if (queueClass === "ranked_solo" || queueClass === "ranked_flex") {
    confidenceScore += 26;
    confidenceSignals.push("ranked opponent pressure");
  } else if (queueClass === "pvp") {
    confidenceScore += 18;
    confidenceSignals.push("PvP opponent pressure");
  } else if (queueClass === "bot") {
    confidenceBlockers.push("Co-op vs AI inflates fight success and cannot prove ranked opponent pressure");
  } else {
    confidenceBlockers.push("queue type is unknown");
  }
  if (context.rankedFullGames >= context.highConfidenceRequirements.rankedFullGames) {
    confidenceScore += 12;
    confidenceSignals.push("enough ranked full-game samples for calibration");
  } else if (context.pvpFullGames >= context.highConfidenceRequirements.pvpFullGames) {
    confidenceScore += 8;
    confidenceSignals.push("enough PvP full-game samples for calibration");
  } else {
    confidenceBlockers.push(`needs ${context.highConfidenceRequirements.rankedFullGames} ranked full games or ${context.highConfidenceRequirements.pvpFullGames} PvP full games for high confidence`);
  }

  if (Number.isFinite(deaths)) {
    if (deaths >= 10) {
      score -= 22;
      leaks.push("very high avoidable-death pressure");
    } else if (deaths >= 9) {
      score -= 17;
      leaks.push("nine deaths creating death-timer CS loss");
    } else if (deaths >= 7) {
      score -= 13;
      leaks.push("too many punishable deaths");
    } else if (deaths >= 5) {
      score -= 8;
      leaks.push("avoidable deaths still show up");
    } else if (deaths <= 3) {
      score += 7;
      strengths.push("death count stayed controlled");
    }
  }
  if (Number.isFinite(kills) && kills >= 18) {
    score += 5;
    strengths.push("fight conversion and damage output are clearly above beginner mechanics");
  } else if (Number.isFinite(kills) &&
      Number.isFinite(csPerMinute) &&
      Number.isFinite(deaths) &&
      kills >= 10 &&
      csPerMinute >= 5.5 &&
      deaths <= 7 &&
      ["ranked_solo", "ranked_flex", "pvp"].includes(queueClass)) {
    score += 7;
    strengths.push("real ranked fight impact with playable farm pace");
  } else if (Number.isFinite(kills) &&
      Number.isFinite(csPerMinute) &&
      Number.isFinite(deaths) &&
      kills >= 14 &&
      csPerMinute >= 6 &&
      deaths <= 8) {
    score += 5;
    strengths.push("fight impact and farm pace are both visible");
  } else if (Number.isFinite(kills) && kills <= 5 && reviewCategory !== "objectiveFight") {
    score -= 4;
    leaks.push("kill pressure is not yet consistent");
  }
  if (Number.isFinite(kills) && Number.isFinite(deaths) && kills <= 1 && deaths >= 5) {
    score -= 6;
    leaks.push("low fight impact paired with death pressure");
  }
  if (Number.isFinite(kda)) {
    if (kda >= 5) score += 5;
    else if (kda < 1.8) score -= 6;
  }
  if (Number.isFinite(csPerMinute)) {
    if (csPerMinute >= 6.5) {
      score += 6;
      strengths.push("farm pace is a real strength");
    } else if (csPerMinute >= 5.2) {
      score += 2;
    } else if (csPerMinute < 4) {
      score -= 8;
      leaks.push("farm pace is too low for reliable ranked climbing");
    } else if (csPerMinute < 5) {
      score -= 5;
      leaks.push("ADC CS/min is below stable ranked pace");
    }
  }
  if (flags.lethalHp) {
    score -= 8;
    leaks.push("lethal-health stays");
  }
  if (flags.overstayReset) {
    score -= 11;
    leaks.push("reset discipline after wins");
  }
  if (flags.conversion) {
    score -= 8;
    leaks.push("missed structure/objective conversion");
  }
  if (flags.chaseDrift) {
    score -= 7;
    leaks.push("side chase or fog drift");
  }
  if (flags.shutdownGold) {
    score -= 4;
    leaks.push("shutdown or unspent-gold protection");
  }
  if (flags.objectiveFight && reviewCategory === "objectiveFight") {
    score += flags.legalEntry ? 8 : 4;
    strengths.push(flags.legalEntry ? "objective entry is at least partly legal" : "objective fight presence exists");
  }
  if (flags.illegalEntry && reviewCategory !== "objectiveFight") {
    score -= 6;
    leaks.push("illegal or catchable entry shape");
  }
  if (flags.stateFlipExit) {
    score -= reviewCategory === "objectiveFight" ? 8 : 5;
    leaks.push("exit or re-entry after value is unstable");
  }
  if (reviewCategory === "sideFarmDefense" &&
      Number.isFinite(deaths) &&
      deaths <= 4 &&
      Number.isFinite(csPerMinute) &&
      csPerMinute >= 5.2 &&
      flags.stateFlipExit) {
    score += 9;
    strengths.push("calmer farming and survival baseline");
  }
  if (won &&
      ["ranked_solo", "ranked_flex", "pvp"].includes(queueClass) &&
      (reviewCategory === "cleanerWinExit" || /\bcleaner win\b/i.test(analysisCoachText(recording))) &&
      Number.isFinite(deaths) &&
      deaths <= 3 &&
      Number.isFinite(csPerMinute) &&
      csPerMinute >= 5.2 &&
      Number.isFinite(kills) &&
      Number.isFinite(assists) &&
      kills + assists >= 12) {
    score = Math.max(score, 40);
    strengths.push("controlled win baseline with playable fight impact");
  }
  if (Number.isFinite(kills) &&
      Number.isFinite(deaths) &&
      Number.isFinite(csPerMinute) &&
      kills >= 12 &&
      deaths >= 10 &&
      csPerMinute >= 6.5) {
    score = Math.max(score, 18);
    strengths.push("high CS and fight impact keep this above the lowest Iron floor");
  }
  if (Number.isFinite(kills) &&
      Number.isFinite(deaths) &&
      Number.isFinite(csPerMinute) &&
      kills >= 20 &&
      deaths <= 8 &&
      csPerMinute >= 3.9) {
    score = Math.max(score, 24);
    strengths.push("high fight impact prevents the loss from grading as pure Iron mechanics");
  }
  if (flags.syncedTeamplay) {
    score += 5;
    strengths.push("team grouping or sync appears in the review");
  }
  if (flags.positiveConversion) {
    score += 5;
    strengths.push("you are already finding fights, waves, towers, or base pressure");
  }

  let cap = beginnerBot ? 43 : (queueClass === "unknown" ? 55 : 100);
  if (beginnerBot && !(Number.isFinite(csPerMinute) && csPerMinute >= 6.3 && Number.isFinite(deaths) && deaths <= 3 && Number.isFinite(kills) && kills >= 14)) {
    cap = Math.min(cap, 39);
  }
  if (Number.isFinite(deaths) && deaths >= 10) {
    cap = Math.min(cap, Number.isFinite(kills) && kills >= 18 && Number.isFinite(csPerMinute) && csPerMinute >= 5 ? 27 : 23);
  } else if (Number.isFinite(deaths) && deaths >= 8) {
    cap = Math.min(cap, Number.isFinite(kills) && kills >= 18 ? 31 : 27);
  }
  if (Number.isFinite(kills) && Number.isFinite(deaths) && kills <= 1 && deaths >= 5) {
    cap = Math.min(cap, Number.isFinite(csPerMinute) && csPerMinute >= 5.5 ? 27 : 23);
  }
  if (Number.isFinite(csPerMinute) &&
      csPerMinute < 4 &&
      Number.isFinite(deaths) &&
      deaths >= 5 &&
      !(Number.isFinite(kills) && kills >= 20 && deaths <= 8 && csPerMinute >= 3.9)) {
    cap = Math.min(cap, 23);
  }
  if (score >= 56 && (
      !Number.isFinite(csPerMinute) ||
      csPerMinute < 6 ||
      !Number.isFinite(deaths) ||
      deaths > 4 ||
      !(flags.positiveConversion || reviewCategory === "cleanerWinExit")
    )) {
    cap = Math.min(cap, 55);
  }
  const cappedScore = Math.max(0, Math.min(cap, Math.round(score)));
  const band = scoreRankBand(cappedScore);
  const exactRank = exactRankForScore(cappedScore);
  const rankedComparableQueue = ["ranked_solo", "ranked_flex", "pvp"].includes(queueClass);
  const rankedTransferConfidence = confidenceScore >= 78 && rankedComparableQueue && (context.rankedFullGames >= 3 || context.pvpFullGames >= 5)
    ? "high"
    : (confidenceScore >= 55 && rankedComparableQueue ? "medium" : "low");
  const evidenceConfidence = confidenceScore >= 52 && context.fullReviewGames >= 10 ? "high" : (confidenceScore >= 34 ? "medium" : "low");
  const reason = performanceRankReason(recording, {
    exactRank: exactRank.name,
    flags,
    reviewCategory,
    csPerMinute,
    kills,
    deaths,
    assists,
    strengths,
    leaks,
    rankedTransferConfidence,
    evidenceConfidence,
    queueClass,
    beginnerBot
  });
  return {
    version: rankEstimateVersion,
    label: band.label,
    range: band.range,
    exactRank: exactRank.name,
    exactRankValue: exactRank.value,
    score: cappedScore,
    confidence: rankedTransferConfidence,
    rankedTransferConfidence,
    evidenceConfidence,
    confidenceScore: Math.max(0, Math.min(100, Math.round(confidenceScore))),
    queueClass,
    basis: "research-calibrated rank-equivalent macro estimate from full-game review text, visible timestamps, K/D/A, CS, queue context, and cross-game calibration gates; not Riot MMR",
    percentile: band.percentile,
    confidenceSignals,
    confidenceBlockers: [...new Set(confidenceBlockers)],
    researchBasis: rankCalibrationResearch.map((item) => item.id),
    reason
  };
}

function performanceRankReason(recording = {}, context = {}) {
  const csPerMinute = Number(context.csPerMinute);
  const deaths = Number(context.deaths);
  const kills = Number(context.kills);
  const assists = Number(context.assists);
  const rank = clean(context.exactRank || recording.performanceRank?.exactRank || recording.rankEstimate?.exactRank || "this rank");
  const csText = Number.isFinite(csPerMinute)
    ? `${csPerMinute.toFixed(1)} CS/min`
    : (Number.isFinite(Number(recording.cs)) ? `${Math.round(Number(recording.cs))} CS` : "CS evidence is limited");
  const deathText = Number.isFinite(deaths)
    ? `${deaths} ${deaths === 1 ? "death" : "deaths"}`
    : "death evidence is limited";
  const category = context.reviewCategory || reviewRepCategory(recording);
  const flags = context.flags || rankTextFlags(recording);
  const kdaText = [kills, deaths, assists].every(Number.isFinite) ? `${kills}/${deaths}/${assists} K/D/A` : "the K/D/A line";
  if (Number.isFinite(kills) && Number.isFinite(deaths) && kills <= 1 && deaths >= 5) {
    return `${csText} is playable, but ${kdaText} with ${deathText} keeps the game at ${rank}; the main leak is fight-entry and exit value becoming another death timer instead of wave, recall, or group.`;
  }
  if (category === "objectiveFight") {
    const entryClause = flags.legalEntry
      ? "even though the dragon entry is partly legal"
      : "with objective-entry quality still not fully proven";
    const leakClause = flags.stateFlipExit
      ? "the main leak is exit/re-entry after first value"
      : "the main question is whether objective pressure becomes dragon, wave, recall, or group";
    return `${csText} and ${deathText} pull the game to ${rank} ${entryClause}; ${leakClause}.`;
  }
  if (category === "firstWinCashout") {
    return `${csText} with ${kdaText} and ${deathText} puts the game at ${rank}: fight entry and impact are real, but the main leak is exit/value after the first won fight, where cash-out should become tower, wave, recall, or group instead of another fight window.`;
  }
  if (category === "basePush") {
    const entryClause = flags.illegalEntry ? "because some forward clicks are still catchable" : "while base-entry quality is mixed";
    return `${csText} and ${deathText} put the game at ${rank} ${entryClause}; the main leak is whether base pressure becomes structure, blocker, wave, or exit.`;
  }
  if (category === "laneDeathExit") {
    return `${csText} and ${deathText} pull the game to ${rank} because the lane entry keeps continuing after support or wave protection expires; the main leak is first safe exit discipline.`;
  }
  if (category === "midRiverChase") {
    return `${csText} is usable, but ${kdaText}, ${deathText}, low fight impact, and the avoidable mid-wave-to-river exit leak keep the game at ${rank}.`;
  }
  if (category === "sideFarmDefense") {
    if (/\b(blue-side jungle|jungle fight|jungle value|jungle-exit)\b/i.test(analysisCoachText(recording))) {
      return `${csText} and only ${deathText} show calmer farming and survival than the death-heavy games, but ${kdaText} fight impact and the late jungle-fight exit/value leak keep the performance at ${rank}.`;
    }
    return `${csText} with ${kdaText} puts the game at ${rank}: the CS/death line is calmer, but the main leak is side-wave or jungle-fight exit into tower, wave, group, or reset.`;
  }
  if (category === "cleanerWinExit") {
    return `${kdaText} and only ${deathText} are positives, while ${csText} plus the remaining fight-entry or exit/value leak keep the performance at ${rank} rather than higher.`;
  }
  if (category === "deathExit" && Number.isFinite(kills) && kills >= 8 && Number.isFinite(deaths) && deaths >= 5) {
    return `${csText} with ${kdaText} puts the game at ${rank}: damage pressure exists, but ${deathText} and the exit/re-entry leak keep turning value into dead time instead of structure, wave, recall, or group.`;
  }
  const entryClause = flags.illegalEntry ? "because fight entry is still catchable" : "with mixed fight-entry evidence";
  const leakClause = flags.stateFlipExit
    ? "the main leak is exit/re-entry after first value"
    : (Number.isFinite(deaths) && deaths <= 3 ? "the remaining leak is cleaner conversion after pressure" : "the main leak is turning pressure into a safe exit or map result");
  return `${csText} and ${deathText} put the game at ${rank} ${entryClause}; ${leakClause}.`;
}

function performanceRankForRecording(recording = {}, rankEstimate = null) {
  const estimate = rankEstimate || recording.rankEstimate;
  if (!estimate?.exactRank) return null;
  return {
    version: performanceRankVersion,
    exactRank: estimate.exactRank,
    exactRankValue: estimate.exactRankValue,
    reason: performanceRankReason(recording, {
      exactRank: estimate.exactRank,
      flags: rankTextFlags(recording),
      reviewCategory: reviewRepCategory(recording),
      csPerMinute: Number.isFinite(Number(recording.cs)) && Number.isFinite(Number(recording.gameLengthSeconds)) && Number(recording.gameLengthSeconds) > 0
        ? Number(recording.cs) / (Number(recording.gameLengthSeconds) / 60)
        : null,
      kills: Number(recording.kills),
      deaths: Number(recording.deaths),
      assists: Number(recording.assists)
    })
  };
}

function cacheKeyFor(stat) {
  return `${stat.size}:${Math.round(stat.mtimeMs)}`;
}

function existingRecording(existing, fileName, cacheKey) {
  return existing?.recordings?.find((item) => (
    item.file === fileName &&
    item.cacheKey === cacheKey
  )) || null;
}

function cachedRecording(existing, fileName, cacheKey) {
  const cached = existingRecording(existing, fileName, cacheKey);
  if (!cached) return null;
  if (!compatibleAnalysisVersions.has(cached.analysisVersion)) return null;
  if (refreshedManualFeedbackFiles.has(fileName)) return null;
  if (needsCachedTextRepair(cached)) return cached;
  if (requiresVisibleParagraphStandard(fileName, cached) && visibleParagraphStandardIssues(cached).length) return null;
  if (cached.analysisSource === "fallback" && process.env.LEAGUE_RETRY_FALLBACK === "1" && process.env.OPENAI_API_KEY) return null;
  if (process.env.LEAGUE_FORCE_ANALYSIS === "1" || (forceAnalysisFile && fileName === forceAnalysisFile)) return null;
  return cached;
}

function manualFeedback(file) {
  if (file === "auto_NA1-5568447928_01.mp4") {
    return {
      champion: "Samira",
      confidence: "high",
      feedbackTitle: "Bot siege became a jungle chase",
      feedback: "The leak is that a winning bot siege keeps turning into one more chase off the tower line, so free structure tempo becomes low-value jungle fighting and another avoidable death window.",
      gameDetail: "At 9:58, you have bot wave under enemy tower with an ally beside you and the defender already backing off, so the wrong click is following the retreat path into red-side jungle and the next click is hit the free tower, clear the wave, or reset behind ally cover. By 10:34 you are low in enemy jungle instead of spending the bot-side value cleanly. The game still finishes as a 20/4/3, 117 CS win, but the four deaths and sub-6 CS/min leak still come from these extra chase windows after lane pressure already paid.",
      secondaryFocus: "Rep: after bot tower pressure gives value, ask tower, wave, or base before chase. If the target has already left tower range and no ally is front-lining the next screen, stop the chase and spend the wave or reset.",
      mistakeTypes: [
        "bot siege exit after value",
        "tower-to-jungle chase drift",
        "death-state exposure",
        "wave and structure conversion",
        "low-value pursuit after win"
      ],
      eventEvidence: "9:34 shows Samira winning the bot-side fight at tower; 9:58 shows the wave still at tower with an ally nearby; 10:10 shows the chase continuing away from the structure; 10:34 shows Samira low in red-side jungle instead of finishing the tower or cashing out.",
      failureEvidence: "At 9:58 the permanent value is still the bot tower and wave with ally cover, so chasing off that line into red-side jungle turns a winning siege into a thin, low-HP fight path that leaves Samira low by 10:34 instead of spending the lane win safely.",
      goodThing: "You do create the winning bot-side state first: the 9:34 fight is aggressive in a way that earns tower pressure, and the later game shows cleaner grouped mid pressure off your lead; keep that first-win confidence.",
      whyTrust: "This uses inspected 9:34, 9:58, 10:10, 10:34, and 18:58 frames plus the League Client 20/4/3, 117 CS ranked context.",
      focusTag: "bot siege exit",
      evidence: "Manual frame inspection of the bot-tower siege, chase continuation, and later ranked-stat context from the same match.",
      pattern: "This is a better game than the recent losses because the first engage wins real map space, but the remaining leak is still spending that pressure on a chase after tower value is already available.",
      diamondRule: "When bot pressure reaches tower with wave and ally cover, Samira spends that state on structure, wave, or reset first; chasing into jungle is illegal unless an ally still fronts the next screen and the target is already trapped.",
      drill: "after bot siege wins space, say tower, wave, or base before you click at the runner. If the runner is outside tower line and no ally is front, drop it.",
      timeline: [
        "9:34 - Samira wins the bot-side fight near enemy tower.",
        "9:58 - Samira has bot wave at tower with ally cover and the defender backing off.",
        "10:10 - Samira keeps moving past the tower line toward red-side jungle.",
        "10:34 - Samira is low in enemy jungle after the extra chase.",
        "18:58 - Scoreboard context shows Samira at 20/4/3 with 117 CS in the winning game."
      ],
      clockAnchors: [
        { clock: "9:34", videoSeconds: 570, description: "Samira wins the bot-side fight near enemy tower." },
        { clock: "9:58", videoSeconds: 594, description: "Samira has bot wave at tower with ally cover and the defender backing off." },
        { clock: "10:10", videoSeconds: 606, description: "Samira keeps moving past the tower line toward red-side jungle." },
        { clock: "10:34", videoSeconds: 630, description: "Samira is low in enemy jungle after the extra chase." },
        { clock: "18:58", videoSeconds: 1170, description: "Scoreboard context shows Samira at 20/4/3 with 117 CS in the winning game." }
      ],
      nuance: [
        "The opening bot-side fight is good enough to earn real tower pressure.",
        "The leak starts only after the structure line is won and the click keeps following the retreat path.",
        "Because the game is already winning, the remaining coaching point should stay narrow: spend siege value before chasing.",
        "The 20/4/3 line shows real carry pressure; the remaining rank cleaner is cutting the four extra death windows and turning them into farm or resets."
      ],
      reviewLimit: "Manual 2 FPS frame review cannot prove exact cooldowns, unseen flank positions, or every hidden enemy, but it verifies the bot-tower fight win, the 9:58 tower-value state, the chase continuation, the low-health jungle exit, and the 20/4/3, 117 CS ranked context.",
      outcome: "victory",
      outcomeLabel: "VICTORY",
      outcomeSource: "Manual review and League Client stat context",
      analysisSource: "manual"
    };
  }
  if (file === "auto_NA1-5568316539_01.mp4") {
    return {
      champion: "Samira",
      confidence: "high",
      feedbackTitle: "Bot pressure kept turning into death timers",
      feedback: "The leak is that bot-side pressure keeps becoming one more fight after the first wave or tower value, so real damage gets paid back as death timers instead of reset, group, or structure.",
      gameDetail: "At 24:21, you are in the bot-side enemy-lane fight after earlier structure pressure, one ally has just died, enemies are in front, and no free tower, safe wave-only reset, or objective is guaranteed on screen, so the wrong click is staying available for the same fight and the next click is back through the wave to reset or group unless an ally is clearly in front and the target is already CC'd or low. By 26:39 that extra fight has become another death timer. The 10/9/2, 151 CS line says the damage is real, but nine deaths and under 5 CS/min keep paying the lead back.",
      secondaryFocus: "Rep: after bot wave or tower pressure gives value, take the first safe exit: structure if free, wave then reset/group, or one step behind ally front. Do not re-enter while you are catchable; no second forward E unless an ally is in front and the target is already CC'd or low.",
      mistakeTypes: [
        "bot pressure exit after value",
        "second fight after structure pressure",
        "death-state exposure",
        "ally-front check",
        "CS lost to death timers"
      ],
      eventEvidence: "9:56 shows a low-health recall under bot-side safety; 22:04 shows Samira pressuring enemy bot structure with allies and wave; 24:21 shows the same bot-side pressure becoming another fight after an ally dies; 26:39 shows the death timer.",
      failureEvidence: "At 24:21 the first bot-side value has already shifted into an exit check: one ally is dead, enemies are in front, and no free structure or objective is guaranteed, so staying available turns pressure into the 26:39 death timer instead of reset, group, or wave control.",
      goodThing: "At 9:56 you recall from low health instead of forcing another bot fight, and at 22:04 you pressure bot structure with allies and wave; keep those exit and structure-pressure shapes.",
      whyTrust: "This uses inspected 9:56, 22:04, 24:21, 26:39, and 31:15 frames plus the League Client 10/9/2, 151 CS ranked context.",
      focusTag: "bot pressure exit",
      evidence: "Manual frame inspection of the bot pressure, exit, and death-timer windows plus League Client ranked stats for the same match.",
      pattern: "The game shows real fighting pressure and some correct exits, but the repeat blocker is letting a good bot-side pressure window stay open after the safe result is gone.",
      diamondRule: "After bot pressure gets value, Samira's next click is structure, wave into reset, group, or one step behind ally front; no second fight while catchable.",
      drill: "after bot wave or tower pressure gives value, take the first safe exit: structure if free, wave then reset/group, or one step behind ally front. No second forward E while catchable.",
      timeline: [
        "9:56 - Samira recalls from low health under bot-side safety.",
        "22:04 - Samira pressures enemy bot structure with allies and wave.",
        "24:21 - Samira stays available in the same bot-side fight after an ally dies.",
        "26:39 - Samira is dead after the extra bot-side fight.",
        "31:15 - Final scoreboard context shows 10/9/2 with 151 CS."
      ],
      clockAnchors: [
        { clock: "9:56", videoSeconds: 555.385, description: "Samira recalls from low health under bot-side safety." },
        { clock: "22:04", videoSeconds: 1244.615, description: "Samira pressures enemy bot structure with allies and wave." },
        { clock: "24:21", videoSeconds: 1382.462, description: "Samira stays available in the same bot-side fight after an ally dies." },
        { clock: "26:39", videoSeconds: 1520.308, description: "Samira is dead after the extra bot-side fight." },
        { clock: "31:15", videoSeconds: 1796, description: "The scoreboard context shows Samira at 10/9/2 with 151 CS." }
      ],
      nuance: [
        "The damage is real: 10 kills and bot-side pressure show you can create fights.",
        "The leak is the second bot-side fight after the first value window, not the first structure-pressure idea.",
        "Nine deaths are the main rank blocker because they turn damage windows into dead time and lower CS/min.",
        "The next-game rep is bot-pressure exit discipline: structure, wave reset, group, or behind ally front."
      ],
      reviewLimit: "Manual 2 FPS frame review cannot prove exact inputs, cooldowns, or every hidden enemy, but it verifies the low-health recall, bot-structure pressure, 24:21 re-fight window, 26:39 death timer, and 10/9/2, 151 CS ranked context.",
      outcome: "defeat",
      outcomeLabel: "DEFEAT",
      outcomeSource: "Manual review and League Client stat context",
      analysisSource: "manual"
    };
  }
  if (file === "auto_NA1-5568185590_01.mp4") {
    return {
      champion: "Samira",
      confidence: "high",
      feedbackTitle: "Mid wave became an illegal river chase",
      feedback: "The leak is that a safe mid-wave state turns into a river chase once wave and ally cover stop protecting you, so pressure becomes another avoidable death instead of wave, turret safety, reset, or group.",
      gameDetail: "At 23:05, you have mid wave near you, an ally nearby, and a retreat path back toward turret while the target is deeper toward river with no tower hit, dragon/baron setup, or guaranteed kill on screen, so the wrong click is chasing into river and the next click is catch mid wave, step back toward turret, reset, or group. By 23:20 multiple enemies can reach you and the playable wave has become another death.",
      secondaryFocus: midRiverChaseRep,
      mistakeTypes: [
        "mid wave to river chase",
        "ally-front check",
        "exit after first value",
        "fight-entry discipline",
        "avoidable river death"
      ],
      eventEvidence: "22:40 and 23:00 show Samira grouped mid with wave and ally context; 23:05 shows the move from mid toward river; 23:15 shows the collapse beginning; 23:20 shows the death.",
      failureEvidence: "At 23:05 the visible value is still mid wave, turret safety, reset, or group; river is not legal yet because ally front, objective, or a CC'd/low target is not proven, so the 23:15 collapse turns the playable mid setup into the 23:20 death.",
      goodThing: "At 19:47 you recall safely under turret after pressure, and earlier you play near wave plus ally context; keep that exit/setup habit.",
      whyTrust: "This uses the inspected 19:47, 22:40, 23:05, 23:15, and 23:20 frames plus the League Client 4/6/1, 148 CS ranked context.",
      focusTag: "mid-to-river exit",
      evidence: "Manual frame inspection of the mid-to-river fight window and League Client ranked stats for the same match.",
      pattern: "The first mid setup is playable because wave and ally context exist; the mistake starts when the next click leaves that setup for river without a clear front body, tower, wave, objective, or low/CC'd target.",
      diamondRule: "After mid pressure, a Samira river chase is legal only when an ally is still in front and the target is already CC'd or low; otherwise the result is mid wave, turret safety, reset, or regroup.",
      drill: "after mid wave gives value, ask: wave, turret, reset, or river? River is legal only if an ally is clearly in front and the target is already CC'd/low or an objective is active. If not, catch the wave and take one step back.",
      timeline: [
        "19:47 - Samira recalls safely under mid turret after pressure.",
        "22:40 - Samira is grouped mid with an ally and wave context.",
        "23:00 - Samira is still mid with wave nearby before leaving the safer lane shape.",
        "23:05 - Samira moves from mid toward river while the ally line is split.",
        "23:15 - Multiple enemies collapse around the river edge.",
        "23:20 - Samira is dead after the river chase."
      ],
      clockAnchors: [
        { clock: "19:47", videoSeconds: 1186.308, description: "Samira recalls safely under mid turret after pressure." },
        { clock: "22:40", videoSeconds: 1360, description: "Samira is grouped mid with an ally and wave context." },
        { clock: "23:00", videoSeconds: 1380, description: "Samira is mid with wave nearby before leaving the safer lane shape." },
        { clock: "23:05", videoSeconds: 1385, description: "Samira moves from mid toward river while the ally line is split." },
        { clock: "23:15", videoSeconds: 1395, description: "Multiple enemies collapse around the river edge." },
        { clock: "23:20", videoSeconds: 1400, description: "Samira is dead after the river chase." }
      ],
      nuance: [
        "The mid setup itself is not the problem; wave and ally context make it playable.",
        "The state flips once the click leaves mid wave and turret safety for river without a clear front body.",
        "The 148 CS is usable for this session, but 4/6/1 means fight impact is not surviving the exit windows.",
        "The next-game rep is a mid-to-river legality check, not a generic pressure-mode rule."
      ],
      reviewLimit: "Manual 2 FPS frame review cannot prove exact cooldowns or hidden enemies, but it verifies the mid-wave setup, river move, collapse, death, and 4/6/1, 148 CS ranked context.",
      outcome: "defeat",
      outcomeLabel: "DEFEAT",
      outcomeSource: "Manual review and League Client stat context",
      analysisSource: "manual"
    };
  }
  if (file === "auto_NA1-5568079693_01.mp4") {
    return {
      champion: "Samira",
      confidence: "high",
      feedbackTitle: "Cleaner win, one mid re-entry death remains",
      feedback: "The leak is staying forward for a second mid-fight re-entry after the first value window has already become wave, recall, or regroup.",
      gameDetail: "At 21:09, the first mid fight is legal enough because allies and a wave are near you and value has already happened, but the state flip is exit/value: you are low, enemy bodies can still re-engage, and the next click is one step back through the wave, then recall or group. The first bad next click is staying forward for another Samira re-entry. By 22:02 the re-entry becomes your third death, so this is a cleaner 7/3/10, 139 CS victory with one mid-fight exit leak.",
      secondaryFocus: "Rep: after a mid fight gives one kill, assist, wave, or turret pressure, say wave, recall, or regroup. If you are low or no ally is clearly in front, no second forward E; take one step back through the wave first.",
      mistakeTypes: [
        "mid-fight exit after value",
        "low-HP re-entry discipline",
        "wave-to-recall conversion",
        "ally-front check"
      ],
      eventEvidence: "19:23 shows Samira recalling after bot-side pressure with about 1687 gold; 21:09 shows Samira low in mid with wave/ally context and enemy bodies still able to re-engage; 22:02 shows the death timer after the re-entry.",
      failureEvidence: "At 21:09 the first value has already happened and the legal branch is wave, recall, or regroup; staying forward turns the play into the 22:02 death timer instead of a stable result.",
      goodThing: "At 19:23 you recall after bot-side tower pressure with about 1687 gold; keep that exit instinct.",
      whyTrust: "This uses inspected 19:23, 21:09, and 22:02 frames plus the League Client 7/3/10, 139 CS ranked victory context.",
      focusTag: "mid-fight exit",
      evidence: "Manual frame inspection of the mid re-entry window and League Client ranked stats for the same match.",
      pattern: "This is a cleaner win with one remaining mid-fight exit leak, not the old chain-feeding pattern.",
      diamondRule: "After mid value, no second forward Samira click while low unless ally front is clear and the target is already CC'd or low.",
      drill: "after a mid fight gives one kill, assist, wave, or turret pressure, say wave, recall, or regroup. If you are low or no ally is clearly in front, no second forward E; take one step back through the wave first.",
      timeline: [
        "19:23 - Samira recalls after bot-side pressure with about 1687 gold.",
        "20:42 - Samira is low near mid with an ally nearby and enemy bodies in front.",
        "20:57 - Samira is still low with mid wave visible and exit available.",
        "21:09 - Samira stays forward for another mid re-entry after first value.",
        "22:02 - Samira is dead with BACK IN 38 visible."
      ],
      clockAnchors: [
        { clock: "19:23", videoSeconds: 1070.923, description: "Samira recalls after bot-side pressure with about 1687 gold." },
        { clock: "20:42", videoSeconds: 1150, description: "Samira is low near mid with an ally nearby and enemy bodies in front." },
        { clock: "20:57", videoSeconds: 1165, description: "Samira is still low with mid wave visible and exit available." },
        { clock: "21:09", videoSeconds: 1177.615, description: "Samira stays forward for another mid re-entry after first value." },
        { clock: "22:02", videoSeconds: 1230, description: "Samira is dead with BACK IN 38 visible." }
      ],
      nuance: [
        "This is a cleaner ranked victory, not the same death-heavy collapse pattern.",
        "The useful part is that farming, fighting, and deaths are more controlled.",
        "The mistake starts after the first mid value window, when the next click stays re-entry instead of exit.",
        "The 139 CS and 3 deaths show Silver-level survival for this session, but the remaining re-entry death keeps it from a cleaner grade.",
        "The next-game rep is a mid-fight exit check, not a generic pressure-mode slogan."
      ],
      reviewLimit: "Manual 2 FPS frame review cannot prove exact cooldowns or hidden enemy positions, but it verifies the 19:23 recall, 21:09 re-entry state, 22:02 death, and 7/3/10, 139 CS ranked victory context.",
      outcome: "victory",
      outcomeLabel: "VICTORY",
      outcomeSource: "Manual review and League Client stat context",
      analysisSource: "manual"
    };
  }
  if (file === "auto_NA1-5567953154_01.mp4") {
    return {
      champion: "Samira",
      confidence: "high",
      feedbackTitle: "Jungle fight continued after first value",
      feedback: "The leak is that after the first jungle value window ends, you keep chasing the same fight through blue-side jungle instead of choosing a stable result.",
      gameDetail: "At 22:51, the blue-side jungle fight is playable at first: allies are in front, an enemy is already committed, and Samira can threaten from behind the line, so the first value window is not the issue and the next click is exit to turret, catch mid wave, reset, or regroup after that value is gone. Once no enemy is already CC'd or low, no ally is clearly body-blocking, and no tower, wave, or objective is visible, Samira's next click has to be exit, not another forward chase. By 23:39 the playable entry has turned into enemy tempo and another death timer.",
      secondaryFocus: jungleFightExitRep,
      mistakeTypes: [
        "jungle fight exit after first value",
        "side wave to map-result conversion",
        "ally-front check",
        "low damage pressure",
        "reset/group timing"
      ],
      eventEvidence: "22:41 shows Samira entering blue-side jungle behind allies; 22:51 shows the fight is playable at first because allies are in front and an enemy is already committed; 22:59 shows the state flip as the same fight keeps extending through jungle; 23:39 shows the death timer with 144 CS.",
      failureEvidence: "At 22:51 the entry is playable; the failure is the next phase, when no enemy is already CC'd or low, no ally is clearly body-blocking, and no tower, wave, or objective is visible, so the correct branch is turret, mid wave, reset, or regroup instead of another jungle chase.",
      goodThing: "This game is calmer: 175 CS and only 4 deaths means your farming and survival baseline improved; keep the calmer reset, wave, and ally-line habits.",
      whyTrust: "This uses inspected 22:31, 22:41, 22:51, 22:59, and 23:39 frames plus the League Client 1/4/3, 175 CS ranked stat line.",
      focusTag: "jungle fight exit",
      evidence: "Manual frame inspection of the blue-side jungle fight and League Client ranked stats for the same match.",
      pattern: "The first value window is not the problem; the problem is staying in the same jungle fight after the stable result disappears.",
      diamondRule: "After a jungle fight gives first value, the next Samira click is turret, mid wave, reset, or regroup unless an ally is still in front and the target is already CC'd or low.",
      drill: "after a jungle fight gives first value, ask: exit to turret, catch mid wave, reset, or regroup? Do not keep chasing through jungle unless an ally is still in front and the target is already CC'd or low.",
      timeline: [
        "22:31 - Samira and an ally are under allied mid/base area after the defense stabilizes.",
        "22:41 - Samira follows allies into blue-side jungle.",
        "22:51 - Samira joins a jungle fight with allies already in front and an enemy committed.",
        "22:59 - Samira stays in the jungle fight as another enemy remains visible and the exit check is due.",
        "23:39 - Samira is dead with 144 CS."
      ],
      clockAnchors: [
        { clock: "22:31", videoSeconds: 1350, description: "Samira and an ally are under allied mid/base area after the defense stabilizes." },
        { clock: "22:41", videoSeconds: 1360, description: "Samira follows allies into blue-side jungle." },
        { clock: "22:51", videoSeconds: 1370, description: "Samira joins a jungle fight with allies already in front and an enemy committed." },
        { clock: "22:59", videoSeconds: 1378, description: "Samira stays in the jungle fight as another enemy remains visible and the exit check is due." },
        { clock: "23:39", videoSeconds: 1385, description: "Samira is dead with 144 CS after the jungle fight." }
      ],
      nuance: [
        "This is a calmer ranked loss, not the same death-heavy pattern.",
        "The useful part is following allies into a fight where bodies are already committed.",
        "The mistake starts after the first jungle value window, when the next click stays chase instead of exit.",
        "The 175 CS and 4 deaths show improved farming and survival, but 1/4/3 means the fight value did not become enough map pressure.",
        "The next-game rep is a jungle-fight exit check, not an objective-fight or pressure-mode slogan."
      ],
      reviewLimit: "Manual 2 FPS frame review cannot prove exact cooldowns or all hidden enemy positions, but it can verify the allied-front jungle entry, the state-flip window, the death timer, and the 1/4/3, 175 CS ranked context.",
      outcome: "defeat",
      outcomeLabel: "DEFEAT",
      outcomeSource: "Manual review and League Client stat context",
      analysisSource: "manual"
    };
  }
  if (file === "auto_NA1-5567787430_02.mp4") {
    return {
      champion: "Samira",
      confidence: "medium",
      feedbackTitle: "Do not turn level 1 into a blind brush test",
      feedback: "The leak is treating an early bot-brush setup as a commit by itself instead of waiting for enemy reveal, wave control, or a free first trade to make the next step legal.",
      gameDetail: "At 0:53, Samira and support are holding the bot-side brush before minions meet and no enemy body, wave payout, or forced first trade is visible, so the wrong click is stepping deeper for a blind first contact and the next click is to hold the brush edge, wait for enemy reveal, or walk to lane on time if nothing appears. By 1:21, the first minions are already in lane and the setup only mattered if it created health, summoner, or wave value. The final 5/9/3, 119 CS in 28 minutes says the bigger rank cost is still turning early pressure into stable lane and fight value instead of later death timers.",
      secondaryFocus: "Rep: before any level-1 brush hold, ask what the reveal buys right now: first trade, wave control, or leave. If none is visible, walk to lane on time instead of forcing first contact.",
      mistakeTypes: [
        "level-1 blind commit",
        "early lane payout check",
        "wave-first discipline",
        "ally-front timing",
        "death-state exposure later"
      ],
      eventEvidence: "0:53 shows Samira and support sitting in the bot-side brush before minions meet with no enemy body or wave payout visible; 1:21 shows the first lane wave already in front, which means the setup needed to create health, summoner, or wave value immediately to be worth the hold.",
      failureEvidence: "At 0:53 the setup is not automatically wrong, but it is not yet a legal commit either; if the next step becomes deeper brush or blind first contact before reveal or wave value, the lane gives up timing for a guess instead of a controlled first trade or lane start.",
      goodThing: "You are grouped with support instead of wandering into lane alone, which is the right base shape to keep before the reveal happens.",
      whyTrust: "This uses the visible 0:53 brush hold, the 1:21 lane state, and the final 5/9/3, 119 CS ranked stat line to keep the note tied to what the clip actually shows.",
      focusTag: "level 1 payout",
      evidence: "Manual frame inspection of the 0:53 bot-brush hold, the 1:21 first-wave lane state, and the League Client stats for the same ranked game.",
      pattern: "The early setup is only useful when the reveal creates a concrete payout. If nothing appears, lane timing and first-wave control matter more than proving willingness to fight from fog.",
      diamondRule: "Level-1 brush pressure is only worth keeping when the next visible step creates a first trade, wave control, or a forced enemy detour.",
      drill: "before any level-1 brush hold, ask what the reveal buys right now: first trade, wave control, or leave. If none is visible, walk to lane on time instead of forcing first contact.",
      timeline: [
        "0:53 - Samira and support hold bot-side brush before minions meet.",
        "1:21 - The first minion wave is already in lane with Samira and support beside it."
      ],
      clockAnchors: [
        { clock: "0:53", videoSeconds: 53, description: "Samira and support hold bot-side brush before minions meet." },
        { clock: "1:21", videoSeconds: 125, description: "The first minion wave is already in lane with Samira and support beside it." }
      ],
      nuance: [
        "Good: the setup is grouped with support instead of a solo face-check.",
        "Leak: the brush hold needs a visible payout before it becomes a commit.",
        "Branch: if no enemy reveal or free trade appears, lane timing and first-wave control are the better conversion.",
        "Cost: the full ranked line still ends 5/9/3 with 119 CS in 28 minutes, so later deaths and low farm remain the bigger carry leak.",
        "Limit: sampled frames do not prove the unseen enemy positions inside fog, so the rule stays tied to visible reveal and wave state."
      ],
      reviewLimit: "Manual frame review used sampled 2 FPS replay frames and cannot prove hidden enemy positions or exact pings; the note is limited to the visible brush hold, lane timing, and the synced match stat line.",
      analysisSource: "manual"
    };
  }
  if (file === "auto_NA1-5567787430_01.mp4") {
    return {
      champion: "Samira",
      confidence: "high",
      feedbackTitle: "Objective entry is improving; the leak is second fight after value",
      feedback: "The leak is taking a second fight after the first objective value window instead of re-checking whether dragon, wave, recall, group, or ally front is still available.",
      gameDetail: "At 9:58, the dragon fight starts as a partly legal entry: dragon is on screen, allies are already committed, enemies are in front, and you are close enough to follow, so the first value window is playable, but once that dragon/kill pressure resolves the wrong click is taking a second forward fight and the next click is dragon, wave, recall, group, or one step back if none is visible. That state flip is where deaths stack: legal entry, value gained, state flip, and exit check are not separated. With 5/9/3 and 119 CS in 28 minutes, damage pressure exists, but death timers and low-CS time keep the pressure from becoming stable conversion.",
      secondaryFocus: objectiveFightRep,
      mistakeTypes: [
        "objective-fight state flip",
        "second fight after value",
        "exit/re-entry discipline",
        "low CS from death timers",
        "objective/wave/recall conversion"
      ],
      eventEvidence: "9:58 shows dragon on screen with several champions engaged near pit; 24:09 shows another death timer; the final 5/9/3, 119 CS in a 28-minute ranked loss shows damage pressure existed but deaths and low CS kept conversion unstable.",
      failureEvidence: "At 9:58 the first objective entry is playable, but the failure starts after the initial dragon/kill value: the next forward fight happens before dragon, wave, recall, group, or ally-front safety is proven, which turns pressure into another death-state pattern.",
      goodThing: "At 9:58 you are starting to recognize real objective fight windows with allies already committed; keep entering when bodies are engaged and the fight can create dragon or kill pressure.",
      whyTrust: "This uses the visible 9:58 dragon-pit fight, the later death-state frame, and the 5/9/3, 119 CS ranked stat line instead of judging only the defeat.",
      focusTag: "objective fight state flip",
      evidence: "Manual frame inspection of the 9:58 objective fight, 24:09 death-state frame, and League Client stats.",
      pattern: "The entry is improving when objective value and allied commitment are visible; the leak is the next phase, where the same fight keeps being treated as legal after the first value window has already changed.",
      diamondRule: "After an objective fight gives value, choose dragon, wave, recall, or group before another forward fight.",
      drill: objectiveFightRep.replace(/^Rep\s*:\s*/i, ""),
      timeline: [
        "9:58 - Dragon is on screen with several champions engaged near pit.",
        "24:09 - Samira is dead with the death timer visible."
      ],
      clockAnchors: [
        { clock: "9:58", videoSeconds: 506.308, description: "Dragon is on screen with several champions engaged near pit." },
        { clock: "24:09", videoSeconds: 1109.077, description: "Samira is dead with the death timer visible." }
      ],
      nuance: [
        "Good: the first objective entry is partly legal because dragon and committed bodies are visible.",
        "Leak: the second fight after first value is being treated like the same legal window.",
        "Cost: 5/9/3 and 119 CS in 28 minutes means death timers are erasing farm and conversion.",
        "Next branch: dragon, wave, recall, group, or step back.",
        "Limit: sampled frames cannot prove every cooldown, so the re-entry rule stays conditional on visible ally front and enemy commitment."
      ],
      reviewLimit: "Manual frame review used sampled 2 FPS frames and cannot prove exact cooldowns or every enemy position; the decision rule is based on visible objective, allied commitment, death state, K/D/A, and CS.",
      analysisSource: "manual"
    };
  }
  if (file === "auto_NA1-5567367431_01.mp4") {
    return {
      champion: "Samira",
      confidence: "high",
      feedbackTitle: "Bot-tower dash after lane value ended",
      feedback: "The leak is treating one catchable enemy under turret as a legal Samira entry after the wave/front/body no longer protects you, so lane pressure becomes another death timer instead of a reset or wave result.",
      gameDetail: "At 9:02, you are 0/2/0 with 44 CS beside enemy bot outer turret, support is near you but not clearly between you and the enemy, the wave is already thin, and the visible enemy is under turret, so the wrong click is the forward dash/chase and the next click is back through your minion wave behind support, or reset if the wave cannot safely be played. By 9:22 you are dead, the score has moved to 0/3/0, and the lane gained no tower or objective from the entry. The final 0/5/0, 57 CS in 16 minutes says the first blocker is death-state exposure: the lane ideas are not useless, but the all-in button is being pressed after the legal setup is gone.",
      secondaryFocus: laneDeathExitRep,
      mistakeTypes: [
        "lane all-in after setup ends",
        "death-state exposure",
        "ally-frontline check",
        "wave-thin tower discipline",
        "CS loss through death timers"
      ],
      eventEvidence: "8:32 shows Samira and support using bot wave pressure together; 8:52 shows the pair walking at enemy bot outer turret; 9:02 shows the forward entry beside enemy turret with the wave already thin; 9:22 shows the death timer and 0/3/0 scoreboard state.",
      failureEvidence: "At 9:02 the visible state no longer guarantees tower, wave, or ally-front entry value; by 9:22 the cost is another death timer and lost lane tempo.",
      goodThing: "At 8:32 and 8:52 you are at least playing through your support and the bot wave, which is the lane shape to keep before the setup expires.",
      whyTrust: "This uses inspected 8:32, 8:52, 9:02, and 9:22 frames plus the League Client 0/5/0, 57 CS defeat line.",
      focusTag: "lane entry exit",
      evidence: "Manual frame inspection of 8:32, 8:52, 9:02, and 9:22 plus League Client stats.",
      pattern: "This game is a death-state lane-control problem: the first improvement is not a fancy macro branch, it is refusing the dash after the wave and ally-front setup expires.",
      diamondRule: "Samira E is legal only when wave, ally front, enemy cooldowns, and the exit path still make the target safe enough to cash.",
      drill: laneDeathExitRep.replace(/^Rep\s*:\s*/i, ""),
      timeline: [
        "8:32 - Samira and support push bot wave together before the tower setup expires.",
        "8:52 - Samira walks near enemy bot outer turret with support nearby.",
        "9:02 - Samira dashes/steps forward beside enemy bot turret after the wave is already thin.",
        "9:22 - Samira is dead, the scoreboard shows 0/3/0, and no tower or objective was gained."
      ],
      clockAnchors: [
        { clock: "8:32", videoSeconds: 560, description: "Samira and support push bot wave together before the tower setup expires." },
        { clock: "8:52", videoSeconds: 580, description: "Samira walks near enemy bot outer turret with support nearby." },
        { clock: "9:02", videoSeconds: 590, description: "Samira dashes or steps forward beside enemy bot turret after the wave is already thin." },
        { clock: "9:22", videoSeconds: 610, description: "Samira is dead, the scoreboard shows 0/3/0, and no tower or objective was gained." }
      ],
      nuance: [
        "This is a lane-entry issue, not a base-push issue.",
        "The useful part is moving with support and wave before the entry.",
        "The mistake starts when the setup expires but the forward click still happens.",
        "The 0/5/0 line means deaths, not lack of aggression, are the first blocker.",
        "The next-game rep is about refusing Samira E when the wave, ally front, or exit is missing."
      ],
      reviewLimit: "Manual 2 FPS frame review cannot prove exact inputs or every cooldown, but it can verify the bot-turret entry window, the death timer, and the 0/5/0, 57 CS defeat context.",
      outcome: "defeat",
      outcomeLabel: "DEFEAT",
      outcomeSource: "Manual review and League Client stat context",
      analysisSource: "manual"
    };
  }
  if (file === "auto_NA1-5567223507_01.mp4") {
    return {
      champion: "Samira",
      confidence: "high",
      feedbackTitle: "Cleaner win, one overstay pattern remains",
      feedback: "The leak is that one or two pressure moments still continue after the map stops offering a safe tower, wave, objective, or ally-front entry, so a winning or neutral sequence can still become a preventable death.",
      gameDetail: "At 8:47, you are under the enemy bot turret with an ally behind you, a pushed wave already used for pressure, multiple enemies still able to collapse, and no guaranteed tower or objective left, so the wrong click is continuing the fight and the next click is one step back through the wave toward reset. By 9:01 that overstay becomes a death timer instead of a clean exit. The 8/3/6, 202 CS in 38 minutes is real improvement: fewer deaths, better farming, and cleaner exits mean this is a cleaner win with one remaining overstay branch, not the same old collapse game.",
      secondaryFocus: cleanerWinExitRep,
      mistakeTypes: [
        "post-pressure exit branch",
        "tower dive/overstay discipline",
        "ally-frontline check",
        "camera/map-state check",
        "reset after wave pressure"
      ],
      eventEvidence: "8:27 shows Samira farming the pushed bot wave; 8:47 shows the fight continuing under enemy bot turret after the wave pressure; 9:01 shows the death timer; 17:32 shows later jungle farming in a calmer won-game state.",
      failureEvidence: "At 8:47 the wave and turret pressure have already paid enough to require an exit check; by 9:01 the cost is visible as a death timer, which is the remaining overstay pattern inside an otherwise cleaner win.",
      goodThing: "The strong part is that this is clearly an improvement game: 202 CS in 38 minutes, only 3 deaths, and multiple better reset/exit choices show that you are applying the discipline instead of perma-fighting.",
      whyTrust: "This uses inspected 8:27, 8:47, 9:01, and 17:32 frames plus the League Client 8/3/6, 202 CS victory line.",
      focusTag: "cleaner win exit",
      evidence: "Manual frame inspection of 8:27, 8:47, 9:01, and 17:32 plus League Client stats.",
      pattern: "This game is a better baseline. The remaining pattern is not lack of damage or farming; it is ending the one pressure window when the safe payout disappears.",
      diamondRule: "After a wave, tower hit, or fight start, Samira clicks forward only if tower, wave, objective, or ally front is still visible.",
      drill: cleanerWinExitRep.replace(/^Rep\s*:\s*/i, ""),
      timeline: [
        "8:27 - Samira farms a pushed bot wave with enemy pressure still possible.",
        "8:47 - Samira continues fighting under enemy bot turret after the wave pressure.",
        "9:01 - Samira is dead with the respawn timer visible.",
        "17:32 - Samira farms a jungle camp later in the cleaner winning game."
      ],
      clockAnchors: [
        { clock: "8:27", videoSeconds: 480, description: "Samira farms a pushed bot wave with enemy pressure still possible." },
        { clock: "8:47", videoSeconds: 500, description: "Samira continues fighting under enemy bot turret after the wave pressure." },
        { clock: "9:01", videoSeconds: 514.462, description: "Samira is dead with the respawn timer visible." },
        { clock: "17:32", videoSeconds: 1024.923, description: "Samira attacks a jungle camp later in the cleaner winning game." }
      ],
      nuance: [
        "This is a cleaner win, not another feeding pattern.",
        "The improvement is fewer deaths, stronger CS, and better reset discipline.",
        "The remaining mistake is one pressure window continuing after the safe payoff disappears.",
        "The 9:01 death is the cost of not exiting the 8:47 bot-turret state.",
        "The next-game check is wave, tower, objective, ally front, or reset/group."
      ],
      reviewLimit: "Manual 2 FPS frame review cannot prove exact inputs or every cooldown, but it can verify the bot-turret overstay window, the death timer, and the improved 8/3/6, 202 CS victory context.",
      outcome: "victory",
      outcomeLabel: "VICTORY",
      outcomeSource: "Manual review and League Client stat context",
      analysisSource: "manual"
    };
  }
  if (file === "auto_NA1-5566943774_01.mp4") {
    return {
      champion: "Samira",
      confidence: "high",
      feedbackTitle: "Late entry with no legal fight",
      feedback: "The leak is entering after the safe fight is gone, so pressure becomes another death timer instead of a reset or map result.",
      gameDetail: "At 22:00, you are left of upper river with two allies nearby and enemies in front; no tower, wave, or objective is visible, so the wrong click is forward entry and the next click is one step back behind the ally line. By 24:00 that entry becomes another death; the 2/10/8, 103 CS line says death timers are the first blocker, with CS bleeding through dead time.",
      secondaryFocus: "Rep: after 15 minutes, before stepping into a fight, ask: tower, wave, objective, or ally front? If none is visible, click one step back and re-enter only from behind an ally.",
      mistakeTypes: [
        "catchable fight entry",
        "death-state exposure",
        "ally-frontline check",
        "camera/map-state check",
        "low CS income stability"
      ],
      eventEvidence: "7:59 and 12:44 show death timers after bot-side fights; 15:32 shows the correct recall under bot turret with over 1100 gold; 22:00 shows the upper-river fight with enemies in front and no tower or wave payout on screen; 24:00 shows another death in the same upper-river/jungle area.",
      failureEvidence: "At 22:00 the visible state is fight-only value with no permanent result on screen; by 24:00 another death timer replaces the reset or map result.",
      goodThing: "At 15:32 you recalled under bot turret with more than 1100 gold; keep that reset instinct.",
      whyTrust: "This uses inspected 7:59, 12:44, 15:32, 22:00, and 24:00 frames plus the 2/10/8, 103 CS ranked stat line.",
      focusTag: "fight entry reset",
      evidence: "Manual frame inspection of the visible death timers, 15:32 recall, 22:00 upper-river fight, and 24:00 death plus League Client stats.",
      pattern: "The game shows playable damage and a real reset habit, but the repeat failure is treating fight-only screens as if they still contain a permanent result.",
      diamondRule: "If the screen has no permanent result, Samira clicks back before she clicks in.",
      drill: "After 15 minutes, ask: tower, wave, objective, or ally front before every forward click.",
      timeline: [
        "7:59 - Samira is on a death timer after a bot-side fight.",
        "12:44 - Samira is dead again after a bot-side river/jungle fight.",
        "15:32 - Samira recalls under allied bot turret with over 1100 gold.",
        "22:00 - Samira is near an upper-river jungle fight with allies nearby and enemies in front.",
        "24:00 - Samira is dead near the same upper-river/jungle area."
      ],
      clockAnchors: [
        { clock: "7:59", videoSeconds: 510.769, description: "Samira is on a death timer after a bot-side fight." },
        { clock: "12:44", videoSeconds: 764.154, description: "Samira is dead again after a bot-side river or jungle fight." },
        { clock: "15:32", videoSeconds: 932, description: "Samira recalls under allied bot turret with over 1100 gold." },
        { clock: "22:00", videoSeconds: 1320, description: "Samira is on the left edge of an upper-river jungle fight with allies nearby, enemies in front, and no tower or wave payout on screen." },
        { clock: "24:00", videoSeconds: 1440, description: "Samira is dead near the upper-river jungle area." }
      ],
      nuance: [
        "The good part is the 15:32 recall; the reset button exists in your game.",
        "The bad part is entering later fight-only screens when no permanent result is visible.",
        "Ten deaths are the main blocker in this ranked game.",
        "103 CS in 27 minutes is also low, but the CS issue is partly caused by dead time.",
        "The next-game check is tower, wave, objective, ally front, or one step back."
      ],
      reviewLimit: "Manual 2 FPS frame review cannot prove exact inputs or cooldowns, but it can verify the visible death timers, recall, fight-only state, missing tower/wave payout, and final K/D/A/CS context.",
      outcome: "defeat",
      outcomeLabel: "DEFEAT",
      outcomeSource: "Manual review and League Client stat context",
      analysisSource: "manual"
    };
  }
  if (file === "auto_NA1-5566860300_01.mp4") {
    return {
      champion: "Samira",
      confidence: "high",
      feedbackTitle: "Grouped base push needs click discipline",
      feedback: "Mistake: the grouped base push was good, but the next click still needs to be structure, safe blocker, wave, or exit instead of another vague forward move. Fix: when allies are in front in base, hit free structure, hit only the defender blocking it, clear the wave, or leave as soon as those stop being true.",
      gameDetail: "At 19:43 the mistake risk is inside the enemy base: you are grouped with multiple allies in front, an enemy is near the base entrance, and the nearest permanent value is the exposed inhibitor/base structure, so the branch is hit free structure, hit only the defender blocking it from behind ally front, clear wave if the structure is not hittable, or leave when defenders and respawns make the structure no longer free. At 16:07 the stronger version already happened because your team is grouped near enemy mid turret as it falls, which is real conversion. At 10:43 you are 3/0/1 with 76 CS and 1031 gold in bot lane, so the lead exists before the base push. The 5/1/7, 123 CS, 23-minute line says deaths are controlled and fight impact is good; the next Challenger-path improvement is making every base click either structure, blocker, wave, or exit.",
      whyTrust: "This uses inspected 1:43, 10:43, 16:07, and 19:43 frames plus the 5/1/7 and 123 CS stat line.",
      eventEvidence: "1:43 shows bot lane with ally-and-wave cover against two enemies; 10:43 shows Samira farming bot at 3/0/1 with 76 CS and 1031 gold; 16:07 shows the enemy mid turret falling with allies nearby; 19:43 shows Samira grouped with allies in the enemy base near exposed structures.",
      failureEvidence: "At 19:43 the grouped base state is good, but it becomes a leak only if the next click leaves the structure/blocker/wave/exit branch, because defenders can respawn and turn a won base position into another fight.",
      mistakeTypes: [
        "base structure target priority",
        "ally-frontline check",
        "wave into exit timing",
        "camera/map-state check",
        "fight-to-structure conversion"
      ],
      goodThing: "At 16:07 and 19:43 you are grouped with allies while structures are falling or exposed; keep that base-pressure habit.",
      focusTag: "base click discipline",
      evidence: "Manual frame inspection of 1:43, 10:43, 16:07, and 19:43 plus League Client stats.",
      pattern: "This game is a better shape: low deaths, grouped pressure, and structure access. The improvement is not fighting less; it is making the base click sequence exact.",
      diamondRule: "In base, every Samira click is structure, blocker, wave, or exit.",
      drill: "In every base push, say structure, blocker, wave, exit before moving forward.",
      timeline: [
        "1:43 - Bot lane has ally-and-wave cover against two enemies.",
        "10:43 - Samira farms bot at 3/0/1 with 76 CS and 1031 gold.",
        "16:07 - Enemy mid turret falls with allies nearby.",
        "19:43 - Samira is grouped with allies in enemy base near exposed structures."
      ],
      clockAnchors: [
        { clock: "1:43", videoSeconds: 112.077, description: "Bot lane has ally-and-wave cover against two enemies." },
        { clock: "10:43", videoSeconds: 652.462, description: "Samira farms bot at 3/0/1 with 76 CS and 1031 gold." },
        { clock: "16:07", videoSeconds: 976.692, description: "Enemy mid turret falls with allies nearby." },
        { clock: "19:43", videoSeconds: 1192.846, description: "Samira is grouped with allies in enemy base near exposed structures." }
      ],
      nuance: [
        "The good part is grouped base pressure with allies in front.",
        "The mistake risk is not entering base; it is losing the exact structure/blocker/wave/exit branch after entry.",
        "5/1/7 means deaths were controlled, so this is a better game state than the recent feeding games.",
        "123 CS in 23 minutes is stable enough that the next gain is target priority and exit timing.",
        "The next-game check is structure, blocker, wave, exit."
      ],
      reviewLimit: "Manual frame review used 2 FPS sampled frames and cannot prove exact clicks or cooldowns; it can judge grouped base state, structure access, stats, and exit-branch discipline.",
      secondaryFocus: "Work on base target priority: once allies are in front, keep the camera on structure and defenders so the next click is structure, blocker, wave, or exit.",
      analysisSource: "manual"
    };
  }
  if (file === "auto_NA1-5566786855_01.mp4") {
    return {
      champion: "Samira",
      confidence: "high",
      feedbackTitle: "Bot pressure needs exit branch",
      feedback: "Mistake: you created bot pressure, but the later fight windows stayed open after the safe tower or wave branch should have ended. Fix: hit tower while it is free, hit only a safe blocker, push wave then recall, or leave before the collapse returns.",
      gameDetail: "At 15:01 you are bot with an ally, a minion wave, and the enemy bot turret directly in front; the branch is to hit tower while it is free, stop only for a safe blocker, then push the next wave or recall before the enemy collapse returns. At 10:03 you were already low under allied bot turret while the wave was ahead of you, so pressure had to start from turret and wave safety rather than another forward trade. By 11:54 you are near the enemy bot side again with enemies visible around lane and the jungle entrance, which means the next click needs ally front and turret value before it becomes a chase. The 12/6/5, 156 CS, 26-minute line says your damage and lane pressure are real, but six deaths are the bigger blocker; the improvement is ending bot pressure as tower damage, wave crash, or reset before the fight reopens.",
      whyTrust: "This is tied to visible bot-lane tower frames at 10:03, 11:54, and 15:01 plus the 12/6/5 and 156 CS stat line.",
      eventEvidence: "10:03 shows Samira low under allied bot turret with wave pressure ahead; 11:54 shows Samira near enemy bot-side lane and jungle entrance with enemies visible; 15:01 shows Samira and an ally hitting enemy bot turret with a wave.",
      failureEvidence: "At 15:01 the tower branch is good while it is free, but the failure risk is staying forward after that branch disappears, because the enemy gets a new collapse window and the final six-death line shows those reopenings are still too expensive.",
      mistakeTypes: [
        "tower branch exit",
        "death-state exposure",
        "ally-frontline check",
        "wave crash into reset",
        "camera/map-state check"
      ],
      goodThing: "At 15:01 you did create real bot tower pressure with an ally and a wave; keep that part.",
      focusTag: "tower exit branch",
      evidence: "Manual frame inspection of 10:03, 11:54, and 15:01 plus League Client stats.",
      pattern: "The repeat is not lack of aggression; it is keeping pressure mode active after the free tower or wave value is no longer guaranteed.",
      diamondRule: "When bot tower is the payout, hit it while free, then exit through wave or recall before the next fight opens.",
      drill: "After 15 minutes, say tower, wave, exit before every bot-side forward click.",
      timeline: [
        "10:03 - Samira is low under allied bot turret with wave pressure ahead.",
        "11:54 - Samira is near enemy bot-side lane and jungle entrance with enemies visible.",
        "15:01 - Samira and an ally hit enemy bot turret with a wave."
      ],
      clockAnchors: [
        { clock: "10:03", videoSeconds: 559.577, description: "Samira is low under allied bot turret with wave pressure ahead." },
        { clock: "11:54", videoSeconds: 670.692, description: "Samira is near enemy bot-side lane and jungle entrance with enemies visible." },
        { clock: "15:01", videoSeconds: 781.808, description: "Samira and an ally hit enemy bot turret with a wave." }
      ],
      nuance: [
        "The good part is the 15:01 tower pressure with an ally and wave.",
        "The bad part is letting the next fight stay available after tower or wave value is no longer free.",
        "The 12/6/5 line says deaths are the bigger blocker than damage.",
        "156 CS in 26 minutes is playable, so the next gain is exit timing, not farming forever.",
        "The next-game check is tower, wave, exit before the forward click."
      ],
      reviewLimit: "Manual frame review used sampled 2 FPS frames, so exact inputs and cooldowns are not judged.",
      secondaryFocus: "Use camera/map-state checks after bot pressure: if ally front, free tower, or safe wave is gone, click back before another fight starts.",
      analysisSource: "manual"
    };
  }
  if (file === "auto_NA1-5566726915_01.mp4") {
    return {
      champion: "Samira",
      confidence: "high",
      feedbackTitle: "Fight wins need exit branch",
      feedback: "Mistake: the fights kept staying open after the useful damage window, so kills did not reliably become objective, wave, or reset value. Fix: after the first winning exchange, choose objective, safe wave, recall, or back behind ally front before spending another forward click.",
      gameDetail: "At 19:12 you are in the bot-side jungle with an ally rooted in front of you and an enemy visible from the lower-left; the branch is to hit only from behind the ally front, rotate to objective if the fight is won, or leave if enemy tools are still live. At 5:41 the early safe branch is clearer because you are under allied bot turret with wave and two enemies in front, so the job is wave defense before forward trading. By 22:40 you are grouped around a river camp or objective fight with several allies, which is useful only if it becomes objective control or a reset path. The 25/8/9, 162 CS, 41-minute line says the problem is not damage, it is that eight deaths and low income stability stretch winning fights into more enemy chances.",
      whyTrust: "This uses inspected 5:41, 19:12, and 22:40 frames plus the 25/8/9 and 162 CS stat line.",
      eventEvidence: "5:41 shows Samira under allied bot turret with a wave and two enemies in front; 19:12 shows a bot-side jungle fight with ally front and an enemy angle from lower-left; 22:40 shows several allies grouped around a river camp or objective fight.",
      failureEvidence: "At 19:12 the ally-front shape is playable, but the enemy angle is still visible and the fight is not yet a guaranteed objective; if the next click is another forward fight instead of objective, safe wave, reset, or back behind allies, the eight-death final line is the cost.",
      mistakeTypes: [
        "fight exit branch",
        "death-state exposure",
        "objective after first win",
        "low CS income stability",
        "ally-frontline check"
      ],
      goodThing: "You are clearly creating fight impact; 25 kills and the grouped 22:40 river state show that you can be present when fights matter.",
      focusTag: "fight exit branch",
      evidence: "Manual frame inspection of 5:41, 19:12, and 22:40 plus League Client stats.",
      pattern: "The repeated issue is the decision after the first useful damage window: objective, safe wave, recall, or back behind allies has to happen before the fight reopens.",
      diamondRule: "After the first winning exchange, decide objective, wave, reset, or ally front before another forward click.",
      drill: "After a won exchange, say objective, wave, reset, or back.",
      timeline: [
        "5:41 - Samira is under allied bot turret with wave and two enemies in front.",
        "19:12 - Samira fights bot-side jungle with ally front and enemy angle visible.",
        "22:40 - Samira is grouped around river camp or objective with several allies."
      ],
      clockAnchors: [
        { clock: "5:41", videoSeconds: 335.077, description: "Samira is under allied bot turret with wave and two enemies in front." },
        { clock: "19:12", videoSeconds: 997.231, description: "Samira fights bot-side jungle with ally front and enemy angle visible." },
        { clock: "22:40", videoSeconds: 1162.769, description: "Samira is grouped around river camp or objective with several allies." }
      ],
      nuance: [
        "The good part is fight presence; the stat line shows real kill pressure.",
        "The bad part is letting the fight continue after the first useful window.",
        "Eight deaths matter more than squeezing one more risky hit from an already won exchange.",
        "162 CS in 41 minutes says income is unstable, so clean resets and waves matter.",
        "The next-game check is objective, wave, reset, or back."
      ],
      reviewLimit: "Manual frame review used sampled 2 FPS frames and cannot prove exact cooldowns or every enemy position.",
      secondaryFocus: "Work on post-fight camera checks: after the first useful damage window, look at ally front, nearest objective, and whether one enemy angle is still open.",
      analysisSource: "manual"
    };
  }
  if (file === "auto_NA1-5566563083_01.mp4") {
    return {
      champion: "Samira",
      confidence: "high",
      feedbackTitle: "Side waves need death-state discipline",
      feedback: "Mistake: side-wave pressure kept turning into death-state exposure, so the game gave enemies repeated reset windows. Fix: clear the safe wave, then leave toward ally front or base unless a free tower, safe blocker, or objective is already visible.",
      gameDetail: "At 25:49 you are bottom with support clearing a wave near the destroyed bottom inhibitor turret; before any forward click, clear the safe wave, check ally deaths and who can stand in front, then leave toward team unless a free tower, safe blocker, or objective is visible. The cost is visible earlier at 22:59, where you are dead after a river or jungle fight while the map keeps moving without you. The 9/13/11, 162 CS, 39-minute line says the biggest issue is not refusing to fight; it is thirteen deaths and side-wave exposure turning pressure into enemy reset windows. Your support-and-wave position at 25:49 is the correct shape only if it ends as wave clear plus exit, not another isolated forward path.",
      whyTrust: "This is tied to inspected 22:59 and 25:49 frames plus the 9/13/11 and 162 CS stat line.",
      eventEvidence: "22:59 shows Samira dead after a river or jungle fight; 25:49 shows Samira and support clearing a bottom wave near the destroyed bottom inhibitor turret.",
      failureEvidence: "At 25:49 the wave clear is useful, but the failure appears when the next click stays side instead of exiting toward allies or base; the 22:59 death frame and thirteen-death final line show how side pressure becomes lost tempo.",
      mistakeTypes: [
        "side wave exit",
        "death-state exposure",
        "ally-frontline check",
        "base-defense timing",
        "camera/map-state check"
      ],
      goodThing: "At 25:49 you are at least clearing a real wave with support nearby; keep choosing visible wave value instead of random fog fights.",
      focusTag: "side wave exit",
      evidence: "Manual frame inspection of 22:59 and 25:49 plus League Client stats.",
      pattern: "The repeat is side pressure after the safe wave value: the wave is good, but the next click must be exit, ally front, or base unless a permanent result is visible.",
      diamondRule: "A side wave is a job, not permission to stay side after the wave is gone.",
      drill: "After each side wave, say wave done, front body, exit.",
      timeline: [
        "22:59 - Samira is dead after a river or jungle fight.",
        "25:49 - Samira and support clear bottom wave near the destroyed bottom inhibitor turret."
      ],
      clockAnchors: [
        { clock: "22:59", videoSeconds: 1195.346, description: "Samira is dead after a river or jungle fight." },
        { clock: "25:49", videoSeconds: 1365.538, description: "Samira and support clear bottom wave near the destroyed bottom inhibitor turret." }
      ],
      nuance: [
        "The good part is identifying a real bottom wave at 25:49.",
        "The bad part is staying side after the wave job is done.",
        "Thirteen deaths are the main blocker in this review.",
        "162 CS in 39 minutes means income exists, but deaths are erasing its value.",
        "The next-game check is wave done, front body, exit."
      ],
      reviewLimit: "Manual frame review used sampled 2 FPS frames and cannot judge exact combo speed, only visible death state, wave state, ally front, and pathing.",
      secondaryFocus: "Use camera/map-state checks after each side wave: if ally front or a free structure is not visible, leave toward team before the next fight starts.",
      analysisSource: "manual"
    };
  }
  if (file === "auto_NA1-5566823161_01.mp4") {
    return {
      champion: "Samira",
      confidence: "high",
      feedbackTitle: "Pressure mode after payout vanished",
      feedback: "Mistake: you stayed in pressure mode after the safe mid wave or turret-defense payout stopped being clear. Fix: before any forward click, check closest threatened turret, ally deaths, and who can stand in front; hit tower if free, hit only the blocker if safe, push or clear wave then recall, or leave.",
      gameDetail: "At 16:55 the mistake window is Samira mid with one ally beside you, a minion wave nearby, a very low allied mid turret on screen, and the team kill score down 12-16; before any forward click, check closest threatened turret, ally deaths, and who can stand in front: hit enemy tower if it is free, hit only the blocker if safe, clear the wave then recall if wave is the only value, or leave if none of those are true. Earlier at 5:26 the cleaner version is visible bot side because you have ally-and-wave cover before pressure continues, and by 18:50 and 20:44 you are still around mid turret with an ally and waves rather than a guaranteed forward structure. The leak is that you stayed in pressure mode after the safe payout stopped being clear; with a 6/3/6, 81 CS, 25-minute ranked line, the issue is not raw damage or a huge death count, it is low income plus unstable wave/tower conversion before the next forward click.",
      whyTrust: "This review is based on inspected 5:26, 16:55, 18:50, and 20:44 frames plus the League Client 6/3/6 and 81 CS stat line.",
      eventEvidence: "5:26 shows bot-side ally-and-wave cover; 16:55 shows Samira mid beside one ally, a nearby wave, a low allied mid turret, minimap, and a 12-16 team kill score; 18:50 and 20:44 show Samira still around mid turret with an ally and waves.",
      failureEvidence: "At 16:55 the visible state does not prove a free forward tower, a safe enemy blocker, or known enemy positions, so continuing pressure without first choosing wave clear, protected hit, or exit risks time loss instead of a permanent result.",
      mistakeTypes: [
        "mid wave/turret branch discipline",
        "low CS income stability",
        "ally-frontline check",
        "camera/map-state check",
        "reset after wave"
      ],
      goodThing: "At 5:26, 18:50, and 20:44 you are often near allies and waves instead of randomly fighting alone; keep using ally-and-wave cover.",
      focusTag: "forward-click branch",
      evidence: "Manual frame inspection of 5:26, 16:55, 18:50, and 20:44 plus League Client stats.",
      pattern: "The repeated issue is the branch after a wave or turret state appears: you can fight and stand with allies, but the next click has to prove a tower, blocker, wave, or reset before pressure continues.",
      diamondRule: "After 15 minutes, every forward click needs one visible branch: free tower, safe blocker, wave then recall, or leave.",
      drill: "Before each forward click after 15 minutes, say: turret, deaths, front body.",
      timeline: [
        "5:26 - Bot-side ally-and-wave cover before pressure continues.",
        "16:55 - Samira mid beside one ally near a low allied mid turret while team score is 12-16.",
        "18:50 - Samira remains around mid turret with an ally and a wave.",
        "20:44 - Samira and ally clear mid wave under turret."
      ],
      clockAnchors: [
        { clock: "5:26", videoSeconds: 348.308, description: "Bot-side ally-and-wave cover before pressure continues." },
        { clock: "16:55", videoSeconds: 1036.923, description: "Samira mid beside one ally near a low allied mid turret with wave and minimap visible." },
        { clock: "18:50", videoSeconds: 1151.692, description: "Samira and ally around mid turret with wave pressure nearby." },
        { clock: "20:44", videoSeconds: 1266.462, description: "Samira and ally clear mid wave under allied turret." }
      ],
      nuance: [
        "The visible issue is not pure mechanics; the 6/3/6 line shows fight impact exists.",
        "81 CS in 25 minutes is the income warning, so wave handling and resets matter as much as kills.",
        "The 16:55 frame does not prove all death timers or missing enemies, which is why the branch has to be conditional.",
        "The nearest permanent value is defending or converting the mid wave/turret state, not vague pressure.",
        "The next-game check is turret, ally deaths, and front body before the click."
      ],
      reviewLimit: "Manual frame review used 2 FPS sampled frames and cannot prove exact inputs, every enemy position, or every death timer; the branch is therefore conditional on visible tower, wave, ally, and minimap state.",
      secondaryFocus: "After 15 minutes, before any forward click, use camera/map-state discipline: closest threatened turret, ally deaths, and who can stand in front of me.",
      analysisSource: "manual"
    };
  }
  if (file === "auto_NA1-5566620104_01.mp4") {
    return {
      champion: "Cait",
      confidence: "high",
      feedbackTitle: "Cait deaths hide useful damage",
      feedback: "Mistake: you let playable Cait states become extra forward or side-value clicks before checking who could reach you, so deaths erased the pressure your lane damage was creating. Fix: after a wave, camp, or fight is handled, click back behind an allied body, check the nearest threatened turret/objective, and only continue if Cait can hit from max range.",
      gameDetail: "Around 2:16, Cait is bot with an allied duo and a minion wave while enemy pressure is visible elsewhere; the useful next click is to stay behind the wave and allied body, hit only max-range targets, then choose safe wave, tower hit, objective path, or reset instead of walking into another loose trade. The 0/5/6, 112 CS full-game line says the issue is not that you never join fights; it is that deaths are still too expensive for the pressure Cait creates. At 14:21 the ability bar shows Piltover Peacemaker, confirming this is Cait footage. After 15 minutes, every forward click needs one check first: who can reach me, which ally is between me and them, and what permanent payout this wave or fight buys.",
      whyTrust: "The champion identity is source-checked from the visible Cait HUD and Piltover Peacemaker frame, and the stat line is from League Client match history.",
      eventEvidence: "2:16 shows Cait's bot-side lane state with ally and wave cover; 14:21 shows the Cait ability bar with Piltover Peacemaker; the synced stat line is 0/5/6 K/D/A and 112 CS.",
      failureEvidence: "Cait had enough lane presence to be involved in fights, but the visible review and 0/5/6 stat line show deaths outvaluing the pressure; the failure is letting Cait become reachable before the next click has a safe target, ally body, or objective payout.",
      mistakeTypes: [
        "Cait spacing before forward clicks",
        "death-state exposure",
        "camera/map-state check",
        "wave or objective payout after pressure"
      ],
      goodThing: "You are still finding bot-lane presence and damage windows; keep using Cait's range and wave cover instead of abandoning pressure entirely.",
      focusTag: "Cait spacing and payout",
      evidence: "Manual champion-identity repair from the latest recording poster and anchors: Cait HUD, Piltover Peacemaker at 14:21, 0/5/6 K/D/A, 112 CS, and bot-lane wave states.",
      pattern: "The repeatable issue is not mechanics speed; it is letting a ranged champion become reachable before the map state is safe. Cait should make enemies walk through wave, ally bodies, traps, or tower pressure before she is a target.",
      diamondRule: "On Cait, if no ally or structure is between you and the enemy, the next click is back, not forward.",
      drill: "Next Cait game, before every camp, side wave, or forward fight after 15 minutes, check ally deaths, nearest threatened turret, and whether an ally can stand between Cait and the collapse.",
      timeline: [
        "2:16 - Cait is bot with allied duo and minion wave cover.",
        "14:21 - Cait ability bar shows Piltover Peacemaker, confirming the recording is Cait footage."
      ],
      clockAnchors: [
        { clock: "2:16", videoSeconds: 172.538, description: "Cait is bot with allied duo and minion wave cover while enemy pressure is visible elsewhere." },
        { clock: "14:21", videoSeconds: 762.423, description: "Cait is near turret with the ability bar showing Piltover Peacemaker." }
      ],
      nuance: [
        "Good: you are present for bot-side waves and fights instead of being absent from the game.",
        "Leak: Cait becomes reachable before the next click has ally cover, structure value, or a reset path.",
        "Consequence: 0/5/6 means deaths are costing more than the pressure is paying.",
        "Next check: if no ally body, trap line, wave, or turret separates Cait from the enemy, click back first.",
        "The second lane is camera/map-state checking, because this low-FPS review can judge positioning and pathing better than frame-perfect mechanics."
      ],
      reviewLimit: "This is a champion-identity and visible-state repair from sampled 2 FPS footage, not a full frame-perfect Cait mechanics review.",
      secondaryFocus: "Next Cait game, before every camp, side wave, or forward fight after 15 minutes, check ally deaths, nearest threatened turret, and whether an ally can stand between Cait and the collapse.",
      analysisSource: "manual"
    };
  }
  if (file === "auto_NA1-5566120017_01.mp4") {
    return {
      champion: "Samira",
      confidence: "high",
      feedbackTitle: "Six deaths from bad-state clicks",
      feedback: "Mistake: you kept looking for farm and side value after the map was already collapsing, so the enemy got to trade your jungle time into base pressure and another death. Fix: at the mistake timestamp, drop the camp or side wave and move to the closest base-defense line until teammates are alive.",
      gameDetail: "At 23:33, in a 1/6/1, 152 CS, 25-minute ranked game, you are taking a side jungle camp while enemies are pressuring through your side of the map; your job is to leave the camp, walk toward the inhibitor/base line, and clear only the wave that reaches turret instead of spending more seconds on camp gold. At 23:33 the feeding pattern is not that you never farm; it is that normal farm stays on the menu after the map state already says defend. At 25:30 the consequence is visible: you are dead, an allied turret has fallen, and enemies are inside the base area because every extra second on the camp left Samira away from the only place that could stop the push. At 17:42, the better shape briefly appears because you are mid with an ally and a wave; mid is better in that state because it is the shortest route to defend or hit structure and your ally can stand between Samira and a collapse. At 19:39 you are again near river with an ally, which is useful only if it turns into wave control, vision, or a safe fight. When you are behind or already dying a lot, one safe defensive wave is worth more than one jungle camp.",
      whyTrust: "The review is tied to the visible collapse frames and the scoreboard line: 1/6/1 with 152 CS, side-camp choice at 23:33, and death/base consequence at 25:30.",
      eventEvidence: "17:42 shows Samira mid with an ally and a wave; 19:39 shows Samira near river with an ally; 23:33 shows Samira alone on a side jungle camp while the enemy map state is pushing in; 25:30 shows Samira dead as an allied turret falls and enemies are in the base area.",
      failureEvidence: "At 23:33 Samira chooses a side jungle camp while the visible map state is already about base defense, so the failure is not farming in general; it is farming after the defend signal. By 25:30 the cost is visible because Samira is dead, an allied turret has fallen, and enemies are inside the base area.",
      mistakeTypes: [
        "side farm over base defense",
        "camera/map-state check",
        "shutdown or death-state exposure",
        "wave/objective defense timing"
      ],
      goodThing: "At 17:42 you did find the correct map lane with an ally and a mid wave; that is the shape to repeat before it turns into side-camp drift.",
      focusTag: "base defense over side farm",
      evidence: "Manual frame review of the latest ranked recording plus scoreboard context: 1/6/1, 152 CS, mid-wave setup at 17:42, river hover at 19:39, isolated side camp at 23:33, and death/base collapse at 25:30.",
      pattern: "The repeated mistake is not mechanics; it is treating a losing map as if normal farming still has equal value. The six deaths matter more than the extra camp, so the first climb target is leaving low-value farm before it becomes another death window.",
      diamondRule: "When the enemy can hit your base, defensive wave first, jungle camp second.",
      drill: "Next game, whenever an outer or inhibitor-side turret is threatened, say wave before camp and path to the structure line first.",
      timeline: [
        "17:42 - Samira is mid with an ally and a wave, which is the correct pressure or defense lane.",
        "19:39 - Samira is near river with an ally, close enough to help a mid or dragon-side fight.",
        "23:33 - Samira is alone on a side jungle camp while the enemy map state is threatening base pressure.",
        "25:30 - Samira is dead, an allied turret has fallen, and enemies are in the base area."
      ],
      clockAnchors: [
        { clock: "17:42", videoSeconds: 1057.692, description: "Samira is mid with an ally clearing a wave." },
        { clock: "19:39", videoSeconds: 1174.769, description: "Samira is near river with an ally before the next map collapse." },
        { clock: "23:33", videoSeconds: 1408.923, description: "Samira is taking a side jungle camp alone while the enemy side of the map is pressuring in." },
        { clock: "25:30", videoSeconds: 1526, description: "Samira is dead while an allied turret has fallen and enemies are inside the base area." }
      ],
      nuance: [
        "Good: the 17:42 mid wave with an ally is the map shape to keep.",
        "Stat read: 1/6/1 with 152 CS means the easiest improvement is cutting two preventable deaths, not farming less forever.",
        "Leak: at 23:33 the camp takes your champion away from the base-defense line.",
        "Consequence: by 25:30 you are dead and the enemy has converted pressure into your base.",
        "Next check: if a structure can fall before you finish the camp, leave the camp.",
        "The second visible lane is camera/map checking, not combo speed, because the 2 FPS capture is better for decisions than frame-perfect mechanics."
      ],
      reviewLimit: "This uses sampled 2 FPS frames, so it cannot judge exact combo speed or every cooldown. It can judge map state, side-camp timing, ally location, death state, and whether the next click protects base.",
      secondaryFocus: "Next game, before taking a camp after 15 minutes, glance at mid wave, death timers, and nearest threatened turret; if any are bad, leave the camp.",
      analysisSource: "manual"
    };
  }
  if (file === "auto_NA1-5565911037_01.mp4") {
    return {
      champion: "Samira",
      confidence: "high",
      feedbackTitle: "Losing fights need a next-click script",
      feedback: "Mistake: you kept playing messy or losing states as if one more fight would fix them, even when enemies were alive, your health was dropping, or teammates were dead. Fix: at the mistake timestamp, back out, clear only the safe wave, or wait behind the first ally before entering again.",
      gameDetail: "At 23:33 the mid push has turned into a crowded fight with three enemy bodies still in front of you and an enemy turret/base line behind them; your job is to stand behind the first ally, hit the nearest safe target or wave, and leave as soon as your health drops instead of staying available for the full re-engage. By 23:43 you are dead with multiple allies also down, so the leak is not that you lacked damage; the leak is that the fight continued after the safe damage window ended and gave the enemy a clean push back. At 24:20, when you respawn with several teammates still dead, do not run out looking for a fight or a side route; hold base, clear the closest wave under turret, and wait for at least two teammates to spawn. At 26:54 the same rule appears again with four allies dead: stop at the base/inhibitor line, do not walk up bottom jungle or lane, and only clear minions that enter tower range. The simple next-game script is fight from behind a body while the state is even, and when the state is losing, defend one safe wave until teammates are alive.",
      whyTrust: "The review is tied to the death-state frames: the game was already hard, so the fastest improvement is removing the extra deaths after the safe fight window is gone.",
      eventEvidence: "23:33 shows Samira behind a Baron-powered mid push with multiple enemy defenders still alive; 23:43 shows Samira dead after the fight continues; 24:20 shows Samira respawning while several teammates are still dead; 26:54 shows Samira moving out while four allies are dead.",
      failureEvidence: "At 23:33 the fight is already crowded with enemy defenders alive, so the safe damage window is ending. By 23:43 Samira is dead with allies also down; at 24:20 and 26:54 the visible failure repeats as forward movement starts while teammates are still dead instead of holding the base line.",
      mistakeTypes: [
        "spacing/entry discipline",
        "shutdown or death-state exposure",
        "base-defense wave timing",
        "forward pathing after allies die"
      ],
      goodThing: "At 19:52 you are in the better shape: allies are in front of Samira near mid, so you can damage from behind them instead of being the first body enemies reach.",
      focusTag: "losing-state discipline",
      evidence: "Manual frame review of the May 22 6:11 PM ranked game: mid fight setup at 23:33, death-state consequence at 23:43, respawn/base state at 24:20, and four-allies-dead defense state at 26:54.",
      pattern: "The repeated mistake is trying to solve a losing state by walking forward or staying in the fight. The higher-value habit is to switch from carry mode to damage-control mode the moment allies are dead, enemy tools are still available, or your HP no longer lets you survive a re-engage.",
      diamondRule: "When the state is losing, your next click is not hero damage; it is safe wave, base line, or wait for bodies.",
      drill: "Next game, say even or losing before every mid-game fight; if the answer is losing, your only allowed clicks are back, tower wave, or wait.",
      timeline: [
        "19:52 - Samira is behind allies near mid with enemies in front, which is the safer fight shape.",
        "23:33 - Samira is in a crowded mid-base fight with three enemy defenders alive and should play behind the first ally or exit.",
        "23:43 - Samira is dead after the fight continues and multiple allies are also down.",
        "24:20 - Samira respawns while several teammates are still dead, so the correct next job is hold base and clear only the closest safe wave.",
        "26:54 - Four allies are dead while Samira moves out; the correct line is base/inhibitor defense, not a forward side route."
      ],
      clockAnchors: [
        { clock: "4:55", videoSeconds: 238.154, description: "Samira is low in bot lane while the enemy duo is still in front and support is not parallel." },
        { clock: "7:16", videoSeconds: 355.231, description: "Samira is forward in bot lane while the enemy duo controls the space ahead." },
        { clock: "19:52", videoSeconds: 940.615, description: "Samira is behind allies near mid with enemies in front and a minion wave between teams." },
        { clock: "23:33", videoSeconds: 1128, description: "Samira is in a crowded mid-base fight with multiple enemy defenders still alive." },
        { clock: "23:43", videoSeconds: 1138, description: "Samira is dead after the mid-base fight continues and multiple allies are also down." },
        { clock: "24:20", videoSeconds: 1174.769, description: "Samira respawns in base while several teammates are still dead." },
        { clock: "26:54", videoSeconds: 1291.846, description: "Samira moves out bottom side while four allies are dead." }
      ],
      nuance: [
        "Good: the 19:52 shape is closer to correct because allies are between Samira and the enemy engage.",
        "Leak: the 23:33 fight continues after the safe damage window is gone.",
        "Consequence: by 23:43 Samira is dead with allies down, which gives the enemy room to push back instead of letting your team stabilize.",
        "Next check: if two or more allies are dead, switch to base defense and safe wave clear until bodies are back.",
        "The second visible lane is entry discipline and spacing over several seconds, not frame-perfect mechanics."
      ],
      reviewLimit: "This uses sampled 2 FPS frames, so it cannot judge exact combo speed, reaction time, or every cooldown. It can judge the visible fight state, ally death timers, spacing, and forward pathing.",
      secondaryFocus: "Next game, do not cross past your support/frontline until the enemy engage tool is used; at 4:55 and 7:16 the safer habit is last-hit from Q range and let the wave come to you.",
      analysisSource: "manual"
    };
  }
  if (file === "auto_NA1-5565964482_01.mp4") {
    return {
      champion: "Samira",
      confidence: "medium",
      feedbackTitle: "Mid wave needed a side check",
      feedback: "Mistake: you kept turning mid priority into another mid wave after the map was asking for a side-lane or objective check. Fix: after the mid wave is handled, move your camera first, then choose ally/objective movement or reset before touching the next wave.",
      gameDetail: "At 16:05 Samira is mid alone last-hitting after the wave is already under control; move the camera to both side lanes, then either path toward the closest ally/objective or reset instead of autoing the next neutral mid wave. The leak is not that mid farm is bad; it is that mid stayed as default farm when the wave had already bought you time to look elsewhere. At 9:46 the same neutral pattern appears at mid turret, and by 21:49 the game has already produced a death/reset cycle, so the bigger climb habit is to turn one handled mid wave into a map check before the next minion. This matters because mid priority only helps Samira climb if it becomes information, vision, structure access, or a safer reset before enemies get another collapse window.",
      whyTrust: "The visible anchors show repeated mid-wave time at 9:46, 16:05, 18:00, and 19:54, plus the later 21:49 respawn state, so the review is about map-use after mid wave rather than combo execution.",
      eventEvidence: "9:46 shows Samira auto-attacking a cannon minion at mid turret. 16:05 shows Samira last-hitting mid alone with no immediate structure hit. 18:00 and 19:54 show more mid movement/wave clear. 21:49 shows Samira leaving fountain after a death/reset state.",
      failureEvidence: "At 16:05 Samira uses the handled mid wave as permission to keep farming mid instead of checking the next side/objective state, so the wave priority leaks into autopilot time. By 21:49 the recording has reached a respawn cycle, which is the visible cost pattern when mid time does not become a useful map action soon enough.",
      mistakeTypes: [
        "mid wave autopilot",
        "camera/map-state check",
        "objective or side-lane conversion",
        "reset timing after priority"
      ],
      goodThing: "The strong part is that you kept finding mid waves and did not randomly abandon the lane; that wave control is useful when it becomes a map check.",
      focusTag: "mid priority check",
      evidence: "Manual repair from visible clock anchors: 9:46 mid cannon, 16:05 mid last-hit state, 18:00 and 19:54 repeated mid wave movement, and 21:49 respawn/reset state.",
      pattern: "The repeated mistake is not wave clearing itself. It is failing to spend the few seconds earned by wave clear on camera, side pressure, vision, or reset choice.",
      diamondRule: "After one safe mid wave, look side before touching the next one.",
      drill: "Next game, after every mid wave past 14 minutes, flick camera to both side lanes and death timers before autoing the next wave; if a fight or threatened turret is visible, leave mid.",
      timeline: [
        "9:46 - Samira is auto-attacking cannon minion at mid turret.",
        "16:05 - Samira is last-hitting mid alone after the wave is already under control.",
        "18:00 - Samira continues moving through mid after using a skillshot.",
        "19:54 - Samira clears another mid wave.",
        "21:49 - Samira leaves fountain after the game has reached a death/reset cycle."
      ],
      clockAnchors: [
        { clock: "9:46", videoSeconds: 576.115, description: "Samira auto-attacks a cannon minion at mid turret." },
        { clock: "16:05", videoSeconds: 919, description: "Samira last-hits minions in mid lane while alone." },
        { clock: "18:00", videoSeconds: 1033.808, description: "Samira moves in mid lane after using a skillshot." },
        { clock: "19:54", videoSeconds: 1148.231, description: "Samira clears a mid minion wave with one minion remaining." },
        { clock: "21:49", videoSeconds: 1262.654, description: "Samira runs from fountain into base after a respawn state." }
      ],
      nuance: [
        "Good: mid wave control gives you time and lane access.",
        "Leak: at 16:05 the wave is handled, but the next action is still more mid farming instead of a side/objective check.",
        "Consequence: the game later reaches a respawn state, so the review target is spending mid priority sooner.",
        "Next check: after one safe mid wave, look at side lanes and death timers before taking the next one."
      ],
      reviewLimit: "The 2 FPS review can judge repeated mid-wave state, map movement, and respawn timing. It cannot judge exact camera hotkey timing or frame-perfect mechanics.",
      secondaryFocus: "Next game, after every mid wave past 14 minutes, flick camera to both side lanes and death timers before autoing the next wave; if a fight or threatened turret is visible, leave mid.",
      analysisSource: "manual"
    };
  }
  if (file === "auto_NA1-5565818690_01.mp4") {
    return {
      champion: "Samira",
      confidence: "medium",
      feedbackTitle: "Won fight needed low-HP reset",
      feedback: "Mistake: after a fight win, you let the next state become another low-health stay instead of turning the win into recall, structure, or wave. Fix: if the fight is won and your HP is low, recall unless a free structure is already directly in front of your team.",
      gameDetail: "At 16:27 the cost is already visible: Samira is dead in mid river after the fight sequence, so your next-game script is reset immediately after a won fight when HP is low unless a free structure is already in front of the team. The leak is staying available after the useful part of the fight is over; stronger games turn that extra stay into a death timer before your gold or tempo becomes pressure. At 10:42 the earlier warning sign is visible in bot lane because both sides are still trading while you and your ally are low, so the smaller version of the same habit is one extra forward step after health already says stop. At 14:47 you are near a grouped objective fight, which is the kind of useful team shape to keep if the exit happens cleanly afterward.",
      whyTrust: "The visible anchors show a low-health trade pattern at 10:42, a grouped objective fight at 14:47, and the death timer at 16:27, so the review is about post-fight exit timing and HP-state discipline.",
      eventEvidence: "10:42 shows a bot-lane skirmish with both sides still trading and Samira plus ally low. 14:47 shows a grouped objective fight near dragon pit. 16:27 shows Samira dead with the death timer open while allies push mid.",
      failureEvidence: "At 16:27 Samira is dead after the mid-river fight sequence, so the visible failure is not refusing to fight; it is staying past the safe exit after the useful fight value is gone. The earlier 10:42 low-health lane trade shows the same HP-state habit before it becomes the later death timer.",
      mistakeTypes: [
        "reset/overstay discipline",
        "low-HP spacing",
        "post-fight exit timing",
        "shutdown or death-state exposure"
      ],
      goodThing: "The strong part is that you did join a grouped objective fight at 14:47 instead of only playing side farm.",
      focusTag: "low hp reset",
      evidence: "Manual repair from visible clock anchors: 10:42 low-health bot trade, 14:47 grouped objective fight, and 16:27 death timer after the fight sequence.",
      pattern: "The repeated mistake is not being afraid to fight. It is failing to switch from fight mode to exit mode once health and payout say the useful part is over.",
      diamondRule: "Won fight plus low HP means recall unless the structure is free now.",
      drill: "Next game, after any won fight, check HP before clicking forward; if one spell can kill you and no free structure is on-screen, recall.",
      timeline: [
        "10:42 - Samira and ally are low while the bot-lane trade is still continuing.",
        "14:47 - Samira is near a grouped objective fight around dragon pit.",
        "16:27 - Samira is dead in mid river with the death timer visible while allies push mid."
      ],
      clockAnchors: [
        { clock: "10:42", videoSeconds: 508.615, description: "Bot-lane skirmish continues while Samira and ally are low health." },
        { clock: "14:47", videoSeconds: 710.462, description: "Samira is near a grouped objective fight around dragon pit." },
        { clock: "16:27", videoSeconds: 811, description: "Samira is dead with the death timer visible while allies push mid." }
      ],
      nuance: [
        "Good: the 14:47 grouped objective fight is a useful team shape.",
        "Leak: at 16:27 the won-fight value has turned into a death timer instead of a clean reset.",
        "Consequence: low HP makes the next forward click more expensive than the next wave or camp can repay.",
        "Next check: after a won fight, HP decides whether the next click is forward or recall."
      ],
      reviewLimit: "The 2 FPS review can judge HP-state, fight aftermath, death timer, and grouped objective shape. It cannot judge exact spell cooldowns or combo timing.",
      secondaryFocus: "Next game, in lane and river fights, stop taking the next forward step once health is below one enemy spell; hold behind ally or wave until the threat is used.",
      analysisSource: "manual"
    };
  }
  if (file === "auto_NA1-5565387627_01.mp4") {
    return {
      champion: "Samira",
      confidence: "high",
      feedbackTitle: "Turn the shutdown into a grouped push",
      feedback: "Mistake: after spending a huge lead, you let side fights test your shutdown before your team was set up to take tower or base. Fix: choose the safest visible payout first: group with the wave and allies, hit free structure, or reset if teammates cannot follow.",
      gameDetail: "At 09:11 you are in base/shop after a strong 4/0/2 start, and that part is good because you spend instead of dragging raw gold around. At 10:25 you are 6/0/2 with 1285 gold in a bot-side lane fight right after a shutdown, so the leak is testing the fed Samira shutdown before the team is organized around tower, objective setup, or reset. At 11:12 the better shape appears: you are grouped mid behind allies with enemies in front because allies protect the entry and mid points the lead toward towers/base instead of fog collapse. At 12:42 you are 8/0/2 mid while several allies are dead or on timers, so the next check is wait, reset, or hold the wave until the next push is together. By 13:10 and 13:24 you enter base with the team; make the earlier 10:25 and 12:42 windows look like that team-linked ending sooner.",
      whyTrust: "The frames show both the good habit and the leak: you bought at 09:11 and ended with the team at 13:24, but the risky windows were the side-fight exposure at 10:25 and the alone-before-team state at 12:42.",
      eventEvidence: "09:11 shows Samira in shop after a 4/0/2 start with Immortal Shieldbow visible and low remaining gold. 10:25 shows Samira 6/0/2 in bot-side lane during a shutdown message with enemies and a wave still present. 11:12 shows Samira grouped mid behind allies while enemies are in front. 12:42 shows Samira 8/0/2 mid while multiple allies are dead or on timers. 13:10 to 13:24 shows the team turning the lead into enemy-base damage.",
      goodThing: "You did spend, you did group with allies, and you did end through the base. The improvement is protecting the shutdown lead between those good moments.",
      focusTag: "shutdown lead conversion",
      evidence: "Manual frame review of the May 21 queued auto capture: shop/spend at 09:11, side-fight shutdown state at 10:25, grouped mid pressure at 11:12, unsynced mid wave with ally death timers at 12:42, and base conversion at 13:10-13:24.",
      pattern: "The repeated climb leak is letting a won personal lead pass through extra side fights before the next team objective is organized. The fix is not always mid; it is whichever visible route turns the lead into structure, objective setup, or a clean reset with the least shutdown exposure.",
      diamondRule: "After a big Samira spend, do not take a fair side fight until you have first checked the guaranteed payout: group, structure, objective, or reset.",
      drill: "When you are 4/0 or better, say payout first before accepting the next side fight.",
      timeline: [
        "09:11 - Samira is in shop after a 4/0/2 start with Immortal Shieldbow visible and low remaining gold.",
        "10:25 - Samira is 6/0/2 in bot-side lane during a shutdown message with enemies and a wave still present.",
        "11:12 - Samira is grouped mid behind allies while enemies are in front, which is the safer pressure shape.",
        "12:42 - Samira is 8/0/2 mid while multiple allies are dead or on timers, making sync/reset more important than another solo wave.",
        "13:10 - The team is entering the enemy base area together.",
        "13:24 - Samira and allies hit the enemy base as the conversion finally becomes clean."
      ],
      clockAnchors: [
        { clock: "09:11", videoSeconds: 234.217, description: "Samira is in base shop after a 4/0/2 start with Immortal Shieldbow visible and low remaining gold." },
        { clock: "10:25", videoSeconds: 249.565, description: "Samira is 6/0/2 in bot-side lane during a shutdown message with enemies and a wave still present." },
        { clock: "11:12", videoSeconds: 278.375, description: "Samira is grouped mid behind allies while multiple enemies are in front." },
        { clock: "12:42", videoSeconds: 318.75, description: "Samira is 8/0/2 mid while multiple allies are dead or on timers." },
        { clock: "12:54", videoSeconds: 326.304, description: "Samira is still moving through the next mid/side pressure window with the shutdown lead." },
        { clock: "13:10", videoSeconds: 341.652, description: "Samira and allies reach the enemy base area together." },
        { clock: "13:24", videoSeconds: 355.25, description: "Samira and allies convert inside the enemy base." }
      ],
      nuance: [
        "Good: the 09:11 shop frame shows you did spend your lead instead of ignoring items.",
        "Good: the 11:12 and 13:24 frames show you can play behind allies and convert the base with the team.",
        "Leak: the 10:25 side fight keeps the shutdown lead exposed before the next objective state is clean.",
        "Meaning: conversion is the concrete payout after the fight, not a vague call; it is tower, base, objective setup, or reset.",
        "Why mid here: at 11:12 allies are already mid and enemies are in front, so mid lets teammates protect Samira and turns the lead toward structure faster than another side-lane fight.",
        "Master-climb punishment: better enemies do not need many openings; one side re-fight or one late solo wave is enough to take your shutdown."
      ],
      reviewLimit: "This review uses sampled visible frames and game-clock anchors. It does not infer hidden clicks, voice calls, or cooldowns that are not visible in the recording.",
      analysisSource: "manual"
    };
  }
  if (file === "auto_NA1-5565445744_01.mp4") {
    return {
      champion: "Samira",
      confidence: "high",
      feedbackTitle: "Spend the base win before the next fight",
      feedback: "Mistake: after turning the lead into enemy-base pressure, you kept the next fight window alive while carrying a large unspent shutdown. Fix: after the base kill or tower damage, reset unless nexus is immediately finishable.",
      gameDetail: "At 1:31 you are already farming bot safely with the wave in front, and by 3:23 you take the first bot-side fight instead of only bleeding CS; that early pressure is good. At 4:36 you correctly turn the lane win into bot tower damage with allies and minions, and at 6:56 you are still converting through bot-side structure pressure. The leak starts after the map is already cracked: at 9:47 you are walking near the enemy base with multiple enemies alive, and at 10:36 you get another kill inside the base while holding about 2497 gold. That fight works in beginner bots, but the Master-climb reason to reset is simple: unspent gold is not real power yet, and giving a shutdown before buying would erase the tempo you already earned. At 12:21 you are back on the map after spending, which is the cleaner version; the repeatable rule is base damage or a base kill first, then spend the gold unless the nexus is free right now.",
      whyTrust: "The evidence is tied to visible state: wave-first lane pressure, tower conversion, then a large unspent-gold base fight before the reset.",
      eventEvidence: "1:31 shows Samira safely farming bot with wave control. 4:36 shows Samira hitting bot tower with allies and minions. 9:47 shows Samira near the enemy base while enemies are still alive. 10:36 shows a base kill while Samira is holding about 2497 gold. 12:21 shows Samira back on the map after spending.",
      goodThing: "You did convert the lane lead into tower/base pressure instead of only chasing kills.",
      focusTag: "spend after base payout",
      evidence: "Manual frame review of the May 21 full-game clip: 1:31 bot wave control, 4:36 bot tower conversion, 9:47 enemy-base pressure, 10:36 base kill with about 2497 gold, and 12:21 post-spend map return.",
      pattern: "The improvement is real: you are finding waves, towers, and the base. The next leak is staying available for one more base fight after the payout while your gold is still unspent.",
      diamondRule: "After a base kill or structure payout, reset with big gold unless the nexus is free on the current wave.",
      drill: "Next game, when your gold is above 2000 after a base fight, say 'nexus or reset' before clicking forward.",
      timeline: [
        "1:31 - Samira farms bot with wave in front.",
        "3:23 - Samira takes the first bot-side fight window.",
        "4:36 - Samira and allies hit bot tower.",
        "6:56 - Samira keeps structure pressure bot side.",
        "9:47 - Samira is near the enemy base with defenders alive.",
        "10:36 - Samira gets a base kill while holding about 2497 gold.",
        "12:21 - Samira is back on the map after spending."
      ],
      clockAnchors: [
        { clock: "1:31", videoSeconds: 4, description: "Samira farms bot safely with wave in front." },
        { clock: "3:23", videoSeconds: 76.826, description: "Samira takes the first bot-side fight window." },
        { clock: "4:36", videoSeconds: 149.652, description: "Samira and allies hit bot tower with minions." },
        { clock: "6:56", videoSeconds: 182.875, description: "Samira keeps bot-side structure pressure after the lane win." },
        { clock: "9:47", videoSeconds: 251.609, description: "Samira walks near the enemy base while defenders are alive." },
        { clock: "10:36", videoSeconds: 295.304, description: "Samira gets a base kill while holding about 2497 gold." },
        { clock: "12:21", videoSeconds: 339, description: "Samira is back on the map after spending." }
      ],
      nuance: [
        "Good: you converted early lane pressure into bot tower and later base pressure.",
        "Leak: the extra base fight happened before the big gold was spent.",
        "Consequence: stronger enemies punish that by taking shutdown gold before your lead becomes items.",
        "Next check: after a base payout, choose nexus now or reset now."
      ],
      reviewLimit: "This review uses visible replay frames and match-clock anchors; it cannot prove exact clicks or voice comms.",
      analysisSource: "manual"
    };
  }
  if (file === "auto_NA1-5565308644_01.mp4") {
    return {
      champion: "Samira",
      confidence: "high",
      feedbackTitle: "Base break became a delayed sync",
      feedback: "Mistake: after the base was cracked, you let the next minute become mid-wave cleanup and a late rejoin instead of an immediate finish-or-reset call. Fix: once the inhibitor/nexus area opens, say finish, reset, or sync next wave before touching another mid wave.",
      gameDetail: "At 11:12 you and your team are already inside the enemy base with the structure line cracked, so the objective habit is real and that part is good. At 11:27 you correctly fight with allies in the base and get the takedown instead of chasing somewhere useless. At 11:47 the next decision point appears: the tower is down, you have about 3034 gold, minions and allies are still in the base, and the clean Master-climb call is either finish now or reset on the same timing as the team. At 12:32 and 12:42 you are back mid collecting waves after spending, which means the old reset critique was too vague; the actual leak is that the next base hit is no longer clearly synced. By 12:52 your team is fighting again near the opened base while you are still arriving from mid, and at 13:00 the rejoin works in this game, but stronger teams use that delay to clear waves, respawn, or collapse on the late carry. The lesson is: after base breaks, do not let a correct reset turn into a disconnected re-entry.",
      whyTrust: "The evidence changes the diagnosis: visible gold drops after the base break, so the mistake is not simply refusing to spend; it is losing team sync on the next push.",
      eventEvidence: "11:12 shows the base already cracked with Samira and allies inside; 11:27 shows the base fight working with allies; 11:47 shows about 3034 gold and a fresh tower-down window; 12:32 to 12:42 shows mid-wave cleanup after spending; 12:52 to 13:00 shows the late rejoin into the next base fight.",
      goodThing: "You did create real base pressure with the team and appear to spend before the next mid wave; the fix is the re-entry timing after that, not pretending the whole sequence was bad.",
      focusTag: "base re-entry sync",
      evidence: "Manual frame review of the May 21 8:23 PM auto capture: base pressure at 11:12 and 11:27, tower-down/gold state at 11:47, mid-wave cleanup at 12:32-12:42, and rejoin at 12:52-13:00.",
      pattern: "The repeated climb leak is not only chasing; it is letting a won base state turn into an unclear next state. Once the base is open, every next action should preserve finish pressure, reset value, or team sync.",
      diamondRule: "After a base break, the next wave only matters if it syncs the next base hit.",
      drill: "After inhibitor/base pressure, call one word before the next click: finish, reset, or sync.",
      timeline: [
        "11:12 - Samira and allies are already inside the enemy base with the structure line cracked.",
        "11:27 - Samira takes the base fight with allies and converts a takedown.",
        "11:47 - The tower is down, Samira has about 3034 gold, and the clean call is finish now or reset together.",
        "12:32 - Samira is mid with low spent-down gold, so the old no-reset critique is not fully supported.",
        "12:52 - The team is fighting again near the opened base while Samira is arriving from mid.",
        "13:00 - The rejoin works here, but it is the delay window stronger teams punish."
      ],
      clockAnchors: [
        { clock: "11:12", videoSeconds: 300, description: "Samira and allies are inside the enemy base as an enemy structure falls." },
        { clock: "11:27", videoSeconds: 315, description: "Samira fights with allies in the enemy base and converts another takedown." },
        { clock: "11:47", videoSeconds: 335, description: "The base tower is down, Samira has about 3034 gold, and allies/minions are still in base." },
        { clock: "12:32", videoSeconds: 345, description: "Samira is back mid collecting a wave after spending down to low gold." },
        { clock: "12:42", videoSeconds: 355, description: "Samira continues mid-wave cleanup after the base break." },
        { clock: "12:52", videoSeconds: 365, description: "Allies are fighting near the opened base while Samira is still arriving from mid." },
        { clock: "13:00", videoSeconds: 373, description: "Samira rejoins the fight near the enemy base as the cleanup succeeds." }
      ],
      nuance: [
        "Good: the base break and first base fight are real objective conversion, not random fighting.",
        "Correction: the old review overclaimed that you failed to spend; the frame evidence shows your gold drops before the next mid wave.",
        "Leak: after spending, the next action becomes mid-wave cleanup and a delayed rejoin instead of a clearly synced next base hit.",
        "Master-climb punishment: stronger teams use the delay between 12:32 and 12:52 to clear the wave, respawn, or catch the carry arriving late.",
        "Next check: after base breaks, every wave must answer whether it creates the next synced base hit."
      ],
      reviewLimit: "This review uses sampled visible frames, not raw clicks or comms. The exact recall channel is not visible, so the critique is narrowed to the visible spend-down and re-entry sync window.",
      analysisSource: "manual"
    };
  }
  if (file === "auto_NA1-5565242641_01.mp4") {
    return {
      champion: "Samira",
      confidence: "high",
      feedbackTitle: "Base win becomes side chase",
      feedback: "Mistake: after the base was cracked, you kept accepting second and third fights away from the cleanest payout. Fix: after inhibitor/base pressure, call the state out loud: free structure, body blocking structure, or reset; only fight if it directly protects one of those.",
      gameDetail: "At 20:58 you are already in the enemy base with an open lane and enough damage to keep the push moving; that part is good objective pressure, not the mistake. At 21:14 the fight has paid you, two allies are dead, and you are holding about 2700 unspent gold, so the next Master-climb decision is to reset or regroup instead of staying available for the next collapse. At 22:27 you run down bot side alone with the base still cracked, which leaks the map win into travel time and gives enemies another respawn window. The clearest mistake is the 27:08 to 27:12 chase into the side jungle after the base is already open; by 27:56 you are back in the base brawl at low HP with multiple defenders alive, which is exactly how a won beginner-bot base sequence becomes a shutdown or stall in harder games. The lesson is not stop fighting forever; it is stop fighting unless the fight removes the body between you and the structure.",
      whyTrust: "The evidence separates the good habit from the leak: you did get to the enemy base, but the later side chase and low-HP re-entry are the parts that stop the same lead from converting cleanly against stronger players.",
      eventEvidence: "20:58 Samira is in the enemy base hitting through minions and defenders. 21:14 shows the won fight plus about 2700 unspent gold. 22:27 shows a solo bot-side drift after base pressure. 27:08 to 27:12 shows the chase away from structures. 27:56 shows the low-HP re-entry into multiple defenders.",
      goodThing: "You repeatedly found the base and created real ending pressure; the mistake is what happened after the first payout, not the fact that you went to objectives.",
      focusTag: "base conversion discipline",
      evidence: "Manual frame review of the queued May 21 full-game clip: visible base pressure at 20:58 and 21:14, solo bot-side drift at 22:27, side-jungle chase at 27:08-27:12, and low-HP base re-entry at 27:56.",
      pattern: "The recurring leak is post-win state switching. You win enough of the first fight, then spend the next seconds on a side chase, extra body, or low-HP re-entry instead of choosing reset, regroup, or structure.",
      diamondRule: "After a base win, every click must be one of three things: hit free structure, kill the body blocking structure, or reset with the gold.",
      drill: "Next game, after inhibitor/base pressure, say 'free, blocked, or reset' before every forward click for the next 20 seconds.",
      timeline: [
        "20:58 - Samira is in the enemy base with allied pressure and an open lane; this is the objective habit to keep.",
        "21:14 - The fight has paid out, two allies are dead, and Samira has about 2700 gold; the clean next decision is reset or regroup.",
        "22:27 - Samira runs bot side alone after the base has already been cracked, leaking pressure into travel time.",
        "27:08 - Samira and an ally chase into the side jungle while the enemy base remains the actual payout.",
        "27:12 - The chase continues away from structures instead of removing only the body blocking the push.",
        "27:56 - Samira re-enters a base fight at low HP into multiple defenders, the exact shutdown/stall pattern to cut."
      ],
      clockAnchors: [
        { clock: "20:58", videoSeconds: 750, description: "Samira is inside the enemy base with allied pressure and defenders nearby." },
        { clock: "21:14", videoSeconds: 765.043, description: "Samira is clearing in the enemy base after a won sequence with about 2700 unspent gold." },
        { clock: "22:27", videoSeconds: 812.609, description: "Samira is running alone down bot side after the base pressure." },
        { clock: "24:35", videoSeconds: 901.875, description: "Samira is low near the enemy base while several defenders are still present." },
        { clock: "27:08", videoSeconds: 1002.87, description: "Samira and an ally chase an enemy into the side jungle away from structures." },
        { clock: "27:12", videoSeconds: 1006.875, description: "The chase continues around the jungle wall instead of directly converting base pressure." },
        { clock: "27:56", videoSeconds: 1050.435, description: "Samira is back in the base fight at low HP with multiple defenders alive." }
      ],
      nuance: [
        "Good: you did route the game to the enemy base and created real end pressure.",
        "Leak: after the first payout, you stayed in fight mode instead of switching to reset/regroup/structure mode.",
        "What happened: the lead turned into extra travel, side jungle chasing, and low-HP re-entry instead of a clean close.",
        "Master-climb punishment: stronger players turn that low-HP second fight into shutdown gold, wave clear, and a stalled end.",
        "Next check: if the enemy is not directly blocking the structure, stop chasing and either hit the structure or reset."
      ],
      reviewLimit: "The recording has some non-League desktop frames from full-desktop capture, so this review uses only visible League frames as evidence and does not infer clicks during desktop portions.",
      analysisSource: "manual"
    };
  }
  if (file === "16-10_NA1-5564259818_01.webm") {
    return {
      champion: "Samira",
      confidence: "high",
      feedbackTitle: "Finish-window all-in",
      feedback: "Mistake: over-learning this clip would make you throw; the same dash is bad if it starts without wave, teammate body, or nexus pressure. Fix: full send only when every reset moves toward the payout.",
      gameDetail: "At 14:21 the fight is already in their base, not in river or a side lane: allies and minions are in front, enemy defenders are packed near nexus, and Samira is close enough to chain resets without walking into fog. At 14:27 the first two kills land and the play becomes a real cleanup instead of a random chase. At 14:33 the chain reaches triple, at 14:38 the quadra happens beside the nexus area, and at 14:41 the penta lands because the fight never leaves the ending window. Learn this exactly: the all-in is good when the map is already ending; outside that condition, take the tower, wave, objective, or recall before another fight.",
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
      gameDetail: "Around 12:10 Samira is low below the enemy base entrance while allies are already fighting inside the cracked base; the next valuable movement is backward-to-safe or forward-to-structure with the team, not a solo side angle. Around 13:05 the map slows down: Mordekaiser walks away mid, an ally is channeling recall, and Samira is full HP with the lane already open, which is exactly the moment to choose wave/base route before another target appears. Around 13:15 the camera follows Mordekaiser again and Samira casts Q/Flair into him from close range; the spell connects, but the leak is that the fight is sideways while the open base is still the real payout. Around 14:19 the clean version finally shows up: multiple enemies are dead, minions are in the base, Samira is behind the front body, and the team is hitting the ending area instead of wandering after another duel. The lesson is to treat the open base as the destination and only fight bodies that block that destination.",
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
        { clock: "11:51", videoSeconds: 9.300, description: "Samira is near the enemy base approach before the cracked-base decision window." },
        { clock: "12:10", videoSeconds: 27.800, description: "Samira is low below the enemy base entrance while allies are already inside the cracked base." },
        { clock: "13:05", videoSeconds: 83.300, description: "The map slows as Mordekaiser walks away mid and an ally channels recall." },
        { clock: "13:15", videoSeconds: 92.500, description: "Samira follows Mordekaiser with Q/Flair during a sideways mid fight while the open base remains the payout." },
        { clock: "13:52", videoSeconds: 129.500, description: "Samira is rotating back through mid toward the open-base pressure window." },
        { clock: "14:01", videoSeconds: 138.800, description: "Allies and minions are moving back toward the enemy base for the ending push." },
        { clock: "14:10", videoSeconds: 148.000, description: "The team is grouped near the enemy base with minions available to pressure structures." },
        { clock: "14:19", videoSeconds: 157.300, description: "Multiple enemies are dead, minions are inside the base, and Samira is behind the front body for the finish." }
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
      feedback: "Mistake: you keep playing for another fight after the first win. Fix: take wave, tower, reset, or end before touching another champion.",
      gameDetail: "Honest read: this is improved, but the same leak keeps coming back after the good moment. Around 1:24 Samira is fighting under the friendly bot tower with Jinx and Braum still on screen; the movement is forward into a contested lane pocket while the safer value is to thin the wave, hold the tower line, and make them walk into you. Around 7:58 the good version happens: the bot push is already under enemy tower, the wave is with you, and the won pressure turns into turret damage instead of another random chase. Around 10:32 Samira is low in bot lane while Braum and Jinx can still answer, so every extra step forward is a shutdown invitation unless the next click is reset or structure. Around 12:44 the punishment is visible: the fight is still extended near the enemy side, crowd control lands, and the screen shows a shutdown instead of a clean wave/tower/reset branch. The lesson is not to fight less; it is to make the first won fight buy the wave, turret, reset, or end before accepting the second one.",
      whyTrust: "The same game shows both sides: turret conversion is the right version, and the later low-health re-fight is how stronger opponents get shutdown gold back.",
      eventEvidence: "1:24 contested fight under friendly bot tower; 7:58 won bot push becomes turret damage; 10:32 low-health lane stay; 12:44 crowd control and shutdown punish the extended fight.",
      goodThing: "The good part was real: you turned one bot-side win into turret pressure instead of only chasing kills.",
      focusTag: "payout before dash",
      evidence: "Manual storyboard review of the May 18 8:10 PM game: early bot pressure, double-kill conversion, turret take, inhibitor take, and nexus pressure.",
      pattern: "The damage is already there. The leak is the second decision: after the first win, you often accept another fight before the map payout is locked.",
      diamondRule: "First win buys wave, tower, reset, or end before the next fight is allowed.",
      drill: "After the first kill or forced recall, say wave, tower, reset, or end before moving forward.",
      timeline: [
        "1:24 - Early bot fight is still near friendly tower with both lane enemies able to answer.",
        "7:58 - Bot pressure becomes turret, which is the good conversion.",
        "10:32-12:44 - Low-health extended fighting replaces the clean wave/tower/reset branch."
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
        "At 10:32 Samira is low while Braum is still present; that is a wave/tower/reset moment, not a retest moment.",
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
      feedbackTitle: "Pressure mode after payout vanished",
      feedback: "Mistake: you stayed in pressure mode after the safe wave or tower payout stopped being clear. Fix: before any forward click, check closest threatened turret, ally deaths, and who can stand in front; hit tower if free, hit only the blocker if safe, push or clear wave then recall, or leave.",
      gameDetail: "At the first visible mid-game pressure window, Samira needs a branch before the forward click: hit tower if it is free, hit only the enemy body blocking tower if an ally can stand in front, push or clear the wave then recall if wave is the only guaranteed value, or leave if none of those are true. The leak is staying in pressure mode after the safe payout is no longer proven, because that turns a playable wave or tower state into enemy time, another collapse window, or a lost reset. The next useful rep is not a slogan; it is checking closest threatened turret, ally deaths, and front body before the click.",
      whyTrust: "The visible frames and client stats show whether Samira is getting damage, deaths, CS, and wave/tower value; the review is about protecting that pressure with a concrete next-click branch.",
      eventEvidence: "",
      goodThing: "You are finding fights and creating damage pressure; keep that, but attach each forward click to a visible wave, tower, objective, or reset branch.",
      focusTag: "overstay control",
      evidence: "",
      pattern: "The carry score says damage is available, so the rank leak is the exact branch after a wave, tower, fight, or reset state appears.",
      diamondRule: "After 15 minutes, every forward click needs one visible branch: free tower, safe blocker, wave then recall, or leave.",
      drill: cleanerWinExitRep.replace(/^Rep\s*:\s*/i, ""),
      nuance: ["High kills only matter when the next click creates tower, wave, objective, reset, or base value.", "Low CS makes every unclear forward click more expensive because income is already unstable."],
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
      focusTag: "shutdown protection"
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

async function requestOpenAiJson(prompt, images, maxOutputTokens = 1800) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      store: false,
      max_output_tokens: maxOutputTokens,
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
  return parseJsonText(extractOutputText(await response.json()));
}

function analysisSpecificityIssues(parsed, context = {}) {
  const feedback = coachClean(parsed?.feedback, "");
  const gameDetail = coachClean(parsed?.gameDetail, "");
  const eventEvidence = coachClean(parsed?.eventEvidence, "");
  const secondaryFocus = coachClean(parsed?.secondaryFocus || parsed?.secondaryImprovement, "");
  const mistakeTypes = cleanList(parsed?.mistakeTypes, 5);
  const failureEvidence = coachClean(parsed?.failureEvidence, "");
  const pattern = coachClean(parsed?.pattern, "");
  const nuance = cleanList(parsed?.nuance, 5);
  const combined = [feedback, gameDetail, eventEvidence, failureEvidence, secondaryFocus, pattern, mistakeTypes.join(" "), nuance.join(" ")].join(" ");
  const issues = [];
  const isAutoFullReview = /^auto_/i.test(context.file || "") && Number(context.duration || 0) >= 90;
  const hasStats = Number.isFinite(Number(context.kills)) &&
    Number.isFinite(Number(context.deaths)) &&
    Number.isFinite(Number(context.assists)) &&
    Number.isFinite(Number(context.cs));
  if (!(/\bThe leak is(?:\s+that)?\b[\s\S]{40,}/i.test(feedback) || /Mistake:\s*\S+[\s\S]*Fix:\s*\S+/i.test(feedback))) {
    issues.push("feedback must name the leak in one direct red sentence");
  }
  if (gameDetail.length < 180) {
    issues.push("gameDetail too short for a useful decision-chain recap");
  }
  if (!eventEvidence || eventEvidence.length < 60) {
    issues.push("eventEvidence must name visible proof");
  }
  if (isAutoFullReview && (!failureEvidence || failureEvidence.length < 80)) {
    issues.push("failureEvidence must spell out the visible proof of failure, not only the recommendation");
  }
  if (isAutoFullReview && mistakeTypes.length < 3) {
    issues.push("mistakeTypes must list at least three distinct mistake lanes visible or honestly limited by the recording");
  }
  if (!/\b(leak|cost|punish|punished|shutdown|tempo|missed|risk|risky|death|died|gave|lost|blocked|consequence|happened)\b/i.test(combined)) {
    issues.push("missing leak or consequence");
  }
  if (!/\b(then|after|before|because|instead|next|when)\b/i.test(gameDetail)) {
    issues.push("missing decision sequence");
  }
  if (isAutoFullReview && !/\b(because|so that|this matters because|the reason|which makes|which means|which proves|meaning|means|so\s+(?:the|a|every|your|you))\b/i.test(gameDetail)) {
    issues.push("gameDetail must explain why the advice is correct, not only what to do");
  }
  if (isAutoFullReview && /\b(sync(?:ed|ing)?|conversion|convert|grouped mid|group mid|mid pressure)\b/i.test(gameDetail) && !/\b(mean|means|meaning|because|so that|the reason|this matters because)\b/i.test(gameDetail)) {
    issues.push("gameDetail uses coaching shorthand without a plain-language explanation");
  }
  if (isAutoFullReview && /\b(grouped mid|group mid|mid pressure)\b/i.test(gameDetail) && !/\b(mid[^.]*because|because[^.]*mid|mid[^.]*shortest|mid[^.]*team|mid[^.]*allies|mid[^.]*base|mid[^.]*tower|mid[^.]*fog|mid[^.]*collapse)\b/i.test(gameDetail)) {
    issues.push("gameDetail must explain why mid/grouping is better in this map state");
  }
  if (isAutoFullReview && !hasTimestampedActionScript(gameDetail)) {
    issues.push("gameDetail must include a timestamped replacement action script");
  }
  if (isAutoFullReview && !hasKeyTimestampClickRule(gameDetail)) {
    issues.push("gameDetail must start with one key timestamp sentence containing visible state and the exact next click");
  }
  if (isAutoFullReview && !/\b(legal|illegal|not automatically wrong|partly legal|mostly legal|setup expires|setup is gone)\b/i.test(gameDetail)) {
    issues.push("gameDetail must judge entry legality at the key timestamp");
  }
  if (isAutoFullReview && !/\b(value|dragon|baron|objective|tower|turret|wave|recall|group|state flip|state flips|first bad next click|setup expires|setup is gone)\b/i.test(gameDetail)) {
    issues.push("gameDetail must separate value, state flip, and correct branch");
  }
  if (isAutoFullReview && /\b(?:mistake category|correct next click)\s*:/i.test(gameDetail)) {
    issues.push("gameDetail uses labels instead of natural replay-coaching prose");
  }
  if (isAutoFullReview && !/^Rep\s*:/i.test(coachClean(parsed?.secondaryFocus || parsed?.drill || ""))) {
    issues.push("secondaryFocus must be one pink next-game Rep sentence");
  }
  if (isAutoFullReview && gameDetail.length > 850) {
    issues.push("gameDetail is too long for the tight single-paragraph review");
  }
  if (isAutoFullReview && repeatedPayoutChecklistCount(combined) > 1) {
    issues.push("visible review repeats the payout checklist instead of saying it once");
  }
  if (isAutoFullReview && /\bcurrent-match\b|\breview frame\b|\bbranch before any forward click\b/i.test(combined)) {
    issues.push("visible review uses generic review-frame or broad branch wording");
  }
  if (isAutoFullReview && /\b(?:map cash[-\s]?outs?|cash(?:ing)? (?:those )?(?:wins|moments|it)? ?out(?:s)? cleaner|cash[-\s]?out timing|cleaner map|wrong task after the map state changes|call free structure, blocked structure, or reset)\b/i.test(combined)) {
    issues.push("visible review uses abstract cash-out wording instead of exact branch rules");
  }
  if (isAutoFullReview && /\b(tower|turret|structure|wave|inhib|inhibitor|nexus|payout|pressure)\b/i.test(combined) && !/\b(?:free tower|tower is free|hit tower|body blocks|blocker|push or clear|clear the wave|wave then recall|leave if none|closest threatened turret|who can stand in front)\b/i.test(combined)) {
    issues.push("structure/wave review must separate concrete branch options");
  }
  if (isAutoFullReview && hasStats && !/\b\d+\s*\/\s*\d+\s*\/\s*\d+\b[\s\S]{0,120}\bCS\b|\bCS\b[\s\S]{0,120}\b\d+\s*\/\s*\d+\s*\/\s*\d+\b/i.test(combined)) {
    issues.push("full-game review with client stats must include K/D/A and CS context");
  }
  const unverifiedNames = unverifiedChampionNames(combined, [parsed?.champion || "Unknown"]);
  if (isAutoFullReview && unverifiedNames.length) {
    issues.push(`visible feedback names unverified champion(s): ${unverifiedNames.join(", ")}; use ally/enemy/team unless roster evidence is verified`);
  }
  if (isAutoFullReview && hasExactJungleBuffName(combined)) {
    issues.push("visible feedback names an exact jungle buff without verified camp evidence; use jungle camp unless the camp label is verified");
  }
  if (/\b(?:by|at|around)\s+and\s*,/i.test(combined)) {
    issues.push("visible evidence contains a malformed timestamp phrase");
  }
  if (/^(this|each time|the better play|the core lesson|the critical lesson|the simple lesson)\b/i.test(gameDetail)) {
    issues.push("gameDetail starts with conclusion instead of visible action");
  }
  if (hasRedundantLessonEcho({ gameDetail })) {
    issues.push("gameDetail repeats the Mistake/Fix feedback instead of adding new evidence");
  }
  if (/\bAlan\b/.test(combined)) {
    issues.push("visible feedback must address the player as you or the detected champion, not Alan in third person");
  }
  if (/\b(shop interface|shop open|stealth ward selected|standing at (the )?fountain|fountain at game start|game start)\b/i.test([gameDetail, eventEvidence].join(" "))) {
    issues.push("uses non-evidence shop/fountain/game-start timestamp as proof");
  }
  if (!/^(?:At|Around|By|Then|In|During|After|When|Samira|Cait|Caitlyn|Fizz|You|\d{1,2}:[0-5]\d)\b/i.test(gameDetail)) {
    issues.push("visible paragraph starts with a broken fragment instead of evidence");
  }
  if (isAutoFullReview && ![
    ...primaryMistakeTimestampSeconds(gameDetail, eventEvidence, pattern),
    ...keyClickRuleTimestampSeconds(gameDetail)
  ].length) {
    issues.push("the beginning of the main mistake window must have a visible game-clock timestamp");
  }
  if (isAutoFullReview) {
    issues.push(...secondaryFocusStandardIssues({
      secondaryFocus,
      captureFps: Number(process.env.LEAGUE_LIVE_FPS || 2)
    }));
  }
  if (nuance.length < 3) {
    issues.push("nuance needs at least three specific bullets");
  }
  return issues;
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

async function describeTimelineClockAnchors({ file, sourcePath, duration, sidecar, frameDir, matchTimeMs, gameLengthSeconds, readTimes }) {
  const timedCandidates = spacedClockAnchors(
    expectedClockAnchorsFromTimes(readTimes, sidecar, matchTimeMs, gameLengthSeconds),
    10
  );
  if (timedCandidates.length < 3 || !process.env.OPENAI_API_KEY) return [];
  const timelineDir = path.join(frameDir, "clock-timeline");
  await fs.mkdir(timelineDir, { recursive: true });
  const images = [];
  for (let index = 0; index < timedCandidates.length; index += 1) {
    const anchor = timedCandidates[index];
    const framePath = path.join(timelineDir, `timeline-${String(index + 1).padStart(2, "0")}-${normalizeClock(anchor.clock).replace(":", "-")}.jpg`);
    await extractFrame(sourcePath, framePath, Number(anchor.videoSeconds), 1280);
    images.push({
      type: "input_text",
      text: `Frame ${index + 1}: capture-timeline League game clock ${anchor.clock}; review-video time ${mmss(anchor.videoSeconds)} (${anchor.videoSeconds}s). Describe only visible League gameplay in this exact frame.`
    });
    images.push({
      type: "input_image",
      image_url: `data:image/jpeg;base64,${(await fs.readFile(framePath)).toString("base64")}`,
      detail: "high"
    });
  }
  const prompt = [
    "Alan needs timestamped League feedback even when OCR misses the tiny HUD clock.",
    "The clock labels below are computed from Riot match start time plus the capture segment timeline. Use them only as labels for the exact frames provided; do not invent events outside the frame.",
    "Choose 4-8 useful coaching evidence frames. Prefer frames showing setup, Alan's action, a fight, a wave/structure state, a reset/spend, a side-lane risk, a collapse risk, or a consequence. Avoid shop/fountain/scoreboard frames unless the visible coaching point is spending, resetting, or protecting gold.",
    "Each description must be factual and visible. Say the followed player champion, not Player. Do not write advice in descriptions.",
    "Return only JSON with this shape:",
    '{"clockAnchors":[{"clock":"MM:SS","videoSeconds":0,"description":"visible evidence in that exact frame"}]}',
    `Recording file: ${file}. Duration: ${mmss(duration)}.`
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
        max_output_tokens: 1200,
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
    if (!response.ok) throw new Error(`OpenAI timeline clock response ${response.status}`);
    const parsed = parseJsonText(extractOutputText(await response.json()));
    const byKey = new Map(timedCandidates.map((anchor) => [`${anchor.clock}@${anchor.videoSeconds}`, anchor]));
    return cleanClockAnchors(parsed.clockAnchors)
      .map((anchor) => {
        const match = byKey.get(`${anchor.clock}@${anchor.videoSeconds}`) ||
          timedCandidates.find((candidate) => candidate.clock === anchor.clock && Math.abs(candidate.videoSeconds - anchor.videoSeconds) <= 0.35);
        if (!match) return null;
        return {
          ...match,
          description: normalizeEvidenceDescription(anchor.description || match.description || "", "Samira")
        };
      })
      .filter(Boolean)
      .filter((anchor) => anchor.description && !anchorDescriptionLooksWeak(anchor.description))
      .slice(0, 8);
  } catch (error) {
    console.warn(`Timeline clock fallback failed for ${file}: ${error.message}`);
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
    const verifiedAnchors = fastMacroReview
      ? anchors
      : await verifyVisibleClockAnchors({ file, sourcePath, anchors, frameDir });
    const latestVerifiedClock = Math.max(0, ...cleanClockAnchors(verifiedAnchors).map((anchor) => clockSeconds(anchor.clock)).filter((seconds) => Number.isFinite(seconds)));
    const expectedCoverageClock = Number(gameLengthSeconds || 0) > 0 ? Number(gameLengthSeconds) * 0.55 : duration * 0.55;
    const needsTimelineCoverage = duration >= 600 && latestVerifiedClock < expectedCoverageClock;
    const shouldDescribeTimeline = (!fastMacroReview && verifiedAnchors.length < 3) || (fastMacroReview && needsTimelineCoverage);
    const timelineAnchors = shouldDescribeTimeline
      ? await describeTimelineClockAnchors({
        file,
        sourcePath,
        duration,
        sidecar,
        frameDir,
        matchTimeMs,
        gameLengthSeconds,
        readTimes
      })
      : [];
    const compatibleTimelineAnchors = cleanClockAnchors(timelineAnchors)
      .filter((anchor) => !cleanClockAnchors(verifiedAnchors).some((verified) => (
        Math.abs(Number(verified.videoSeconds) - Number(anchor.videoSeconds)) <= 0.5 &&
        !clockWithinSeconds(verified.clock, anchor.clock, 2.5)
      )));
    const finalAnchors = dedupeClockAnchors([...verifiedAnchors, ...compatibleTimelineAnchors])
      .filter((anchor) => clockFitsCurrentMatch(anchor, sidecar, matchTimeMs, gameLengthSeconds));
    await fs.writeFile(cachePath, `${JSON.stringify({
      cacheKey,
      clockAnchorVersion,
      generatedAt: new Date().toISOString(),
      clockAnchors: finalAnchors
    }, null, 2)}\n`, "utf8");
    return finalAnchors;
  } catch (error) {
    console.warn(`Clock anchor fallback for ${file}: ${error.message}`);
    return [];
  }
}

async function analyzeRecording({ file, duration, framePaths, frameTimes, sequenceLabel, reviewPhase: phase, previousAnalysis = null }) {
  const manual = manualFeedback(file);
  if (manual) return { ...manual, sampledFrames: framePaths.length };
  if (!process.env.OPENAI_API_KEY) {
    return previousAnalysis || fallbackFeedback(file, duration, { reviewPhase: phase });
  }
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
    "Analyze these League of Legends replay frames extremely carefully for Alan. He explicitly wants direct, evidence-based critique across every visible part of the game so he can climb toward Challenger, not comfort feedback.",
    "Images are chronological sampled frames from the recording. Read them in order and use every visible clue: followed champion, team list/nameplate, health bars, minimap shape when visible, wave state, structure/objective context, fight numbers, target selection, spacing, fog, recalls, base state, and obvious crowd-control or cooldown evidence.",
    "The player champion is usually the champion the replay camera follows most. Use the side list/nameplate when visible. If uncertain, say low confidence and state the limit.",
    "Use capture order internally to distinguish earlier leak evidence from later implementation attempts, but do not mention recency weighting in visible output.",
    `This recording is ${sequenceLabel}. Review phase: ${phase}.`,
    `Sampled frame times: ${frameList}. Duration: ${mmss(duration)}.`,
    "The recorder is intentionally low-FPS for low-lag review. At 2 FPS, scan every visible aspect that can honestly be judged: macro, reset timing, objective conversion, side-lane drift, base pressure, shutdown protection, map tempo, camera stability, spacing, entry timing, target choice, cooldown/CC accounting, wave state, fog/vision pathing, and repeated cursor/pathing patterns. Do not over-index on single-frame mechanics.",
    "Do not name allied or enemy champions unless the name is verified from visible roster/nameplate evidence. If uncertain, say ally, enemy, support, jungler, defender, or teammate. Do not name red buff or blue buff unless the camp label is visually verified; say jungle camp instead.",
    "Coach like a blunt but serious Challenger-path League coach: name the actual mistake, do not soften it, and do not insult Alan. If a play is greedy, late, unsafe, low-value, disconnected, or not transferable to stronger ranked games, say that plainly and tie it to visible evidence.",
    "Give one highest-value main mistake plus at least two supporting mistake lanes after scanning the whole visible game. The main mistake stays in feedback/gameDetail. The next easiest lane goes in secondaryFocus. The broader lane list goes in mistakeTypes so the page can show more kinds of mistakes without becoming a giant checklist.",
    "Write the visible coaching fields like one smooth paragraph from a highly experienced League coach. Do not expose field labels such as 'Failure evidence:', 'Other mistake types:', or 'Second focus:'. Green/red/pink highlighting is handled by the page; all unhighlighted prose should read as context, proof, and supporting detail for the green/red/pink claims. The red-readable mistake text should name only what was bad or leaking, the green-readable goodThing should name only what to keep doing, and the pink-readable action text should tell Alan exactly what to do next game if he reads only pink.",
    "The feedback field must be one short red sentence beginning with 'The leak is ...'. It names the actual bad decision once and the cost once. Do not use broad claims like 'chased too much' unless the frames show the chase and the missed result.",
    "Every detailed review must answer this decision chain in the visible fields: what Alan did, what leaked because of it, what happened next or almost happened, and what the better next click/check was. Be specific enough that a replay timestamp can prove or limit each claim.",
    "Alan's latest correction: keep the single-paragraph colored format, but make the review tighter, denser, and more direct. Ideal visible structure: sharp title, outcome header, one key timestamp, visible state, wrong click, correct click, one green habit to keep, one red leak, one pink Rep. Do not repeat the same payout checklist several times. Mention tower/wave/objective/ally-front style checks once when it is the playable rule, then stay short.",
    "The pink Rep must be game-specific, not a universal template. A death-heavy loss should drill low-HP exits and no re-entry; a huge-kill loss should drill cashing out after the first won fight; a controlled base-push win should drill structure, blocker, wave, or exit; a cleaner win with fewer deaths and better CS should first recognize the improvement and drill the one remaining overstay/exit branch.",
    "For the key timestamp, split the play into phases inside natural prose: legal or illegal entry, value created or not, the exact state-flip moment, the first bad next click, and the correct next click. Do not label those phases as fields; make the sentence sound like a coach replaying the moment.",
    "For objective fights, do not mark the first entry wrong just because the final result was bad. If dragon/baron/objective is visible, allies are committed, and enemies are already engaged, say the entry is legal or partly legal; then critique the second fight after value if that is the real leak.",
    "The downstream rank line is generated from your evidence, so your review must expose the inputs clearly: CS/min context, avoidable death pattern, entry legality, exit/re-entry quality, and whether damage pressure became tower, dragon, baron, inhib, wave, recall, or group.",
    "If the game is a victory with clearly improved K/D/A, CS, reset discipline, or fewer chain deaths, frame it as improvement first. Do not describe it like the same older pressure-mode loss; name the remaining leak as one narrower pattern inside a better game.",
    "Do not stop at category advice like group, reset, pressure mid, spacing, target selection, cash out cleaner, map cash-out, or wrong task after map state changes. The first sentence of gameDetail must be one natural key click-rule sentence in this shape: 'At MM:SS, [exact visible state], so the wrong click is [bad click] and the next click is [the click/check to do now].' It must name the concrete screen state and translate the concept into a literal if-this-then-that click rule.",
    "At the main timestamp, name the concrete visible state precisely: where the followed champion is, which tower or wave matters, which allies are present or dead if visible, which enemies are visible or missing if visible, whether an ally can stand between the followed champion and enemy collapse, and what the nearest permanent result is. If death timers, missing enemies, or a tower state are not visible enough, say the limit and make the action conditional instead of pretending certainty.",
    "For tower, wave, inhibitor, base, or pressure states, separate the branch options instead of blending them: hit tower if it is free; hit only the enemy body blocking tower if it is safe and an ally can front; push or clear wave then recall if wave is the only guaranteed value; leave if no permanent result is available. Avoid slogans such as cash out cleaner, map cash-out, and wrong task after map state changes.",
    "If client K/D/A and CS context is available in the recording metadata, use it in the visible review and name the bigger blocker: deaths, low CS, missed tower, bad reset, overchase, wave defense, objective timing, or fight entry. Do not treat K/D/A and CS as decoration; use them to decide what the player should work on first.",
    "Also include eventEvidence and failureEvidence. eventEvidence is one compact sentence naming the actual visible things that prove the coaching claim. failureEvidence is the same proof written as the failure chain: what Alan did, what visible state made it wrong, what leaked, and what happened next or almost happened. If the advice is overstay/reset, the evidence must show the overstay, low-health stay, respawn danger, missed reset window, or tempo leak; if the advice is structure conversion, the evidence must show structure access, a free structure, a blocked structure, or the chase away from it. This is proof, not advice.",
    "For base, inhibitor, nexus, and open-structure situations, separate three states: free structure, enemy body blocking the structure, and objective not currently possible. Do not call a wave-to-structure or structure-hitting moment a mistake. If the footage shows Alan correctly pathing to the objective, say that as the goodThing and critique only the remaining leak.",
    "Also include goodThing: one honest positive thing Alan did well if the footage supports it, especially when it contrasts with the mistake. If nothing positive is visible, use an empty string rather than inventing praise.",
    "Write gameDetail like one smooth, short replay-review paragraph, not a stat audit and not a field list: include the main visible mistake window, what happened next or almost happened, and the K/D/A-CS blocker if available. The red feedback field names the leak, the green goodThing names the keep habit, and the pink secondaryFocus names the drill, so do not repeat those claims in gameDetail unless the timestamp evidence needs one short bridge. The beginning or nearest visible beginning of the biggest mistake window must have a game-clock timestamp, and that timestamped sentence must include the exact visible state, the wrong click, and the correct next click. Extra timestamps are optional and should appear only when they make the critique clearer. Current-standard gameDetail should usually stay under 650 characters.",
    "Do not copy the feedback field back into gameDetail. gameDetail must not contain 'Mistake:' or 'Fix:' labels; use it for new timestamped evidence, why the fix is correct, and the final lesson.",
    "secondaryFocus must start with 'Rep:' and be the exact drill Alan can run next ranked game. Keep it playable and short. If he read only the pink text, he should know exactly what to ask or click next game. Avoid vague drills like 'what permanent thing do we win?' because ally front can make a fight legal even when it is not permanent. Make the Rep match the game: lane death = first safe exit/no illegal E; objective fight = after first value choose dragon, wave, recall, or group; fed loss = cash out after first won fight; grouped base push = structure, blocker, wave, or exit; mid-wave river chase = after mid wave gives value, ask wave, turret, reset, or river. Do not start with 'Second focus:' or a label.",
    "mistakeTypes must list 3-5 distinct mistake lanes in short phrases. Good examples: side farm over base defense, camera/map-state check, spacing/entry discipline, reset/overstay discipline, target choice/chase drift, wave/objective conversion, vision/fog pathing, shutdown or death-state exposure. Only include a lane if the frames support it or the limit is stated.",
    "At 2 FPS, do not pretend to judge frame-perfect mechanics, animation cancels, exact combo speed, or reaction time. You may still critique mechanics-adjacent habits that are visible over seconds: spacing, moving while low HP, target choice, camera staying with the wrong fight, clicking toward fog, entering first, using dash before the fight is ready, or repeated pathing/cursor drift. If mechanics are limited by FPS, say that plainly inside secondaryFocus.",
    "Do not assume mechanics are the blocker. If visible coordination is fine and decision-making is the real leak, say that directly; if a visible mechanics-adjacent habit is costing value, name it as the second focus.",
    "Do not over-explain common coaching terms Alan already knows. Only define grouped mid, sync, tempo, payout, or conversion when the advice would otherwise be unclear; prioritize the timestamped replacement action and why that action is better in this visible state.",
    "If you recommend grouping mid or pressuring mid, explain why mid is better in that visible state: for example, allies are already there, mid is the shortest lane to towers/base, it reduces fog-collapse risk, it lets teammates peel, or it forces enemies to defend structure instead of chasing the player champion in a side lane. Tie the reason to the frames; do not say group mid as generic advice.",
    "Every full-game review must include the reason Alan should do the fix, not just the instruction. A good sentence sounds like: 'This matters because ...' or 'That route is better because ...'.",
    "Alan explicitly wants Challenger-level critique. You may mention Challenger-level punishment when it names a concrete consequence, but do not use rank labels as vague authority. Name the exact visible habit and exact in-game payoff.",
    "If the visible frames are too sparse for a claim, say that in reviewLimit instead of inventing certainty. A limited review is better than a vague confident one.",
    "For the biggest mistake event, include the visible game-clock timestamp from the top right when it is visible. It can be the beginning or nearest visible beginning of the mistake window; it does not have to be the exact click. Do not turn the recap into a numbered timeline, and do not invent timestamps for unseen moments.",
    "If any visible game-clock timestamp appears in gameDetail, eventEvidence, timeline, evidence, or pattern, include a matching clockAnchors item: {\"clock\":\"MM:SS\",\"videoSeconds\":number}. Use the review-video time from the labeled frame where that clock is visible. Timestamps should be evidence anchors for the lesson, not decorative time labels. If you are not sure the clock is visible or useful for the lesson, do not include the timestamp in visible copy.",
    "The only mandatory timestamp is the start of the main mistake window. That mandatory timestamp must carry the key click rule: exact visible state plus the correct next click. Do not add extra timestamps just to pad the review; add another only if it explains the consequence or the corrected habit.",
    "Do not use shop, fountain, scoreboard, game-start, or item-selection frames as proof unless the actual coaching point is buying, recalling, or spending. They are not valid setup anchors for objective, chase, wave, or fight feedback.",
    "The first sentence of gameDetail must start with the visible game state or Alan's action, not a conclusion like 'This leaks...' or 'The better play...'.",
    "Prioritize repeatable habits that stop the gameplay from transferring to much harder ranked games: lethal-HP lane stays, re-entering after the first win, chasing away from open structures, wave crash, recall timing, objective conversion, shutdown protection, numbers before joining, second entry, cooldown/CC accounting, vision/fog discipline, target choice, structure hitting, and reset discipline.",
    "If this is an implementation or current-form clip, evaluate the next constraint after the attempted improvement instead of only repeating the old diagnosis.",
    "Also include whyTrust: one concrete reason Alan should trust and try the feedback, grounded in the detected champion's mechanics, map conversion, recording evidence, or anxiety-reducing decision rules.",
    "The nuance bullets must be specific coaching facts, not paraphrases: include what was good, what leaked, what happened, at least one additional mistake lane beyond the main leak, what the harder-game or Challenger-level punishment would be, and the next repeatable check when the frames support them.",
    "Visible page copy should be concise and operational. Second person is allowed here because this is a personal coaching surface, but avoid vague 'you should' advice and broad motivational coaching.",
    "Visible output must address the player as 'you' or the detected player champion, never 'Alan' in third person.",
    "Return only JSON with this shape:",
    '{"champion":"detected champion","confidence":"high|medium|low","feedbackTitle":"short sharp title naming the actual mistake","feedback":"The leak is that [exact wrong decision and what it costs].","gameDetail":"short decision paragraph with one key timestamp, exact visible state, wrong click, correct click, and compact consequence/stat context; no field labels","secondaryFocus":"Rep: one pink next-game drill Alan can apply immediately; must be click-specific","mistakeTypes":["3-5 short distinct mistake lanes visible or honestly limited by the recording"],"eventEvidence":"compact proof of what visibly happened in the game","failureEvidence":"one natural sentence proving failure: what Alan did, what state made it wrong, what leaked, and what happened next or almost happened; no label prefix","goodThing":"one concrete keep-doing-this habit, or empty string","whyTrust":"one concrete reason to trust this feedback","focusTag":"short tag","evidence":"short visual basis","pattern":"fuller read of the visible pattern, 1-2 sentences","diamondRule":"one exact rule that would still matter as games get harder","drill":"one next-game repetition","timeline":["00:00 - exact visible event from the frame, for internal evidence only"],"clockAnchors":[{"clock":"MM:SS","videoSeconds":0}],"nuance":["3-5 specific bullets: what was good, what leaked, consequence, second/third mistake lane, next check"],"reviewLimit":"what the sampled frames cannot prove"}',
    `Recording file: ${file}.`
  ].join("\n");

  try {
    let parsed = await requestOpenAiJson(prompt, images, 1800);
    const detailIssues = analysisSpecificityIssues(parsed, { file, duration });
    if (detailIssues.length) {
      const retryPrompt = [
        prompt,
        "",
        `The first JSON draft failed the detail gate: ${detailIssues.join("; ")}.`,
        "Rewrite once with the same JSON shape. Keep the page format compact and tight: one key timestamp, visible state, entry legality, value or no value, state flip, first bad next click, correct next click, one green keep habit, one red leak, one pink Rep. The first gameDetail sentence must be natural, not a label list: 'At MM:SS, [exact visible state], so the wrong click is [bad click] and the next click is [the click/check to do now].' For objective fights, separate legal first entry from the second fight after value. Do not repeat the tower/wave/objective/ally-front checklist more than once. Do not use vague drill language like 'what permanent thing do we win?'. Include failureEvidence internally as visible proof, include mistakeTypes with at least three distinct mistake lanes, and make secondaryFocus start with 'Rep:' followed by one click-specific drill. Keep Mistake/Fix labels out of gameDetail, do not write 'mistake category:' or 'correct next click:' in visible prose, do not name unverified allied/enemy champions or exact jungle buffs, and use only visible frame evidence. Do not write visible labels like Failure evidence, Other mistake types, or Second focus; make those fields natural paragraph sentences. If the evidence cannot support a claim, narrow the claim and state the limit instead of writing vague advice."
      ].join("\n");
      parsed = await requestOpenAiJson(retryPrompt, images, 1800);
    }
    const finalDetailIssues = analysisSpecificityIssues(parsed, { file, duration });
    if (finalDetailIssues.length) {
      parsed.reviewLimit = coachClean(
        [parsed.reviewLimit, `Detail gate still limited by: ${finalDetailIssues.join("; ")}.`].filter(Boolean).join(" "),
        "The sampled frames did not support a fully specific review."
      );
    }
    return {
      champion: clean(parsed.champion, "Unknown"),
      confidence: clean(parsed.confidence, "low").toLowerCase(),
      feedbackTitle: coachClean(parsed.feedbackTitle, "Focus"),
      feedback: coachClean(parsed.feedback, "Review the clip and choose one safer next action."),
      gameDetail: coachClean(parsed.gameDetail, `${coachClean(parsed.pattern, "The recording points to one repeatable decision pattern.")} ${coachClean(parsed.feedback, "Choose one safer next action.")}`),
      secondaryFocus: coachClean(parsed.secondaryFocus || parsed.secondaryImprovement, ""),
      mistakeTypes: cleanList(parsed.mistakeTypes, 5).map((item) => coachClean(item)),
      eventEvidence: coachClean(parsed.eventEvidence, coachClean(parsed.evidence, "Generated from sampled replay frames.")),
      failureEvidence: coachClean(parsed.failureEvidence, ""),
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
    if (previousAnalysis) {
      return {
        ...previousAnalysis,
        reviewLimit: stripDetailRefreshFailureNotes(previousAnalysis.reviewLimit) ||
          "The previous review was kept because the model refresh failed."
      };
    }
    return fallbackFeedback(file, duration, { reviewPhase: phase });
  }
}

async function summarizeRecordings(recordings, detectedChampions) {
  const fallback = dynamicOverallFeedback(recordings, detectedChampions);
  if (!recordings.length || process.env.LEAGUE_AI_MAIN_FEEDBACK !== "1") return fallback;
  const notes = recordings.map((item, index) => (
    `${index + 1}. ${item.title} [${item.reviewPhase || "baseline"}] (${item.champion}, ${item.duration}): ${item.feedbackTitle} - ${item.feedback}. Pattern: ${item.pattern || ""} Rule: ${item.diamondRule || ""}`
  )).join("\n");
  const prompt = [
    "Given these deeply analyzed League recording feedback notes, produce one simple focus for Alan's next queue.",
    "He wants a blunt Challenger-path coach read. Name the recurring mistake directly, without insults or motivational filler.",
    "Scan macro, decision-making, camera, spacing, entry timing, target choice, wave/fog/vision, reset timing, and mechanics-adjacent habits, then choose the single highest-leverage pattern instead of summarizing everything.",
    "Keep the summary narrow enough to remember while playing.",
    "Use capture order internally to distinguish earlier leak evidence from implementation attempts. Do not mention recency weighting in visible output.",
    "If the newer clips show an earlier rule being attempted, choose the next simple constraint that preserves the improvement instead of repeating only the old leak.",
    "Do not summarize everything. Choose the single improvement with the highest Challenger-climb value from the recordings and explain the evidence behind it.",
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

function rankNameFromValue(value) {
  const index = Math.max(0, Math.min(exactRankScale.length - 1, Math.round(Number(value) || 0)));
  return exactRankScale[index] || "Iron IV";
}

function recordingRankValue(recording = {}) {
  const value = Number(recording.rankEstimate?.exactRankValue);
  if (Number.isFinite(value)) return value;
  if (Number.isFinite(Number(recording.rankEstimate?.score))) return exactRankForScore(Number(recording.rankEstimate.score)).value;
  return null;
}

function stripTerminalPunctuation(value = "") {
  return clean(value).replace(/[.!?]+$/g, "");
}

function sentenceCaseFragment(value = "") {
  const text = stripTerminalPunctuation(value);
  return text.replace(/^([A-Z])/, (match) => match.toLowerCase());
}

function firstSentenceFragment(value = "", maxLength = 140) {
  const text = stripTerminalPunctuation(value);
  if (!text) return "";
  const first = text.split(/(?<=[.!?])\s+/)[0] || text;
  if (first.length <= maxLength) return stripTerminalPunctuation(first);
  const clipped = first.slice(0, maxLength).replace(/\s+\S*$/, "");
  return stripTerminalPunctuation(clipped);
}

function recordingMistakePhrases(recording = {}) {
  const fromReview = cleanList(recording.mistakeTypes, 5)
    .map((item) => sentenceCaseFragment(item))
    .filter(Boolean);
  if (fromReview.length) return fromReview;

  const flags = rankTextFlags(recording);
  const phrases = [];
  if (flags.chaseDrift) phrases.push("side pressure or fog drift");
  if (flags.overstayReset) phrases.push("reset/overstay discipline");
  if (flags.shutdownGold) phrases.push("shutdown or unspent-gold exposure");
  if (flags.conversion) phrases.push("missed structure/objective conversion");
  if (flags.lethalHp) phrases.push("low-HP or death-state re-entry");
  return phrases;
}

function recordingStrengthPhrase(recording = {}) {
  const good = clean(recording.goodThing);
  if (good) {
    return firstSentenceFragment(good, 150)
      .replace(/^At\s+\d{1,2}:[0-5]\d\s+you\s+/i, "you ")
      .replace(/^The strong part is that\s+/i, "")
      .replace(/\byou did find\b/i, "you found")
      .replace(/\byou did\b/i, "you")
      .replace(/\s+/g, " ")
      .trim();
  }
  const flags = rankTextFlags(recording);
  if (flags.syncedTeamplay) return "grouping with allies when the play is clear";
  if (flags.positiveConversion) return "finding fights, waves, towers, or base pressure";
  if (Number(recording.kills) >= 12) return "enough damage to win bot-game fights";
  return "";
}

function weightedCurrentPhrases(recordings = [], phraseGetter) {
  const counts = new Map();
  recordings.forEach((recording, index) => {
    const weight = index + 1;
    for (const phrase of phraseGetter(recording).slice(0, 3)) {
      counts.set(phrase, (counts.get(phrase) || 0) + weight);
    }
  });
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([phrase]) => phrase);
}

function joinCompactList(items = [], fallback = "") {
  const values = items.map((item) => clean(item)).filter(Boolean);
  if (values.length === 0) return fallback;
  if (values.length === 1) return values[0];
  if (values.length === 2) return `${values[0]} and ${values[1]}`;
  return `${values.slice(0, -1).join(", ")}, and ${values.at(-1)}`;
}

function dynamicOverallFeedback(recordings = [], detectedChampions = []) {
  const full = recordings
    .filter((recording) => isFullReviewRecording(recording) && championId(recording.champion) === "samira")
    .map((recording) => ({ ...recording, rankValue: recordingRankValue(recording) }))
    .filter((recording) => Number.isFinite(recording.rankValue))
    .sort((a, b) => (
      Number(a.matchTimeMs || 0) - Number(b.matchTimeMs || 0) ||
      Number(a.durationSeconds || 0) - Number(b.durationSeconds || 0) ||
      String(a.file || "").localeCompare(String(b.file || ""))
    ));

  const latest = full.at(-1) || recordings.at(-1);
  const values = full.map((recording) => recording.rankValue);
  const currentWindow = full.slice(-3);
  const currentValues = currentWindow.map((recording) => recording.rankValue);
  const medianValue = values.length ? [...values].sort((a, b) => a - b)[Math.floor((values.length - 1) / 2)] : null;
  const currentAverage = currentValues.length
    ? currentValues.reduce((sum, value) => sum + value, 0) / currentValues.length
    : medianValue;
  const latestRank = latest?.rankEstimate?.exactRank || (Number.isFinite(latest?.rankValue) ? rankNameFromValue(latest.rankValue) : "unranked");
  const baselineRank = Number.isFinite(medianValue) ? rankNameFromValue(medianValue) : "unranked";
  const currentRank = Number.isFinite(currentAverage) ? rankNameFromValue(currentAverage) : baselineRank;

  const latestVsCurrent = Number.isFinite(latest?.rankValue) && Number.isFinite(currentAverage)
    ? latest.rankValue - currentAverage
    : 0;
  const direction = latestVsCurrent >= 2
    ? "The newest game is above the current three-game read"
    : (latestVsCurrent <= -2 ? "The newest game is below the current three-game read" : "The newest game is around the current three-game read");
  const limit = rankCalibrationContext(recordings).currentLimitation ||
    "Rank read is a macro-equivalent estimate, not Riot MMR.";
  const gamesLabel = full.length === 1 ? "1 full game" : `${full.length} full games`;
  const latestGameLabel = latest?.gameHappenedAtLabel || latest?.recordedAtLabel || "the latest synced full game";
  const latestMistakes = recordingMistakePhrases(latest);
  const currentMistakes = weightedCurrentPhrases(currentWindow, recordingMistakePhrases);
  const latestLeakText = joinCompactList(latestMistakes.slice(0, 2), "not enough newest-game mistake evidence yet");
  const repeatText = joinCompactList(currentMistakes.slice(0, 3), latestLeakText);
  const latestStrength = recordingStrengthPhrase(latest);
  const strengthText = latestStrength || joinCompactList(weightedCurrentPhrases(currentWindow, (recording) => {
    const phrase = recordingStrengthPhrase(recording);
    return phrase ? [phrase] : [];
  }).slice(0, 1), "not enough newest-game strength evidence yet");
  const latestText = [
    latest?.feedbackTitle,
    latest?.feedback,
    latest?.gameDetail,
    latest?.secondaryFocus,
    latest?.pattern,
    latest?.diamondRule
  ].filter(Boolean).join(" ");
  const latestNeedsLosingStateScript = /\b(losing state|allies (?:are )?dead|teammates (?:are )?dead|four allies dead|base line|inhibitor line|safe wave|hold base|defend one safe wave)\b/i.test(latestText);
  const latestAction = clean(latest?.secondaryFocus || latest?.drill || "");
  const nextRep = latestAction || (latestNeedsLosingStateScript
    ? "Next game: call even or losing before each fight; if losing, choose only back, tower wave, or wait."
    : "Next game: after the first won fight or open structure, choose only free structure, body blocking that structure, or reset.");

  return {
    title: "Samira latest synced state",
    focus: `Synced through ${latestGameLabel}: newest full-game read ${latestRank}; current ${Math.min(3, currentWindow.length)}-game read ${currentRank}; archive median ${baselineRank} across ${gamesLabel}, used only as baseline context. ${direction}.`,
    rule: `The newest-game blocker is ${latestLeakText}; the current repeat across the latest games is ${repeatText}. The keep-habit is ${strengthText}.`,
    nextRep,
    whyTrust: `This is latest-weighted: the newest full game carries the coaching state, the last ${Math.min(3, currentWindow.length)} full games set the current pattern, and older games only provide baseline context.`,
    pattern: `Latest file ${latest?.file || "unknown"} is the state source; the archive median is kept for the plot and baseline only.`,
    checklist: ["Read the newest-game point.", "Use the latest-game next action.", "Treat the archive as baseline only."],
    reviewLimit: limit
  };
}

function championId(name) {
  const normalized = clean(name, "unknown").toLowerCase().replace(/[^a-z]/g, "");
  const aliases = {
    cait: "caitlyn",
    caitlyn: "caitlyn",
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
  const sourceFiles = (await fs.readdir(sourceDir, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && sourceVideoPattern.test(entry.name) && !ignoredSourceVideoPattern.test(entry.name));
  const discoveredEntries = [];
  for (const entry of sourceFiles) {
    const sourcePath = path.join(sourceDir, entry.name);
    const stat = await fs.stat(sourcePath);
    const cacheKey = cacheKeyFor(stat);
    const existingEntry = existingRecording(existing, entry.name, cacheKey);
    const cachedTrusted = Boolean(existingEntry) &&
      compatibleAnalysisVersions.has(existingEntry.analysisVersion) &&
      !needsCachedTextRepair(existingEntry) &&
      !refreshedManualFeedbackFiles.has(entry.name) &&
      (!requiresVisibleParagraphStandard(entry.name, existingEntry) || visibleParagraphStandardIssues(existingEntry).length === 0) &&
      process.env.LEAGUE_FORCE_ANALYSIS !== "1" &&
      (!forceAnalysisFile || entry.name !== forceAnalysisFile) &&
      process.env.LEAGUE_RETRY_FALLBACK !== "1";
    const health = cachedTrusted
      ? {
        duration: Number(existingEntry.durationSeconds) || 0,
        size: stat.size,
        bytesPerSecond: Number(existingEntry.durationSeconds) > 0 ? stat.size / Number(existingEntry.durationSeconds) : 0
      }
      : await probeVideoHealth(sourcePath).catch(() => null);
    const sidecar = await readJsonSafe(`${sourcePath}.json`);
    const visual = cachedTrusted
      ? { visible: true, samples: [] }
      : /^auto_/i.test(entry.name) && health?.duration > 60
        ? await videoVisibility(sourcePath, health.duration)
        : null;
    discoveredEntries.push({
      name: entry.name,
      sourcePath,
      stat,
      health,
      sidecar,
      visual,
      cachedTrusted,
      existingEntry
    });
  }
  const sourceEntries = collapseSameMatchDuplicateSources(
    discoveredEntries
      .filter((entry) => {
        if (entry.cachedTrusted) return true;
        const rejectReason = autoCaptureRejectReason(entry.name, entry.health, entry.sidecar, entry.visual);
        if (!rejectReason) return true;
        console.log(`Skipping invalid auto capture ${entry.name}: ${rejectReason}.`);
        return false;
      })
      .sort((a, b) => a.stat.mtimeMs - b.stat.mtimeMs || a.name.localeCompare(b.name))
  );
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
    const detectedQueueMeta = recordingMetadata.queues.get(parts.matchId) || {
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
    const previousAnalysis = existingRecording(existing, name, cacheKey);
    const cached = entry.cachedTrusted ? entry.existingEntry : cachedRecording(existing, name, cacheKey);
    const previousQueueMeta = Number.isFinite(Number(previousAnalysis?.queueId))
      ? {
          queueId: Number(previousAnalysis.queueId),
          gameType: previousAnalysis.gameType || queueLabel(previousAnalysis.queueId),
          gameTypeSource: previousAnalysis.gameTypeSource || "Previous manifest"
        }
      : null;
    const queueMeta = Number.isFinite(Number(detectedQueueMeta.queueId))
      ? detectedQueueMeta
      : (previousQueueMeta || detectedQueueMeta);

    const publicVideoBytes = await ensurePublicVideo(sourcePath, destPath, stat);
    const duration = Number(cached?.durationSeconds) || Number(entry.health?.duration) || await probeDuration(sourcePath);
    totalSeconds += duration;
    if (!(await exists(posterPath))) {
      await extractFrame(sourcePath, posterPath, Math.max(0.2, duration * 0.5), 640);
    }
    if (entry.cachedTrusted && cached) {
      const recordedMs = Date.parse(cached.recordedAt || cached.gameHappenedAt || "");
      sourceStats.push({ mtimeMs: Number.isFinite(recordedMs) ? recordedMs : stat.mtimeMs });
      if (duration > 90) fullGameCount += 1;
      else highlightCount += 1;
      const cachedRankEstimate = rankedEquivalentForRecording(cached);
      const cachedCaptureFps = captureFpsForEntry(entry, cached.captureFps);
      const cachedRecording = {
        ...cached,
        ...(cachedRankEstimate ? { rankEstimate: cachedRankEstimate } : {}),
        ...(cachedRankEstimate ? { performanceRank: performanceRankForRecording(cached, cachedRankEstimate) } : {}),
        ...(cachedCaptureFps ? { captureFps: cachedCaptureFps } : {}),
        ...(matchStats.outcome ? {
          win: matchStats.win,
          outcome: matchStats.outcome,
          outcomeLabel: matchStats.outcomeLabel,
          outcomeSource: matchStats.outcomeSource
        } : {}),
        publicVideoBytes,
        src: publicPath(destPath),
        poster: publicPath(posterPath)
      };
      sanitizeAbstractBranchLanguage(cachedRecording);
      recordings.push(cachedRecording);
      console.log(`${name}: ${recordings.at(-1).reviewPhase || phase} - ${recordings.at(-1).champion} - ${recordings.at(-1).feedbackTitle}`);
      continue;
    }

    let analysis = cached;
    if (!analysis) {
      await fs.mkdir(frameDir, { recursive: true });
      const sampleTimes = analysisSampleTimes(duration, entry.sidecar);
      const framePaths = [];
      for (let sampleIndex = 0; sampleIndex < sampleTimes.length; sampleIndex += 1) {
        const framePath = path.join(frameDir, `frame-${sampleIndex + 1}.jpg`);
        if (process.env.LEAGUE_FORCE_ANALYSIS === "1" || (forceAnalysisFile && name === forceAnalysisFile) || !(await exists(framePath))) {
          await extractFrame(sourcePath, framePath, sampleTimes[sampleIndex], duration > 90 ? 960 : 1024);
        }
        framePaths.push(framePath);
      }
      analysis = await analyzeRecording({ file: name, duration, framePaths, frameTimes: sampleTimes, sequenceLabel, reviewPhase: phase, previousAnalysis });
    }
    const matchTimeMs = matchStats.matchTimeMs || replayMeta.matchTimeMs || stat.mtimeMs;
    const isManualAnalysis = analysis.analysisSource === "manual";
    const candidateClockAnchors = cleanClockAnchors(analysis.clockAnchors)
      .filter((anchor) => isManualAnalysis || clockFitsCurrentMatch(anchor, entry.sidecar, matchTimeMs, matchStats.gameLengthSeconds || null));
    const candidateHasPrimaryMistake = hasUsablePrimaryMistakeAnchor({
      gameDetail: analysis.gameDetail,
      eventEvidence: analysis.eventEvidence || analysis.evidence,
      pattern: analysis.pattern,
      clockAnchors: candidateClockAnchors
    }, clean(analysis.champion, "Samira"));
    const shouldReadVisibleClock = duration >= 3;
    const visibleClockAnchors = shouldReadVisibleClock && !(fastMacroReview && candidateHasPrimaryMistake)
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
    const fallbackClockAnchors = !isManualAnalysis && !visibleClockAnchors.length && duration > 90
      ? computedTimelineClockAnchors({
        duration,
        sidecar: entry.sidecar,
        matchTimeMs,
        gameLengthSeconds: matchStats.gameLengthSeconds || null,
        candidateAnchors: candidateClockAnchors,
        champion: clean(matchStats.championName || analysis.champion, "Samira")
      })
      : [];
    const clockAnchors = dedupeClockAnchors(
      visibleClockAnchors,
      fallbackClockAnchors,
      (analysis.analysisSource === "manual" || (fastMacroReview && candidateHasPrimaryMistake)) ? candidateClockAnchors : []
    );
    const clockMoments = await selectEvidenceClockMoments({
      file: name,
      analysis,
      clockAnchors,
      frameDir,
      cacheKey
    });
    const annotatedClockAnchors = annotateClockAnchorsWithMoments(clockAnchors, clockMoments);
    const narrativeClockAnchors = isManualAnalysis ? clockAnchors : clockMoments;
    const championName = clean(matchStats.championName || analysis.champion, "Unknown");
    const clockMomentEvidence = isManualAnalysis ? "" : evidenceTextFromMoments(clockMoments);
    const isFullReview = duration > 90;
    const rawGameDetail = coachClean(analysis.gameDetail, `${coachClean(analysis.pattern, "The recording points to one repeatable decision pattern.")} ${coachClean(analysis.feedback, "Choose one safer next action.")} ${coachClean(analysis.whyTrust, "The feedback is tied to visible replay evidence.")}`);
    const cleanedGameDetail = stripUnverifiedClockReferences(rawGameDetail, narrativeClockAnchors);
    let integratedGameDetail = isManualAnalysis
      ? cleanedGameDetail
      : integrateMomentEvidence(cleanedGameDetail, clockMoments, championName);
    integratedGameDetail = stripRedundantLessonEcho(stripRepeatedConversionGlossary(integratedGameDetail));
    const cleanedEventEvidence = normalizeVisibleCoachText(stripUnverifiedClockReferences(coachClean(analysis.eventEvidence, analysis.evidence || ""), narrativeClockAnchors), championName);
    const cleanedEvidence = normalizeVisibleCoachText(stripUnverifiedClockReferences(coachClean(analysis.evidence, "Generated from sampled replay frames."), narrativeClockAnchors), championName);
    let finalEventEvidence = normalizeCoachPunctuation(clockMomentEvidence || (isGenericEvidenceText(cleanedEventEvidence) ? "" : cleanedEventEvidence));
    if (!isManualAnalysis && isFullReview) {
      const repairMoments = standardRepairMoments(analysis, annotatedClockAnchors, clockMoments, championName);
      let projectedIssues = visibleParagraphStandardIssues({
        file: name,
        durationSeconds: duration,
        analysisSource: analysis.analysisSource || "openai",
        analysisVersion,
        gameDetail: integratedGameDetail,
        secondaryFocus: analysis.secondaryFocus || analysis.secondaryImprovement || "",
        failureEvidence: analysis.failureEvidence || "",
        mistakeTypes: analysis.mistakeTypes || [],
        eventEvidence: finalEventEvidence,
        clockAnchors: annotatedClockAnchors
      });
      if (projectedIssues.length && repairMoments.length) {
        const repairedDetail = teachingDetailFromMoments(analysis, repairMoments, championName);
        const repairedEvidence = eventEvidenceFromMoments(repairMoments, championName);
        if (repairedDetail) integratedGameDetail = stripRedundantLessonEcho(repairedDetail);
        if (repairedEvidence) finalEventEvidence = repairedEvidence;
        projectedIssues = visibleParagraphStandardIssues({
          file: name,
          durationSeconds: duration,
          analysisSource: analysis.analysisSource || "openai",
          analysisVersion,
          gameDetail: integratedGameDetail,
          secondaryFocus: analysis.secondaryFocus || analysis.secondaryImprovement || "",
          failureEvidence: analysis.failureEvidence || "",
          mistakeTypes: analysis.mistakeTypes || [],
          eventEvidence: finalEventEvidence,
          clockAnchors: annotatedClockAnchors
        });
      }
    }

    const shortTitle = isFullReview
      ? `full review ${String(++fullGameCount).padStart(2, "0")}`
      : `highlight ${String(++highlightCount).padStart(2, "0")}`;
    const fingerprint = crypto.createHash("sha1").update(`${name}:${cacheKey}`).digest("hex").slice(0, 12);
    const inferredStats = inferredStatsFromAnalysis(analysis);
    const previousRecording = previousAnalysis || entry.existingEntry || {};
    const sidecarRecordedMs = Date.parse(entry.sidecar?.createdAt || entry.sidecar?.endedAt || "");
    const recordedDate = new Date(Number.isFinite(sidecarRecordedMs) ? sidecarRecordedMs : stat.mtimeMs);
    sourceStats.push({ mtimeMs: recordedDate.getTime() });
    const clipStart = Number(captureMeta.clipTimestampSeconds);
    const clipWindow = Number.isFinite(clipStart)
      ? `${shortClock(clipStart)}-${shortClock(clipStart + duration)}`
      : "";
    const entryCaptureFps = captureFpsForEntry(entry, process.env.LEAGUE_LIVE_FPS || 2);
    const recording = {
      file: name,
      publicFile: destName,
      cacheKey,
      fingerprint,
      matchId: parts.matchId,
      score: parts.score,
      clipNumber: parts.clipNumber,
      matchTimeMs: matchTimeMs || Number(previousRecording.matchTimeMs) || recordedDate.getTime(),
      gameHappenedAt: matchStats.gameHappenedAt || replayMeta.gameHappenedAt || previousRecording.gameHappenedAt || recordedDate.toISOString(),
      gameHappenedAtLabel: matchStats.gameHappenedAtLabel || replayMeta.gameHappenedAtLabel || previousRecording.gameHappenedAtLabel || shortDateTime(recordedDate),
      recordedAt: previousRecording.recordedAt || recordedDate.toISOString(),
      recordedAtLabel: previousRecording.recordedAtLabel || shortDateTime(recordedDate),
      recordedAtTimeLabel: previousRecording.recordedAtTimeLabel || shortTime(recordedDate),
      clipTimestampSeconds: Number.isFinite(clipStart) ? Math.round(clipStart * 1000) / 1000 : null,
      clipTimestamp: captureMeta.clipTimestamp || "",
      clipWindow,
      timestamp: captureMeta.clipTimestamp || "",
      queueId: queueMeta.queueId || previousRecording.queueId || null,
      gameType: queueMeta.gameType || previousRecording.gameType || "Unverified",
      gameTypeSource: queueMeta.gameTypeSource || previousRecording.gameTypeSource || "No queue id found in local logs",
      title: clean(analysis.feedbackTitle, shortTitle),
      duration: mmss(duration),
      durationSeconds: Math.round(duration * 1000) / 1000,
      gameLength: matchStats.gameLength || previousRecording.gameLength || inferredStats.gameLength || "",
      gameLengthSeconds: matchStats.gameLengthSeconds || previousRecording.gameLengthSeconds || inferredStats.gameLengthSeconds || null,
      kda: matchStats.kda || previousRecording.kda || inferredStats.kda || "",
      kills: Number.isFinite(matchStats.kills) ? matchStats.kills : (Number.isFinite(previousRecording.kills) ? previousRecording.kills : inferredStats.kills),
      deaths: Number.isFinite(matchStats.deaths) ? matchStats.deaths : (Number.isFinite(previousRecording.deaths) ? previousRecording.deaths : inferredStats.deaths),
      assists: Number.isFinite(matchStats.assists) ? matchStats.assists : (Number.isFinite(previousRecording.assists) ? previousRecording.assists : inferredStats.assists),
      cs: Number.isFinite(matchStats.cs) ? matchStats.cs : (Number.isFinite(previousRecording.cs) ? previousRecording.cs : inferredStats.cs),
      statsSource: matchStats.statsSource || previousRecording.statsSource || inferredStats.statsSource || "",
      win: typeof matchStats.win === "boolean" ? matchStats.win : (typeof previousRecording.win === "boolean" ? previousRecording.win : (typeof analysis.win === "boolean" ? analysis.win : null)),
      outcome: matchStats.outcome || previousRecording.outcome || analysis.outcome || "",
      outcomeLabel: matchStats.outcomeLabel || previousRecording.outcomeLabel || analysis.outcomeLabel || "",
      outcomeSource: matchStats.outcomeSource || previousRecording.outcomeSource || analysis.outcomeSource || "",
      kind: isFullReview ? "full review" : "highlight",
      reviewPhase: phase,
      champion: championName,
      confidence: clean(analysis.confidence, "low"),
      feedbackTitle: normalizeVisibleCoachText(analysis.feedbackTitle || "Focus", championName),
      feedback: normalizeVisibleCoachText(stripUnmatchedClockTokens(analysis.feedback || "Review the clip and choose one safer next action.", annotatedClockAnchors), championName),
      gameDetail: integratedGameDetail,
      secondaryFocus: normalizeVisibleCoachText(stripUnmatchedClockTokens(stripUnverifiedClockReferences(analysis.secondaryFocus || analysis.secondaryImprovement || "", narrativeClockAnchors), annotatedClockAnchors), championName),
      mistakeTypes: cleanList(analysis.mistakeTypes, 5).map((item) => normalizeVisibleCoachText(item, championName)),
      eventEvidence: finalEventEvidence,
      failureEvidence: normalizeVisibleCoachText(stripUnmatchedClockTokens(stripUnverifiedClockReferences(analysis.failureEvidence || "", narrativeClockAnchors), annotatedClockAnchors), championName),
      goodThing: normalizeVisibleCoachText(analysis.goodThing || "", championName),
      whyTrust: normalizeVisibleCoachText(analysis.whyTrust || "This feedback is tied to the visible replay pattern and one controllable in-game decision.", championName),
      focusTag: normalizeVisibleCoachText(analysis.focusTag || "review", championName),
      evidence: normalizeCoachPunctuation(clockMomentEvidence || (isGenericEvidenceText(cleanedEvidence) ? "" : cleanedEvidence)),
      pattern: normalizeVisibleCoachText(stripUnmatchedClockTokens(stripUnverifiedClockReferences(coachClean(analysis.pattern, "The recording points to one repeatable decision pattern."), narrativeClockAnchors), annotatedClockAnchors), championName),
      diamondRule: normalizeVisibleCoachText(analysis.diamondRule || "Convert the first winning moment before taking the next fight.", championName),
      drill: normalizeVisibleCoachText(analysis.drill || "Name the payout before committing.", championName),
      timeline: stripUnverifiedTimelineItems(analysis.timeline, narrativeClockAnchors),
      clockAnchors: annotatedClockAnchors,
      clockMoments,
      nuance: cleanList(analysis.nuance, 5).map((item) => normalizeVisibleCoachText(item, championName)),
      reviewLimit: normalizeVisibleCoachText(stripDetailRefreshFailureNotes(analysis.reviewLimit) || "The review is based on sampled frames, not full input/cooldown telemetry.", championName),
      analysisSource: analysis.analysisSource || "cache",
      analysisVersion: analysis.analysisVersion || analysisVersion,
      sampledFrames: analysis.sampledFrames || (cached ? cached.sampledFrames : analysisSampleTimes(duration, entry.sidecar).length),
      publicVideoBytes,
      ...(entryCaptureFps ? { captureFps: entryCaptureFps } : {}),
      src: publicPath(destPath),
      poster: publicPath(posterPath)
    };
    repairVisibleReviewForStandard(recording, name);
    repairPublishAuditRequirements(recording, name);
    sanitizeAbstractBranchLanguage(recording);
    sanitizeTemplateResidue(recording);
    const rankEstimate = rankedEquivalentForRecording(recording);
    if (rankEstimate) {
      recording.rankEstimate = rankEstimate;
      recording.performanceRank = performanceRankForRecording(recording, rankEstimate);
    }
    enforceVisibleParagraphStandard(recording, name);
    sanitizeTemplateResidue(recording);
    recordings.push(recording);
    console.log(`${name}: ${recordings.at(-1).reviewPhase} - ${recordings.at(-1).champion} - ${recordings.at(-1).feedbackTitle}`);
  }

  const calibrationContext = rankCalibrationContext(recordings);
  for (const recording of recordings) {
    sanitizeTemplateResidue(recording);
    const rankEstimate = rankedEquivalentForRecording(recording, calibrationContext);
    if (rankEstimate) {
      recording.rankEstimate = rankEstimate;
      recording.performanceRank = performanceRankForRecording(recording, rankEstimate);
    } else {
      delete recording.rankEstimate;
      delete recording.performanceRank;
    }
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
    reviewBasis: "Newest match first; duplicate same-match captures collapse to the fullest auto review.",
    mainFeedback,
    rankCalibration: rankCalibrationSummary(recordings),
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
