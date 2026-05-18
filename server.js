const http = require("http");
const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");

const root = path.join(__dirname, "public");
const port = Number(process.env.PORT || 3000);
const dataRoot = process.env.LEAGUE_DATA_DIR || process.env.RAILWAY_VOLUME_MOUNT_PATH || path.join(__dirname, "data");
const notesPath = path.join(dataRoot, "public-notes.json");
const writeToken = (process.env.LEAGUE_WRITE_TOKEN || "").trim();
const isRailway = Boolean(process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_SERVICE_ID);

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
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

async function readJsonBody(req) {
  const chunks = [];
  let length = 0;
  for await (const chunk of req) {
    length += chunk.length;
    if (length > 12000) throw new Error("Request body too large");
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

function cleanText(value, maxLength) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

async function handleApi(req, res, url) {
  if (url.pathname === "/api/health" && req.method === "GET") {
    sendJson(res, 200, {
      ok: true,
      app: "league",
      storage: "file",
      persistent_storage_ready: Boolean(process.env.LEAGUE_DATA_DIR || process.env.RAILWAY_VOLUME_MOUNT_PATH),
      ai_ready: Boolean(process.env.OPENAI_API_KEY)
    });
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
    const payload = await readJsonBody(req);
    const title = cleanText(payload.title, 80);
    const body = cleanText(payload.body, 700);
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
  fs.readFile(filePath, (err, data) => {
    if (err) {
      send(res, 404, "Not found");
      return;
    }
    res.writeHead(200, { "Content-Type": types[path.extname(filePath)] || "application/octet-stream" });
    res.end(data);
  });
}).listen(port, () => {
  console.log(`league.aolabs.io local server listening on http://localhost:${port}`);
});
