import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, "..");
const analysisRoot = path.join(appRoot, "_recording-analysis");
const statusPath = path.join(analysisRoot, "recording-status.json");
const sourceDir = process.env.LEAGUE_RECORDINGS_DIR || "C:\\Users\\phama\\Documents\\League of Legends\\Highlights";
const startupPath = path.join(process.env.APPDATA || "", "Microsoft", "Windows", "Start Menu", "Programs", "Startup", "AO Labs League live recorder.vbs");
const liveBase = process.env.LEAGUE_SITE_URL || "https://league.aolabs.io";
const maxFreshSeconds = Number(process.env.LEAGUE_VERIFY_MAX_STATUS_AGE_SECONDS || 180);
const sourceVideoPattern = /\.(webm|mp4)$/i;
const ignoredSourceVideoPattern = /\.with-desktop-pauses\.(webm|mp4)$/i;

function ageSeconds(value) {
  const time = Date.parse(value || "");
  return Number.isFinite(time) ? Math.max(0, Math.round((Date.now() - time) / 1000)) : null;
}

function ok(name, detail = "") {
  return { name, ok: true, detail };
}

function fail(name, detail = "") {
  return { name, ok: false, detail };
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

async function shellJson(command) {
  const { stdout } = await execFileAsync("powershell.exe", ["-NoProfile", "-Command", command], {
    cwd: appRoot,
    maxBuffer: 8 * 1024 * 1024,
    windowsHide: true
  });
  const trimmed = stdout.trim();
  return trimmed ? JSON.parse(trimmed) : null;
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return await response.json();
}

async function headOk(url) {
  const response = await fetch(url, { method: "HEAD", redirect: "follow" });
  return response.ok;
}

async function latestSourceVideo() {
  const entries = await fs.readdir(sourceDir, { withFileTypes: true });
  const videos = [];
  for (const entry of entries) {
    if (!entry.isFile() || !sourceVideoPattern.test(entry.name) || ignoredSourceVideoPattern.test(entry.name)) continue;
    const filePath = path.join(sourceDir, entry.name);
    const stat = await fs.stat(filePath);
    videos.push({ name: entry.name, size: stat.size, mtimeMs: stat.mtimeMs });
  }
  videos.sort((a, b) => b.mtimeMs - a.mtimeMs || a.name.localeCompare(b.name));
  return videos[0] || null;
}

async function recorderProcessCheck() {
  const rows = await shellJson(`
$rows = Get-CimInstance Win32_Process |
  Where-Object { $_.Name -eq 'node.exe' -and $_.CommandLine -like '*league-live-recorder.mjs*' } |
  Select-Object ProcessId, CreationDate
@($rows) | ConvertTo-Json -Compress
`);
  const list = Array.isArray(rows) ? rows : (rows ? [rows] : []);
  return list.length
    ? ok("recorder process", `running pid ${list[0].ProcessId}`)
    : fail("recorder process", "not running");
}

async function startupCheck() {
  return await fileExists(startupPath)
    ? ok("startup launcher", startupPath)
    : fail("startup launcher", "missing hidden Startup launcher");
}

async function tokenCheck() {
  const result = await shellJson(`
$user = [Environment]::GetEnvironmentVariable('LEAGUE_STATUS_TOKEN','User')
$machine = [Environment]::GetEnvironmentVariable('LEAGUE_STATUS_TOKEN','Machine')
[pscustomobject]@{ hasUser = [bool]$user; hasMachine = [bool]$machine } | ConvertTo-Json -Compress
`);
  return result?.hasUser || result?.hasMachine
    ? ok("status token", result.hasUser ? "user token set" : "machine token set")
    : fail("status token", "missing LEAGUE_STATUS_TOKEN");
}

async function publisherTaskCheck() {
  const task = await shellJson(`
$task = Get-ScheduledTask -TaskName 'AO Labs League recording publisher' -ErrorAction SilentlyContinue
if (-not $task) { $null | ConvertTo-Json -Compress; exit 0 }
$info = $task | Get-ScheduledTaskInfo
[pscustomobject]@{
  state = $task.State.ToString()
  lastTaskResult = $info.LastTaskResult
  lastRunTime = if ($info.LastRunTime) { $info.LastRunTime.ToString('s') } else { '' }
  nextRunTime = if ($info.NextRunTime) { $info.NextRunTime.ToString('s') } else { '' }
} | ConvertTo-Json -Compress
`);
  if (!task) return fail("publisher task", "missing scheduled task");
  if (Number(task.lastTaskResult) !== 0) return fail("publisher task", `last result ${task.lastTaskResult}`);
  return ok("publisher task", `${task.state}; next ${task.nextRunTime}`);
}

async function localStatusCheck() {
  const status = await readJson(statusPath);
  const age = ageSeconds(status.updatedAt);
  if (!Number.isFinite(age)) return fail("local status", "missing updatedAt");
  if (age > maxFreshSeconds) return fail("local status", `${age}s old`);
  return ok("local status", `${status.status}; ${age}s old`);
}

async function liveStatusCheck() {
  const status = await fetchJson(`${liveBase}/api/recording-status?verify=automation-health`);
  const age = Number(status.ageSeconds);
  if (status.stale || age > maxFreshSeconds) return fail("live status", `${status.status}; ${age}s old; stale=${Boolean(status.stale)}`);
  return ok("live status", `${status.status}; ${age}s old`);
}

async function manifestCheck() {
  const latest = await latestSourceVideo();
  if (!latest) return fail("recording source", "no source videos found");
  const manifest = await fetchJson(`${liveBase}/recordings/recordings.json?verify=automation-health`);
  const recordings = Array.isArray(manifest.recordings) ? manifest.recordings : [];
  const found = recordings.find((item) => item.file === latest.name || item.publicFile === latest.name || String(item.src || "").endsWith(`/${latest.name}`));
  if (!found) return fail("live manifest", `latest source ${latest.name} is not visible live`);
  const videoUrl = new URL(found.src, liveBase).toString();
  if (!(await headOk(videoUrl))) return fail("latest video", `${found.src} is not reachable`);
  return ok("live manifest", `${recordings.length} recordings; latest ${latest.name}`);
}

async function main() {
  const checks = [];
  for (const fn of [
    recorderProcessCheck,
    startupCheck,
    tokenCheck,
    publisherTaskCheck,
    localStatusCheck,
    liveStatusCheck,
    manifestCheck
  ]) {
    try {
      checks.push(await fn());
    } catch (error) {
      checks.push(fail(fn.name.replace(/Check$/, ""), error.message));
    }
  }

  const failed = checks.filter((item) => !item.ok);
  const icon = (item) => item.ok ? "OK" : "FAIL";
  for (const item of checks) {
    console.log(`${icon(item)} ${item.name}${item.detail ? ` - ${item.detail}` : ""}`);
  }
  if (failed.length) {
    console.error(`League automation health failed: ${failed.map((item) => item.name).join(", ")}`);
    process.exitCode = 1;
  } else {
    console.log("League automation health passed.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
