import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, "..");
const publicRoot = path.join(appRoot, "public");
const analysisRoot = path.join(appRoot, "_recording-analysis");
const manifestPath = path.join(publicRoot, "recordings", "recordings.json");
const model = process.env.LEAGUE_TIMESTAMP_AUDIT_MODEL || process.env.LEAGUE_ANALYSIS_MODEL || "gpt-4.1";

function clean(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function slugify(value) {
  return clean(value)
    .toLowerCase()
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

function normalizeClock(value) {
  const match = String(value || "").match(/\b(\d{1,2}):([0-5]\d)\b/);
  if (!match) return "";
  return `${Number(match[1])}:${match[2]}`;
}

function clockSeconds(clock) {
  const normalized = normalizeClock(clock);
  if (!normalized) return null;
  const [minutes, seconds] = normalized.split(":").map(Number);
  return minutes * 60 + seconds;
}

function mmss(seconds) {
  const rounded = Math.max(0, Math.round(Number(seconds) || 0));
  return `${Math.floor(rounded / 60)}:${String(rounded % 60).padStart(2, "0")}`;
}

function parseJsonText(text) {
  const stripped = clean(text).replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const match = stripped.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON object returned");
  return JSON.parse(match[0]);
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

async function extractFrame(input, output, second) {
  await fs.mkdir(path.dirname(output), { recursive: true });
  await execFileAsync("ffmpeg", [
    "-y",
    "-v", "error",
    "-ss", String(Math.max(0, second)),
    "-i", input,
    "-frames:v", "1",
    "-vf", "scale=1280:-1",
    output
  ]);
}

function manifestVideoPath(recording) {
  const src = String(recording.src || recording.publicFile || "").replace(/^\//, "");
  return path.join(publicRoot, src);
}

function narrativeFields(recording) {
  return [
    recording.gameDetail,
    recording.eventEvidence,
    recording.evidence,
    recording.pattern,
    ...(Array.isArray(recording.timeline) ? recording.timeline : [])
  ].filter(Boolean);
}

function timestampMatchesAnchor(timestamp, anchors) {
  const seconds = clockSeconds(timestamp);
  if (!Number.isFinite(seconds)) return false;
  return anchors.some((anchor) => {
    const anchorSeconds = clockSeconds(anchor.clock);
    return Number.isFinite(anchorSeconds) && Math.abs(anchorSeconds - seconds) <= 2.5;
  });
}

function unanchoredNarrativeTimestamps(recording, anchors) {
  const misses = [];
  for (const text of narrativeFields(recording)) {
    const matches = String(text).match(/\b\d{1,2}:[0-5]\d\b/g) || [];
    for (const timestamp of matches) {
      if (!timestampMatchesAnchor(timestamp, anchors)) misses.push(timestamp);
    }
  }
  return [...new Set(misses)];
}

async function verifyAnchorsWithVision(recording, anchors, videoPath) {
  if (!anchors.length) return [];
  if (!process.env.OPENAI_API_KEY) {
    return anchors.map((anchor, index) => ({
      index: index + 1,
      expected: anchor.clock,
      pass: null,
      visibleClock: "",
      note: "OPENAI_API_KEY unavailable; frame extracted but not vision-verified"
    }));
  }

  const auditDir = path.join(analysisRoot, slugify(recording.file), "timestamp-audit");
  const content = [];
  for (let index = 0; index < anchors.length; index += 1) {
    const anchor = anchors[index];
    const framePath = path.join(auditDir, `anchor-${String(index + 1).padStart(2, "0")}-${normalizeClock(anchor.clock).replace(":", "-")}.jpg`);
    await extractFrame(videoPath, framePath, Number(anchor.videoSeconds));
    content.push({
      type: "input_text",
      text: `Frame ${index + 1}: expected League game clock ${anchor.clock}; review-video seek ${mmss(anchor.videoSeconds)} (${anchor.videoSeconds}s). Pass only if this exact frame visibly shows the expected League in-game clock or a clock within two seconds of it.`
    });
    content.push({
      type: "input_image",
      image_url: `data:image/jpeg;base64,${(await fs.readFile(framePath)).toString("base64")}`,
      detail: "high"
    });
  }

  const prompt = [
    "Audit clickable timestamp anchors for league.aolabs.io.",
    "For each frame, read the current League of Legends in-game HUD clock only. Ignore browser/player overlays and any other clocks.",
    "Return pass=true only when the expected game clock is visibly readable in that exact frame, allowing at most two seconds of visual/OCR tolerance.",
    "If the frame is too blurry, cropped, alt-tabbed, green-blocked, or the clock is not visible/readable, pass=false.",
    "Return only JSON:",
    '{"checks":[{"index":1,"expected":"MM:SS","visibleClock":"MM:SS or unreadable","pass":true,"description":"what is visible"}]}',
    `Recording file: ${recording.file}.`
  ].join("\n");

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
            ...content
          ]
        }
      ]
    })
  });
  if (!response.ok) throw new Error(`OpenAI timestamp audit ${response.status}`);
  const parsed = parseJsonText(extractOutputText(await response.json()));
  return Array.isArray(parsed.checks) ? parsed.checks : [];
}

async function main() {
  const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
  const failures = [];
  const warnings = [];
  let checkedAnchors = 0;

  for (const recording of manifest.recordings || []) {
    const anchors = (Array.isArray(recording.clockAnchors) ? recording.clockAnchors : [])
      .map((anchor) => ({
        clock: normalizeClock(anchor.clock),
        videoSeconds: Number(anchor.videoSeconds),
        description: clean(anchor.description)
      }))
      .filter((anchor) => anchor.clock && Number.isFinite(anchor.videoSeconds));

    const duration = Number(recording.durationSeconds || 0);
    const videoPath = manifestVideoPath(recording);
    const unanchored = unanchoredNarrativeTimestamps(recording, anchors);
    if (unanchored.length) {
      failures.push(`${recording.file}: visible text has unverified timestamp(s): ${unanchored.join(", ")}`);
    }
    for (const anchor of anchors) {
      if (anchor.videoSeconds < 0 || (duration > 0 && anchor.videoSeconds > duration + 0.25)) {
        failures.push(`${recording.file}: ${anchor.clock} seeks outside video at ${anchor.videoSeconds}s`);
      }
      if (!anchor.description) {
        failures.push(`${recording.file}: ${anchor.clock} lacks a visible-frame description`);
      }
    }
    if (duration >= 10 && anchors.length > 0 && anchors.length < 2) {
      warnings.push(`${recording.file}: only ${anchors.length} verified clickable timestamp`);
    }
    if (!(await fs.stat(videoPath).catch(() => null))) {
      failures.push(`${recording.file}: missing public video ${videoPath}`);
      continue;
    }

    const checks = await verifyAnchorsWithVision(recording, anchors, videoPath);
    checkedAnchors += anchors.length;
    for (const check of checks) {
      if (check.pass === false) {
        failures.push(`${recording.file}: ${check.expected || `anchor ${check.index}`} failed frame audit; visible=${check.visibleClock || "unreadable"}; ${check.description || ""}`);
      }
      if (check.pass === null) {
        warnings.push(`${recording.file}: ${check.expected || `anchor ${check.index}`} not vision-audited`);
      }
    }
  }

  console.log(JSON.stringify({
    recordings: (manifest.recordings || []).length,
    checkedAnchors,
    failures,
    warnings
  }, null, 2));

  if (failures.length) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
