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
const model = process.env.LEAGUE_TIMESTAMP_AUDIT_MODEL || "gpt-5-nano";
const fallbackModel = process.env.LEAGUE_TIMESTAMP_AUDIT_FALLBACK_MODEL || process.env.LEAGUE_ANALYSIS_MODEL || "gpt-4.1";
const currentPrimaryMistakeAnalysisVersions = new Set([
  "2026-05-23-decision-branch-coaching-v17",
  "2026-05-23-evidence-lanes-coaching-v14",
  "2026-05-22-action-script-coaching-v13",
  "2026-05-22-challenger-direct-coaching-v12",
  "2026-05-22-two-focus-coaching-v11",
]);

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

function timestampSecondsInText(text) {
  return (String(text || "").match(/\b\d{1,2}:[0-5]\d\b/g) || [])
    .map(clockSeconds)
    .filter((seconds) => Number.isFinite(seconds));
}

function sentenceParts(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .trim()
    .match(/[^.!?]+[.!?]+(?:["')\]]+)?|[^.!?]+$/g) || [];
}

function primaryMistakeTextPattern() {
  return /\b(biggest|primary|main|clearest|real|actual|big)?\s*(mistake|leak|overstay|overstaying|stayed|stay|chase|chasing|chased|duel|dueling|side[-\s]?lane|sideline|re-?engage|re-?enter|fight|fighting|accepted|accepting|drift|drifted|low[-\s]?hp|lethal|unspent|shutdown|reset|tempo|collapse|overextend|overextended|missed|delayed|risky|risk|danger|gave|died|death|stall|throw|window|blocked|alone|side fight)\b/i;
}

function primaryMistakeTimestampSeconds(...texts) {
  const pattern = primaryMistakeTextPattern();
  return texts
    .flatMap((text) => sentenceParts(text))
    .map(clean)
    .filter((sentence) => sentence && pattern.test(sentence))
    .flatMap(timestampSecondsInText);
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

function anchorMatchesTimestamp(anchor, timestamp) {
  const timestampSeconds = clockSeconds(timestamp);
  const anchorSeconds = clockSeconds(anchor.clock);
  return Number.isFinite(timestampSeconds) && Number.isFinite(anchorSeconds) && Math.abs(anchorSeconds - timestampSeconds) <= 2.5;
}

function visibleParagraphStandardIssues(recording, anchors) {
  const detail = clean(recording.gameDetail);
  const eventEvidence = clean(recording.eventEvidence || recording.evidence);
  const issues = [];
  if (detail.length < 240) issues.push("visible paragraph is too short");
  if (!primaryMistakeTimestampSeconds(detail, eventEvidence).length) issues.push("primary mistake window must have a game-clock timestamp");
  if (!/\b(leak|cost|punish|punished|shutdown|tempo|missed|risk|risky|death|died|gave|lost|blocked|blocker|mistake|danger|punishment|consequence|window|delay|stall|throw)\b/i.test(detail)) {
    issues.push("visible paragraph must name the leak or consequence");
  }
  if (!/\b(instead|because|so|which|then|after|before|when)\b/i.test(detail)) {
    issues.push("visible paragraph must explain the decision chain");
  }
  if (currentPrimaryMistakeAnalysisVersions.has(recording.analysisVersion) && !hasTimestampedActionScript(detail)) {
    issues.push("visible paragraph must include a timestamped replacement action script");
  }
  if (eventEvidence.length < 60) {
    issues.push("eventEvidence must name visible proof");
  }
  const primarySeconds = [...new Set(primaryMistakeTimestampSeconds(detail, eventEvidence).map((seconds) => Math.round(seconds)))];
  const anchorSeconds = anchors
    .map((anchor) => clockSeconds(anchor.clock))
    .filter((seconds) => Number.isFinite(seconds));
  if (!primarySeconds.some((seconds) => anchorSeconds.some((anchorSecond) => Math.abs(anchorSecond - seconds) <= 5))) {
    issues.push("primary mistake timestamp must have a matching verified clock anchor");
  }
  if (/\b(this leads|the consequence|the better play|the core lesson|the critical lesson|the simple lesson)\b/i.test(detail.slice(0, 80))) {
    issues.push("visible paragraph starts with a conclusion instead of evidence");
  }
  return issues;
}

function requiresVisibleParagraphStandard(recording) {
  return /^auto_/i.test(recording.file || "") &&
    Number(recording.durationSeconds || 0) >= 90 &&
    currentPrimaryMistakeAnalysisVersions.has(recording.analysisVersion);
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

function displayClockAnchors(recording, anchors) {
  const primarySeconds = [...new Set(primaryMistakeTimestampSeconds(recording.gameDetail, recording.eventEvidence || recording.evidence).map((seconds) => Math.round(seconds)))];
  const visibleTimestamps = new Set(primarySeconds.map(mmss));
  const momentTimestamps = new Set((Array.isArray(recording.clockMoments) ? recording.clockMoments : [])
    .map((moment) => normalizeClock(moment?.clock))
    .filter((clock) => {
      const seconds = clockSeconds(clock);
      return Number.isFinite(seconds) && primarySeconds.some((primarySecond) => Math.abs(primarySecond - seconds) <= 5);
    }));
  const wanted = [...new Set([...visibleTimestamps, ...momentTimestamps])];
  const selected = [];
  for (const timestamp of wanted) {
    const timestampSeconds = clockSeconds(timestamp);
    const match = anchors
      .map((anchor) => ({
        anchor,
        delta: Math.abs(clockSeconds(anchor.clock) - timestampSeconds)
      }))
      .filter((item) => Number.isFinite(item.delta) && item.delta <= 2.5)
      .sort((a, b) => a.delta - b.delta || (b.anchor.description ? 1 : 0) - (a.anchor.description ? 1 : 0))[0]?.anchor;
    if (match && !selected.some((anchor) => anchor.clock === match.clock && anchor.videoSeconds === match.videoSeconds)) {
      selected.push(match);
    }
  }
  return selected;
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

  async function requestAudit(modelName) {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: modelName,
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

  try {
    return await requestAudit(model);
  } catch (error) {
    if (fallbackModel && fallbackModel !== model) {
      return await requestAudit(fallbackModel);
    }
    return anchors.map((anchor, index) => ({
      index: index + 1,
      expected: anchor.clock,
      pass: null,
      visibleClock: "",
      description: `timestamp vision audit unavailable: ${error.message}`
    }));
  }
}

async function main() {
  const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
  const failures = [];
  const warnings = [];
  let checkedAnchors = 0;

  for (const recording of manifest.recordings || []) {
    const allAnchors = (Array.isArray(recording.clockAnchors) ? recording.clockAnchors : [])
      .map((anchor) => ({
        clock: normalizeClock(anchor.clock),
        videoSeconds: Number(anchor.videoSeconds),
        description: clean(anchor.description)
      }))
      .filter((anchor) => anchor.clock && Number.isFinite(anchor.videoSeconds));
    const duration = Number(recording.durationSeconds || 0);
    const videoPath = manifestVideoPath(recording);
    const strictVisibleStandard = requiresVisibleParagraphStandard(recording);
    const anchors = strictVisibleStandard ? displayClockAnchors(recording, allAnchors) : [];
    const unanchored = unanchoredNarrativeTimestamps(recording, allAnchors);
    if (unanchored.length && strictVisibleStandard) {
      failures.push(`${recording.file}: visible timestamp(s) without matching anchors: ${unanchored.join(", ")}`);
    } else if (unanchored.length) {
      warnings.push(`${recording.file}: extra visible timestamp(s) without matching anchors: ${unanchored.join(", ")}`);
    }
    if (strictVisibleStandard) {
      const standardIssues = visibleParagraphStandardIssues(recording, allAnchors);
      for (const issue of standardIssues) {
        failures.push(`${recording.file}: ${issue}`);
      }
    } else if (/^auto_/i.test(recording.file || "") && Number(recording.durationSeconds || 0) >= 90) {
      warnings.push(`${recording.file}: legacy analysis version ${recording.analysisVersion || "none"} skipped for current timestamp-standard frame audit`);
    }
    for (const anchor of anchors) {
      if (anchor.videoSeconds < 0 || (duration > 0 && anchor.videoSeconds > duration + 0.25)) {
        failures.push(`${recording.file}: ${anchor.clock} seeks outside video at ${anchor.videoSeconds}s`);
      }
      if (!anchor.description) {
        const issue = `${recording.file}: ${anchor.clock} lacks a visible-frame description`;
        if (strictVisibleStandard) {
          failures.push(issue);
        } else {
          warnings.push(issue);
        }
      }
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
