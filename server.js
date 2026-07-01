const http = require("http");
const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

const root = path.join(__dirname, "public");
const port = Number(process.env.PORT || 3000);
const dataRoot = process.env.LEAGUE_DATA_DIR || process.env.RAILWAY_VOLUME_MOUNT_PATH || path.join(__dirname, "data");
const notesPath = path.join(dataRoot, "public-notes.json");
const samiraAnalysisCachePath = path.join(dataRoot, "samira-analysis-cache.json");
const recordingsPath = path.join(root, "recordings", "recordings.json");
const writeToken = (process.env.LEAGUE_WRITE_TOKEN || "").trim();
const isRailway = Boolean(process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_SERVICE_ID);
const recordingMediaBase = (process.env.LEAGUE_RECORDING_MEDIA_BASE || "").replace(/\/+$/, "");
const recordingWebmMediaBase = (process.env.LEAGUE_RECORDING_WEBM_MEDIA_BASE || "https://cdn.jsdelivr.net/gh/nalalalan/league-app@main/public/recordings").replace(/\/+$/, "");
const recordingMp4MediaBase = (process.env.LEAGUE_RECORDING_MP4_MEDIA_BASE || "https://raw.githubusercontent.com/nalalalan/league-app/main/public/recordings").replace(/\/+$/, "");
const statusToken = (process.env.LEAGUE_STATUS_TOKEN || process.env.LEAGUE_WRITE_TOKEN || "").trim();
const samiraAnalysisModel = (process.env.LEAGUE_ANALYSIS_MODEL || process.env.OPENAI_MODEL || "gpt-4.1-mini").trim();
const samiraAiDisabled = /^(1|true|yes)$/i.test(process.env.LEAGUE_DISABLE_AI || "");
const samiraAnalysisPromptVersion = 4;
const recordingStatusPath = path.join(dataRoot, "recording-status.json");
const localAnalysisRoot = path.join(__dirname, "_recording-analysis");
const localRecordingStatusPath = path.join(localAnalysisRoot, "recording-status.json");
const localPostGameQueuePath = path.join(localAnalysisRoot, "post-game-queue.json");

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".webm": "video/webm",
  ".mp4": "video/mp4",
  ".pdf": "application/pdf",
  ".tex": "text/plain; charset=utf-8",
  ".bib": "text/plain; charset=utf-8"
};

const seedNotes = [
  {
    id: "seed-arc-imported",
    created_at: "2026-05-17T00:00:00-04:00",
    title: "seed arc imported",
    body: "The first page comes from the long League chat arc: farm-and-survive, sensory control, camera stability, Samira commit rules, Caitlyn comfort, death exposure, and bot-ladder practice."
  },
  {
    id: "practice-room-over-judgment",
    created_at: "2026-05-17T00:00:00-04:00",
    title: "practice room over judgment machine",
    body: "Bots are the practice room. Humans are performance. Go easier if overwhelmed, harder if bored, stay if anxious but playable."
  },
  {
    id: "current-samira-law",
    created_at: "2026-05-17T00:00:00-04:00",
    title: "current Samira law",
    body: "Q is the test. E is the commit. W is parry. R is reward. After kill, check E; dash again only if safe."
  },
  {
    id: "samira-s-plus-proof",
    created_at: "2026-05-18T00:00:00-04:00",
    title: "S+ Samira proof game",
    body: "User-supplied Swiftplay result: 13/6/5, 39,136 damage, 27,378 gold, 925 gold/min, S+ in a loss. The working blueprint was Q often, save W for real danger, wait for enemy disadvantage, enter late, R only when they are losing, run when chased, and mute everyone."
  },
  {
    id: "samira-a-plus-proof",
    created_at: "2026-05-18T00:00:00-04:00",
    title: "A+ Samira follow-up",
    body: "User-supplied follow-up: 10/1/8, 21,209 damage, 16,272 gold, 871 gold/min, A+ in a win. Boring rules made the good game happen."
  },
  {
    id: "samira-safe-gold-late-entry",
    created_at: "2026-05-18T00:00:00-04:00",
    title: "safe gold plus late entry",
    body: "Bad-team games need safe farming without disappearing. Farm on Alan's side of the map, hover toward team when enemies group, wait for big spells to fly, then clean up from the edge."
  }
];

function send(res, status, body, type = "text/plain; charset=utf-8") {
  res.writeHead(status, { "Content-Type": type });
  res.end(body);
}

function sendJson(res, status, body) {
  send(res, status, JSON.stringify(body, null, 2), "application/json; charset=utf-8");
}

