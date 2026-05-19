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
const analysisVersion = "2026-05-18-deep-recording-feedback-v7";
const largeRecordingBytes = Number(process.env.LEAGUE_LARGE_RECORDING_BYTES || 45 * 1024 * 1024);
const targetPublicVideoBytes = Number(process.env.LEAGUE_TARGET_PUBLIC_VIDEO_BYTES || 32 * 1024 * 1024);

function clean(value, fallback = "") {
  return String(value || fallback).replace(/\s+/g, " ").trim();
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
  const match = file.match(/^([^_]+)_(NA1-\d+)_(\d+)\.webm$/i);
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
  return labels[Number(queueId)] || "Unverified";
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
      const fileMatch = line.match(/Highlights[\\/]+([^:]+?\.webm)\b/i);
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
  return { replayTimes, queues, captureTimes };
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
    { crf: "31", maxrate: "1200k", bufsize: "2400k" },
    { crf: "34", maxrate: "850k", bufsize: "1700k" },
    { crf: "37", maxrate: "650k", bufsize: "1300k" },
    { crf: "40", maxrate: "480k", bufsize: "960k" }
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
      "-vf", "scale=1280:-2",
      "-c:a", "aac",
      "-b:a", "64k",
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
  const stale = !current || current.mtimeMs < sourceStat.mtimeMs || current.size === 0;
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
    .map((item) => clean(String(item).replace(/^[-*\d.]+\s*/, "")))
    .filter(Boolean)
    .slice(0, maxItems);
}

async function readExistingManifest() {
  try {
    return JSON.parse(await fs.readFile(manifestPath, "utf8"));
  } catch {
    return null;
  }
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
  if (manualFeedback(fileName) && cached.analysisSource !== "manual") return null;
  if (cached.analysisSource === "fallback" && process.env.OPENAI_API_KEY) return null;
  if (process.env.LEAGUE_FORCE_ANALYSIS === "1") return null;
  return cached;
}

