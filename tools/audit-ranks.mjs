import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = path.join(root, "public", "recordings", "recordings.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

const expectedRankEstimateVersion = manifest.rankCalibration?.version;
const expectedPerformanceRankVersion = "2026-05-25-performance-rank-v5";
const minBronzeValue = 4;
const minGoldValue = 12;
const maxBotValue = 8; // Silver IV. Beginner bot success cannot prove ranked pressure above this.

const expectedRankedSolo = new Set([
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
  "auto_NA1-5565856492_01.mp4",
  "auto_NA1-5565804951_01.mp4",
  "auto_NA1-5565779781_01.mp4"
]);

const failures = [];
const rankRows = manifest.recordings.filter((recording) => recording.performanceRank?.exactRank);

function fail(recording, message) {
  failures.push(`${recording.file || recording.src || "unknown"}: ${message}`);
}

function csPerMinute(recording) {
  const cs = Number(recording.cs);
  const seconds = [recording.gameLengthSeconds, recording.durationSeconds, recording.sourceDurationSeconds]
    .map((value) => Number(value))
    .find((value) => Number.isFinite(value) && value > 0);
  return Number.isFinite(cs) && Number.isFinite(seconds) && seconds > 0
    ? cs / (seconds / 60)
    : NaN;
}

function rankValue(recording) {
  return Number(recording.performanceRank?.exactRankValue ?? recording.rankEstimate?.exactRankValue);
}

function rankLabel(recording) {
  return recording.performanceRank?.exactRank || recording.rankEstimate?.exactRank || "";
}

function reasonText(recording) {
  return [
    recording.performanceRank?.reason,
    recording.rankEstimate?.reason
  ].filter(Boolean).join(" ");
}

for (const recording of rankRows) {
  const file = recording.file || "";
  const value = rankValue(recording);
  const rank = rankLabel(recording);
  const reason = reasonText(recording);
  const queue = recording.rankEstimate?.queueClass || "";
  const deaths = Number(recording.deaths);
  const kills = Number(recording.kills);
  const assists = Number(recording.assists);
  const cspm = csPerMinute(recording);

  if (recording.rankEstimate?.version !== expectedRankEstimateVersion) {
    fail(recording, `rank estimate version ${recording.rankEstimate?.version || "missing"} does not match ${expectedRankEstimateVersion}`);
  }
  if (recording.performanceRank?.version !== expectedPerformanceRankVersion) {
    fail(recording, `performance rank version ${recording.performanceRank?.version || "missing"} does not match ${expectedPerformanceRankVersion}`);
  }
  if (!Number.isFinite(value)) {
    fail(recording, "missing exact numeric rank value");
  }
  if (!/\bCS\/min\b/.test(reason)) {
    fail(recording, "rank reason does not mention CS/min");
  }
  if (!/\bdeath|deaths|K\/D\/A\b/i.test(reason)) {
    fail(recording, "rank reason does not mention deaths or K/D/A");
  }
  if (!/\bleak|entry|exit|fight|cash|conversion|base|objective|lane|wave|recall|group|pressure\b/i.test(reason)) {
    fail(recording, "rank reason does not tie the rank to a decision or conversion pattern");
  }

  if (expectedRankedSolo.has(file) && recording.gameType !== "Ranked Solo") {
    fail(recording, `expected Ranked Solo queue metadata, found ${recording.gameType || "missing"}`);
  }
  if (recording.gameType === "Co-op vs AI Beginner" && value > maxBotValue) {
    fail(recording, `beginner bot game is over-ranked at ${rank}`);
  }
  if (recording.gameType === "Co-op vs AI Beginner" && !/\blow-confidence ranked-habit read\b/i.test(reason)) {
    fail(recording, "beginner bot game is missing low-confidence ranked-habit wording");
  }
  if (recording.gameType === "Co-op vs AI Beginner" && /\bputs the game at\b/i.test(reason)) {
    fail(recording, "beginner bot game uses normal ranked-performance wording");
  }
  if (file === "auto_NA1-5568519322_01.mp4" &&
      !/\bfirst objective setup is grouped\b[\s\S]{0,160}\bsecured objective value\b/i.test(reason)) {
    fail(recording, "Drake review rank reason must separate grouped objective setup from post-secure re-fight");
  }
  if (queue === "unknown" && value >= minGoldValue) {
    fail(recording, `unverified queue cannot carry ${rank}`);
  }
  if (value >= minGoldValue && (!Number.isFinite(cspm) || cspm < 6 || !Number.isFinite(deaths) || deaths > 4)) {
    fail(recording, `${rank} claim lacks Gold-level CS/death baseline`);
  }
  if (Number.isFinite(kills) && Number.isFinite(deaths) && kills <= 1 && deaths >= 5 && value > 3) {
    fail(recording, `low-impact ${kills}/${deaths}/${Number.isFinite(assists) ? assists : "?"} line is over-ranked at ${rank}`);
  }
  if (Number.isFinite(deaths) && deaths >= 10 && value > 3) {
    fail(recording, `${deaths}-death game is over-ranked at ${rank}`);
  }
  if (Number.isFinite(deaths) && deaths >= 8 && Number.isFinite(kills) && kills < 18 && value > minBronzeValue) {
    fail(recording, `${deaths}-death game without carry-level kills is over-ranked at ${rank}`);
  }
  if (Number.isFinite(deaths) && deaths >= 8 && Number.isFinite(kills) && kills >= 18 && value > 5) {
    fail(recording, `${deaths}-death carry game is above the allowed low-Bronze cap at ${rank}`);
  }
  if (Number.isFinite(cspm) && cspm < 4 && Number.isFinite(deaths) && deaths >= 5 &&
      !(Number.isFinite(kills) && kills >= 20 && deaths <= 8 && cspm >= 3.9) &&
      value > 3) {
    fail(recording, `${cspm.toFixed(1)} CS/min with ${deaths} deaths is over-ranked at ${rank}`);
  }
  if (/cleaner win/i.test(recording.feedbackTitle || "") && rank !== "Silver IV") {
    fail(recording, `cleaner controlled win should calibrate to Silver IV, found ${rank}`);
  }
  if (/Fight wins need exit branch/i.test(recording.feedbackTitle || "") && rank !== "Bronze III") {
    fail(recording, `25-kill cash-out loss should calibrate to Bronze III, found ${rank}`);
  }
}

const byMatch = new Map();
for (const recording of rankRows) {
  const match = recording.matchId || (recording.file || "").match(/NA1-\d+/)?.[0];
  if (!match) continue;
  const current = byMatch.get(match) || [];
  current.push(recording.file || recording.src || "unknown");
  byMatch.set(match, current);
}
for (const [match, files] of byMatch.entries()) {
  if (files.length > 1) {
    failures.push(`${match}: multiple ranked full-review entries (${files.join(", ")})`);
  }
}

const countedLabels = rankRows.reduce((acc, recording) => {
  const label = (rankLabel(recording).split(" ")[0] || "").trim();
  if (label) acc[label] = (acc[label] || 0) + 1;
  return acc;
}, {});
const manifestCounts = manifest.rankCalibration?.rankLabelCounts || {};
const stableJson = (value) => JSON.stringify(Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b))));
if (stableJson(countedLabels) !== stableJson(manifestCounts)) {
  failures.push(`rank label counts mismatch: computed ${JSON.stringify(countedLabels)}, manifest ${JSON.stringify(manifestCounts)}`);
}
if (manifest.rankCalibration?.anchoredFullGames !== rankRows.length) {
  failures.push(`anchoredFullGames ${manifest.rankCalibration?.anchoredFullGames} does not match ranked rows ${rankRows.length}`);
}

if (failures.length) {
  console.error(`Rank audit failed with ${failures.length} issue(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Rank audit passed: ${rankRows.length} ranked full-review rows, ${manifest.recordings.length - rankRows.length} unranked highlight/remake rows.`);
