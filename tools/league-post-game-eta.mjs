import fs from "node:fs/promises";
import path from "node:path";

const maxSamplesPerStage = 80;
const minUsefulSeconds = 5;
const maxUsefulSeconds = 60 * 60;

function clampSeconds(value, fallback = 0) {
  const seconds = Math.round(Number(value));
  if (!Number.isFinite(seconds)) return fallback;
  return Math.max(0, Math.min(maxUsefulSeconds, seconds));
}

function iso(value) {
  const time = value instanceof Date ? value.getTime() : Date.parse(value || "");
  return Number.isFinite(time) ? new Date(time).toISOString() : "";
}

function secondsBetween(start, end) {
  const startMs = Date.parse(start || "");
  const endMs = Date.parse(end || "");
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) return null;
  return Math.round((endMs - startMs) / 1000);
}

function percentile(values, p) {
  const sorted = values
    .map(Number)
    .filter((value) => Number.isFinite(value) && value >= minUsefulSeconds && value <= maxUsefulSeconds)
    .sort((a, b) => a - b);
  if (!sorted.length) return null;
  const index = (sorted.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

function historyPath(analysisRoot) {
  return path.join(analysisRoot, "post-game-eta-history.json");
}

async function readJson(filePath, fallback) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function emptyHistory() {
  return {
    version: 1,
    seededFromLogsAt: "",
    samples: []
  };
}

function sampleKey(stage, seconds, meta = {}) {
  return [
    stage,
    meta.fileName || "",
    Math.round(Number(seconds) || 0),
    iso(meta.recordedAt) || ""
  ].join(":");
}

function normalizeHistory(raw) {
  const history = raw && typeof raw === "object" ? raw : emptyHistory();
  const samples = Array.isArray(history.samples) ? history.samples : [];
  return {
    version: 1,
    seededFromLogsAt: String(history.seededFromLogsAt || ""),
    samples: samples
      .filter((sample) => sample && sample.stage && Number.isFinite(Number(sample.seconds)))
      .map((sample) => {
        const normalized = {
          stage: String(sample.stage),
          seconds: clampSeconds(sample.seconds),
          recordedAt: iso(sample.recordedAt) || new Date().toISOString(),
          fileName: String(sample.fileName || ""),
          sourceDurationSeconds: Number.isFinite(Number(sample.sourceDurationSeconds))
            ? clampSeconds(sample.sourceDurationSeconds)
            : null,
          reviewDurationSeconds: Number.isFinite(Number(sample.reviewDurationSeconds))
            ? clampSeconds(sample.reviewDurationSeconds)
            : null,
          sourceBytes: Number.isFinite(Number(sample.sourceBytes)) ? Math.round(Number(sample.sourceBytes)) : null,
          segmentCount: Number.isFinite(Number(sample.segmentCount)) ? Math.round(Number(sample.segmentCount)) : null,
          basis: String(sample.basis || "")
        };
        return {
          key: sample.key || sampleKey(normalized.stage, normalized.seconds, normalized),
          ...normalized
        };
      })
  };
}

async function writeHistory(analysisRoot, history) {
  await fs.mkdir(analysisRoot, { recursive: true });
  const byStage = new Map();
  for (const sample of history.samples) {
    if (!byStage.has(sample.stage)) byStage.set(sample.stage, []);
    byStage.get(sample.stage).push(sample);
  }
  const samples = [];
  for (const stageSamples of byStage.values()) {
    stageSamples.sort((a, b) => Date.parse(a.recordedAt || "") - Date.parse(b.recordedAt || ""));
    samples.push(...stageSamples.slice(-maxSamplesPerStage));
  }
  samples.sort((a, b) => Date.parse(a.recordedAt || "") - Date.parse(b.recordedAt || ""));
  await fs.writeFile(historyPath(analysisRoot), `${JSON.stringify({ ...history, samples }, null, 2)}\n`, "utf8");
}

function parseRecorderLog(text) {
  const rows = [];
  const sessions = [];
  for (const line of String(text || "").split(/\r?\n/)) {
    const match = line.match(/^(\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z)\s+(.+)$/);
    if (!match) continue;
    rows.push({ at: match[1], message: match[2] });
  }
  let current = null;
  for (const row of rows) {
    if (/Stopping League screen capture\./i.test(row.message)) {
      current = { stoppedAt: row.at };
      sessions.push(current);
      continue;
    }
    const created = row.message.match(/Created review clip (.+)$/i);
    if (created && current && !current.clipCreatedAt) {
      current.clipCreatedAt = row.at;
      current.outputPath = created[1].trim();
      current.fileName = path.basename(current.outputPath);
    }
  }
  return sessions.filter((session) => session.stoppedAt && session.clipCreatedAt && session.fileName);
}

function parsePublisherLog(text) {
  const rows = [];
  for (const line of String(text || "").split(/\r?\n/)) {
    const startDone = line.match(/^\[(.+?)\]\s+(start|done) League recording publish(?: exit=(\d+))?/i);
    if (startDone) {
      rows.push({
        at: iso(startDone[1]),
        kind: startDone[2].toLowerCase(),
        exit: startDone[3] || ""
      });
      continue;
    }
    if (/League recordings published\./i.test(line)) rows.push({ kind: "published" });
  }

  const windows = [];
  let current = null;
  let sawPublished = false;
  for (const row of rows) {
    if (row.kind === "start") {
      current = { startedAt: row.at };
      sawPublished = false;
      continue;
    }
    if (row.kind === "published" && current) {
      sawPublished = true;
      continue;
    }
    if (row.kind === "done" && current) {
      if (sawPublished && row.exit === "0") {
        windows.push({ ...current, liveAt: row.at });
      }
      current = null;
      sawPublished = false;
    }
  }
  return windows.filter((item) => item.startedAt && item.liveAt);
}

async function sidecarFor(sourceDir, fileName) {
  if (!fileName) return null;
  return await readJson(path.join(sourceDir, `${fileName}.json`), null);
}

function addSample(samples, stage, seconds, meta = {}) {
  const value = clampSeconds(seconds);
  if (value < minUsefulSeconds || value > maxUsefulSeconds) return;
  const key = sampleKey(stage, value, meta);
  if (samples.some((sample) => sample.key === key)) return;
  samples.push({
    key,
    stage,
    seconds: value,
    recordedAt: iso(meta.recordedAt) || new Date().toISOString(),
    fileName: String(meta.fileName || ""),
    sourceDurationSeconds: Number.isFinite(Number(meta.sourceDurationSeconds))
      ? clampSeconds(meta.sourceDurationSeconds)
      : null,
    reviewDurationSeconds: Number.isFinite(Number(meta.reviewDurationSeconds))
      ? clampSeconds(meta.reviewDurationSeconds)
      : null,
    sourceBytes: Number.isFinite(Number(meta.sourceBytes)) ? Math.round(Number(meta.sourceBytes)) : null,
    segmentCount: Number.isFinite(Number(meta.segmentCount)) ? Math.round(Number(meta.segmentCount)) : null,
    basis: String(meta.basis || "")
  });
}

async function seedFromLogs({ analysisRoot, sourceDir }) {
  const recorderText = await fs.readFile(path.join(analysisRoot, "league-live-recorder.log"), "utf8").catch(() => "");
  const publisherText = await fs.readFile(path.join(analysisRoot, "publish-recordings.log"), "utf8").catch(() => "");
  const recorderSessions = parseRecorderLog(recorderText);
  const publishWindows = parsePublisherLog(publisherText);
  const samples = [];

  for (const session of recorderSessions) {
    const sidecar = await sidecarFor(sourceDir, session.fileName);
    const sourceDurationSeconds = sidecar?.sourceDurationSeconds || null;
    const reviewDurationSeconds = sidecar?.durationSeconds || null;
    const segmentCount = Array.isArray(sidecar?.segments) ? sidecar.segments.length : null;
    const sourceBytes = await fs.stat(path.join(sourceDir, session.fileName)).then((stat) => stat.size).catch(() => null);
    addSample(samples, "review_clip", secondsBetween(session.stoppedAt, session.clipCreatedAt), {
      fileName: session.fileName,
      recordedAt: session.clipCreatedAt,
      sourceDurationSeconds,
      reviewDurationSeconds,
      sourceBytes,
      segmentCount,
      basis: "recorder log"
    });
    const publishWindow = publishWindows.find((window) => (
      Date.parse(window.startedAt) >= Date.parse(session.clipCreatedAt) - 30 * 1000 &&
      Date.parse(window.startedAt) <= Date.parse(session.clipCreatedAt) + 10 * 60 * 1000
    )) || publishWindows.find((window) => (
      Date.parse(window.liveAt) >= Date.parse(session.clipCreatedAt) &&
      Date.parse(window.liveAt) <= Date.parse(session.clipCreatedAt) + 45 * 60 * 1000
    ));
    if (!publishWindow) continue;
    addSample(samples, "clip_to_live", secondsBetween(session.clipCreatedAt, publishWindow.liveAt), {
      fileName: session.fileName,
      recordedAt: publishWindow.liveAt,
      sourceDurationSeconds,
      reviewDurationSeconds,
      sourceBytes,
      segmentCount,
      basis: "recorder and publisher logs"
    });
    addSample(samples, "post_game_total", secondsBetween(session.stoppedAt, publishWindow.liveAt), {
      fileName: session.fileName,
      recordedAt: publishWindow.liveAt,
      sourceDurationSeconds,
      reviewDurationSeconds,
      sourceBytes,
      segmentCount,
      basis: "recorder and publisher logs"
    });
    addSample(samples, "publisher_to_live", secondsBetween(publishWindow.startedAt, publishWindow.liveAt), {
      fileName: session.fileName,
      recordedAt: publishWindow.liveAt,
      sourceDurationSeconds,
      reviewDurationSeconds,
      sourceBytes,
      segmentCount,
      basis: "publisher log"
    });
  }

  return samples;
}

export function clearEtaFields() {
  return {
    etaSeconds: null,
    estimatedReadyAt: "",
    etaBasis: ""
  };
}

export async function readEtaHistory({ analysisRoot, sourceDir, seed = true } = {}) {
  const raw = await readJson(historyPath(analysisRoot), null);
  let history = normalizeHistory(raw);
  if (seed && !history.seededFromLogsAt && sourceDir) {
    const seeded = await seedFromLogs({ analysisRoot, sourceDir }).catch(() => []);
    history = normalizeHistory({
      ...history,
      seededFromLogsAt: new Date().toISOString(),
      samples: [...history.samples, ...seeded]
    });
    await writeHistory(analysisRoot, history).catch(() => {});
  }
  return history;
}

function fallbackFor(stage, fallbackSeconds, context = {}) {
  if (Number.isFinite(Number(fallbackSeconds)) && Number(fallbackSeconds) > 0) return clampSeconds(fallbackSeconds);
  const sourceDuration = Number(context.sourceDurationSeconds) || 0;
  if (stage === "review_clip") return clampSeconds(120 + sourceDuration * 0.12, 240);
  if (stage === "clip_to_live") return 10 * 60;
  if (stage === "publisher_to_live") return 12 * 60;
  if (stage === "deploy_to_live") return 4 * 60;
  return 14 * 60;
}

function estimateTotalSeconds(history, stage, fallbackSeconds, context = {}) {
  const sourceDuration = Number(context.sourceDurationSeconds) || null;
  const reviewDuration = Number(context.reviewDurationSeconds) || null;
  const sourceBytes = Number(context.sourceBytes) || null;
  const all = history.samples.filter((sample) => sample.stage === stage);
  let pool = all.slice(-12);
  if (sourceDuration || reviewDuration || sourceBytes) {
    const nearest = all
      .filter((sample) => (
        (sourceDuration && Number.isFinite(Number(sample.sourceDurationSeconds))) ||
        (reviewDuration && Number.isFinite(Number(sample.reviewDurationSeconds))) ||
        (sourceBytes && Number.isFinite(Number(sample.sourceBytes)))
      ))
      .sort((a, b) => {
        const score = (sample) => {
          let total = 0;
          if (sourceDuration && Number.isFinite(Number(sample.sourceDurationSeconds))) {
            total += Math.abs(sample.sourceDurationSeconds - sourceDuration) / Math.max(60, sourceDuration);
          }
          if (reviewDuration && Number.isFinite(Number(sample.reviewDurationSeconds))) {
            total += Math.abs(sample.reviewDurationSeconds - reviewDuration) / Math.max(30, reviewDuration);
          }
          if (sourceBytes && Number.isFinite(Number(sample.sourceBytes))) {
            total += Math.abs(sample.sourceBytes - sourceBytes) / Math.max(1024 * 1024, sourceBytes);
          }
          return total;
        };
        return score(a) - score(b);
      })
      .slice(0, 8);
    if (nearest.length >= 3) pool = nearest;
  }

  const values = pool.map((sample) => sample.seconds);
  const fallback = fallbackFor(stage, fallbackSeconds, context);
  if (stage === "post_game_total" && values.length < 2) {
    const review = estimateTotalSeconds(history, "review_clip", fallbackFor("review_clip", 0, context), context);
    const publish = estimateTotalSeconds(history, "clip_to_live", fallbackFor("clip_to_live", 0, context), context);
    return {
      totalSeconds: clampSeconds(review.totalSeconds + publish.totalSeconds, fallback),
      sampleCount: review.sampleCount + publish.sampleCount,
      basis: `game-length model: review ${review.sampleCount}, publish ${publish.sampleCount} samples`
    };
  }
  if (values.length < 2) return { totalSeconds: fallback, sampleCount: values.length };

  const p75 = percentile(values, 0.75);
  const median = percentile(values, 0.5);
  const estimate = Math.max(median || fallback, (p75 || fallback) + 20);
  return {
    totalSeconds: clampSeconds(estimate, fallback),
    sampleCount: values.length
  };
}

export async function etaFields({ analysisRoot, sourceDir, stage, fallbackSeconds, startedAt = "", context = {} }) {
  const history = await readEtaHistory({ analysisRoot, sourceDir });
  const estimate = estimateTotalSeconds(history, stage, fallbackSeconds, context);
  const startedMs = Date.parse(startedAt || "");
  const elapsedSeconds = Number.isFinite(startedMs) ? Math.max(0, Math.round((Date.now() - startedMs) / 1000)) : 0;
  const remaining = Math.max(20, estimate.totalSeconds - elapsedSeconds);
  return {
    etaSeconds: clampSeconds(remaining),
    estimatedReadyAt: new Date(Date.now() + remaining * 1000).toISOString(),
    etaBasis: estimate.basis || (estimate.sampleCount >= 2
      ? `trained on ${estimate.sampleCount} recent ${stage.replace(/_/g, " ")} samples`
      : "using fallback until more games finish")
  };
}

export async function recordEtaSample({ analysisRoot, sourceDir, stage, seconds, meta = {} }) {
  const history = await readEtaHistory({ analysisRoot, sourceDir });
  addSample(history.samples, stage, seconds, meta);
  await writeHistory(analysisRoot, history);
}

export async function recordPublishComplete({ analysisRoot, sourceDir, fileName, publishStartedAt, deployStartedAt, liveAt }) {
  const sidecar = await sidecarFor(sourceDir, fileName);
  const clipCreatedAt = sidecar?.createdAt || "";
  const gameEndedAt = sidecar?.endedAt || "";
  const sourceDurationSeconds = sidecar?.sourceDurationSeconds || null;
  const reviewDurationSeconds = sidecar?.durationSeconds || null;
  const segmentCount = Array.isArray(sidecar?.segments) ? sidecar.segments.length : null;
  const sourceBytes = await fs.stat(path.join(sourceDir, fileName)).then((stat) => stat.size).catch(() => null);
  const meta = {
    fileName,
    recordedAt: liveAt,
    sourceDurationSeconds,
    reviewDurationSeconds,
    sourceBytes,
    segmentCount,
    basis: "completed publish"
  };

  if (gameEndedAt && clipCreatedAt) {
    await recordEtaSample({
      analysisRoot,
      sourceDir,
      stage: "review_clip",
      seconds: secondsBetween(gameEndedAt, clipCreatedAt),
      meta: { ...meta, recordedAt: clipCreatedAt }
    });
  }
  if (clipCreatedAt) {
    await recordEtaSample({
      analysisRoot,
      sourceDir,
      stage: "clip_to_live",
      seconds: secondsBetween(clipCreatedAt, liveAt),
      meta
    });
  }
  if (gameEndedAt) {
    await recordEtaSample({
      analysisRoot,
      sourceDir,
      stage: "post_game_total",
      seconds: secondsBetween(gameEndedAt, liveAt),
      meta
    });
  }
  if (publishStartedAt) {
    await recordEtaSample({
      analysisRoot,
      sourceDir,
      stage: "publisher_to_live",
      seconds: secondsBetween(publishStartedAt, liveAt),
      meta
    });
  }
  if (deployStartedAt) {
    await recordEtaSample({
      analysisRoot,
      sourceDir,
      stage: "deploy_to_live",
      seconds: secondsBetween(deployStartedAt, liveAt),
      meta
    });
  }
}