async function readJsonBody(req, maxBytes = 12000) {
  const chunks = [];
  let length = 0;
  for await (const chunk of req) {
    length += chunk.length;
    if (length > maxBytes) throw new Error("Request body too large");
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

async function loadNotes() {
  try {
    const raw = await fsp.readFile(notesPath, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : seedNotes;
  } catch {
    return seedNotes;
  }
}

async function saveNotes(notes) {
  await fsp.mkdir(dataRoot, { recursive: true });
  await fsp.writeFile(notesPath, JSON.stringify(notes, null, 2) + "\n", "utf8");
}

async function readJsonFile(filePath, fallback = null) {
  try {
    return JSON.parse(await fsp.readFile(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

async function loadRecordingReview() {
  return readJsonFile(recordingsPath, {});
}

function statusUpdatedMs(raw) {
  const value = Date.parse(raw?.updatedAt || raw?.serverReceivedAt || "");
  return Number.isFinite(value) ? value : 0;
}

async function loadRecordingStatus() {
  const fallback = {
    status: "unknown",
    label: "recorder status unavailable",
    detail: "No live recorder heartbeat has reached the site yet.",
    updatedAt: ""
  };
  const primary = await readJsonFile(recordingStatusPath, null);
  const local = isRailway ? null : await readJsonFile(localRecordingStatusPath, null);
  let status = [primary, local]
    .filter(Boolean)
    .sort((a, b) => statusUpdatedMs(b) - statusUpdatedMs(a))[0] || fallback;

  if (!isRailway) {
    const queue = await readJsonFile(localPostGameQueuePath, []);
    if (Array.isArray(queue) && queue.length === 0 && Array.isArray(status.queueItems)) {
      const activeItems = status.queueItems.filter((item) => {
        const label = String(item?.label || "").toLowerCase();
        const stage = String(item?.stage || "").toLowerCase();
        const itemStatus = String(item?.status || "").toLowerCase();
        return label === "current game" || stage === "recording" || itemStatus === "recording";
      });
      status = {
        ...status,
        queueCount: activeItems.length,
        queueItems: activeItems
      };
    } else if (Array.isArray(queue) && (!Array.isArray(status.queueItems) || Date.now() - statusUpdatedMs(status) >= 2 * 60 * 1000)) {
      status = {
        ...status,
        queueCount: queue.length,
        queueItems: queue
      };
    }
  }
  return status;
}

async function saveRecordingStatus(status) {
  await fsp.mkdir(dataRoot, { recursive: true });
  await fsp.writeFile(recordingStatusPath, JSON.stringify(status, null, 2) + "\n", "utf8");
}

function cleanText(value, maxLength) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function cleanParagraphText(value, maxLength) {
  return String(value || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim()
    .slice(0, maxLength);
}

function hashText(value) {
  return crypto.createHash("sha256").update(String(value || "")).digest("hex");
}

function samiraAiReady() {
  return Boolean(process.env.OPENAI_API_KEY) && !samiraAiDisabled;
}

async function loadSamiraAnalysisCache() {
  const fallback = { version: 1, noteAnalyses: {}, corpusAnalyses: {} };
  const parsed = await readJsonFile(samiraAnalysisCachePath, fallback);
  return {
    version: 1,
    noteAnalyses: parsed && typeof parsed.noteAnalyses === "object" ? parsed.noteAnalyses : {},
    corpusAnalyses: parsed && typeof parsed.corpusAnalyses === "object" ? parsed.corpusAnalyses : {}
  };
}

async function saveSamiraAnalysisCache(cache) {
  await fsp.mkdir(dataRoot, { recursive: true });
  await fsp.writeFile(samiraAnalysisCachePath, JSON.stringify(cache, null, 2) + "\n", "utf8");
}

function stripAssistantScaffold(value, maxLength = 430) {
  let text = cleanText(value, maxLength)
    .replace(/\b(?:Good sign|Biggest watchout|Best move|Recommendation|Why it helps|Main concern|Action|Reason|Next|Blunt read|Honest read|Improvement|Previous game read|Approx rank read)\s*:\s*/gi, "")
    .replace(/\bThe\s+(?:improvement|note|duo lesson|money leak|entry rule|death|lesson|leak|rule)\s+(?:is|was)\s+/gi, "")
    .replace(/\b(?:This note says|This game shows|The saved note says|The valuable part is)\s+/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  return text.slice(0, maxLength);
}

function wordCount(value) {
  return cleanText(value, 2000).split(/\s+/).filter(Boolean).length;
}

function samiraTextLooksCutOff(text) {
  const value = cleanText(text, 1000);
  if (!value) return true;
  if (!/[.!?]$/.test(value)) return true;
  return /\b(?:to the|to a|instead of|because|while|when|if|with|without|from|into|and|or|but|the|a|an|to|of|for|as|than)\.?$/i.test(value);
}

function sentenceBoundedText(value, maxLength = 430, maxWords = 72) {
  const text = cleanText(value, 1200);
  if (!text) return "";
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  let result = "";
  for (const sentence of sentences) {
    const next = cleanText(`${result} ${sentence}`, maxLength + 120);
    if (next.length > maxLength || wordCount(next) > maxWords) break;
    result = next;
  }
  if (!result) {
    return "";
  }
  return result.replace(/[,:;/-]*$/, "").trim();
}

function samiraAiCopyRejected(text) {
  const value = cleanText(text, 1000);
  return samiraTextLooksCutOff(value) || /\b(?:improve overall performance|win chances|strategic play|showcas(?:e|ing)|critical decision leak|decision leak|potential success|achieved|secured|faltered|undermined|playing Teemo support|while playing Teemo|Alan played Teemo|in this (?:swiftplay|ranked|game)|gameplay relies|unfavorable|strategy|strategic|prioriti[sz]e|focus on|maintain|capitalize|impactful plays|challenging matchup|despite the|breakdown in strategy|hinder success|overall performance|your stats show potential|execution needs refinement|keep pushing|find your openings|focus on bigger fights|turn the game around|maintain chase pressure|controlled|stable|safe entry|overextending|prematurely|risky engagements|initial impact|red-light commits?|must adopt|must be|playstyle|approach|engage(?:ment)?|clear entry|exit patterns?|main failure|main mistake|biggest mistake|classic .* mistake|failure to|stabiliz(?:e|ing)|mental overload|poor positioning|poor fight endings|fundamental|mechanical and decision|decision flaws?|the note (?:clearly )?(?:defines|identifies|emphasizes|highlights)|highlighting that|aligns with|iron [ivx]+ level mistakes?|ranked-habit evidence|source-bounded note analysis|limited ranked|beyond baseline|ranked-level|decision depth|basic fight timing|opportunit(?:y|ies)|show enough|climb yet|red flags?|avoid(?:s|ing)?)\b/i.test(value);
}

function samiraAiDescriptionRejected(text) {
  const value = cleanText(text, 1000);
  return !value || value.length < 45 || value.length > 430 || wordCount(value) > 72 || samiraAiCopyRejected(value);
}

function samiraAiReasonRejected(text) {
  const value = cleanText(text, 500);
  return !value || value.length < 12 || value.length > 170 || wordCount(value) > 26 || samiraAiCopyRejected(value);
}

function naturalRankReason(value, fallback = "") {
  const candidate = sentenceBoundedText(stripAssistantScaffold(value, 260), 170, 26);
  if (!samiraAiReasonRejected(candidate)) return candidate;
  const fallbackText = sentenceBoundedText(stripAssistantScaffold(fallback, 260), 170, 24);
  if (!samiraAiReasonRejected(fallbackText)) return fallbackText;
  return "Your rank read stays low because the same fights still need cleaner exits.";
}

function parseJsonObject(text) {
  const raw = String(text || "").trim();
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

async function openAiJson(messages, maxTokens = 260) {
  if (!samiraAiReady()) return null;
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: samiraAnalysisModel,
      temperature: 0.35,
      max_tokens: maxTokens,
      response_format: { type: "json_object" },
      messages
    })
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`OpenAI analysis failed: ${response.status} ${body.slice(0, 200)}`);
  }
  const data = await response.json();
  return parseJsonObject(data?.choices?.[0]?.message?.content || "");
}

const samiraRankScale = [
  "Iron IV", "Iron III", "Iron II", "Iron I",
  "Bronze IV", "Bronze III", "Bronze II", "Bronze I",
  "Silver IV", "Silver III", "Silver II", "Silver I",
  "Gold IV", "Gold III", "Gold II", "Gold I",
  "Platinum IV", "Platinum III", "Platinum II", "Platinum I",
  "Emerald IV", "Emerald III", "Emerald II", "Emerald I",
  "Diamond IV", "Diamond III", "Diamond II", "Diamond I",
  "Master", "Grandmaster", "Challenger"
];
const samiraRankValueByName = new Map(samiraRankScale.map((rank, index) => [rank.toLowerCase(), index]));
const samiraCurrentWindowStartMs = Date.parse("2026-06-30T00:00:00-04:00");
const samiraRankTrendDateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  month: "numeric",
  day: "numeric"
});

function samiraRankNameForValue(value) {
  const number = Number(value);
  const index = Number.isFinite(number) ? Math.round(number) : 0;
  return samiraRankScale[Math.max(0, Math.min(samiraRankScale.length - 1, index))] || "unrated";
}

function samiraRankValueFromText(value) {
  const text = String(value || "").toLowerCase();
  const match = samiraRankScale.find((rank) => {
    const parts = rank.toLowerCase().split(/\s+/);
    const pattern = parts.length === 2
      ? new RegExp(`\\b${parts[0]}\\s+${parts[1]}\\b`, "i")
      : new RegExp(`\\b${parts[0]}\\b`, "i");
    return pattern.test(text);
  });
  return match ? samiraRankValueByName.get(match.toLowerCase()) : null;
}

function samiraRecordingTime(item = {}) {
  const matchTime = Number(item.matchTimeMs);
  if (Number.isFinite(matchTime) && matchTime > 0) return matchTime;
  const parsed = Date.parse(item.gameHappenedAt || item.recordedAt || item.updatedAt || "");
  return Number.isFinite(parsed) ? parsed : 0;
}

function samiraInCurrentWindow(timeMs) {
  return Number.isFinite(timeMs) && timeMs >= samiraCurrentWindowStartMs;
}

function samiraNoteInCurrentWindow(note = {}) {
  return samiraInCurrentWindow(Date.parse(note.created_at || ""));
}

function samiraRecordingInCurrentWindow(item = {}) {
  return samiraInCurrentWindow(samiraRecordingTime(item));
}

function samiraRecordingRank(item = {}) {
  const estimate = item.performanceRank || item.rankEstimate || {};
  const exactRank = cleanText(estimate.exactRank || estimate.mostLikelyRank || estimate.rank || estimate.label, 32);
  const mapped = samiraRankValueByName.get(exactRank.toLowerCase());
  const exactValue = Number(estimate.exactRankValue);
  return exactRank
    ? {
        rank: exactRank,
        value: Number.isFinite(exactValue) ? exactValue : (Number.isFinite(mapped) ? mapped : null),
        queueClass: cleanText(estimate.queueClass || item.rankEstimate?.queueClass, 40),
        confidence: cleanText(estimate.rankedTransferConfidence || estimate.confidence || item.rankEstimate?.confidence, 40),
        reason: cleanText(estimate.reason || item.rankEstimate?.reason, 220)
      }
    : null;
}

function samiraRecordings(review = {}) {
  return (Array.isArray(review.recordings) ? review.recordings : [])
    .filter((item) => String(item.champion || "").toLowerCase().includes("samira"))
    .filter((item) => String(item.kind || "").toLowerCase().includes("full") || item.rankEstimate || item.performanceRank)
    .filter(samiraRecordingInCurrentWindow)
    .sort((a, b) => samiraRecordingTime(b) - samiraRecordingTime(a));
}

function parseRankPhrase(text, label) {
  const match = String(text || "").match(new RegExp(`${label}\\s+([^;,.]+)`, "i"));
  return match ? cleanText(match[1], 48) : "";
}

function numberWithCommas(value) {
  const digits = String(value || "").replace(/[^\d]/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("en-US");
}

function normalizedGameType(text) {
  const source = String(text || "");
  const patterns = [
    { re: /\branked\s+solo(?:\/duo)?\b|\bsolo\s+queue\b/i, label: "ranked solo" },
    { re: /\branked\s+flex\b|\bflex\s+queue\b/i, label: "ranked flex" },
    { re: /\bquickplay\b/i, label: "quickplay" },
    { re: /\bnormal\s+draft\b|\bdraft\s+pick\b/i, label: "normal draft" },
    { re: /\bnormal\s+blind\b|\bblind\s+pick\b/i, label: "normal blind" },
    { re: /\baram\b/i, label: "ARAM" },
    { re: /\bco-?op\s+vs\.?\s+ai\b|\bbot\s+game\b|\bbeginner\s+bots?\b|\bintro\s+bots?\b|\bintermediate\s+bots?\b/i, label: "bot game" },
    { re: /\bswiftplay\b/i, label: "Swiftplay" },
    { re: /\bcustom\b/i, label: "custom" },
    { re: /\branked\b/i, label: "ranked" },
    { re: /\bnormal\b/i, label: "normal" }
  ];
  return patterns.find((item) => item.re.test(source))?.label || "";
}

function samiraNoteGameMeta(note = {}) {
  const text = `${note.title || ""}\n${note.body || ""}`;
  const resultMatch = text.match(/\b(victory|defeat|won|win|lost|loss)\b/i);
  const result = resultMatch
    ? (/victory|won|win/i.test(resultMatch[1]) ? "win" : "loss")
    : "";
  const kdaMatch = text.match(/\b(?:k\/?d\/?a|score|went|finished|ending)?\s*:?\s*(\d{1,2})\s*\/\s*(\d{1,2})\s*\/\s*(\d{1,2})\b/i);
  const csMatch = text.match(/\b(?:cs|creep\s+score|farm)\s*[:=]?\s*(\d{2,4})\b/i) ||
    text.match(/\b(\d{2,4})\s*(?:cs|creep\s+score)\b/i);
  const damageMatch = text.match(/\b(\d{1,3}(?:,\d{3})+|\d{4,6})\s*(?:damage|dmg)\b/i);
  const goldMatch = text.match(/\b(\d{1,3}(?:,\d{3})+|\d{4,6})\s*gold\b/i);
  const goldPerMinuteMatch = text.match(/\b(\d{2,4})\s*(?:gold\/min|gpm)\b/i);
  const gameType = normalizedGameType(text);
  const kda = kdaMatch ? `${kdaMatch[1]}/${kdaMatch[2]}/${kdaMatch[3]}` : "";
  const cs = csMatch ? `${csMatch[1]} CS` : "";
  const damage = damageMatch ? `${numberWithCommas(damageMatch[1])} damage` : "";
  const gold = goldMatch ? `${numberWithCommas(goldMatch[1])} gold` : "";
  const gpm = goldPerMinuteMatch ? `${goldPerMinuteMatch[1]} gold/min` : "";
  const parts = [gameType, result, kda, cs, damage, gold, gpm].filter(Boolean);
  return {
    game_type: gameType,
    result,
    kda,
    cs,
    damage,
    gold,
    gold_per_minute: gpm,
    line: cleanText(parts.join(" / "), 160)
  };
}

function isSamiraNote(note = {}) {
  const haystack = `${note.title || ""} ${note.body || ""} ${note.source || ""}`.toLowerCase();
  return haystack.includes("samira") || haystack.includes("e key") || haystack.includes("w/hp/ally") || haystack.includes("inferno trigger");
}

function sentenceStart(text, maxLength) {
  const sentence = String(text || "").split(/(?<=[.!?])\s+/)[0] || "";
  return cleanText(sentence, maxLength);
}

function samiraRankEstimate(notes, review = {}) {
  const recordings = samiraRecordings(review);
  const newest = recordings[0] || null;
  const newestRank = newest ? samiraRecordingRank(newest) : null;
  const currentNoteReads = notes.map((note) => samiraNoteRankRead(note, { exactRank: "Iron II" }));
  const newestNoteRank = currentNoteReads[0] || null;
  const exactRank = newestRank?.rank || newestNoteRank?.exactRank || "unrated";
  const currentRead = newestNoteRank?.exactRank || "";
  const archiveRead = "";
  const range = newestNoteRank?.range || exactRank;
  const newestLine = newest
    ? `${cleanText(newest.title || "newest Samira recording", 80)}${newestRank?.rank ? `, ${newestRank.rank}` : ""}`
    : "";
  return {
    exactRank,
    range,
    currentRead,
    archiveRead,
    confidence: notes.length >= 3 ? "medium" : (notes.length ? "low" : "none"),
    basis: cleanText(`June 30 onward Samira notes plus current-window full-game reviews; not Riot MMR`, 160),
    reason: cleanText(newestRank?.reason || newestNoteRank?.reason || "No June 30 onward Samira rank source is available yet.", 260),
    newestRecording: newestLine
  };
}

function samiraRankTrendDateLabel(timeMs) {
  const date = new Date(timeMs);
  if (Number.isNaN(date.getTime())) return "";
  return samiraRankTrendDateFormatter.format(date);
}

function samiraRankTrendPoint({ source, title, rank, value, timeMs }) {
  if (!rank || !Number.isFinite(value) || !Number.isFinite(timeMs) || timeMs <= 0) return null;
  return {
    source: cleanText(source, 24),
    title: cleanText(title, 100),
    rank: cleanText(rank, 32),
    value,
    time_ms: timeMs,
    created_at: new Date(timeMs).toISOString(),
    date_label: samiraRankTrendDateLabel(timeMs)
  };
}

function samiraRankTrend(notes = [], review = {}, overallRank = {}, analysesById = {}) {
  const recordingPoints = samiraRecordings(review)
    .map((item) => {
      const rank = samiraRecordingRank(item);
      return samiraRankTrendPoint({
        source: "full game",
        title: item.title || item.file || "Samira recording",
        rank: rank?.rank || "",
        value: Number(rank?.value),
        timeMs: samiraRecordingTime(item)
      });
    })
    .filter(Boolean);
  const notePoints = notes
    .map((note) => {
      const rankRead = analysesById[samiraNoteCacheKey(note)]?.rank_read || samiraNoteRankRead(note, overallRank);
      const value = samiraRankValueFromText(rankRead.exactRank);
      return samiraRankTrendPoint({
        source: "note",
        title: note.title || "Samira note",
        rank: rankRead.exactRank,
        value,
        timeMs: Date.parse(note.created_at || "")
      });
    })
    .filter(Boolean);
  const points = [...recordingPoints, ...notePoints]
    .sort((a, b) => a.time_ms - b.time_ms || a.value - b.value || a.title.localeCompare(b.title))
    .slice(-80);
  return {
    points,
    basis: "June 30 onward saved Samira notes plus current-window full-game rank reads; not Riot MMR"
  };
}

function samiraTips(notes, review = {}) {
  const noteText = notes.map((note) => `${note.title || ""} ${note.body || ""}`).join(" ").toLowerCase();
  const currentRecordingText = samiraRecordings(review)
    .map((item) => `${item.title || ""} ${item.review || ""} ${item.mainTakeaway || ""} ${item.notes || ""}`)
    .join(" ")
    .toLowerCase();
  const tips = [
    "Before E, call W ready / HP above half / ally close.",
    "Red light means Q/auto while backing up.",
    "S loaded means R is available, not required.",
    "After a kill, take wave, plate, objective, or reset."
  ];
  if (noteText.includes("fog") || noteText.includes("bush") || currentRecordingText.includes("fog") || currentRecordingText.includes("forward click")) {
    tips.push("Fog chase becomes wave or objective unless next enemy is known.");
  }
  return tips.slice(0, 5);
}

function samiraNoteAnalysisText(note = {}) {
  return `${note.title || ""}\n${note.body || ""}`.toLowerCase();
}

function countSamiraMatches(text, patterns) {
  return patterns.reduce((total, pattern) => total + (text.match(pattern) || []).length, 0);
}

function hasSamiraConcept(text, patterns) {
  return patterns.some((pattern) => pattern.test(text));
}

function samiraConceptSentence(text) {
  if (hasSamiraConcept(text, [/fixed flight pattern/i, /boom-and-zoom/i, /edge is altitude/i, /return to edge/i, /death as the fight-ending/i])) {
    return "Use the flight pattern: edge, dive, damage, climb out.";
  }
  if (hasSamiraConcept(text, [/\bs loaded\b/i, /\bs rank\b/i, /permission to r/i, /ready to r/i])) {
    return "S loaded is only availability. It is not permission to press R.";
  }
  if (hasSamiraConcept(text, [/\bfog\b/i, /\bchase\b/i, /turns? into wave/i, /turns? into objective/i])) {
    return "Treat fog chase as the throw pattern. Take map payout before the second fight.";
  }
  if (hasSamiraConcept(text, [/teemo support/i, /pyke lane/i, /stabil/i, /309\/720/i, /6\/11\/2/i])) {
    return "Make ugly lane smaller. Bad support and early HP loss do not make a bigger fight correct.";
  }
  if (hasSamiraConcept(text, [/lily/i, /short commands/i, /behind me/i, /peel me/i, /calm commands/i])) {
    return "Use one short duo call, then play the fight.";
  }
  if (hasSamiraConcept(text, [/unspent gold/i, /shutdown/i, /buy/i, /reset/i, /spending/i])) {
    return "Turn each kill into wave, plate, objective, buy, or reset.";
  }
  if (hasSamiraConcept(text, [/w ready/i, /hp above half/i, /ally close/i, /green light/i])) {
    return "Check W ready, HP above half, ally close; otherwise Q and auto while backing out.";
  }
  if (hasSamiraConcept(text, [/\bdeath\b/i, /\bdied\b/i, /\bstayed\b/i, /\bstay\b/i, /\bin the middle\b/i])) {
    return "Do not call the death random. You stayed where Samira is easiest to punish.";
  }
  return "Name the next wrong click before the note can help.";
}

function samiraNextClickSentence(text) {
  if (hasSamiraConcept(text, [/fixed flight pattern/i, /boom-and-zoom/i, /edge is altitude/i, /return to edge/i, /death as the fight-ending/i])) {
    return "Play edge, dive, damage, out. If you are still in the middle after the pass, you are already wrong.";
  }
  if (hasSamiraConcept(text, [/\bs loaded\b/i, /\bs rank\b/i, /permission to r/i, /ready to r/i])) {
    return "Treat S as a light, not a command. Re-check W, HP, ally, and exit before R.";
  }
  if (hasSamiraConcept(text, [/\bfog\b/i, /\bchase\b/i, /turns? into wave/i, /turns? into objective/i])) {
    return "When the enemy runs into fog, take wave, plate, objective, or reset unless vision and ally position are already true.";
  }
  if (hasSamiraConcept(text, [/teemo support/i, /pyke lane/i, /stabil/i, /309\/720/i, /6\/11\/2/i])) {
    return "When support or lane is bad, stabilize first. Farm, recall, stop trying to win the lane back through another fight.";
  }
  if (hasSamiraConcept(text, [/lily/i, /short commands/i, /behind me/i, /peel me/i, /calm commands/i])) {
    return "Say the command once, then spend attention on spacing instead of talking.";
  }
  if (hasSamiraConcept(text, [/unspent gold/i, /shutdown/i, /buy/i, /reset/i, /spending/i])) {
    return "Spend the kill before hunting again. Wave, plate, objective, buy, or reset.";
  }
  if (hasSamiraConcept(text, [/w ready/i, /hp above half/i, /ally close/i, /green light/i])) {
    return "If W, HP, and ally are not true, stay on Q, auto, and backstep.";
  }
  if (hasSamiraConcept(text, [/\bdeath\b/i, /\bdied\b/i, /\bstayed\b/i, /\bstay\b/i, /\bin the middle\b/i])) {
    return "After damage, click out first. Re-enter only after the next cooldown check.";
  }
  return "Name the next click before queue starts, or the note will not change the game.";
}

function samiraNoteRankRead(note = {}, overallRank = {}) {
  const text = samiraNoteAnalysisText(note);
  const explicit = samiraRankValueFromText(text);
  const baseline = samiraRankValueFromText(overallRank.exactRank || overallRank.currentRead || "") ?? 3;
  const greenLight = countSamiraMatches(text, [
    /\bw ready\b/g,
    /\bhp above half\b/g,
    /\bally close\b/g,
    /\bgreen light\b/g,
    /\bq before e\b/g,
    /\bauto(?:\/| and )?q\b/g,
    /\bback click\b/g,
    /\breset spacing\b/g
  ]);
  const conversion = countSamiraMatches(text, [
    /\btake wave\b/g,
    /\bplate\b/g,
    /\bobjective\b/g,
    /\brecall\b/g,
    /\bgroup\b/g,
    /\bexit\b/g,
    /\bwait\b/g,
    /\bkite\b/g
  ]);
  const leak = countSamiraMatches(text, [
    /\bred light\b/g,
    /\bpanic\b/g,
    /\bgreed\b/g,
    /\bchase\b/g,
    /\bfog\b/g,
    /\bw down\b/g,
    /\blow hp\b/g,
    /\bno ally\b/g,
    /\bsecond fight\b/g,
    /\billegal e\b/g,
    /\bunspent\b/g,
    /\btilt\b/g
  ]);
  const words = text.split(/\s+/).filter(Boolean).length;
  let delta = 0;
  if (greenLight + conversion >= 6 && leak <= 3) delta += 2;
  else if (greenLight + conversion >= 3 && leak <= 5) delta += 1;
  if (leak >= 6) delta -= 1;
  if (words < 35) delta -= 1;
  const value = explicit ?? Math.max(0, Math.min(samiraRankScale.length - 1, baseline + delta));
  const exactRank = samiraRankNameForValue(value);
  const reason = leak > greenLight + conversion
    ? "Too many fights still become chase, low-HP stays, or no-exit deaths."
    : greenLight + conversion > 0
      ? "You name the entry gate and the cash-out, but it still has to become clicks."
      : "There is not enough ranked behavior here to move the read much.";
  return {
    exactRank,
    range: `${samiraRankNameForValue(value - 1)} to ${samiraRankNameForValue(value + 1)}`,
    confidence: words >= 120 ? "medium" : "low",
    reason: cleanText(reason, 180),
    basis: "saved note + current Samira baseline; not Riot MMR",
    signals: {
      greenLight,
      conversion,
      leak
    }
  };
}

function publicSamiraNote(note = {}, overallRank = {}, analysis = null) {
  const id = cleanText(note.id, 120);
  const rankRead = analysis?.rank_read || samiraNoteRankRead(note, overallRank);
  const gameMeta = samiraNoteGameMeta(note);
  return {
    id,
    title: cleanText(note.title || "Samira note", 90),
    description: analysis?.description || samiraNoteDescription(note, rankRead, overallRank),
    created_at: note.created_at || "",
    source: cleanText(note.source || "", 40),
    body: cleanParagraphText(note.body || "", 140000),
    preview: sentenceStart(note.body, 260),
    game_meta: gameMeta,
    game_meta_line: gameMeta.line,
    pdf_url: id ? `/api/samira/notes/${encodeURIComponent(id)}.pdf` : "",
    rank_read: rankRead
  };
}

function samiraCorpusMainTakeaway(notes = [], review = {}, overallRank = {}) {
  const text = cleanParagraphText(notes.map((note) => `${note.title || ""}\n${note.body || ""}`).join("\n"), 300000);
  const lower = text.toLowerCase();
  const greenLight = countSamiraMatches(lower, [
    /\bw ready\b/g,
    /\bhp above half\b/g,
    /\bally close\b/g,
    /\bgreen light\b/g,
    /\bq before e\b/g,
    /\bauto(?:\/| and )?q\b/g
  ]);
  const exits = countSamiraMatches(lower, [
    /\btake wave\b/g,
    /\bplate\b/g,
    /\bobjective\b/g,
    /\brecall\b/g,
    /\bbuy\b/g,
    /\bexit\b/g,
    /\bstep out\b/g,
    /\bkite\b/g
  ]);
  const leaks = countSamiraMatches(lower, [
    /\bred light\b/g,
    /\bpanic\b/g,
    /\bgreed\b/g,
    /\bchase\b/g,
    /\bfog\b/g,
    /\bw down\b/g,
    /\blow hp\b/g,
    /\bno ally\b/g,
    /\bsecond fight\b/g,
    /\billegal e\b/g,
    /\bunspent\b/g,
    /\btilt\b/g,
    /\bstay\b/g
  ]);
  if (hasSamiraConcept(text, [/fixed flight pattern/i, /boom-and-zoom/i, /edge is altitude/i, /return to edge/i])) {
    return "Edge first. Dive for damage, climb out, then re-check.";
  }
  if (exits >= 5 && leaks >= 5) {
    return "You already have damage. Kill, step out, buy, then fight again.";
  }
  if (greenLight >= 4 && leaks >= 4) {
    return "Your E needs a gate. W ready, HP above half, ally close, then go.";
  }
  if (lower.includes("controlled violence plus clean exits")) {
    return "Controlled violence is fine. The exit after the violence is still the test.";
  }
  if (/quiet fight|short call|behind me|peel me|bubble diver|calm commands/.test(lower)) {
    return "Short calls are helping. Stop turning one fight into five instructions.";
  }
  const lockIn = text.match(/Alan locks in by making the game smaller:\s*([^.!?]+[.!?]?)/i);
  if (lockIn?.[1]) return cleanText(`Make the game smaller: ${lockIn[1]}`, 120);
  const problem = text.match(/problem is this:\s*([^.!?]+[.!?]?)/i);
  if (problem?.[1]) return cleanText(problem[1], 120);
  if (notes.length) {
    return "Stop treating damage as the hard part. Take the payout and leave.";
  }
  return "Stop making every fight bigger than the first useful win.";
}

function samiraPreviousGameImprovement(note = {}, rankRead = {}, overallRank = {}) {
  const text = samiraNoteAnalysisText(note);
  const signals = rankRead.signals || {};
  const pieces = [];
  if (/fixed flight pattern|boom-and-zoom|edge is altitude|return to edge/.test(text)) {
    pieces.push("Name the climb-out after damage, not after the dive.");
  } else if (/\bs loaded\b|\bs rank\b|permission to r|ready to r/.test(text)) {
    pieces.push("Separate R availability from R permission.");
  } else if (/\bfog\b|\bchase\b|turns? into wave|turns? into objective/.test(text)) {
    pieces.push("See the chase as a map-choice leak, not a mechanics problem.");
  } else if (/teemo support|pyke lane|stabil|309\/720|6\/11\/2/.test(text)) {
    pieces.push("Give bad lane a boring response: farm, recall, stop forcing.");
  } else if (/quiet fight|short call|behind me|peel me|bubble diver|calm commands|lily/.test(text)) {
    pieces.push("Shrink duo comms into one command before the fight starts.");
  } else if (signals.conversion >= 4 || /exit|reset|recall|buy|wave|objective|step out|plate/.test(text)) {
    pieces.push("Name where the value goes after the kill.");
  } else if (/w ready|hp above half|ally close|green light/.test(text)) {
    pieces.push("Make E conditional instead of emotional.");
  } else {
    pieces.push("Narrow the next note until the next game proves one changed click.");
  }
  if ((signals.leak || 0) >= (signals.greenLight || 0) + 5 && !/\bfog\b|\bchase\b/.test(text)) {
    pieces.push("The next game has to prove one calmer check.");
  }
  return cleanText(pieces.join(" "), 300);
}

function samiraSourceSpecificSentence(note = {}) {
  const text = samiraNoteAnalysisText(note);
  const gameMeta = samiraNoteGameMeta(note).line;
  if (/swiftplay|2\/0\/0|15 cs|4,?492 gold|panic defense|win condition/.test(text) || /Swiftplay/i.test(gameMeta)) {
    return "Survival was not the problem. Panic defense after first value was.";
  }
  if (/6\/11\/2|8,?279 damage|11,?077 gold|teemo support|pyke lane|309\/720/.test(text)) {
    return "The lane was ugly, but eleven deaths made the comeback attempt worse.";
  }
  if (/16\/6\/9|yasuo|47,?199 damage/.test(text)) {
    return "Yasuo was the real carry signal, so Samira needed cleaner value conversion, not more pride fights.";
  }
  if (/nami|lily|trio|team score|46.?38/.test(text)) {
    return "The trio-game leak is not damage; it is letting ally chaos turn one defense into repeated re-entry.";
  }
  if (/aram/.test(text)) {
    return "ARAM hides the lane problem, but it still exposes the five seconds after aggression works.";
  }
  if (/ranked solo \/ win|ranked solo queue win|win\b/.test(`${text} ${gameMeta.toLowerCase()}`)) {
    return "The exit rule has to survive games that are not already working.";
  }
  return "";
}

function samiraNoteDescription(note = {}, rankRead = {}, overallRank = {}) {
  const sourceText = `${note.title || ""}\n${note.body || ""}`;
  const parts = [samiraConceptSentence(sourceText)];
  const specific = samiraSourceSpecificSentence(note);
  if (specific) parts.push(specific);
  parts.push(samiraNextClickSentence(sourceText));
  parts.push(samiraPreviousGameImprovement(note, rankRead, overallRank));
  if (hasSamiraConcept(sourceText, [/fixed flight pattern/i, /boom-and-zoom/i, /return to edge/i])) {
    parts.push("Stop turnfighting on the ground. One pass, out, re-check, then another pass.");
  } else if (hasSamiraConcept(sourceText, [/\bs loaded\b/i, /\bs rank\b/i, /permission to r/i])) {
    parts.push("Do not ult just because the letter appears.");
  } else if (hasSamiraConcept(sourceText, [/\bfog\b/i, /\bchase\b/i])) {
    parts.push("Fog is not a slot machine. Convert first, chase second.");
  } else if (hasSamiraConcept(sourceText, [/teemo support/i, /pyke lane/i, /stabil/i, /309\/720/i, /6\/11\/2/i])) {
    parts.push("Bad lane gets smaller, not louder.");
  } else if (hasSamiraConcept(sourceText, [/lily/i, /short commands/i, /behind me/i, /peel me/i, /calm commands/i])) {
    parts.push("One calm command is enough.");
  } else if (hasSamiraConcept(sourceText, [/unspent gold/i, /shutdown/i, /buy/i, /reset/i, /spending/i, /\bplate\b/i])) {
    parts.push("Do not donate the shutdown back.");
  } else if (hasSamiraConcept(sourceText, [/w ready/i, /hp above half/i, /ally close/i, /green light/i])) {
    parts.push("No gate, no E.");
  } else {
    parts.push("Stop admiring the kill. Cash it out or leave.");
  }
  const uniqueParts = parts.filter((part, index, array) => {
    const normalized = cleanParagraphText(part, 400).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    return normalized && array.findIndex((other) => cleanParagraphText(other, 400).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim() === normalized) === index;
  });
  return cleanText(uniqueParts.join(" "), 430);
}

function samiraNoteCacheKey(note = {}) {
  return cleanText(note.id || hashText(`${note.created_at || ""}\n${note.title || ""}\n${note.body || ""}`).slice(0, 18), 120);
}

function normalizeAiRank(value, fallback = "Iron III") {
  const rank = cleanText(value, 32);
  return samiraRankValueFromText(rank) === null ? fallback : samiraRankNameForValue(samiraRankValueFromText(rank));
}

function fallbackSamiraAnalysis(note = {}, rankRead = {}, overallRank = {}) {
  return {
    engine: "fallback",
    prompt_version: samiraAnalysisPromptVersion,
    body_hash: hashText(`${note.title || ""}\n${note.body || ""}`),
    description: samiraNoteDescription(note, rankRead, overallRank),
    rank_read: rankRead
  };
}

async function analyzeSamiraNoteWithAi(note = {}, rankRead = {}, overallRank = {}) {
  const gameMeta = samiraNoteGameMeta(note);
  const body = cleanParagraphText(note.body || "", 7000);
  const system = [
    "You analyze Alan's saved Samira League notes.",
    "Return JSON only with keys: description, rank, rank_reason.",
    "Do actual game-model analysis from the pasted note. Do not summarize the title.",
    "Alan is the Samira player unless the note explicitly says otherwise. Teemo support, Nami, Lily, Yasuo, Pyke, and enemy names are other players or context, not Alan's champion.",
    "Write the paragraph as the sentence Alan should read before queueing, not as a match recap.",
    "Use natural direct second-person or direct Alan language. Prefer short commands and hard reads. Be mean and concrete, not polite.",
    "Sound like a blunt teammate who understood the note, not a coach report, rank audit, or AI summary.",
    "Pick the one useful pre-game read. Do not inventory every fact in a huge note.",
    "Use the note's own model: entry gate, first damage pass, climb-out, payout, reset, fog chase, bad support, panic defense, value conversion.",
    "Use 2 to 4 short sentences for description, 24 to 65 words.",
    "No labels, prefixes, assistant scaffolding, generic note summaries, or signal counts.",
    "Do not write generic coaching phrases about performance, strategy, potential, success, or improvement.",
    "Do not use professional recap verbs like achieved, secured, showcasing, faltered, or undermined.",
    "Do not write prioritize, focus on, avoid, maintain, controlled, stable, safe entry, overextending, prematurely, risky engagements, red-light, red flag, initial impact, adopt, must be, playstyle, approach, engage, main failure, main mistake, stabilizing, mental overload, fundamental, decision flaw, opportunity, ranked-level, decision depth, basic fight timing, show enough, or climb yet.",
    "Do not write The note defines, the note identifies, highlighting, aligns with, emphasizes, level mistakes, or limited evidence.",
    "Do not start with In this game, In this ranked game, In this Swiftplay, Despite, or The game.",
    "Do not invert Alan's critique. If the note says bigger fights, panic defense, fog chase, or staying in middle caused the problem, name that behavior as the mistake.",
    "Never recommend bigger fights, maintaining chase pressure, pushing through chaos, or finding openings when the note says exit, reset, payout, or climb out.",
    "Do not reuse boilerplate across notes. Mention the note-specific pattern, stats, matchup, game type, or decision leak when present.",
    "rank_reason must also sound natural: one short sentence about the rank read, not a report about the note.",
    "Good style examples, only if the evidence matches: 'You had 309/720 HP. That is not a comeback window. Shrink the lane, take small farm, or reset; bigger fights made the bad lane bigger.' 'S loaded is not a green light. W, HP, and ally position are the green light; R is the reward.' 'Fog is second-fight bait. Take wave, plate, objective, or reset unless vision and ally position are already true.'",
    "Allowed ranks: Iron IV, Iron III, Iron II, Iron I, Bronze IV."
  ].join(" ");
  const user = [
    `Title: ${cleanText(note.title || "Samira note", 180)}`,
    `Game facts: ${gameMeta.line || "not parsed"}`,
    `Fallback rank read: ${rankRead.exactRank || "unrated"}; reason: ${rankRead.reason || ""}`,
    `Current corpus rank: ${overallRank.exactRank || "unrated"}`,
    "Saved note:",
    body
  ].join("\n");
  const messages = [
    { role: "system", content: system },
    { role: "user", content: user }
  ];
  let parsed = await openAiJson(messages, 340);
  let description = sentenceBoundedText(stripAssistantScaffold(parsed?.description, 700));
  if (description && samiraAiDescriptionRejected(description)) {
    parsed = await openAiJson([
      ...messages,
      { role: "assistant", content: JSON.stringify(parsed || {}) },
      {
        role: "user",
        content: [
          "Rewrite the description only. The previous output was rejected because it sounded generic, polite, inverted, or assistant-shaped.",
          "Use 2 to 4 short direct sentences. Name the note-specific stat, game type, champion context, or decision pattern.",
          "No prioritize/focus/avoid/strategy/performance/potential/controlled/stable/overextending/adopt/must be/playstyle/approach/engage/main failure/main mistake/stabilizing/opportunity/ranked-level/decision depth language.",
          "Return JSON with keys: description, rank, rank_reason."
        ].join(" ")
      }
    ], 300);
    description = sentenceBoundedText(stripAssistantScaffold(parsed?.description, 700));
  }
  if (samiraAiDescriptionRejected(description)) return null;
  const exactRank = normalizeAiRank(parsed?.rank, rankRead.exactRank || overallRank.exactRank || "Iron III");
  const value = samiraRankValueFromText(exactRank) ?? samiraRankValueFromText(rankRead.exactRank) ?? 1;
  return {
    engine: "openai",
    model: samiraAnalysisModel,
    prompt_version: samiraAnalysisPromptVersion,
    body_hash: hashText(`${note.title || ""}\n${note.body || ""}`),
    description,
    rank_read: {
      ...rankRead,
      exactRank,
      range: `${samiraRankNameForValue(value - 1)} to ${samiraRankNameForValue(value + 1)}`,
      reason: naturalRankReason(parsed?.rank_reason, rankRead.reason),
      basis: "AI analysis of June 30 onward Samira note; not Riot MMR",
      confidence: rankRead.confidence || "medium"
    }
  };
}

function corpusCacheKey(notes = []) {
  return hashText(notes.map((note) => `${note.id || ""}:${note.created_at || ""}:${hashText(note.body || "").slice(0, 16)}`).join("|"));
}

async function analyzeSamiraCorpusWithAi(notes = [], rankEstimate = {}) {
  const currentNotes = notes.slice(0, 8).map((note, index) => {
    const meta = samiraNoteGameMeta(note).line;
    return `${index + 1}. ${cleanText(note.title || "Samira note", 120)}${meta ? ` / ${meta}` : ""}\n${cleanParagraphText(note.body || "", 900)}`;
  }).join("\n\n");
  const parsed = await openAiJson([
    {
      role: "system",
      content: [
        "You analyze Alan's current saved Samira notes as one corpus.",
        "Return JSON only with key main_takeaway.",
        "The takeaway must be one complete direct sentence or two very short complete sentences, 8 to 18 words total, no label, no colon-prefix, no generic motivation.",
        "Use the recurring gameplay model across the notes, not a copied title.",
        "Do not write generic phrases about performance, strategic play, strategy, win chances, potential, success, or improvement.",
        "Do not write Alan must adopt, must be, playstyle, approach, engage, prioritize, focus on, avoid, opportunity, ranked-level, or decision depth.",
        "Sound natural, like a short thought Alan would actually remember.",
        "Write the sentence as a direct Samira rule Alan can use before queueing. Start with Stop, Take, Leave, Wait, Hold, or Name when possible."
      ].join(" ")
    },
    {
      role: "user",
      content: `Current rank read: ${rankEstimate.exactRank || "unrated"}\nCurrent June 30 onward notes:\n${currentNotes}`
    }
  ], 120);
  const mainTakeaway = sentenceBoundedText(stripAssistantScaffold(parsed?.main_takeaway, 150), 150, 20);
  return mainTakeaway && mainTakeaway.length >= 20 && !samiraAiCopyRejected(mainTakeaway) ? mainTakeaway : "";
}

async function samiraAiAnalysesForNotes(notes = [], rankEstimate = {}) {
  const cache = await loadSamiraAnalysisCache();
  const notesById = {};
  let changed = false;
  for (const note of notes) {
    const key = samiraNoteCacheKey(note);
    const bodyHash = hashText(`${note.title || ""}\n${note.body || ""}`);
    const fallbackRank = samiraNoteRankRead(note, rankEstimate);
    const cached = cache.noteAnalyses[key];
    if (cached?.body_hash === bodyHash && cached?.prompt_version === samiraAnalysisPromptVersion && cached?.description && (!samiraAiReady() || cached.engine === "openai")) {
      notesById[key] = cached;
      continue;
    }
    let analysis = null;
    try {
      analysis = await analyzeSamiraNoteWithAi(note, fallbackRank, rankEstimate);
    } catch {
      analysis = null;
    }
    if (!analysis) analysis = fallbackSamiraAnalysis(note, fallbackRank, rankEstimate);
    cache.noteAnalyses[key] = analysis;
    notesById[key] = analysis;
    changed = true;
  }
  const corpusKey = corpusCacheKey(notes);
  let mainTakeaway = cache.corpusAnalyses[corpusKey]?.prompt_version === samiraAnalysisPromptVersion ? cache.corpusAnalyses[corpusKey]?.main_takeaway || "" : "";
  if (!mainTakeaway) {
    try {
      mainTakeaway = await analyzeSamiraCorpusWithAi(notes, rankEstimate);
    } catch {
      mainTakeaway = "";
    }
    if (mainTakeaway) {
      cache.corpusAnalyses[corpusKey] = {
        engine: "openai",
        model: samiraAnalysisModel,
        prompt_version: samiraAnalysisPromptVersion,
        main_takeaway: mainTakeaway,
        created_at: new Date().toISOString()
      };
      changed = true;
    }
  }
  if (changed) await saveSamiraAnalysisCache(cache);
  return {
    engine: Object.values(notesById).some((item) => item?.engine === "openai") || mainTakeaway ? "openai" : "fallback",
    main_takeaway: mainTakeaway,
    notesById
  };
}

function samiraRankEstimateFromAnalyses(rankEstimate = {}, visibleNotes = [], analysesById = {}) {
  const newestAnalysis = visibleNotes
    .map((note) => analysesById[samiraNoteCacheKey(note)]?.rank_read)
    .find((rankRead) => rankRead?.exactRank);
  if (!newestAnalysis) return rankEstimate;
  return {
    ...rankEstimate,
    exactRank: newestAnalysis.exactRank,
    range: newestAnalysis.range || rankEstimate.range,
    currentRead: newestAnalysis.exactRank,
    confidence: newestAnalysis.confidence || rankEstimate.confidence,
    basis: newestAnalysis.basis || "AI analysis of June 30 onward Samira notes; not Riot MMR",
    reason: newestAnalysis.reason || rankEstimate.reason
  };
}

function localDateKey(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${byType.year}-${byType.month}-${byType.day}`;
}

function samiraNoteDedupeKey(note = {}) {
  return cleanParagraphText(note.body || note.title || "", 2000)
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function visibleSamiraNotes(notes = [], now = new Date()) {
  const seen = new Set();
  return notes
    .filter((note) => note.source === "samira-intake")
    .filter(samiraNoteInCurrentWindow)
    .filter((note) => {
      const key = samiraNoteDedupeKey(note);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 80);
}

async function samiraState(extraNotes = []) {
  const notes = [...extraNotes, ...(await loadNotes())]
    .filter(isSamiraNote)
    .filter(samiraNoteInCurrentWindow)
    .sort((a, b) => (Date.parse(b.created_at || "") || 0) - (Date.parse(a.created_at || "") || 0));
  const review = await loadRecordingReview();
  const newestNote = notes[0] || null;
  const fallbackRankEstimate = samiraRankEstimate(notes, review);
  const visibleNotes = visibleSamiraNotes(notes);
  const analysis = await samiraAiAnalysesForNotes(visibleNotes, fallbackRankEstimate);
  const rankEstimate = samiraRankEstimateFromAnalyses(fallbackRankEstimate, visibleNotes, analysis.notesById);
  return {
    ok: true,
    note_count: notes.length,
    visible_note_count: visibleNotes.length,
    archived_note_count: Math.max(0, notes.length - visibleNotes.length),
    analysis_engine: analysis.engine,
    main_takeaway: analysis.main_takeaway || samiraCorpusMainTakeaway(notes, review, rankEstimate),
    latest_note: newestNote
      ? {
          title: newestNote.title || "Samira note",
          created_at: newestNote.created_at || "",
          preview: sentenceStart(newestNote.body, 180)
        }
      : null,
    rank_estimate: rankEstimate,
    rank_trend: samiraRankTrend(visibleNotes, review, rankEstimate, analysis.notesById),
    tips: samiraTips(notes, review),
    source_boundary: "Approximate rank read from June 30 onward Samira notes and current-window reviews, not Riot MMR.",
    notes: visibleNotes.map((note) => publicSamiraNote(note, rankEstimate, analysis.notesById[samiraNoteCacheKey(note)]))
  };
}

function pdfText(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[^\x09\x0a\x0d\x20-\x7e]/g, " ")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function wrapPdfText(value, maxChars = 84) {
  const lines = [];
  for (const rawLine of String(value || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n")) {
    const words = rawLine.trim().split(/\s+/).filter(Boolean);
    if (!words.length) {
      lines.push("");
      continue;
    }
    let current = "";
    for (const word of words) {
      const next = current ? `${current} ${word}` : word;
      if (next.length > maxChars && current) {
        lines.push(current);
        current = word;
      } else {
        current = next;
      }
    }
    if (current) lines.push(current);
  }
  return lines;
}

function samiraNotePdfLines(note = {}, rankRead = {}, description = "") {
  const body = cleanParagraphText(note.body || "", 140000);
  const gameMeta = samiraNoteGameMeta(note);
  const lines = [
    { text: cleanText(note.title || "Samira note", 90), font: "F2", size: 16, leading: 22 },
    { text: `approx rank: ${rankRead.exactRank || "unrated"}`, font: "F2", size: 12, leading: 17 },
    ...(gameMeta.line ? [{ text: gameMeta.line, font: "F1", size: 10, leading: 15 }] : []),
    { text: rankRead.basis || "saved note language; not Riot MMR", font: "F1", size: 9, leading: 14 },
    { text: `created: ${cleanText(note.created_at || "", 48)}`, font: "F1", size: 9, leading: 18 },
    ...(description ? wrapPdfText(description, 88).map((line) => ({ text: line, font: "F2", size: 10, leading: line ? 14 : 10 })) : []),
    { text: "note", font: "F2", size: 11, leading: 16 }
  ];
  for (const line of wrapPdfText(body, 88)) {
    lines.push({ text: line, font: "F1", size: 10, leading: line ? 13 : 10 });
  }
  return lines;
}

function paginatePdfLines(lines) {
  const pages = [];
  let page = [];
  let y = 736;
  for (const line of lines) {
    const leading = line.leading || 13;
    if (page.length && y - leading < 58) {
      pages.push(page);
      page = [];
      y = 736;
    }
    page.push(line);
    y -= leading;
  }
  if (page.length) pages.push(page);
  return pages;
}

function pdfContentStream(lines, pageIndex, pageCount) {
  let y = 736;
  const commands = [];
  for (const line of lines) {
    const font = line.font || "F1";
    const size = line.size || 10;
    commands.push(`BT /${font} ${size} Tf 54 ${y} Td (${pdfText(line.text)}) Tj ET`);
    y -= line.leading || 13;
  }
  commands.push(`BT /F1 8 Tf 54 34 Td (${pdfText(`league.aolabs.io / Samira note PDF / ${pageIndex + 1} of ${pageCount}`)}) Tj ET`);
  return commands.join("\n");
}

function serializePdf(objects) {
  const chunks = [];
  const offsets = [0];
  let offset = 0;
  const push = (value) => {
    const buffer = Buffer.from(value, "binary");
    chunks.push(buffer);
    offset += buffer.length;
  };
  push("%PDF-1.4\n%\xff\xff\xff\xff\n");
  for (let index = 1; index < objects.length; index += 1) {
    offsets[index] = offset;
    push(`${index} 0 obj\n${objects[index]}\nendobj\n`);
  }
  const xrefOffset = offset;
  push(`xref\n0 ${objects.length}\n0000000000 65535 f \n`);
  for (let index = 1; index < objects.length; index += 1) {
    push(`${String(offsets[index]).padStart(10, "0")} 00000 n \n`);
  }
  push(`trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`);
  return Buffer.concat(chunks);
}

function buildSamiraNotePdf(note = {}, rankRead = {}, description = "") {
  const pages = paginatePdfLines(samiraNotePdfLines(note, rankRead, description));
  const objects = [];
  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
  objects[4] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>";
  const kids = [];
  let nextObject = 5;
  pages.forEach((pageLines, pageIndex) => {
    const pageObject = nextObject;
    const contentObject = nextObject + 1;
    nextObject += 2;
    kids.push(`${pageObject} 0 R`);
    const stream = pdfContentStream(pageLines, pageIndex, pages.length);
    objects[pageObject] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObject} 0 R >>`;
    objects[contentObject] = `<< /Length ${Buffer.byteLength(stream, "binary")} >>\nstream\n${stream}\nendstream`;
  });
  objects[2] = `<< /Type /Pages /Count ${pages.length} /Kids [${kids.join(" ")}] >>`;
  return serializePdf(objects);
}

function pdfFilenameForNote(note = {}) {
  const slug = cleanText(note.title || note.id || "samira-note", 70)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "samira-note";
  return `${slug}.pdf`;
}

function cleanStatus(value) {
  const status = cleanText(value, 32).toLowerCase();
  return /^(watching|waiting|recording|paused|processing|publishing|published|blocked|error|unknown)$/.test(status)
    ? status
    : "unknown";
}

function cleanProgress(value) {
  const progress = Number(value);
  if (!Number.isFinite(progress)) return null;
  return Math.max(0, Math.min(100, Math.round(progress)));
}

function cleanEtaSeconds(value) {
  if (value === null || value === undefined || value === "") return null;
  const seconds = Number(value);
  if (!Number.isFinite(seconds)) return null;
  return Math.max(0, Math.min(60 * 60, Math.round(seconds)));
}

function cleanQueueItem(item, index) {
  return {
    label: cleanText(item?.label, 80) || `review ${index + 1}`,
    status: cleanText(item?.status, 32),
    stage: cleanText(item?.stage, 40),
    stageLabel: cleanText(item?.stageLabel, 100),
    startedAt: cleanText(item?.startedAt, 40),
    endedAt: cleanText(item?.endedAt, 40),
    queuedAt: cleanText(item?.queuedAt, 40),
    estimatedGameEndAt: cleanText(item?.estimatedGameEndAt, 40),
    estimatedStartAt: cleanText(item?.estimatedStartAt, 40),
    estimatedReadyAt: cleanText(item?.estimatedReadyAt, 40),
    gameEtaSeconds: cleanEtaSeconds(item?.gameEtaSeconds),
    startEtaSeconds: cleanEtaSeconds(item?.startEtaSeconds),
    etaSeconds: cleanEtaSeconds(item?.etaSeconds),
    stageEtaSeconds: cleanEtaSeconds(item?.stageEtaSeconds),
    etaBasis: cleanText(item?.etaBasis, 180),
    progress: cleanProgress(item?.progress)
  };
}

function cleanRecorderPid(value) {
  const pid = Number(value);
  if (!Number.isFinite(pid) || pid <= 0) return "";
  return String(Math.round(pid)).slice(0, 20);
}

function publicQueueFields(raw = {}) {
  const rawItems = Array.isArray(raw.queueItems) ? raw.queueItems : [];
  const rawCount = Number(raw.queueCount);
  const queueCount = Number.isFinite(rawCount)
    ? Math.max(0, Math.min(99, Math.round(rawCount)))
    : rawItems.length;
  const visibleItems = rawItems
    .slice(0, Math.max(0, Math.min(5, queueCount || rawItems.length)))
    .map(cleanQueueItem);
  return { queueCount, queueItems: visibleItems };
}

function publicRecordingStatus(raw) {
  const updatedMs = Date.parse(raw.updatedAt || raw.serverReceivedAt || "");
  const estimatedReadyMs = Date.parse(raw.estimatedReadyAt || "");
  const ageSeconds = Number.isFinite(updatedMs) ? Math.max(0, Math.round((Date.now() - updatedMs) / 1000)) : null;
  const etaSeconds = Number.isFinite(estimatedReadyMs)
    ? Math.max(0, Math.round((estimatedReadyMs - Date.now()) / 1000))
    : cleanEtaSeconds(raw.etaSeconds);
  const queue = publicQueueFields(raw);
  return {
    status: cleanStatus(raw.status),
    label: cleanText(raw.label, 80) || "recorder status",
    detail: cleanText(raw.detail, 180),
    mode: cleanText(raw.mode, 40),
    matchId: cleanText(raw.matchId, 40),
    startedAt: cleanText(raw.startedAt, 40),
    updatedAt: cleanText(raw.updatedAt || raw.serverReceivedAt, 40),
    progress: cleanProgress(raw.progress),
    etaSeconds,
    estimatedReadyAt: cleanText(raw.estimatedReadyAt, 40),
    etaBasis: cleanText(raw.etaBasis, 100),
    queueCount: queue.queueCount,
    queueItems: queue.queueItems,
    ageSeconds,
    stale: ageSeconds === null || ageSeconds > 180
  };
}

function recordingMediaRedirect(pathname) {
  const match = pathname.match(/^\/recordings\/[^/]+\.(webm|mp4)$/i);
  if (!match) return "";
  const base = recordingMediaBase || (match[1].toLowerCase() === "webm" ? recordingWebmMediaBase : recordingMp4MediaBase);
  return `${base}/${encodeURIComponent(path.basename(pathname))}`;
}

function parseRangeHeader(rangeHeader, size) {
  const match = String(rangeHeader || "").match(/^bytes=(\d*)-(\d*)$/);
  if (!match) return null;
  let start = match[1] === "" ? null : Number(match[1]);
  let end = match[2] === "" ? null : Number(match[2]);
  if (start === null && end === null) return null;
  if (start === null) {
    const suffixLength = Math.min(Number(end), size);
    start = size - suffixLength;
    end = size - 1;
  } else {
    end = end === null ? size - 1 : end;
  }
  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end < start || start >= size) {
    return null;
  }
  return { start, end: Math.min(end, size - 1) };
}

function sendStaticFile(req, res, filePath, stat) {
  const type = types[path.extname(filePath)] || "application/octet-stream";
  const baseHeaders = {
    "Content-Type": type,
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=300"
  };
  const range = parseRangeHeader(req.headers.range, stat.size);
  if (req.headers.range && !range) {
    res.writeHead(416, {
      ...baseHeaders,
      "Content-Range": `bytes */${stat.size}`
    });
    res.end();
    return;
  }
  if (range) {
    res.writeHead(206, {
      ...baseHeaders,
      "Content-Length": range.end - range.start + 1,
      "Content-Range": `bytes ${range.start}-${range.end}/${stat.size}`
    });
    if (req.method === "HEAD") {
      res.end();
      return;
    }
    fs.createReadStream(filePath, range).pipe(res);
    return;
  }
  res.writeHead(200, {
    ...baseHeaders,
    "Content-Length": stat.size
  });
  if (req.method === "HEAD") {
    res.end();
    return;
  }
  fs.createReadStream(filePath).pipe(res);
}

async function handleApi(req, res, url) {
  if (url.pathname === "/api/health" && req.method === "GET") {
    sendJson(res, 200, {
      ok: true,
      app: "league",
      storage: "file",
      persistent_storage_ready: Boolean(process.env.LEAGUE_DATA_DIR || process.env.RAILWAY_VOLUME_MOUNT_PATH),
      ai_ready: Boolean(process.env.OPENAI_API_KEY),
      samira_api_ready: true,
      write_token_configured: Boolean(writeToken)
    });
    return true;
  }

  if (url.pathname === "/api/samira" && req.method === "GET") {
    sendJson(res, 200, await samiraState());
    return true;
  }

  const samiraPdfMatch = url.pathname.match(/^\/api\/samira\/notes\/([^/]+)\.pdf$/);
  if (samiraPdfMatch && req.method === "GET") {
    const id = decodeURIComponent(samiraPdfMatch[1] || "");
    const notes = (await loadNotes()).filter(isSamiraNote);
    const note = notes.find((item) => item.id === id);
    if (!note) {
      sendJson(res, 404, { error: "Samira note PDF not found" });
      return true;
    }
    const review = await loadRecordingReview();
    const rankEstimate = samiraRankEstimate(notes, review);
    const rankRead = samiraNoteRankRead(note, rankEstimate);
    const analysis = await samiraAiAnalysesForNotes([note], rankEstimate);
    const noteAnalysis = analysis.notesById[samiraNoteCacheKey(note)];
    const pdfRankRead = noteAnalysis?.rank_read || rankRead;
    const pdf = buildSamiraNotePdf(note, pdfRankRead, noteAnalysis?.description || "");
    res.writeHead(200, {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${pdfFilenameForNote(note)}"`,
      "Cache-Control": "no-store"
    });
    res.end(pdf);
    return true;
  }

  if (url.pathname === "/api/logs" && req.method === "GET") {
    const notes = await loadNotes();
    sendJson(res, 200, { notes });
    return true;
  }

  if (url.pathname === "/api/logs" && req.method === "POST") {
    if (isRailway && !writeToken) {
      sendJson(res, 503, { error: "Write token is not configured" });
      return true;
    }
    const headerToken = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "") || String(req.headers["x-league-write-token"] || "");
    if (writeToken && headerToken !== writeToken) {
      sendJson(res, 401, { error: "Unauthorized" });
      return true;
    }
    const payload = await readJsonBody(req, 140000);
    const title = cleanText(payload.title, 80);
    const body = cleanParagraphText(payload.body, 120000);
    if (!title || !body) {
      sendJson(res, 400, { error: "title and body are required" });
      return true;
    }
    const note = {
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      created_at: new Date().toISOString(),
      title,
      body
    };
    const notes = [note, ...(await loadNotes())].slice(0, 200);
    await saveNotes(notes);
    sendJson(res, 201, { note });
    return true;
  }

  if (url.pathname === "/api/samira/notes" && req.method === "POST") {
    const payload = await readJsonBody(req, 160000);
    const body = cleanParagraphText(payload.body, 140000);
    const title = cleanText(payload.title, 80) || cleanText(body.split("\n")[0], 80) || "Samira note";
    if (!body) {
      sendJson(res, 400, { error: "body is required" });
      return true;
    }
    const note = {
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      created_at: new Date().toISOString(),
      title,
      body,
      source: "samira-intake"
    };
    const notes = [note, ...(await loadNotes())].slice(0, 200);
    await saveNotes(notes);
    sendJson(res, 201, { note, samira: await samiraState() });
    return true;
  }

  const samiraNoteDeleteMatch = url.pathname.match(/^\/api\/samira\/notes\/([^/]+)$/);
  if (samiraNoteDeleteMatch && req.method === "DELETE") {
    const id = decodeURIComponent(samiraNoteDeleteMatch[1] || "");
    const notes = await loadNotes();
    const nextNotes = notes.filter((note) => note.id !== id);
    if (nextNotes.length === notes.length) {
      sendJson(res, 404, { error: "Samira note not found" });
      return true;
    }
    await saveNotes(nextNotes);
    sendJson(res, 200, { ok: true, deleted_id: id, samira: await samiraState() });
    return true;
  }

  if (url.pathname === "/api/recording-status" && req.method === "GET") {
    sendJson(res, 200, publicRecordingStatus(await loadRecordingStatus()));
    return true;
  }

  if (url.pathname === "/api/recording-status" && req.method === "POST") {
    if (isRailway && !statusToken) {
      sendJson(res, 503, { error: "Recording status token is not configured" });
      return true;
    }
    const headerToken = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "") || String(req.headers["x-league-status-token"] || "");
    if (statusToken && headerToken !== statusToken) {
      sendJson(res, 401, { error: "Unauthorized" });
      return true;
    }
    const payload = await readJsonBody(req);
    const queue = publicQueueFields(payload);
    const recorderPid = cleanRecorderPid(payload.recorderPid);
    if (!recorderPid && queue.queueCount > 0) {
      sendJson(res, 409, { error: "stale recorder status rejected" });
      return true;
    }
    const status = {
      status: cleanStatus(payload.status),
      label: cleanText(payload.label, 80),
      detail: cleanText(payload.detail, 180),
      mode: cleanText(payload.mode, 40),
      recorderPid,
      matchId: cleanText(payload.matchId, 40),
      startedAt: cleanText(payload.startedAt, 40),
      progress: cleanProgress(payload.progress),
      etaSeconds: cleanEtaSeconds(payload.etaSeconds),
      estimatedReadyAt: cleanText(payload.estimatedReadyAt, 40),
      etaBasis: cleanText(payload.etaBasis, 100),
      queueCount: queue.queueCount,
      queueItems: queue.queueItems,
      updatedAt: cleanText(payload.updatedAt, 40) || new Date().toISOString(),
      serverReceivedAt: new Date().toISOString()
    };
    await saveRecordingStatus(status);
    sendJson(res, 200, { ok: true, status: publicRecordingStatus(status) });
    return true;
  }

  if (url.pathname.startsWith("/api/")) {
    sendJson(res, 404, { error: "Not found" });
    return true;
  }

  return false;
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  try {
    if (await handleApi(req, res, url)) return;
  } catch (err) {
    sendJson(res, err.message === "Request body too large" ? 413 : 500, { error: err.message || "Server error" });
    return;
  }
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === "/") pathname = "/index.html";
  const filePath = path.normalize(path.join(root, pathname));
  if (!filePath.startsWith(root)) {
    send(res, 403, "Forbidden");
    return;
  }
  fs.stat(filePath, (err, stat) => {
    if (err) {
      const redirect = recordingMediaRedirect(pathname);
      if (redirect) {
        res.writeHead(302, {
          Location: redirect,
          "Cache-Control": "public, max-age=300"
        });
        res.end();
        return;
      }
      send(res, 404, "Not found");
      return;
    }
    if (!stat.isFile()) {
      send(res, 404, "Not found");
      return;
    }
    sendStaticFile(req, res, filePath, stat);
  });
}).listen(port, () => {
  console.log(`league.aolabs.io local server listening on http://localhost:${port}`);
});
