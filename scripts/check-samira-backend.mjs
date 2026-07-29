import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";

const port = String(4700 + Math.floor(Math.random() * 300));
const dataDir = await mkdtemp(join(tmpdir(), "league-samira-backend-"));
const server = spawn(process.execPath, ["server.js"], {
  cwd: new URL("..", import.meta.url),
  env: {
    ...process.env,
    PORT: port,
    LEAGUE_DATA_DIR: dataDir,
    LEAGUE_DISABLE_AI: "1",
    LEAGUE_API_BUDGET_PAUSED: "1",
    OPENAI_API_KEY: "test-key-that-must-not-be-used"
  },
  stdio: ["ignore", "pipe", "pipe"]
});

let output = "";
server.stdout.on("data", (chunk) => { output += String(chunk); });
server.stderr.on("data", (chunk) => { output += String(chunk); });

const base = `http://127.0.0.1:${port}`;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function json(response) {
  const body = await response.json();
  if (!response.ok) throw new Error(`${response.status}: ${JSON.stringify(body)}`);
  return body;
}

async function waitForServer() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(`${base}/api/health`);
      if (response.ok) return response.json();
    } catch {
      // Startup is asynchronous.
    }
    await sleep(100);
  }
  throw new Error(`League server did not start.\n${output}`);
}

