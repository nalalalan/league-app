const http = require("http");
const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");

const root = path.join(__dirname, "public");
const port = Number(process.env.PORT || 3000);
const dataRoot = process.env.LEAGUE_DATA_DIR || process.env.RAILWAY_VOLUME_MOUNT_PATH || path.join(__dirname, "data");
const notesPath = path.join(dataRoot, "public-notes.json");
const recordingsPath = path.join(root, "recordings", "recordings.json");
const writeToken = (process.env.LEAGUE_WRITE_TOKEN || "").trim();
const isRailway = Boolean(process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_SERVICE_ID);
const recordingMediaBase = (process.env.LEAGUE_RECORDING_MEDIA_BASE || "").replace(/\/+$/, "");
const recordingWebmMediaBase = (process.env.LEAGUE_RECORDING_WEBM_MEDIA_BASE || "https://cdn.jsdelivr.net/gh/nalalalan/league-app@main/public/recordings").replace(/\/+$/, "");
const recordingMp4MediaBase = (process.env.LEAGUE_RECORDING_MP4_MEDIA_BASE || "https://raw.githubusercontent.com/nalalalan/league-app/main/public/recordings").replace(/\/+$/, "");
const statusToken = (process.env.LEAGUE_STATUS_TOKEN || process.env.LEAGUE_WRITE_TOKEN || "").trim();
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
    body: "User-supplied follow-up: 10/1/8, 21,209 damage, 16,272 gold, 871 gold/min, A+ in a win. The lesson is not cockiness; it is that the boring rules are what made the good game happen."
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
    .sort((a, b) => samiraRecordingTime(b) - samiraRecordingTime(a));
}

function parseRankPhrase(text, label) {
  const match = String(text || "").match(new RegExp(`${label}\\s+([^;,.]+)`, "i"));
  return match ? cleanText(match[1], 48) : "";
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
  const focus = review.mainFeedback?.focus || "";
  const newestRead = parseRankPhrase(focus, "newest full-game read");
  const currentRead = parseRankPhrase(focus, "current 3-game read");
  const archiveRead = parseRankPhrase(focus, "archive median");
  const recordings = samiraRecordings(review);
  const newest = recordings[0] || null;
  const newestRank = newest ? samiraRecordingRank(newest) : null;
  const exactRank = newestRead || newestRank?.rank || currentRead || archiveRead || "unrated";
  const range = currentRead && currentRead !== exactRank ? `${exactRank} to ${currentRead}` : exactRank;
  const newestLine = newest
    ? `${cleanText(newest.title || "newest Samira recording", 80)}${newestRank?.rank ? `, ${newestRank.rank}` : ""}`
    : "";
  return {
    exactRank,
    range,
    currentRead,
    archiveRead,
    confidence: currentRead ? "medium-high" : "medium",
    basis: cleanText(`recordings.json full-game reviews plus ${notes.length} Samira notes; not Riot MMR`, 160),
    reason: cleanText(review.mainFeedback?.rule || newestRank?.reason || "No full-game Samira rank reason is available yet.", 260),
    newestRecording: newestLine
  };
}

