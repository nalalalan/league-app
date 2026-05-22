import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, "..");
const analysisRoot = path.join(appRoot, "_recording-analysis");
const statusPath = path.join(analysisRoot, "recording-status.json");
const queuePath = path.join(analysisRoot, "post-game-queue.json");
const lockPath = path.join(analysisRoot, "league-live-recorder.lock");
const intervalMs = Number(process.env.LEAGUE_STATUS_GUARD_INTERVAL_MS || 5000);
const untilMs = Date.now() + Number(process.env.LEAGUE_STATUS_GUARD_MS || 2 * 60 * 60 * 1000);

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function readJson(filePath, fallback) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function seconds(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : null;
}

function activeQueueItems(items) {
  return items.filter((item) => {
    const label = String(item?.label || "").toLowerCase();
    const status = String(item?.status || "").toLowerCase();
    const stage = String(item?.stage || "").toLowerCase();
    return label === "current game" || status === "recording" || stage === "recording";
  });
}

function queueFileItems(queue) {
  return queue
    .filter((item) => item?.sessionRoot)
    .slice(0, 5)
    .map((item, index) => ({
      label: `review ${index + 1}`,
      status: index === 0 ? "processing" : "queued",
      stage: index === 0 ? "processing" : "queued",
      stageLabel: index === 0 ? "building review clip" : "waiting behind earlier review",
      startedAt: item.startedAt || "",
      endedAt: item.endedAt || "",
      queuedAt: item.queuedAt || "",
      estimatedGameEndAt: "",
      estimatedStartAt: "",
      estimatedReadyAt: "",
      gameEtaSeconds: null,
      startEtaSeconds: null,
      etaSeconds: null,
      stageEtaSeconds: null,
      etaBasis: "waiting for active recorder",
      progress: index === 0 ? 65 : 0
    }));
}

function normalizeCurrentGame(item) {
  const now = Date.now();
  const estimatedGameEndEta = Math.round((Date.parse(item.estimatedGameEndAt || "") - now) / 1000);
  const gameEtaSeconds = seconds(item.gameEtaSeconds)
    ?? (Number.isFinite(estimatedGameEndEta) ? Math.max(0, estimatedGameEndEta) : 30 * 60);
  const reviewSeconds = Math.max(20, seconds(item.etaSeconds) - seconds(item.startEtaSeconds))
    || Math.max(20, seconds(item.stageEtaSeconds))
    || 14 * 60;
  const estimatedGameEndAt = new Date(now + gameEtaSeconds * 1000).toISOString();
  const estimatedReadyAt = new Date(now + (gameEtaSeconds + reviewSeconds) * 1000).toISOString();
  return {
    ...item,
    estimatedGameEndAt,
    estimatedStartAt: estimatedGameEndAt,
    estimatedReadyAt,
    gameEtaSeconds,
    startEtaSeconds: gameEtaSeconds,
    etaSeconds: gameEtaSeconds + reviewSeconds,
    stageEtaSeconds: gameEtaSeconds
  };
}

while (Date.now() < untilMs) {
  const status = await readJson(statusPath, null);
  const queue = await readJson(queuePath, []);
  const lockPid = (await fs.readFile(lockPath, "utf8").catch(() => "")).trim();
  if (status && Array.isArray(queue) && Array.isArray(status.queueItems)) {
    const correctedItems = queue.length ? queueFileItems(queue) : activeQueueItems(status.queueItems).map(normalizeCurrentGame);
    if (!status.recorderPid || status.queueCount !== correctedItems.length || status.queueItems.length !== correctedItems.length) {
      await fs.writeFile(statusPath, `${JSON.stringify({
        ...status,
        recorderPid: status.recorderPid || lockPid || "",
        queueCount: correctedItems.length,
        queueItems: correctedItems,
        updatedAt: new Date().toISOString()
      }, null, 2)}\n`, "utf8").catch(() => {});
    }
  }
  await delay(intervalMs);
}