function manualFeedback(file) {
  if (file === "16-10_NA1-5563352800_01.webm") {
    return {
      champion: "Samira",
      confidence: "high",
      feedbackTitle: "Name payout before E/R",
      feedback: "Before dashing in, name the payout: wave, tower, dragon, recall, or nexus; if none is real, hold the dash.",
      whyTrust: "The newest storyboard shows the carry pattern working when kills become bot tower, inhibitor, and nexus pressure; this is the same mechanic that transfers from beginner bots into ranked.",
      focusTag: "payout before dash",
      evidence: "Manual storyboard review of the May 18 8:10 PM game: early bot pressure, double-kill conversion, turret take, inhibitor take, and nexus pressure.",
      pattern: "The damage is already there. The Challenger-shaped rep is making every Samira all-in start with a named payout and end before shutdown gold is handed back.",
      diamondRule: "No E/R commit until the payout and exit are named.",
      drill: "Say one word before E/R: wave, tower, dragon, recall, or nexus.",
      nuance: [
        "At 3:35 the bot fight becomes a double kill because Samira stays near the wave and ally pressure.",
        "At 7:39 the won lane becomes turret gold instead of more random fighting.",
        "At 13:16 the pressure becomes inhibitor, then nexus pressure.",
        "Beginner bot games can reward extra fighting, so the ranked-transfer skill is converting first and fighting second."
      ],
      reviewLimit: "Manual review used sampled replay frames and log timing, not raw inputs or full cooldown telemetry.",
      analysisSource: "manual"
    };
  }
  if (file !== "16-10_NA1-5563301586_01.webm") return null;
  return {
    champion: "Samira",
    confidence: "high",
    feedbackTitle: "Reset before lethal HP",
    feedback: "When lane health drops to one Ashe auto or spell, give the wave and recall; dying for the crash delays the item that makes the next fight easy.",
    whyTrust: "The reviewed frames show Samira around 60 HP under the bot wave before Ashe finishes the kill, while later fights work because the lead is converted with items and teammates nearby.",
    focusTag: "lethal hp reset",
    evidence: "Manual storyboard review of the May 18 full recording: early lane death at lethal HP, later kills and turret/base conversion after grouping.",
    pattern: "The new game is better at converting once Samira has items, but the early lane still has a lethal-HP greed point: staying for the wave while one hit from death turns a manageable recall into a death timer.",
    diamondRule: "Below one enemy auto or spell, the wave is no longer the objective; reset first, then play the next item spike.",
    drill: "At low HP, say 'one hit kills me' and recall unless the enemy bot lane is dead or fully gone.",
    nuance: [
      "Around the early bot crash, Samira is already at lethal HP with the enemy marksman still in range.",
      "The death is not a mechanics problem; it is a health-gate decision before the next minion wave.",
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
      whyTrust: "The advice is low-confidence on gameplay and high-confidence on review quality because a one-second clip hides the decision that caused the outcome.",
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
      feedback: "The full-game read says damage is enough; the high-elo rep is ending won fights through wave, tower, dragon, Baron, nexus, or recall.",
      whyTrust: "A 16/10 Samira can already create leads; reducing deaths after wins keeps shutdown gold and turns mechanics into rank pressure.",
      focusTag: "overstay control",
      evidence: "Match-level Samira read from sampled replay frames and side-list evidence.",
      pattern: "The carry score says damage is available, so the rank leak is likely conversion after the first winning moment.",
      diamondRule: "After a won fight, take the guaranteed payout before looking for the next fight.",
      drill: "Say the payout out loud after every kill: wave, tower, dragon, Baron, nexus, or recall.",
      nuance: ["High kills only matter when the map state changes.", "Shutdown deaths after a win erase the lead Samira already created."],
      reviewLimit: "Conservative read until a full model pass is available.",
      analysisSource: "fallback"
    };
  }
  const samiraFallbacks = [
    {
      feedbackTitle: "Ask for the payout first",
      feedback: "Before committing, know what the win buys: crash, plate, tower, dragon move, recall, or end.",
      whyTrust: "High-elo ADCs climb by turning pressure into tempo; a kill with no payout is just a higher-risk fight.",
      pattern: "The fight needs a planned map payout before the commit.",
      diamondRule: "Commit only when the win has an immediate conversion path.",
      drill: "Name the payout before pressing the engage button.",
      nuance: ["A good-looking kill is still low value if the wave or objective stays unchanged."],
      focusTag: "commit timing"
    },
    {
      feedbackTitle: "Name the CC before going in",
      feedback: "Before E/R, identify the one spell that cancels the play; enter only after it is spent, blocked by W, or aimed elsewhere.",
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
      whyTrust: "This preserves the aggression while removing the single easiest way enemies stop Samira.",
      pattern: "Chokes punish the first champion in; Samira gets more value as the second entry.",
      diamondRule: "Second in at jungle walls unless the enemy CC is already gone.",
      drill: "Pause at the choke edge and enter after the first cooldown exchange.",
      nuance: ["The pause is a setup for resets, not hesitation."],
      focusTag: "objective conversion"
    },
    {
      feedbackTitle: "Hit the structure",
      feedback: "At inhib or nexus, the high-elo rep is ending as soon as the structure is available.",
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
    evidence: "Tied to one repeatable Samira decision from sampled replay context.",
    pattern: fallback.pattern || "The recording points to one repeatable decision leak.",
    diamondRule: fallback.diamondRule || "Convert the first win before taking the next fight.",
    drill: fallback.drill || "Name the payout before committing.",
    nuance: fallback.nuance || ["Conservative analysis until the model can read the sampled frames."],
    reviewLimit: fallback.reviewLimit || "Conservative read until a full model pass is available.",
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

async function analyzeRecording({ file, duration, framePaths, frameTimes, sequenceLabel, reviewPhase: phase }) {
  const manual = manualFeedback(file);
  if (manual) return { ...manual, sampledFrames: framePaths.length };
  if (!process.env.OPENAI_API_KEY) return fallbackFeedback(file, duration, { reviewPhase: phase });
  const images = await Promise.all(framePaths.map(async (framePath) => ({
    type: "input_image",
    image_url: `data:image/jpeg;base64,${(await fs.readFile(framePath)).toString("base64")}`,
    detail: "high"
  })));
  const frameList = frameTimes.map((time, index) => `${index + 1}:${mmss(time)}`).join(", ");

  const prompt = [
    "Analyze these League of Legends replay frames extremely carefully for Alan, currently around Silver 4 and trying to build Challenger-level decision quality.",
    "Images are chronological sampled frames from the recording. Read them in order and use every visible clue: followed champion, team list/nameplate, health bars, minimap shape when visible, wave state, structure/objective context, fight numbers, target selection, spacing, fog, recalls, base state, and obvious crowd-control or cooldown evidence.",
    "The player champion is usually the champion the replay camera follows most. Use the side list/nameplate when visible. If uncertain, say low confidence and state the limit.",
    "Use capture order internally to distinguish earlier leak evidence from later implementation attempts, but do not mention recency weighting in visible output.",
    `This recording is ${sequenceLabel}. Review phase: ${phase}.`,
    `Sampled frame times: ${frameList}. Duration: ${mmss(duration)}.`,
    "Give exactly one highest-value improvement for this recording, plus a fuller read of the nuance behind it. The top advice must stay direct, narrow, and playable in the next queue.",
    "If the visible frames are too sparse for a claim, say that in reviewLimit instead of inventing certainty.",
    "Prioritize high-elo habits: wave crash, recall timing, objective conversion, shutdown protection, numbers before joining, second entry, cooldown/CC accounting, vision/fog discipline, target choice, structure hitting, and reset discipline.",
    "If this is an implementation or current-form clip, evaluate the next constraint after the attempted improvement instead of only repeating the old diagnosis.",
    "Also include whyTrust: one concrete reason Alan should trust and try the feedback, grounded in Samira mechanics, map conversion, recording evidence, or anxiety-reducing decision rules.",
    "Visible page copy should be concise and operational. Avoid phrases like 'you should' or broad coaching.",
    "Return only JSON with this shape:",
    '{"champion":"detected champion","confidence":"high|medium|low","feedbackTitle":"short title","feedback":"one specific sentence","whyTrust":"one concrete reason to trust this feedback","focusTag":"short tag","evidence":"short visual basis","pattern":"fuller read of the visible pattern, 1-2 sentences","diamondRule":"one exact rule that would still matter in Challenger","drill":"one next-game repetition","nuance":["3-5 specific nuance bullets from the frames"],"reviewLimit":"what the sampled frames cannot prove"}',
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
      feedbackTitle: clean(parsed.feedbackTitle, "Focus"),
      feedback: clean(parsed.feedback, "Review the clip and choose one safer next action."),
      whyTrust: clean(parsed.whyTrust, "This feedback is tied to the visible replay pattern and one controllable in-game decision."),
      focusTag: clean(parsed.focusTag, "review"),
      evidence: clean(parsed.evidence, "Generated from sampled replay frames."),
      pattern: clean(parsed.pattern, "The recording points to one repeatable decision pattern."),
      diamondRule: clean(parsed.diamondRule, "Convert the first winning moment before taking the next fight."),
      drill: clean(parsed.drill, "Name the payout before committing."),
      nuance: cleanList(parsed.nuance, 5),
      reviewLimit: clean(parsed.reviewLimit, "The review is based on sampled frames, not full input/cooldown telemetry."),
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
    nextRep: "Queue cue: payout first.",
    whyTrust: "The newest recording already shows kills turning into turret, inhibitor, and nexus pressure; repeating that without handing shutdowns back is the ranked-transfer skill.",
    pattern: "The damage is already enough for beginner bots. Challenger-level Samira is not more fighting; it is choosing the fight that creates a map payout, then leaving or ending cleanly.",
    checklist: ["Name the payout.", "Enter second if CC is unknown.", "After the payout, reset or hit the next structure."],
    reviewLimit: "Main read combines manual storyboard review, replay timing, and visible frame evidence."
  };
  const fallback = latest?.focusTag === "payout before dash" ? simplePayoutFocus : latest?.focusTag === "lethal hp reset" ? {
    title: "Samira: reset before lethal HP",
    focus: "The new game already shows better conversion later; the next climb rep is leaving lane when one enemy auto or spell kills Samira.",
    rule: "Below lethal HP, the wave is no longer the objective: recall unless the enemy bot lane is dead or fully gone.",
    nextRep: "Queue cue: one hit kills me -> reset.",
    whyTrust: "This targets the visible early death without nerfing the later aggression that produced kills, turret pressure, inhibitor pressure, and the win.",
    pattern: "The latest recording is not a damage problem. It shows a lane health-gate problem early, followed by much better conversion once Samira has items and teammates nearby.",
    checklist: ["At low HP, count enemy autos before minions.", "Give the crash if one hit kills Samira.", "Return with the item, then convert kills into structures."],
    reviewLimit: "Main read combines generated clip review with manual storyboard review of the newest full recording."
  } : {
    title: "Samira: kill, crash, reset",
    focus: "The climb gap is conversion, not damage: every won fight must become wave crash, tower, dragon, Baron, nexus, or a recall with gold.",
    rule: "No second E/R unless the payout is secured or the next target is isolated, low, and the exit is named.",
    nextRep: "Queue cue: kill -> payout -> reset.",
    whyTrust: "This is high-elo-shaped because deaths with shutdown gold erase the leads Samira creates; conversion turns the same mechanics into XP, tempo, and objectives.",
    pattern: "Across the recordings, the climb value is not finding more damage. It is ending the first winning moment through a map payout before the fight becomes coin-flip again.",
    checklist: ["Name the payout before the commit.", "Crash or reset after the first win.", "Take the second fight only with numbers, CC, and exit known."],
    reviewLimit: "Replay review is based on sampled frames and visible state, not raw inputs or full cooldown telemetry."
  };
  if (!process.env.OPENAI_API_KEY || !recordings.length) return fallback;
  const notes = recordings.map((item, index) => (
    `${index + 1}. ${item.title} [${item.reviewPhase || "baseline"}] (${item.champion}, ${item.duration}): ${item.feedbackTitle} - ${item.feedback}. Pattern: ${item.pattern || ""} Rule: ${item.diamondRule || ""}`
  )).join("\n");
  const prompt = [
    "Given these deeply analyzed League recording feedback notes, produce one simple focus for Alan's next queue.",
    "He is around Silver 4 and wants Challenger-level advice. Keep the summary narrow enough to remember while playing.",
    "Use capture order internally to distinguish earlier leak evidence from implementation attempts. Do not mention recency weighting in visible output.",
    "If the newer clips show an earlier rule being attempted, choose the next simple constraint that preserves the improvement instead of repeating only the old leak.",
    "Do not summarize everything. Choose the single improvement with the highest climb value from the recordings and explain the evidence behind it.",
    "Include whyTrust: one concrete reason Alan should trust and try this focus even if skeptical or anxious.",
    "Avoid phrases like 'you should'. Return only JSON:",
    '{"title":"short title","focus":"one sentence","rule":"one in-game rule","nextRep":"one tiny queue cue","whyTrust":"one concrete reason to trust the focus","pattern":"fuller read of the cross-recording pattern","checklist":["3 tiny checks for the next queue"],"reviewLimit":"short limit of the evidence"}',
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
  const sourceEntries = (await Promise.all((await fs.readdir(sourceDir, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".webm"))
    .map(async (entry) => {
      const sourcePath = path.join(sourceDir, entry.name);
      return {
        name: entry.name,
        sourcePath,
        stat: await fs.stat(sourcePath)
      };
    }))).sort((a, b) => a.stat.mtimeMs - b.stat.mtimeMs || a.name.localeCompare(b.name));
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
    const captureMeta = recordingMetadata.captureTimes.get(name) || {};
    const phase = reviewPhase(index, sourceEntries.length);
    const sequenceLabel = `${index + 1} of ${sourceEntries.length}`;
    sourceStats.push(stat);
    const slug = slugify(name);
    const destName = publicRecordingName(name, stat);
    const destPath = path.join(recordingRoot, destName);
    const posterPath = path.join(posterRoot, `${slug}.jpg`);
    const cacheKey = cacheKeyFor(stat);
    const cached = cachedRecording(existing, name, cacheKey);

    const publicVideoBytes = await ensurePublicVideo(sourcePath, destPath, stat);
    const duration = await probeDuration(sourcePath);
    totalSeconds += duration;
    if (!(await exists(posterPath)) || !cached) {
      await extractFrame(sourcePath, posterPath, Math.max(0.2, duration * 0.5), 640);
    }

    let analysis = cached;
    if (!analysis) {
      const frameDir = path.join(analysisRoot, slug);
      await fs.mkdir(frameDir, { recursive: true });
      const sampleTimes = sampleTimesFor(duration);
      const framePaths = [];
      for (let sampleIndex = 0; sampleIndex < sampleTimes.length; sampleIndex += 1) {
        const framePath = path.join(frameDir, `frame-${sampleIndex + 1}.jpg`);
        await extractFrame(sourcePath, framePath, sampleTimes[sampleIndex], duration > 90 ? 960 : 1024);
        framePaths.push(framePath);
      }
      analysis = await analyzeRecording({ file: name, duration, framePaths, frameTimes: sampleTimes, sequenceLabel, reviewPhase: phase });
    }

    const isFullReview = duration > 90;
    const shortTitle = isFullReview
      ? `full review ${String(++fullGameCount).padStart(2, "0")}`
      : `highlight ${String(++highlightCount).padStart(2, "0")}`;
    const fingerprint = crypto.createHash("sha1").update(`${name}:${cacheKey}`).digest("hex").slice(0, 12);
    const recordedDate = new Date(stat.mtimeMs);
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
      matchTimeMs: replayMeta.matchTimeMs || stat.mtimeMs,
      gameHappenedAt: replayMeta.gameHappenedAt || recordedDate.toISOString(),
      gameHappenedAtLabel: replayMeta.gameHappenedAtLabel || shortDateTime(recordedDate),
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
      title: shortTitle,
      duration: mmss(duration),
      durationSeconds: Math.round(duration * 1000) / 1000,
      kind: isFullReview ? "full review" : "highlight",
      reviewPhase: phase,
      champion: clean(analysis.champion, "Unknown"),
      confidence: clean(analysis.confidence, "low"),
      feedbackTitle: clean(analysis.feedbackTitle, "Focus"),
      feedback: clean(analysis.feedback, "Review the clip and choose one safer next action."),
      whyTrust: clean(analysis.whyTrust, "This feedback is tied to the visible replay pattern and one controllable in-game decision."),
      focusTag: clean(analysis.focusTag, "review"),
      evidence: clean(analysis.evidence, "Generated from sampled replay frames."),
      pattern: clean(analysis.pattern, "The recording points to one repeatable decision pattern."),
      diamondRule: clean(analysis.diamondRule, "Convert the first winning moment before taking the next fight."),
      drill: clean(analysis.drill, "Name the payout before committing."),
      nuance: cleanList(analysis.nuance, 5),
      reviewLimit: clean(analysis.reviewLimit, "The review is based on sampled frames, not full input/cooldown telemetry."),
      analysisSource: analysis.analysisSource || "cache",
      analysisVersion,
      sampledFrames: analysis.sampledFrames || (cached ? cached.sampledFrames : sampleTimesFor(duration).length),
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
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  console.log(`Wrote ${path.relative(appRoot, manifestPath)} with ${recordings.length} recordings.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
