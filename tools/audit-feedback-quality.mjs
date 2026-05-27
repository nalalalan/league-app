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
      /\b(?:next\s+(?:click|input|move|job|decision|check)|job\s+is|is\s+to|should|do|walk|path|move|stand|hold|wait|recall|reset|base|leave|back|kite|hit|clear|catch|push|defend|hover|group|stop|stay|enter|save|let|keep)\b/i.test(sentence)
    )) || [];
}

function hasTimestampedActionScript(text) {
  return timestampedActionScriptSentences(text).some((sentence) => (
    /\b(?:instead|rather than|not|never|should|job\s+is|is\s+to|next\s+(?:click|input|move|job|decision|check)|do|walk|stand|hold|wait|recall|reset|leave|back|kite|hit|clear|catch|push|defend|stop|stay|save|let|keep)\b/i.test(sentence)
  ));
}

function hasKeyTimestampClickRule(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .match(/[^.!?]+[.!?]+(?:["')\]]+)?|[^.!?]+$/g)?.some((sentence) => (
      /\b(?:At|Around|By)\s+\d{1,2}:[0-5]\d\b/i.test(sentence) &&
      (
        (/\bmistake category\s*:/i.test(sentence) && /\bcorrect next click\s*:/i.test(sentence)) ||
        /\bso\s+(?:the\s+)?next\s+(?:click|input)\s+is\b|\bthe\s+next\s+(?:click|input)\s+is\b|\b(?:back[-\s]?click|click\s+(?:back|out|away|toward|only))\b/i.test(sentence)
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
    ["microReview", typeof recording.microReview === "string" ? recording.microReview : recording.microReview?.summary],
    ["eventEvidence", recording.eventEvidence || recording.evidence],
    ["goodThing", recording.goodThing],
    ["whyTrust", recording.whyTrust]
  ];
}

function visibleText(recording = {}) {
  return visibleFields(recording).map(([, value]) => clean(value)).filter(Boolean).join(" ");
}

const forensicPhaseReviewFiles = new Set([
  "auto_NA1-5568079693_01.mp4",
  "auto_NA1-5567787430_01.mp4"
]);

function requiresForensicPhaseStandard(recording = {}) {
  return (recording.analysisVersion === "2026-05-26-early-micro-pass-v26" ||
    recording.analysisVersion === "2026-05-25-forensic-performance-rank-v25") &&
    (recording.analysisSource !== "manual" || forensicPhaseReviewFiles.has(recording.file || ""));
}

function repeatedPayoutChecklistCount(text) {
  const source = String(text || "").toLowerCase();
  return (source.match(/\b(?:no\s+)?(?:tower|turret)\s*,\s*(?:safe\s+)?wave\s*,\s*(?:dragon\s+or\s+baron|objective)\s*(?:setup)?\s*,?\s*(?:and|or)\s*(?:no\s+clear\s+)?ally[-\s]?front\b|\btower\/wave\/objective\/ally[-\s]?front\b|\btower,\s*wave,\s*objective,\s*or\s*ally[-\s]?front\b/g) || []).length;
}

function kdaParts(recording = {}) {
  const parsed = String(recording.kda || "").match(/(\d+)\s*\/\s*(\d+)\s*\/\s*(\d+)/);
  return {
    kills: Number.isFinite(Number(recording.kills)) ? Number(recording.kills) : (parsed ? Number(parsed[1]) : NaN),
    deaths: Number.isFinite(Number(recording.deaths)) ? Number(recording.deaths) : (parsed ? Number(parsed[2]) : NaN),
    assists: Number.isFinite(Number(recording.assists)) ? Number(recording.assists) : (parsed ? Number(parsed[3]) : NaN)
  };
}

function repCategory(recording = {}) {
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
  if (Number.isFinite(kills) && kills >= 18 && /\b(defeat|loss|lost|eight deaths|death|objective|won exchange|first useful damage|reset)\b/i.test(text)) return "firstWinCashout";
  if (isSamira &&
      /\b(bot|lane|outer turret|under turret|support|wave is already thin|samira e|dash\/chase|tower dive)\b/i.test(text) &&
      ((Number.isFinite(kills) && Number.isFinite(deaths) && kills <= 2 && deaths >= 5) || /\bdeath-heavy lane\b/i.test(text))) return "laneDeathExit";
  if (/\bmid[-\s]?wave\b/i.test(text) &&
      /\briver\b/i.test(text) &&
      /\b(chase|entry|front|collapse|ally[-\s]?front)\b/i.test(text)) return "midRiverChase";
  if (!won && Number.isFinite(deaths) && deaths <= 4 &&
      /\b(blue-side jungle|jungle fight|jungle value|jungle-exit|first jungle value)\b/i.test(text)) return "sideFarmDefense";
  if (isSamira &&
      !/\b(blue-side jungle|jungle fight|jungle value|jungle-exit|first jungle value)\b/i.test(text) &&
      /\b(mid fight|mid-fight|mid-lane)\b/i.test(text) &&
      /\b(first value|first burst|second body|second forward|re-entry|reentry|low enough|low health|low[-\s]?hp|back[-\s]?click)\b/i.test(text)) return "midFightValueExit";
  if (isSamira &&
      /\b(early lane|first 15 minutes|first 10 minutes|one-window Samira|auto\/q from behind|no e to start|no e under tower|one damage window, then back\s*click|reset spacing)\b/i.test(text) &&
      /\b(wave|support|ally|turret|tower|trade|damage window|setup expires|cover thins|back\s*click|re-check|spacing)\b/i.test(text)) return "earlyLaneBackclick";
  if (/\b(dragon|baron|objective|pit)\b/i.test(text) &&
      /\b(fight|entry|engaged|committed|first value|second fight|value window|state flip|re-entry|reenter|exit)\b/i.test(text)) return "objectiveFight";
  if (!won && Number.isFinite(kills) && Number.isFinite(deaths) && kills <= 2 && deaths >= 5) return "deathExit";
  if ((Number.isFinite(deaths) && deaths >= 9) || /\b(low hp|low-health|death-heavy|ten deaths|thirteen deaths|death timer|death-state|catchable death)\b/i.test(text)) return "deathExit";
  if (/\b(base|inhib|inhibitor|nexus|structure|exposed structures|enemy base|base push)\b/i.test(text)) return "basePush";
  if (won && Number.isFinite(deaths) && deaths <= 3 && Number.isFinite(csPerMinute) && csPerMinute >= 5) return "cleanerWinExit";
  if (/\b(side|jungle|camp|farm|side wave|side-wave|defend|defense|threatened turret|base defense)\b/i.test(text)) return "sideFarmDefense";
  if (/\b(fight|entry|front|catchable|collapse|cc|crowd control|target|kite)\b/i.test(text)) return "fightEntry";
  return "cleanerWinExit";
}

function repMatchesGameCategory(recording = {}) {
  const rep = clean(recording.secondaryFocus || recording.secondaryImprovement || recording.drill || "");
  if (!rep) return false;
  switch (repCategory(recording)) {
    case "basePush":
      return /\bstructure,\s*blocker,\s*wave,\s*or\s*exit\b/i.test(rep);
    case "firstWinCashout":
      return /\bfirst won exchange\b|\bobjective,\s*tower,\s*wave crash,\s*or\s*recall\b/i.test(rep);
    case "laneDeathExit":
      return /\bdeath-heavy lane sequence\b|\bNo E toward\b|\bDo not E\/dash\b|\bwave still protects (?:me|you)\b|\bone step behind support\b/i.test(rep);
    case "earlyLaneBackclick":
      return /\bone-window Samira\b|\bauto\/Q\s*-\s*back click\s*-\s*re-check\b|\bone back\s*click\b|\bNo E to start\b|\bNo E under tower\b|\bwave or support cover thins\b/i.test(rep);
    case "objectiveFight":
      return /\bdid we already get the value\b|\bsay objective done\b|\bobjective done\s*-\s*exit or next map result\b|\bexit with allies,\s*mid wave,\s*reset\/spend,\s*or\s*Baron setup\b|\bwalk out with allies,\s*mid wave,\s*reset\/spend,\s*or\s*Baron setup\b|\bdragon,\s*wave,\s*recall,\s*or\s*group\b|\bsecond fight\b[\s\S]{0,100}\blow or unsupported\b/i.test(rep);
    case "deathExit":
      return /\blow[-\s]?HP\b|\bdeath-heavy\b|\bfirst safe exit\b|\bdo not re-enter while you are catchable\b|\bbefore Samira E\b|\bforward lane click\b|\bclick back behind support\b/i.test(rep);
    case "sideFarmDefense":
      return /\bcamp or side wave\b|\bnearest threatened turret\b|\bleave the farm\b/i.test(rep);
    case "midRiverChase":
      return /\bafter mid wave gives value\b|\bwave,\s*turret,\s*reset,\s*or\s*river\b|\bRiver is legal only if\b|\bcatch the wave and take one step back\b/i.test(rep);
    case "midFightValueExit":
      return /\bone window\b|\bauto\/Q\b|\bfirst burst\b|\bback[-\s]?click\b|\bre[-\s]?check\b|\bOnly E forward\b|\bNo forward E\/click\b/i.test(rep) &&
        /\bally front|ally is still in front|enemy CC|target HP|CC'd|low\b/i.test(rep);
    case "fightEntry":
      return /\btower,\s*wave,\s*objective,\s*or\s*ally[-\s]?front\b/i.test(rep);
    case "cleanerWinExit":
    default:
      return /\bwave,\s*tower hit,\s*or\s*fight start\b|\btower,\s*wave,\s*objective,\s*or\s*ally[-\s]?front\b|\bwave,\s*recall,\s*or\s*regroup\b|\bno second forward E\b|\bmid fight gives one\b/i.test(rep);
  }
}

function samiraFightMicroStandardIssues(recording = {}) {
  const allVisible = visibleText(recording);
  const isSamira = /\bsamira\b/i.test([recording.champion, recording.championSlug, recording.title, allVisible].join(" "));
  if (!isSamira) return [];
  const category = repCategory(recording);
  const needsInputMicro = (category === "midFightValueExit" || category === "earlyLaneBackclick") &&
    /\b(mid[-\s]?fight|lane trade|trade|first burst|first damage window|damage window|auto\/Q|auto\s*\/\s*Q|second body|second forward|E\/click|forward input|forward click)\b/i.test(allVisible);
  if (!needsInputMicro) return [];
  const issues = [];
  if (!/\b(playable|legal|illegal|not the issue|not automatically wrong|entry\/value window|first window)\b/i.test(allVisible)) {
    issues.push("Samira fight review must judge whether the first entry/damage window is legal or playable");
  }
  if (!/\b(auto\/Q|auto\s*\/\s*Q|first burst|first damage window|damage window|hit\s*-\s*back[-\s]?click|one window)\b/i.test(allVisible)) {
    issues.push("Samira fight review must name the first auto/Q or first-burst damage window");
  }
  if (!/\b(back[-\s]?click|click back|one step back|reset spacing|back through|toward base|hit\s*-\s*back[-\s]?click\s*-\s*re[-\s]?check)\b/i.test(allVisible)) {
    issues.push("Samira fight review must name the exact back-click or reset-spacing input");
  }
  if (!/\bre[-\s]?check\b/i.test(allVisible)) {
    issues.push("Samira fight review must include re-check after the first burst/back-click");
  }
  if (!/\b(E|dash|forward input|forward click|E\/click|second forward)\b/i.test(allVisible)) {
    issues.push("Samira fight review must say whether E/dash/forward click is legal or just chase/re-entry");
  }
  if (!/\b(low|unsupported|ally[-\s]?front|ally is still in front|support|wave still protects|enemy CC|CC'd|target HP|target is .*low)\b/i.test(allVisible)) {
    issues.push("Samira fight review must name the re-entry check: ally front, enemy CC, target HP, or low/unsupported state");
  }
  return issues;
}

function feedbackIssues(recording = {}) {
  const issues = [];
  const title = clean(recording.feedbackTitle);
  const detail = clean(recording.gameDetail);
  const secondaryFocus = clean(recording.secondaryFocus || recording.secondaryImprovement);
  const evidence = clean(recording.eventEvidence || recording.evidence);
  const allVisible = visibleText(recording);
  const strictTwoFocusVersions = new Set([
    "2026-05-26-early-micro-pass-v26",
    "2026-05-25-forensic-performance-rank-v25",
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
    "2026-05-23-evidence-lanes-coaching-v14",
    "2026-05-22-action-script-coaching-v13",
    "2026-05-22-two-focus-coaching-v11",
    "2026-05-22-challenger-direct-coaching-v12"
  ]);
  const needsSecondaryFocus = strictTwoFocusVersions.has(recording.analysisVersion);
  const actionScriptVersions = new Set([
    "2026-05-26-early-micro-pass-v26",
    "2026-05-25-forensic-performance-rank-v25",
    "2026-05-24-game-specific-rep-v22",
    "2026-05-24-dense-click-review-v21",
    "2026-05-24-tight-click-review-v20",
    "2026-05-24-example-review-v19",
    "2026-05-24-key-click-rule-v18",
    "2026-05-23-decision-branch-coaching-v17",
    "2026-05-23-deterministic-publish-fallback-v16",
    "2026-05-23-champion-source-coaching-v15",
    "2026-05-23-evidence-lanes-coaching-v14",
    "2026-05-22-action-script-coaching-v13"
  ]);
  const evidenceLaneVersions = new Set([
    "2026-05-26-early-micro-pass-v26",
    "2026-05-25-forensic-performance-rank-v25",
    "2026-05-24-game-specific-rep-v22",
    "2026-05-24-dense-click-review-v21",
    "2026-05-24-tight-click-review-v20",
    "2026-05-24-example-review-v19",
    "2026-05-24-key-click-rule-v18",
    "2026-05-23-decision-branch-coaching-v17",
    "2026-05-23-deterministic-publish-fallback-v16",
    "2026-05-23-champion-source-coaching-v15",
    "2026-05-23-evidence-lanes-coaching-v14"
  ]);
  const needsActionScript = actionScriptVersions.has(recording.analysisVersion);
  const needsEvidenceLanes = evidenceLaneVersions.has(recording.analysisVersion);
  const needsDecisionBranch = recording.analysisVersion === "2026-05-26-early-micro-pass-v26" ||
    recording.analysisVersion === "2026-05-25-forensic-performance-rank-v25" ||
    recording.analysisVersion === "2026-05-24-game-specific-rep-v22" ||
    recording.analysisVersion === "2026-05-24-dense-click-review-v21" ||
    recording.analysisVersion === "2026-05-24-tight-click-review-v20" ||
    recording.analysisVersion === "2026-05-24-example-review-v19" ||
    recording.analysisVersion === "2026-05-24-key-click-rule-v18" ||
    recording.analysisVersion === "2026-05-23-decision-branch-coaching-v17";
  const needsKeyClickRule = recording.analysisVersion === "2026-05-26-early-micro-pass-v26" ||
    recording.analysisVersion === "2026-05-25-forensic-performance-rank-v25" ||
    recording.analysisVersion === "2026-05-24-game-specific-rep-v22" ||
    recording.analysisVersion === "2026-05-24-dense-click-review-v21" ||
    recording.analysisVersion === "2026-05-24-tight-click-review-v20" ||
    recording.analysisVersion === "2026-05-24-example-review-v19" ||
    recording.analysisVersion === "2026-05-24-key-click-rule-v18";
  const needsExampleReview = recording.analysisVersion === "2026-05-26-early-micro-pass-v26" ||
    recording.analysisVersion === "2026-05-25-forensic-performance-rank-v25" ||
    recording.analysisVersion === "2026-05-24-game-specific-rep-v22" ||
    recording.analysisVersion === "2026-05-24-dense-click-review-v21" ||
    recording.analysisVersion === "2026-05-24-tight-click-review-v20" ||
    recording.analysisVersion === "2026-05-24-example-review-v19";
  const needsTightReview = (recording.analysisVersion === "2026-05-26-early-micro-pass-v26" ||
    recording.analysisVersion === "2026-05-25-forensic-performance-rank-v25" ||
    recording.analysisVersion === "2026-05-24-game-specific-rep-v22" ||
    recording.analysisVersion === "2026-05-24-dense-click-review-v21" ||
    recording.analysisVersion === "2026-05-24-tight-click-review-v20") &&
    (recording.analysisSource !== "manual" || recording.file === "auto_NA1-5566943774_01.mp4");
  const needsDenseReview = (recording.analysisVersion === "2026-05-26-early-micro-pass-v26" ||
    recording.analysisVersion === "2026-05-25-forensic-performance-rank-v25" ||
    recording.analysisVersion === "2026-05-24-game-specific-rep-v22" ||
    recording.analysisVersion === "2026-05-24-dense-click-review-v21") &&
    (recording.analysisSource !== "manual" || recording.file === "auto_NA1-5566943774_01.mp4");
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
  if (needsTightReview && detail.length > 850) {
    issues.push("tight review gameDetail repeats too much context");
  }
  if (needsDenseReview && detail.length > 650) {
    issues.push("dense review gameDetail is too loose");
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
  if (needsDenseReview && /\bwhat permanent thing\b/i.test(secondaryFocus)) {
    issues.push("pink Rep uses vague permanent-thing wording");
  }
  if (needsDenseReview && !repMatchesGameCategory(recording)) {
    issues.push("pink Rep must match the game-specific mistake type");
  }
  if (needsTightReview && repeatedPayoutChecklistCount(allVisible) > 1) {
    issues.push("tight review repeats the payout checklist instead of saying it once");
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
  if (recording.analysisVersion === "2026-05-26-early-micro-pass-v26" ||
      recording.analysisVersion === "2026-05-25-forensic-performance-rank-v25") {
    const performanceRank = clean(recording.performanceRank?.exactRank || recording.rankEstimate?.exactRank);
    const performanceReason = clean(recording.performanceRank?.reason || recording.rankEstimate?.reason);
    if (!performanceRank) {
      issues.push("v25 review missing exact performance rank");
    }
    if (!/\bCS(?:\/min)?\b/i.test(performanceReason) ||
        !/\bdeath|deaths|K\/D\/A\b/i.test(performanceReason) ||
        !/\bentry|fight|dragon|objective|lane|base\b/i.test(performanceReason) ||
        !/\bexit|re-entry|cash-out|value|conversion|structure|wave|recall|group\b/i.test(performanceReason)) {
      issues.push("current performance rank reason must tie CS, deaths, entry/context, and exit/value together");
    }
  }
  const micro = typeof recording.microReview === "string"
    ? clean(recording.microReview)
    : clean(recording.microReview?.summary);
  if (micro) {
    const microFps = Number(recording.microReview?.captureFps || recording.microCaptureFps || 0);
    if (microFps < 6) {
      issues.push("early micro review requires higher-FPS capture evidence");
    }
    if (!/^Early micro:/i.test(micro)) {
      issues.push("early micro review must be clearly separate from the macro review");
    }
    if (!/\b(spacing|support|cc|crowd control|auto|q|w|e|dash|trade|all[-\s]?in|stand|back|behind|legal|illegal|follow|kite|wave|minion|tower|turret)\b/i.test(micro)) {
      issues.push("early micro review must judge lane mechanics, spacing, or short-trade legality");
    }
    if (/\b(frame[-\s]?perfect|animation cancel|exact combo|reaction time|orbwalk)\b/i.test(micro) && microFps < 10) {
      issues.push("early micro review overclaims exact mechanics below 10 FPS");
    }
  }
  if ((recording.file || "") === "auto_NA1-5568519322_01.mp4") {
    if (!/\bsay objective done\b/i.test(secondaryFocus)) {
      issues.push("Drake secure review must use the post-objective exit rep");
    }
    if (/\bdid we already get the value\b/i.test(secondaryFocus)) {
      issues.push("Drake secure review regressed to the generic objective-fight rep");
    }
    if (!/\bobjective entry never existed\b|\bfirst value window is done\b/i.test(allVisible)) {
      issues.push("Drake secure review must separate objective entry from post-secure exit");
    }
  }
  if (requiresForensicPhaseStandard(recording)) {
    if (!/\b(legal|illegal|not automatically wrong|partly legal|mostly legal|setup expires|setup is gone)\b/i.test(allVisible)) {
      issues.push("v25 review must judge entry legality");
    }
    if (!/\b(value|state flip|state flips|first value|second fight|first bad next click|setup expires|setup is gone)\b/i.test(allVisible)) {
      issues.push("v25 review must separate value, state flip, and first bad next click");
    }
  }
  if (recording.analysisVersion === "2026-05-26-early-micro-pass-v26" ||
      recording.analysisVersion === "2026-05-25-forensic-performance-rank-v25") {
    issues.push(...samiraFightMicroStandardIssues(recording));
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