try {
  const health = await waitForServer();
  if (health.ai_ready !== false || health.ai_paused !== true || health.samira_tip_store_ready !== true) {
    throw new Error(`Health does not expose the paused AI/tip-store boundary: ${JSON.stringify(health)}`);
  }

  const exactCoachBody = [
    "Game date/time: 7/28/2026 at 8:15 PM ET.  ",
    "Game type/result: Ranked solo Victory.",
    "Game duration: 29:44.",
    "Patch: 26.14.",
    "Final visible scoreboard: Alan's Samira finished 11/4/9, 221 CS, 34,220 damage, 18,440 gold, and 620 gold/min.",
    "CS@10: unavailable/not readable.",
    "CS/min: 7.5.",
    "Gameplay-estimated rank for Alan's Samira performance: Gold II.",
    "At 14:22 Alan was 3/2/4 with 103 CS; this is an interim scoreboard, not the final result.",
    "Overall verdict: Alan converted the first dragon fight but overstayed after the second tower.",
    "Chronological timeline: At 06:18 the wave was pushing out and Alan recalled correctly. At 21:04 Alan used E before the enemy stun was committed and died.",
    "Lane and matchup: Hold the first three waves and trade only with support range.",
    "Mechanics and execution: Auto Q before E was consistent; W was late once.",
    "Fighting: Wait for hard crowd control before the first E.",
    "Macro and resources: Recall after the tower instead of chasing into fog.",
    "Vision and information: The river threat was not visible.",
    "Mental and communication patterns: Panic created the second E.",
    "Recurring strengths: Patient first entry; accurate Q weaving; clean first reset.",
    "Recurring weaknesses: Fog chase; second-fight greed; late W.",
    "Priorities 1-3: Exit after first damage; spend shutdown gold; track hard crowd control.",
    "Drills: Call W, HP, ally before every E for ten games.",
    "Targets to track: Five games with no fog-chase death; ten games above 70 CS@10.",
    "Pre-queue checklist: W ready; HP above half; ally close.",
    "One rule for my very next game: After first damage, exit before looking for a reset.",
    "Single most important sentence: S rank is availability, not permission.",
    "Anything the recording cannot prove: Hidden enemy cooldowns and off-screen pings."
  ].join("\r\n") + "  ";

  const save = await json(await fetch(`${base}/api/samira/notes`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ body: exactCoachBody })
  }));
  if (!save.note?.id || save.note.body !== exactCoachBody) throw new Error("Primary coach text was not returned byte-for-byte after save.");
  if (save.analysis_status !== "unavailable") throw new Error(`Paused coach save reported a nonexistent pending job: ${save.analysis_status}`);

  const detail = await json(await fetch(`${base}/api/samira/notes/${encodeURIComponent(save.note.id)}`));
  if (detail.source_text !== exactCoachBody || detail.note?.body !== exactCoachBody || detail.note?.source_text !== exactCoachBody) {
    throw new Error("Coach detail does not expose the exact stored source text.");
  }
  const entry = detail.coach_entry;
  if (entry?.schema !== "coach_entry_v1" || entry?.rank_read?.exact_rank !== "Gold II") {
    throw new Error(`Coach entry schema/rank is wrong: ${JSON.stringify(entry?.rank_read)}`);
  }
  if ("body_hash" in entry || "analysis_attempted" in entry) {
    throw new Error("Coach detail leaks internal cache/queue fields.");
  }
  if (entry.scoreboard?.kda !== "11/4/9" || entry.scoreboard?.cs_at_10_status !== "unavailable") {
    throw new Error(`Final scoreboard or CS@10 unavailability was not preserved: ${JSON.stringify(entry.scoreboard)}`);
  }
  if (entry.facts?.patch !== "26.14" || entry.scoreboard?.cs_per_minute !== "7.5") {
    throw new Error(`Dotted patch or decimal metric was truncated: ${JSON.stringify({ patch: entry.facts?.patch, cs_per_minute: entry.scoreboard?.cs_per_minute })}`);
  }
  if (entry.facts?.role !== "" || entry.provenance?.["facts.role"] !== "not-visible") {
    throw new Error("A missing role was inferred instead of remaining not visible.");
  }
  if (entry.provenance?.["facts.result"] !== "grounded-derivative" || entry.provenance?.["scoreboard.kills"] !== "grounded-derivative") {
    throw new Error("Normalized facts are not marked as grounded derivatives.");
  }
  if (!entry.timeline?.length || !entry.coverage || entry.coverage.total !== 11) {
    throw new Error("Coach entry is missing its timeline or coverage model.");
  }
  for (const prefix of ["facts.", "scoreboard.", "rank_read.", "domains.", "development."]) {
    if (!Object.keys(entry.provenance || {}).some((key) => key.startsWith(prefix))) {
      throw new Error(`Coach provenance is missing ${prefix}`);
    }
  }
  if (!/^(coach-stated|grounded-derivative|not-visible)$/.test(entry.provenance?.uncertainties || "")) {
    throw new Error("Coach uncertainties have no source status.");
  }
  if (entry.provenance?.["development.strengths.0"] !== "coach-stated" || entry.provenance?.["uncertainties.0"] !== "coach-stated") {
    throw new Error("Coach development/uncertainty leaves have no precise provenance.");
  }

  const samira = await json(await fetch(`${base}/api/samira`));
  const compactNote = samira.notes.find((note) => note.id === save.note.id);
  if (compactNote?.coach_entry?.schema !== "coach_entry_v1" || !compactNote.coach_entry.coverage) {
    throw new Error("The compact Samira API omits coach-entry status/coverage.");
  }

  const pdfResponse = await fetch(`${base}${compactNote.pdf_url}`);
  if (!pdfResponse.ok) throw new Error(`Structured coach PDF failed: ${pdfResponse.status}`);
  const pdf = Buffer.from(await pdfResponse.arrayBuffer()).toString("latin1");
  const orderedHeadings = [
    "game facts",
    "rank and evidence",
    "overall verdict",
    "timestamped timeline",
    "domain analysis",
    "strengths and root causes",
    "priorities, drills, metrics, and checklist",
    "uncertainties",
    "exact coach response"
  ];
  for (const heading of orderedHeadings) {
    if (!pdf.includes(heading)) throw new Error(`Structured coach PDF is missing '${heading}'.`);
  }
  const headingIndexes = orderedHeadings.map((heading) => pdf.indexOf(heading));
  if (headingIndexes.some((index, position) => position > 0 && index <= headingIndexes[position - 1])) {
    throw new Error(`Structured coach PDF sections are out of order: ${JSON.stringify(headingIndexes)}`);
  }
  if (pdf.indexOf("approx rank:") < pdf.indexOf("game facts")) {
    throw new Error("Structured coach PDF still puts legacy rank metadata before game facts.");
  }
  if (!pdf.includes("Alan's Samira finished 11/4/9")) throw new Error("Structured coach PDF lost the exact response appendix.");

  const image = await sharp({
    create: { width: 320, height: 180, channels: 3, background: { r: 32, g: 24, b: 24 } }
  }).png().toBuffer();
  const sha256 = createHash("sha256").update(image).digest("hex");
  const uploadResponse = await fetch(`${base}/api/samira/tip-images`, {
    method: "POST",
    headers: { "content-type": "image/png" },
    body: image
  });
  if (uploadResponse.status !== 201) throw new Error(`New image upload returned ${uploadResponse.status}.`);
  const upload = await uploadResponse.json();
  if (upload.duplicate || upload.record?.sha256 !== sha256 || upload.record?.status !== "unavailable") {
    throw new Error(`Upload metadata is wrong: ${JSON.stringify(upload)}`);
  }
  const imageId = upload.record.id;
  const originalResponse = await fetch(`${base}${upload.record.original_url}`);
  const original = Buffer.from(await originalResponse.arrayBuffer());
  if (!originalResponse.ok || !original.equals(image)) throw new Error("Original image bytes did not round-trip exactly.");
  if (originalResponse.headers.get("cache-control") !== "no-store") throw new Error("A deleted public original could remain in a browser or shared cache.");
  const thumbnailResponse = await fetch(`${base}${upload.record.thumbnail_url}`);
  const thumbnail = Buffer.from(await thumbnailResponse.arrayBuffer());
  const thumbnailMeta = await sharp(thumbnail).metadata();
  if (!thumbnailResponse.ok || thumbnailResponse.headers.get("content-type") !== "image/webp" || thumbnailMeta.format !== "webp") {
    throw new Error("Thumbnail route does not serve a real WebP derivative.");
  }
  await stat(join(dataDir, "samira-tip-images", sha256, "original.png"));
  await stat(join(dataDir, "samira-tip-images", sha256, "thumbnail.webp"));
  const manifest = JSON.parse(await readFile(join(dataDir, "samira-tip-images", "manifest.json"), "utf8"));
  if (manifest.records?.[0]?.sha256 !== sha256) throw new Error("Persistent tip manifest does not reference the exact original.");

  const duplicateResponse = await fetch(`${base}/api/samira/tip-images`, {
    method: "POST",
    headers: { "content-type": "image/png" },
    body: image
  });
  const duplicate = await duplicateResponse.json();
  if (duplicateResponse.status !== 200 || !duplicate.duplicate || duplicate.record?.id !== imageId) {
    throw new Error("SHA-256 deduplication did not return the existing record.");
  }

  const mismatch = await fetch(`${base}/api/samira/tip-images`, {
    method: "POST",
    headers: { "content-type": "image/jpeg" },
    body: image
  });
  if (mismatch.status !== 400 || (await mismatch.json()).code !== "image_type_mismatch") {
    throw new Error("Declared/decoded image mismatch was not rejected safely.");
  }
  const invalid = await fetch(`${base}/api/samira/tip-images`, {
    method: "POST",
    headers: { "content-type": "image/png" },
    body: Buffer.from("not an image")
  });
  if (invalid.status !== 400 || (await invalid.json()).code !== "invalid_image") {
    throw new Error("Malformed image was not rejected safely.");
  }
  const truncated = await fetch(`${base}/api/samira/tip-images`, {
    method: "POST",
    headers: { "content-type": "image/png" },
    body: image.subarray(0, Math.max(32, Math.floor(image.length / 2)))
  });
  if (truncated.status !== 400 || (await truncated.json()).code !== "invalid_image") {
    throw new Error("Partially decodable image data was accepted without a complete decode.");
  }

  const list = await json(await fetch(`${base}/api/samira/tip-images`));
  if (list.count !== 1 || list.tip_images?.[0]?.id !== imageId || list.records?.[0]?.id !== imageId) {
    throw new Error("Tip-image list aliases are inconsistent.");
  }
  const homepageResponse = await fetch(`${base}/`);
  const homepage = await homepageResponse.text();
  if (!homepageResponse.ok || homepageResponse.headers.get("cache-control") !== "no-store") {
    throw new Error("The Samira homepage bootstrap can be cached or failed to render.");
  }
  if (!homepage.includes('id="samira-bootstrap-state"') || !homepage.includes(`"id":"${imageId}"`)) {
    throw new Error("The first-paint bootstrap does not contain the saved screenshot record.");
  }
  if (homepage.includes(exactCoachBody) || homepage.includes('id="samira-bootstrap-state" type="application/json">{}</script>')) {
    throw new Error("The first-paint bootstrap leaks raw coach text or fell back to an empty shell.");
  }
  const retry = await fetch(`${base}/api/samira/tip-images/${encodeURIComponent(imageId)}/retry`, { method: "POST" });
  if (retry.status !== 503 || (await retry.json()).code !== "analysis_unavailable") {
    throw new Error("AI-disabled retry did not preserve the image with a safe boundary.");
  }
  const tips = await json(await fetch(`${base}/api/samira/tips`));
  if (!Array.isArray(tips.tips) || tips.tips.length < 2 || tips.tips.some((tip) => !tip.id || !tip.text || !tip.source_type)) {
    throw new Error("Morning tip API did not provide stable source-typed fallbacks.");
  }

  const deleted = await json(await fetch(`${base}/api/samira/tip-images/${encodeURIComponent(imageId)}`, { method: "DELETE" }));
  if (deleted.deleted_id !== imageId) throw new Error("Image deletion returned the wrong stable ID.");
  if ((await fetch(`${base}/api/samira/tip-images/${encodeURIComponent(imageId)}/original`)).status !== 404) {
    throw new Error("Deleted original remains publicly addressable.");
  }

  console.log("Samira backend preserves exact coach/image sources, structured entries, WebP thumbnails, safe retries, and public tip APIs.");
} finally {
  server.kill();
  await rm(dataDir, { recursive: true, force: true });
}
