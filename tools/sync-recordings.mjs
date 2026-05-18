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
const model = process.env.LEAGUE_ANALYSIS_MODEL || "gpt-4.1";
const timeZone = "America/New_York";
const analysisVersion = "2026-05-18-recording-feedback-v3";

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
  if (cached.analysisSource === "fallback" && process.env.OPENAI_API_KEY) return null;
  if (process.env.LEAGUE_FORCE_ANALYSIS === "1") return null;
  return cached;
}

function fallbackFeedback(file, duration) {
  const clipNumber = Number(file.match(/_(\d+)\.webm$/i)?.[1]) || 0;
  if (duration < 3) {
    return {
      champion: "Samira",
      confidence: "low",
      feedbackTitle: "Make clips reviewable",
      feedback: "Keep at least five seconds before and after the fight so the trigger, cooldowns, and exit can be judged.",
      focusTag: "recording context",
      evidence: "The recording is shorter than three seconds.",
      analysisSource: "fallback"
    };
  }
  if (duration > 90) {
    return {
      champion: "Samira",
      confidence: "medium",
      feedbackTitle: "Cut the 10-death pattern",
      feedback: "16/10 Samira says damage is not the gap; climb by refusing the second fight unless it buys tower, dragon, Baron, or nexus.",
      focusTag: "overstay control",
      evidence: "Fallback uses the match-level Samira read from sampled replay frames and side-list evidence.",
      analysisSource: "fallback"
    };
  }
  const samiraFallbacks = [
    {
      feedbackTitle: "E only after the exit exists",
      feedback: "Hold E until the target is lethal or a reset, Flash, teammate cover, or clean walk-out path is already visible.",
      focusTag: "commit timing"
    },
    {
      feedbackTitle: "Name the CC before going in",
      feedback: "Before E/R, identify the one spell that cancels the play; enter only after it is spent, blocked by W, or aimed elsewhere.",
      focusTag: "reset discipline"
    },
    {
      feedbackTitle: "Stop chasing at fog",
      feedback: "A low target past vision is not free; shove the wave or take plate unless the next enemy position is known.",
      focusTag: "chase discipline"
    },
    {
      feedbackTitle: "Turn bot kills into tempo",
      feedback: "After the first kill or forced recall, crash wave first, then choose plate, dragon move, reset, or support roam.",
      focusTag: "objective conversion"
    },
    {
      feedbackTitle: "Fight from the edge first",
      feedback: "Let Q, autos, and W collect cooldowns before entering; Samira should clean the fight, not start it blind.",
      focusTag: "crowd-control tracking"
    },
    {
      feedbackTitle: "Do not review one-second clips",
      feedback: "This moment needs pre-fight context; future highlight capture should include the decision before the kill screen.",
      focusTag: "reset discipline"
    },
    {
      feedbackTitle: "Recall with shutdown value",
      feedback: "After a tower or multi-kill, leave while holding gold; dying after the win gives away the tempo that should climb.",
      focusTag: "cash-out timing"
    },
    {
      feedbackTitle: "Count numbers before answering",
      feedback: "If a teammate dies nearby, count visible enemies before joining; do not spend E to rescue a fight already lost.",
      focusTag: "safe gold"
    },
    {
      feedbackTitle: "Side farm only with cover",
      feedback: "Catch the wave, then leave toward teammates; stay side only when mid has priority or three enemies are visible.",
      focusTag: "late entry"
    },
    {
      feedbackTitle: "Do not duel without the exit",
      feedback: "When an enemy catches a wave, pressure the objective first; take the duel only with ult, summoner info, and a walk-out.",
      focusTag: "exit planning"
    },
    {
      feedbackTitle: "Never be first into choke",
      feedback: "At jungle walls, hold the edge until enemy CC is used; entering first makes Samira the target instead of the finisher.",
      focusTag: "objective conversion"
    },
    {
      feedbackTitle: "End after the base win",
      feedback: "At inhib or nexus, kills are only a tool; hit the structure as soon as the fight is won instead of extending.",
      focusTag: "overstay control"
    }
  ];
  const fallback = samiraFallbacks[Math.max(0, clipNumber - 1) % samiraFallbacks.length];
  return {
    champion: "Samira",
    confidence: "medium",
    ...fallback,
    evidence: "Fallback uses the match-level Samira read from sampled replay frames and side-list evidence.",
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

async function analyzeRecording({ file, duration, framePaths }) {
  if (!process.env.OPENAI_API_KEY) return fallbackFeedback(file, duration);
  const images = await Promise.all(framePaths.map(async (framePath) => ({
    type: "input_image",
    image_url: `data:image/jpeg;base64,${(await fs.readFile(framePath)).toString("base64")}`,
    detail: "low"
  })));

  const prompt = [
    "Analyze these League of Legends replay frames from one recording for Alan, currently around Silver 4 and trying to climb toward Diamond.",
    "The player champion is usually the champion the replay camera follows most. Use the side list/nameplate when visible. If uncertain, say low confidence.",
    "Give exactly one improvement for this recording. Keep it direct, narrow, and playable in the next queue. Do not give generic encouragement.",
    "Visible page copy should be concise and operational. Avoid phrases like 'you should' or broad coaching.",
    "Return only JSON with this shape:",
    '{"champion":"Samira","confidence":"high|medium|low","feedbackTitle":"short title","feedback":"one specific sentence","focusTag":"short tag","evidence":"short visual basis"}',
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
        max_output_tokens: 700,
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
      focusTag: clean(parsed.focusTag, "review"),
      evidence: clean(parsed.evidence, "Generated from sampled replay frames."),
      analysisSource: "openai"
    };
  } catch (error) {
    console.warn(`Feedback fallback for ${file}: ${error.message}`);
    return fallbackFeedback(file, duration);
  }
}

async function summarizeRecordings(recordings, detectedChampions) {
  const fallback = {
    title: "Samira: E only with an exit",
    focus: "Before every E, name the exit: lethal reset, Flash, teammate cover, or a clean walk-out path.",
    rule: "Kill or tower -> crash wave, take objective space, or recall; no second fight unless it wins the map.",
    nextRep: "Next queue cue: exit before E."
  };
  if (!process.env.OPENAI_API_KEY || !recordings.length) return fallback;
  const notes = recordings.map((item, index) => (
    `${index + 1}. ${item.title} (${item.champion}, ${item.duration}): ${item.feedbackTitle} - ${item.feedback}`
  )).join("\n");
  const prompt = [
    "Given these League recording feedback notes, produce one simple focus for Alan's next queue.",
    "He is around Silver 4 and wants Diamond. Keep the summary narrow enough to remember while playing.",
    "Do not summarize everything. Choose the single repeated improvement with the highest climb value.",
    "Avoid phrases like 'you should'. Return only JSON:",
    '{"title":"short title","focus":"one sentence","rule":"one in-game rule","nextRep":"one tiny queue cue"}',
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
      nextRep: clean(parsed.nextRep, fallback.nextRep)
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
  const sourceEntries = (await fs.readdir(sourceDir, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".webm"))
    .sort((a, b) => a.name.localeCompare(b.name));

  const sourceStats = [];
  const recordings = [];
  let totalSeconds = 0;

  for (let index = 0; index < sourceEntries.length; index += 1) {
    const entry = sourceEntries[index];
    const sourcePath = path.join(sourceDir, entry.name);
    const stat = await fs.stat(sourcePath);
    sourceStats.push(stat);
    const slug = slugify(entry.name);
    const destPath = path.join(recordingRoot, entry.name);
    const posterPath = path.join(posterRoot, `${slug}.jpg`);
    const cacheKey = cacheKeyFor(stat);
    const cached = cachedRecording(existing, entry.name, cacheKey);

    const destNeedsCopy = !(await exists(destPath)) || (await fs.stat(destPath)).size !== stat.size;
    if (destNeedsCopy) {
      await fs.copyFile(sourcePath, destPath);
      await fs.utimes(destPath, stat.atime, stat.mtime);
    }

    const duration = await probeDuration(sourcePath);
    totalSeconds += duration;
    if (!(await exists(posterPath)) || !cached) {
      await extractFrame(sourcePath, posterPath, Math.max(0.2, duration * 0.5), 640);
    }

    let analysis = cached;
    if (!analysis) {
      const frameDir = path.join(analysisRoot, slug);
      await fs.mkdir(frameDir, { recursive: true });
      const sampleTimes = duration < 3
        ? [Math.max(0.2, duration * 0.5)]
        : [duration * 0.22, duration * 0.52, duration * 0.82];
      const framePaths = [];
      for (let sampleIndex = 0; sampleIndex < sampleTimes.length; sampleIndex += 1) {
        const framePath = path.join(frameDir, `frame-${sampleIndex + 1}.jpg`);
        await extractFrame(sourcePath, framePath, sampleTimes[sampleIndex], 640);
        framePaths.push(framePath);
      }
      analysis = await analyzeRecording({ file: entry.name, duration, framePaths });
    }

    const shortTitle = index === sourceEntries.length - 1 && duration > 90 ? "full game 8x" : `highlight ${String(index + 1).padStart(2, "0")}`;
    const fingerprint = crypto.createHash("sha1").update(`${entry.name}:${cacheKey}`).digest("hex").slice(0, 12);
    recordings.push({
      file: entry.name,
      cacheKey,
      fingerprint,
      title: shortTitle,
      duration: mmss(duration),
      durationSeconds: Math.round(duration * 1000) / 1000,
      kind: shortTitle === "full game 8x" ? "full 8x" : "highlight",
      champion: clean(analysis.champion, "Unknown"),
      confidence: clean(analysis.confidence, "low"),
      feedbackTitle: clean(analysis.feedbackTitle, "Focus"),
      feedback: clean(analysis.feedback, "Review the clip and choose one safer next action."),
      focusTag: clean(analysis.focusTag, "review"),
      evidence: clean(analysis.evidence, "Generated from sampled replay frames."),
      analysisSource: analysis.analysisSource || "cache",
      analysisVersion,
      src: publicPath(destPath),
      poster: publicPath(posterPath)
    });
    console.log(`${entry.name}: ${recordings.at(-1).champion} - ${recordings.at(-1).feedbackTitle}`);
  }

  const detectedChampions = aggregateChampions(recordings);
  const mainFeedback = await summarizeRecordings(recordings, detectedChampions);
  const manifest = {
    generatedAt: new Date().toISOString(),
    source: "League of Legends Highlights folder",
    match: recordings[0]?.file.match(/NA1-\d+/)?.[0] || "latest",
    captured: capturedRange(sourceStats),
    totalDuration: mmss(totalSeconds),
    totalRecordings: recordings.length,
    mainFeedback,
    detectedChampions,
    recordings
  };
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  console.log(`Wrote ${path.relative(appRoot, manifestPath)} with ${recordings.length} recordings.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
