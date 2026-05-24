import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { hasExactJungleBuffName, unverifiedChampionNames } from "./review-text-guards.mjs";

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

function hasKeyTimestampClickRule(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .match(/[^.!?]+[.!?]+(?:["')\]]+)?|[^.!?]+$/g)?.some((sentence) => (
      /\b(?:At|Around|By)\s+\d{1,2}:[0-5]\d\b/i.test(sentence) &&
      (
        (/\bmistake category\s*:/i.test(sentence) && /\bcorrect next click\s*:/i.test(sentence)) ||
        /\bso\s+(?:the\s+)?next\s+click\s+is\b|\bthe\s+next\s+click\s+is\b|\bclick\s+(?:back|out|away|toward|only)\b/i.test(sentence)
      ) &&
      /\b(tower|turret|structure|wave|objective|dragon|baron|ally front|ally-front|front|payout|visible|screen|enemy|enemies|collapse|safe|free)\b/i.test(sentence) &&
      /\b(hit|clear|recall|leave|hold|wait|walk|drop|stop|defend|reset|enter|click|kite|back)\b/i.test(sentence)
    )) || false;
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
    ["failureEvidence", recording.failureEvidence],
    ["mistakeTypes", Array.isArray(recording.mistakeTypes) ? recording.mistakeTypes.join("; ") : ""],
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
    "2026-05-24-example-review-v19",
    "2026-05-24-key-click-rule-v18",
    "2026-05-23-decision-branch-coaching-v17",
    "2026-05-23-deterministic-publish-fallback-v16",
    "2026-05-23-champion-source-coaching-v15",
    "2026-05-23-evidence-lanes-coaching-v14",
    "2026-05-22-action-script-coaching-v13",
    "2026-05-22-two-focus-coaching-v11",
    "2026-05-22-challenger-direct-coaching-v12"
  ]);
  const needsSecondaryFocus = strictTwoFocusVersions.has(recording.analysisVersion);
  const actionScriptVersions = new Set([
    "2026-05-24-example-review-v19",
    "2026-05-24-key-click-rule-v18",
    "2026-05-23-decision-branch-coaching-v17",
    "2026-05-23-deterministic-publish-fallback-v16",
    "2026-05-23-champion-source-coaching-v15",
    "2026-05-23-evidence-lanes-coaching-v14",
    "2026-05-22-action-script-coaching-v13"
  ]);
  const evidenceLaneVersions = new Set([
    "2026-05-24-example-review-v19",
    "2026-05-24-key-click-rule-v18",
    "2026-05-23-decision-branch-coaching-v17",
    "2026-05-23-deterministic-publish-fallback-v16",
    "2026-05-23-champion-source-coaching-v15",
    "2026-05-23-evidence-lanes-coaching-v14"
  ]);
  const needsActionScript = actionScriptVersions.has(recording.analysisVersion);
  const needsEvidenceLanes = evidenceLaneVersions.has(recording.analysisVersion);
  const needsDecisionBranch = recording.analysisVersion === "2026-05-24-example-review-v19" ||
    recording.analysisVersion === "2026-05-24-key-click-rule-v18" ||
    recording.analysisVersion === "2026-05-23-decision-branch-coaching-v17";
  const needsKeyClickRule = recording.analysisVersion === "2026-05-24-example-review-v19" ||
    recording.analysisVersion === "2026-05-24-key-click-rule-v18";
  const needsExampleReview = recording.analysisVersion === "2026-05-24-example-review-v19";
  const hasStats = Number.isFinite(Number(recording.kills)) &&
    Number.isFinite(Number(recording.deaths)) &&
    Number.isFinite(Number(recording.assists)) &&
    Number.isFinite(Number(recording.cs));

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
  if (needsKeyClickRule && !hasKeyTimestampClickRule(detail)) {
    issues.push("full review missing one key timestamp with visible state, mistake category, and correct next click");
  }
  if (needsExampleReview && /\b(?:mistake category|correct next click)\s*:/i.test(detail)) {
    issues.push("full review uses field labels instead of natural key timestamp prose");
  }
  if (needsExampleReview && !/^Rep\s*:/i.test(secondaryFocus || clean(recording.drill))) {
    issues.push("pink next-game instruction must be one Rep sentence");
  }
  if (needsKeyClickRule && /\bcurrent-match\b|\breview frame\b|\bbranch before any forward click\b/i.test(allVisible)) {
    issues.push("full review uses generic review-frame or broad branch wording");
  }
  if (needsDecisionBranch && /\b(?:map cash[-\s]?outs?|cash(?:ing)? (?:those )?(?:wins|moments|it)? ?out(?:s)? cleaner|cash[-\s]?out timing|cleaner map|wrong task after the map state changes|call free structure, blocked structure, or reset)\b/i.test(allVisible)) {
    issues.push("full review uses abstract cash-out wording instead of exact branch rules");
  }
  if (needsDecisionBranch && recording.analysisSource !== "manual" && /\b(tower|turret|structure|wave|inhib|inhibitor|nexus|payout|pressure)\b/i.test(allVisible) && !/\b(?:free tower|tower is free|hit tower|body blocks|blocker|push or clear|clear the wave|wave then recall|leave if none|closest threatened turret|who can stand in front)\b/i.test(allVisible)) {
    issues.push("full review must separate concrete branch options");
  }
  if (needsDecisionBranch && recording.analysisSource !== "manual" && hasStats && !/\b\d+\s*\/\s*\d+\s*\/\s*\d+\b[\s\S]{0,120}\bCS\b|\bCS\b[\s\S]{0,120}\b\d+\s*\/\s*\d+\s*\/\s*\d+\b/i.test(allVisible)) {
    issues.push("full review must include K/D/A and CS context when client stats exist");
  }
  if (needsActionScript) {
    const unverifiedNames = unverifiedChampionNames(allVisible, [recording.champion || "Samira"]);
    if (unverifiedNames.length) {
      issues.push(`visible review names unverified champion(s): ${unverifiedNames.join(", ")}; use ally/enemy/team unless roster evidence is verified`);
    }
    if (hasExactJungleBuffName(allVisible)) {
      issues.push("visible review names an exact jungle buff without verified camp evidence; use jungle camp unless the camp label is verified");
    }
  }
  if (recording.analysisSource !== "manual" && /\b(shop interface|shop open|item shop|stealth ward selected|standing at (the )?fountain|leaving (?:base|fountain)|near base fountain|running from fountain|fountain at game start|game start)\b/i.test([detail, evidence].join(" "))) {
    issues.push("uses non-evidence shop/fountain/game-start timestamp as proof");
  }
  if (!evidence || evidence.length < 55 || /generated from sampled|limited to sampled|conservative read|match-level/i.test(evidence)) {
    issues.push("full review evidence is too weak");
  }
  if (needsEvidenceLanes) {
    const failureEvidence = clean(recording.failureEvidence);
    const mistakeTypes = Array.isArray(recording.mistakeTypes) ? recording.mistakeTypes.filter(Boolean) : [];
    if (/\b(?:Failure evidence|Other mistake types|Second focus)\s*:/i.test(allVisible)) {
      issues.push("visible feedback contains field labels instead of natural coaching prose");
    }
    if (failureEvidence.length < 80) issues.push("failureEvidence does not prove the visible failure chain");
    if (mistakeTypes.length < 3) issues.push("mistakeTypes needs at least three distinct mistake lanes");
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
