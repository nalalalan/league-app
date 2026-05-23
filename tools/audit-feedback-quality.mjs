import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, "..");
const manifestPath = path.join(appRoot, "public", "recordings", "recordings.json");

function clean(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function hasTimestamp(value) {
  return /\b\d{1,2}:[0-5]\d\b/.test(value || "");
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

function isFullReview(recording = {}) {
  return /full/i.test(recording.kind || "") || Number(recording.durationSeconds || 0) > 90;
}

function visibleFields(recording = {}) {
  return [
    ["feedbackTitle", recording.feedbackTitle],
    ["feedback", recording.feedback],
    ["gameDetail", recording.gameDetail],
    ["secondaryFocus", recording.secondaryFocus || recording.secondaryImprovement],
    ["eventEvidence", recording.eventEvidence || recording.evidence],
    ["goodThing", recording.goodThing],
    ["whyTrust", recording.whyTrust]
  ];
}

function visibleText(recording = {}) {
  return visibleFields(recording).map(([, value]) => clean(value)).filter(Boolean).join(" ");
}

function feedbackIssues(recording = {}) {
  const issues = [];
  const title = clean(recording.feedbackTitle);
  const detail = clean(recording.gameDetail);
  const secondaryFocus = clean(recording.secondaryFocus || recording.secondaryImprovement);
  const evidence = clean(recording.eventEvidence || recording.evidence);
  const allVisible = visibleText(recording);
  const strictTwoFocusVersions = new Set([
    "2026-05-22-action-script-coaching-v13",
    "2026-05-22-two-focus-coaching-v11",
    "2026-05-22-challenger-direct-coaching-v12"
  ]);
  const needsSecondaryFocus = strictTwoFocusVersions.has(recording.analysisVersion);
  const needsActionScript = recording.analysisVersion === "2026-05-22-action-script-coaching-v13";

  if (/\bAlan\b/.test(allVisible)) {
    issues.push("visible feedback refers to Alan in third person");
  }
  if (/\b(Mistake|Fix):/i.test(detail)) {
    issues.push("gameDetail repeats Mistake/Fix labels");
  }
  if (/\b(?:A\s+)?conversion\s+(?:just\s+)?means\b/i.test(detail)) {
    issues.push("gameDetail repeats conversion glossary");
  }

  if (!isFullReview(recording)) return issues;

  if (!hasTimestamp(detail)) {
    issues.push("full review missing a game-clock timestamp in gameDetail");
  }
  if (detail.length < 260) {
    issues.push("full review gameDetail is too thin");
  }
  if (detail.length > 1150) {
    issues.push("full review gameDetail is too long");
  }
  if (!/\b(because|this matters|reason|so that|which means|which makes|which proves|so\s+(?:the|a|every|your|you))\b/i.test(detail)) {
    issues.push("full review does not explain why the advice is correct");
  }
  if (!/\b(leak|leaks|leaked|cost|punish|punished|shutdown|tempo|risk|risky|death|died|missed|delay|stall|throw|collapse|consequence|window|lost|gave|overstay|alone)\b/i.test(allVisible)) {
    issues.push("full review does not name the leak or consequence");
  }
  if (/\b(?:by|at|around)\s+and\s*,/i.test(allVisible)) {
    issues.push("visible review contains a malformed timestamp phrase");
  }
  if (needsActionScript && !hasTimestampedActionScript(detail)) {
    issues.push("full review missing a timestamped do-this-instead action script");
  }
  if (!evidence || evidence.length < 55 || /generated from sampled|limited to sampled|conservative read|match-level/i.test(evidence)) {
    issues.push("full review evidence is too weak");
  }
  if (!recording.rankEstimate?.exactRank) {
    issues.push("full review missing exact rank read");
  }
  if (needsSecondaryFocus) {
    if (!secondaryFocus) {
      issues.push("full review missing secondary improvement area");
    } else {
      if (secondaryFocus.length < 70) issues.push("secondary improvement is too thin");
      if (secondaryFocus.length > 380) issues.push("secondary improvement is too long");
      if (!/\b(second|also|another|extra|mechanic|mechanics|camera|spacing|position|target|path|wave|vision|fog|click|cursor|kite|entry|cooldown|hp|health|trade|lane|map|objective|reset|recall|timing|pattern)\b/i.test(secondaryFocus)) {
        issues.push("secondary improvement does not name a distinct improvement lane");
      }
      if (!/\b(next|rep|drill|work|practice|hold|keep|stop|watch|check|click|space|kite|reset|path|use|wait|leave|enter)\b/i.test(secondaryFocus)) {
        issues.push("secondary improvement does not include an easy next-game action");
      }
      if (/\b(frame[-\s]?perfect|animation cancel|exact combo|reaction time|orbwalk)\b/i.test(secondaryFocus) && Number(recording.captureFps || 1) < 10) {
        issues.push("secondary improvement overclaims micro-mechanics from low-FPS capture");
      }
    }
  }
  if (/^(?:Focus|Review|Bad\b|Overstaying after successful map events\b)/i.test(title)) {
    issues.push("title is vague or judgmental");
  }
  return issues;
}

const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
const recordings = Array.isArray(manifest.recordings) ? manifest.recordings : [];
const failures = recordings
  .map((recording, index) => ({
    index: index + 1,
    file: recording.file,
    title: recording.feedbackTitle,
    issues: feedbackIssues(recording)
  }))
  .filter((item) => item.issues.length);

const report = {
  generatedAt: manifest.generatedAt || "",
  recordings: recordings.length,
  fullReviews: recordings.filter(isFullReview).length,
  failures
};

console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exitCode = 1;