function samiraTips(notes, review = {}) {
  const noteText = notes.map((note) => `${note.title || ""} ${note.body || ""}`).join(" ").toLowerCase();
  const tips = [
    "Before E, call W ready / HP above half / ally close.",
    "Red light means Q/auto while backing up.",
    "S loaded means R is available, not required.",
    "After a kill, take wave, plate, objective, or reset."
  ];
  if (noteText.includes("fog") || noteText.includes("bush") || String(review.mainFeedback?.rule || "").includes("forward click")) {
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
    ? "Red-light commits, chase pressure, or exit leaks dominate."
    : greenLight + conversion > 0
      ? "Green-light checks, exits, or value conversion show up."
      : "Limited ranked-habit evidence beyond baseline.";
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

function publicSamiraNote(note = {}, overallRank = {}) {
  const id = cleanText(note.id, 120);
  const rankRead = samiraNoteRankRead(note, overallRank);
  return {
    id,
    title: cleanText(note.title || "Samira note", 90),
    main_takeaway: samiraNoteMainTakeaway(note),
    play_takeaway: samiraNotePlayTakeaway(note, rankRead, overallRank),
    description: samiraNoteDescription(note, rankRead, overallRank),
    previous_game_improvement: samiraPreviousGameImprovement(note, rankRead, overallRank),
    created_at: note.created_at || "",
    source: cleanText(note.source || "", 40),
    body: cleanParagraphText(note.body || "", 140000),
    preview: sentenceStart(note.body, 260),
    pdf_url: id ? `/api/samira/notes/${encodeURIComponent(id)}.pdf` : "",
    rank_read: rankRead
  };
}

function samiraNoteMainTakeaway(note = {}) {
  const text = cleanParagraphText(note.body || note.title || "", 140000);
  const lower = text.toLowerCase();
  if (lower.includes("controlled violence plus clean exits")) {
    return lower.includes("simple roles plus calm commands")
      ? "Controlled violence plus clean exits; simple roles plus calm commands."
      : "Controlled violence plus clean exits.";
  }
  const lockIn = text.match(/Alan locks in by making the game smaller:\s*([^.!?]+[.!?]?)/i);
  if (lockIn?.[1]) return cleanText(`Make the game smaller: ${lockIn[1]}`, 120);
  const problem = text.match(/problem is this:\s*([^.!?]+[.!?]?)/i);
  if (problem?.[1]) return cleanText(problem[1], 120);
  return sentenceStart(text || note.title || "Samira note", 120);
}

function samiraNotePlayTakeaway(note = {}, rankRead = {}, overallRank = {}) {
  const text = samiraNoteAnalysisText(note);
  if (text.includes("live there") || text.includes("step out") || text.includes("exit") || text.includes("leaves the middle")) {
    return "E collects. It does not let you live in the middle. Kill, step out, buy.";
  }
  if (text.includes("w ready") || text.includes("hp above half") || text.includes("ally close") || text.includes("green light")) {
    return "Before E, prove W, HP, and ally. If one is missing, Q/auto out.";
  }
  if (text.includes("gold") || text.includes("recall") || text.includes("buy")) {
    return "A rich Samira with unspent gold is not ahead. Kill, wave, buy.";
  }
  if (text.includes("quiet fight") || text.includes("short call") || text.includes("lily")) {
    return "Use short duo calls. Do not coach while fighting.";
  }
  return cleanText(overallRank.reason || rankRead.reason || "Stop making every fight bigger than the first useful win.", 150);
}

function samiraPreviousGameImprovement(note = {}, rankRead = {}, overallRank = {}) {
  const text = samiraNoteAnalysisText(note);
  const signals = rankRead.signals || {};
  const pieces = [];
  if (String(overallRank.reason || "").toLowerCase().includes("red-light")) {
    pieces.push("Previous game punished red-light E and forward click.");
  } else if (overallRank.newestRecording) {
    pieces.push(`Previous game read: ${overallRank.newestRecording}.`);
  }
  const improvement = [];
  if (signals.conversion >= 4 || /exit|reset|recall|buy|wave|objective|step out/.test(text)) {
    improvement.push("you finally name exits, resets, spending, and value cash-out");
  }
  if (/quiet fight|short call|behind me|peel me|bubble diver|calm commands/.test(text)) {
    improvement.push("you reduce duo chaos into short commands");
  }
  if (/w ready|hp above half|ally close|green light/.test(text)) {
    improvement.push("you mention the green-light check");
  }
  if (!improvement.length) improvement.push("the note is long but still thin on a repeatable Samira habit");
  pieces.push(`Improvement: ${improvement.join("; ")}.`);
  if ((signals.leak || 0) >= (signals.greenLight || 0) + 5) {
    pieces.push("Still too much leak language. Make the next note prove the check, not the panic.");
  }
  return cleanText(pieces.join(" "), 300);
}

function samiraNoteDescription(note = {}, rankRead = {}, overallRank = {}) {
  const signals = rankRead.signals || {};
  const leak = Number(signals.leak || 0);
  const conversion = Number(signals.conversion || 0);
  const greenLight = Number(signals.greenLight || 0);
  const parts = [
    `${rankRead.exactRank || "Unrated"} because the note still says you can make damage, then turn the next five seconds into a problem.`,
  ];
  if (conversion || leak || greenLight) {
    const checkWord = greenLight === 1 ? "check" : "checks";
    parts.push(`${conversion} value-conversion signals, ${leak} leak signals, ${greenLight} green-light ${checkWord}.`);
  }
  parts.push(samiraPreviousGameImprovement(note, rankRead, overallRank));
  parts.push("Blunt read: you are not losing because Samira lacks damage. You are losing because you stay after the payout.");
  return cleanText(parts.join(" "), 700);
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
  const todayKey = localDateKey(now);
  const seen = new Set();
  return notes
    .filter((note) => localDateKey(note.created_at) === todayKey)
    .filter((note) => {
      const key = samiraNoteDedupeKey(note);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 1);
}

async function samiraState(extraNotes = []) {
  const notes = [...extraNotes, ...(await loadNotes())]
    .filter(isSamiraNote)
    .sort((a, b) => (Date.parse(b.created_at || "") || 0) - (Date.parse(a.created_at || "") || 0));
  const review = await loadRecordingReview();
  const newestNote = notes[0] || null;
  const rankEstimate = samiraRankEstimate(notes, review);
  const visibleNotes = visibleSamiraNotes(notes);
  return {
    ok: true,
    note_count: notes.length,
    visible_note_count: visibleNotes.length,
    archived_note_count: Math.max(0, notes.length - visibleNotes.length),
    latest_note: newestNote
      ? {
          title: newestNote.title || "Samira note",
          created_at: newestNote.created_at || "",
          preview: sentenceStart(newestNote.body, 180)
        }
      : null,
    rank_estimate: rankEstimate,
    tips: samiraTips(notes, review),
    source_boundary: "Approximate rank read from saved notes and recording reviews, not Riot MMR.",
    notes: visibleNotes.map((note) => publicSamiraNote(note, rankEstimate))
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

function samiraNotePdfLines(note = {}, rankRead = {}) {
  const body = cleanParagraphText(note.body || "", 140000);
  const lines = [
    { text: cleanText(note.title || "Samira note", 90), font: "F2", size: 16, leading: 22 },
    { text: `approx rank: ${rankRead.exactRank || "unrated"}`, font: "F2", size: 12, leading: 17 },
    { text: rankRead.basis || "saved note language; not Riot MMR", font: "F1", size: 9, leading: 14 },
    { text: `created: ${cleanText(note.created_at || "", 48)}`, font: "F1", size: 9, leading: 20 },
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

function buildSamiraNotePdf(note = {}, rankRead = {}) {
  const pages = paginatePdfLines(samiraNotePdfLines(note, rankRead));
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
    const pdf = buildSamiraNotePdf(note, rankRead);
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
    if (isRailway && !writeToken) {
      sendJson(res, 503, { error: "Write token is not configured" });
      return true;
    }
    const headerToken = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "") || String(req.headers["x-league-write-token"] || "");
    if (writeToken && headerToken !== writeToken) {
      sendJson(res, 401, { error: "Unauthorized" });
      return true;
    }
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
