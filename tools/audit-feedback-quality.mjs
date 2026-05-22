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

function isFullReview(recording = {}) {
  return /full/i.test(recording.kind || "") || Number(recording.durationSeconds || 0) > 90;
}

function visibleFields(recording = {}) {
  return [
    ["feedbackTitle", recording.feedbackTitle],
    ["feedback", recording.feedback],
    ["gameDetail", recording.gameDetail],
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
  const evidence = clean(recording.eventEvidence || recording.evidence);
  const allVisible = visibleText(recording);

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
  if (!/\b(leak|cost|punish|punished|shutdown|tempo|risk|risky|death|died|missed|delay|stall|throw|collapse|window|lost|gave|overstay|alone)\b/i.test(allVisible)) {
    issues.push("full review does not name the leak or consequence");
  }
  if (!evidence || evidence.length < 55 || /generated from sampled|limited to sampled|conservative read|match-level/i.test(evidence)) {
    issues.push("full review evidence is too weak");
  }
  if (!recording.rankEstimate?.exactRank) {
    issues.push("full review missing exact rank read");
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
