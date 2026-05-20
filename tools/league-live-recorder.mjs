import { spawn, execFile } from "node:child_process";
import fs from "node:fs/promises";
import https from "node:https";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, "..");
const analysisRoot = path.join(appRoot, "_recording-analysis");
const sourceDir = process.env.LEAGUE_RECORDINGS_DIR || "C:\\Users\\phama\\Documents\\League of Legends\\Highlights";
const replayDir = process.env.LEAGUE_REPLAY_DIR || path.join(path.dirname(sourceDir), "Replays");
const captureRoot = process.env.LEAGUE_AUTO_CAPTURE_DIR || path.join(path.dirname(sourceDir), "AO Labs Live Captures");
const leagueLockfile = process.env.LEAGUE_LOCKFILE || "C:\\Riot Games\\League of Legends\\lockfile";
const lockPath = path.join(analysisRoot, "league-live-recorder.lock");
const logPath = path.join(analysisRoot, "league-live-recorder.log");
const pollMs = Number(process.env.LEAGUE_LIVE_POLL_MS || 5000);
const endGraceMs = Number(process.env.LEAGUE_LIVE_END_GRACE_MS || 35000);
const segmentSeconds = Number(process.env.LEAGUE_LIVE_SEGMENT_SECONDS || 30);
const fastForwardSpeed = Number(process.env.LEAGUE_LIVE_FAST_FORWARD || 8);
const minGameSeconds = Number(process.env.LEAGUE_LIVE_MIN_GAME_SECONDS || 90);
const minCaptureSegmentBytes = Number(process.env.LEAGUE_LIVE_MIN_SEGMENT_BYTES || 160 * 1024);
const minCaptureCoverage = Number(process.env.LEAGUE_LIVE_MIN_CAPTURE_COVERAGE || 0.6);
const maxCaptureRestarts = Number(process.env.LEAGUE_LIVE_MAX_CAPTURE_RESTARTS || 20);
const captureStallMs = Number(process.env.LEAGUE_LIVE_CAPTURE_STALL_MS || 45000);
const minCaptureGrowthBytes = Number(process.env.LEAGUE_LIVE_MIN_GROWTH_BYTES || 64 * 1024);
const fps = String(process.env.LEAGUE_LIVE_FPS || 10);
const encoderPreference = String(process.env.LEAGUE_LIVE_ENCODER || "auto").toLowerCase();
const liveCq = String(process.env.LEAGUE_LIVE_CQ || 20);
const liveCaptureCq = String(process.env.LEAGUE_LIVE_CAPTURE_CQ || 31);
const x264Crf = String(process.env.LEAGUE_LIVE_CRF || 20);
const x264CaptureCrf = String(process.env.LEAGUE_LIVE_CAPTURE_CRF || 32);
const captureBitrate = String(process.env.LEAGUE_LIVE_CAPTURE_BITRATE || "3500k");
const captureMaxrate = String(process.env.LEAGUE_LIVE_CAPTURE_MAXRATE || "5000k");
const captureBufsize = String(process.env.LEAGUE_LIVE_CAPTURE_BUFSIZE || "7000k");
const captureScale = String(process.env.LEAGUE_LIVE_CAPTURE_SCALE || "1920:-2").trim();
const capturePriority = String(process.env.LEAGUE_LIVE_PRIORITY || "Idle").trim();
const captureWindowTitle = String(process.env.LEAGUE_LIVE_WINDOW_TITLE || "League of Legends (TM) Client").trim();
const captureModePreference = String(process.env.LEAGUE_LIVE_CAPTURE_MODE || "title").trim().toLowerCase();
const publishAfterGame = process.env.LEAGUE_LIVE_PUBLISH !== "0";
const statusEndpoint = String(process.env.LEAGUE_STATUS_ENDPOINT || "https://league.aolabs.io/api/recording-status").trim();
const statusToken = String(process.env.LEAGUE_STATUS_TOKEN || process.env.LEAGUE_WRITE_TOKEN || "").trim();
const statusPath = path.join(analysisRoot, "recording-status.json");
const npmBin = process.platform === "win32" ? "npm.cmd" : "npm";
let encoderProfilePromise;
let lastStatusKey = "";
let lastStatusPostMs = 0;
let lastStatusErrorMs = 0;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function log(message) {
  const line = `${new Date().toISOString()} ${message}\n`;
  await fs.mkdir(analysisRoot, { recursive: true });
  await fs.appendFile(logPath, line, "utf8");
  process.stdout.write(line);
}

async function publishRecorderStatus(status, fields = {}, options = {}) {
  const payload = {
    status,
    updatedAt: new Date().toISOString(),
    mode: captureModePreference,
    ...fields
  };
  await fs.mkdir(analysisRoot, { recursive: true });
  await fs.writeFile(statusPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8").catch(() => {});

  const key = JSON.stringify({
    status: payload.status,
    label: payload.label,
    detail: payload.detail,
    mode: payload.mode,
    matchId: payload.matchId,
    startedAt: payload.startedAt
  });
  const throttleMs = Number(options.throttleMs ?? 15000);
  if (!options.force && key === lastStatusKey && Date.now() - lastStatusPostMs < throttleMs) return;
  lastStatusKey = key;
  lastStatusPostMs = Date.now();
  if (!statusEndpoint || !statusToken) return;

  try {
    const response = await fetch(statusEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-League-Status-Token": statusToken
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(3500)
    });
    if (!response.ok && Date.now() - lastStatusErrorMs > 120000) {
      lastStatusErrorMs = Date.now();
      await log(`Recording status update returned HTTP ${response.status}; capture continues.`);
    }
  } catch (error) {
    if (Date.now() - lastStatusErrorMs > 120000) {
      lastStatusErrorMs = Date.now();
      await log(`Recording status update failed; capture continues.`);
    }
  }
}

function sessionStatusFields(session, detail = "") {
  return {
    label: "recording League window",
    detail,
    mode: session.captureMode || captureModePreference,
    startedAt: session.startedAt?.toISOString?.() || "",
    matchId: ""
  };
}

async function run(command, args, options = {}) {
  return await new Promise((resolve, reject) => {
    const child = execFile(command, args, {
      cwd: appRoot,
      maxBuffer: 64 * 1024 * 1024,
      shell: process.platform === "win32" && /\.cmd$/i.test(command),
      windowsHide: true,
      ...options
    }, (error, stdout, stderr) => {
      if (error) {
        error.stdout = stdout;
        error.stderr = stderr;
        reject(error);
        return;
      }
      resolve(stdout || "");
    });
    if (/^ffmpeg(?:\.exe)?$/i.test(path.basename(command))) {
      lowerProcessPriority(child.pid).catch(() => {});
    }
  });
}

async function ffmpegEncoders() {
  try {
    return await run("ffmpeg", ["-hide_banner", "-encoders"]);
  } catch {
    return "";
  }
}

function encoderArgs(profile, purpose = "review") {
  const isCapture = purpose === "capture";
  if (profile.name === "h264_nvenc") {
    return [
      "-c:v", "h264_nvenc",
      "-preset", isCapture ? "p1" : "p5",
      "-tune", isCapture ? "ll" : "hq",
      "-rc", "vbr",
      "-cq", isCapture ? liveCaptureCq : liveCq,
      "-b:v", captureBitrate,
      "-maxrate", captureMaxrate,
      "-bufsize", captureBufsize,
      "-pix_fmt", "yuv420p"
    ];
  }
  const preset = isCapture ? "ultrafast" : "veryfast";
  return [
    "-c:v", "libx264",
    "-preset", preset,
    "-crf", isCapture ? x264CaptureCrf : x264Crf,
    "-threads", isCapture ? "1" : "0",
    "-pix_fmt", "yuv420p"
  ];
}

async function encoderWorks(profile) {
  const testPath = path.join(analysisRoot, `encoder-test-${profile.name}.mp4`);
  await fs.mkdir(analysisRoot, { recursive: true });
  try {
    await run("ffmpeg", [
      "-y",
      "-hide_banner",
      "-loglevel", "error",
      "-f", "lavfi",
      "-i", "color=size=320x180:rate=30:duration=0.2",
      "-frames:v", "6",
      ...encoderArgs(profile, "review"),
      "-an",
      testPath
    ]);
    return true;
  } catch {
    return false;
  } finally {
    await fs.unlink(testPath).catch(() => {});
  }
}

async function encoderProfile() {
  if (!encoderProfilePromise) {
    encoderProfilePromise = (async () => {
      const encoders = await ffmpegEncoders();
      const wantsNvenc = encoderPreference === "auto" || encoderPreference === "nvenc" || encoderPreference === "h264_nvenc";
      if (wantsNvenc && /\bh264_nvenc\b/i.test(encoders)) {
        const nvenc = { name: "h264_nvenc", label: `NVIDIA hardware H.264, CQ ${liveCq}` };
        if (await encoderWorks(nvenc)) return nvenc;
      }
      return { name: "libx264", label: `CPU H.264 fallback, CRF ${x264Crf}` };
    })();
  }
  return encoderProfilePromise;
}

async function lowerProcessPriority(pid) {
  if (process.platform !== "win32" || !pid) return;
  const safePriority = /^(Idle|BelowNormal)$/i.test(capturePriority) ? capturePriority : "Idle";
  try {
    await run("powershell.exe", [
      "-NoProfile",
      "-WindowStyle", "Hidden",
      "-Command",
      `$p = Get-Process -Id ${Number(pid)} -ErrorAction SilentlyContinue; if ($p) { $p.PriorityClass = '${safePriority}' }`
    ]);
  } catch {
    await log(`Could not lower ffmpeg priority for pid ${pid}; capture continues.`);
  }
}

function processIsAlive(pid) {
  const id = Number(pid);
  if (!Number.isFinite(id) || id <= 0) return false;
  try {
    process.kill(id, 0);
    return true;
  } catch {
    return false;
  }
}

async function acquireLock() {
  await fs.mkdir(analysisRoot, { recursive: true });
  try {
    const handle = await fs.open(lockPath, "wx");
    await handle.writeFile(String(process.pid), "utf8");
    await handle.close();
  } catch {
    const lockPid = (await fs.readFile(lockPath, "utf8").catch(() => "")).trim();
    const stat = await fs.stat(lockPath).catch(() => null);
    if ((lockPid && !processIsAlive(lockPid)) || (stat && Date.now() - stat.mtimeMs > 24 * 60 * 60 * 1000)) {
      await fs.unlink(lockPath).catch(() => {});
      return acquireLock();
    }
    await log("Live recorder already has a lock; exiting.");
    process.exit(0);
  }
}

async function releaseLock() {
  await fs.unlink(lockPath).catch(() => {});
}

async function gameIsRunning() {
  try {
    const stdout = await run("tasklist", ["/FI", "IMAGENAME eq League of Legends.exe", "/FO", "CSV", "/NH"]);
    return /League of Legends\.exe/i.test(stdout);
  } catch {
    return false;
  }
}

function stamp(date = new Date()) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

async function latestReplay(startMs, endMs) {
  const entries = await fs.readdir(replayDir, { withFileTypes: true }).catch(() => []);
  const candidates = [];
  for (const entry of entries) {
    if (!entry.isFile() || !/^NA1-\d+\.rofl$/i.test(entry.name)) continue;
    const filePath = path.join(replayDir, entry.name);
    const stat = await fs.stat(filePath).catch(() => null);
    if (!stat) continue;
    if (stat.mtimeMs < startMs - 10 * 60 * 1000 || stat.mtimeMs > endMs + 10 * 60 * 1000) continue;
    candidates.push({
      matchId: entry.name.replace(/\.rofl$/i, ""),
      mtimeMs: stat.mtimeMs,
      matchSource: "League replay file"
    });
  }
  return candidates.sort((a, b) => b.mtimeMs - a.mtimeMs)[0] || null;
}

async function leagueClientCredentials() {
  const text = (await fs.readFile(leagueLockfile, "utf8").catch(() => "")).trim();
  const parts = text.split(":");
  const port = Number(parts[2]);
  const password = parts[3];
  if (!Number.isFinite(port) || !password) return null;
  return { port, password };
}

async function localLeagueJson(endpoint) {
  const credentials = await leagueClientCredentials();
  if (!credentials) return null;
  return await new Promise((resolve) => {
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    const request = https.request({
      hostname: "127.0.0.1",
      port: credentials.port,
      path: endpoint,
      method: "GET",
      rejectUnauthorized: false,
      auth: `riot:${credentials.password}`,
      timeout: 3000
    }, (response) => {
      let body = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => {
        body += chunk;
      });
      response.on("end", () => {
        try {
          finish(JSON.parse(body));
        } catch {
          finish(null);
        }
      });
    });
    request.on("error", () => finish(null));
    request.on("timeout", () => {
      request.destroy();
      finish(null);
    });
    request.end();
  });
}

async function latestLocalMatch(startMs, endMs) {
  const history = await localLeagueJson("/lol-match-history/v1/products/lol/current-summoner/matches?begIndex=0&endIndex=10");
  const games = Array.isArray(history?.games?.games) ? history.games.games : [];
  const windowStart = startMs - 20 * 60 * 1000;
  const windowEnd = endMs + 10 * 60 * 1000;
  const candidates = games
    .map((game) => ({
      matchId: `NA1-${game.gameId}`,
      gameCreationMs: Number(game.gameCreation) || 0
    }))
    .filter((game) => /^NA1-\d+$/i.test(game.matchId))
    .filter((game) => game.gameCreationMs >= windowStart && game.gameCreationMs <= windowEnd)
    .sort((a, b) => b.gameCreationMs - a.gameCreationMs);
  return candidates[0] ? { matchId: candidates[0].matchId, matchSource: "League Client match history" } : null;
}

async function probeDuration(filePath) {
  const stdout = await run("ffprobe", [
    "-v", "error",
    "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1",
    filePath
  ]);
  return Number(stdout.trim()) || 0;
}

function captureModes() {
  if (/^(title|window|window-title)$/i.test(captureModePreference)) return ["title"];
  if (/^(region|window-region)$/i.test(captureModePreference)) return ["region"];
  return ["title", "region"];
}

async function leagueWindowRect() {
  if (process.platform !== "win32") return null;
  const script = `
$ErrorActionPreference = 'SilentlyContinue'
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public static class LeagueWindowCaptureNative {
  [StructLayout(LayoutKind.Sequential)]
  public struct RECT { public int Left; public int Top; public int Right; public int Bottom; }
  [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Auto)]
  public struct DEVMODE {
    private const int CCHDEVICENAME = 32;
    private const int CCHFORMNAME = 32;
    [MarshalAs(UnmanagedType.ByValTStr, SizeConst = CCHDEVICENAME)]
    public string dmDeviceName;
    public short dmSpecVersion;
    public short dmDriverVersion;
    public short dmSize;
    public short dmDriverExtra;
    public int dmFields;
    public int dmPositionX;
    public int dmPositionY;
    public int dmDisplayOrientation;
    public int dmDisplayFixedOutput;
    public short dmColor;
    public short dmDuplex;
    public short dmYResolution;
    public short dmTTOption;
    public short dmCollate;
    [MarshalAs(UnmanagedType.ByValTStr, SizeConst = CCHFORMNAME)]
    public string dmFormName;
    public short dmLogPixels;
    public int dmBitsPerPel;
    public int dmPelsWidth;
    public int dmPelsHeight;
  }
  [DllImport("user32.dll")]
  public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")]
  public static extern bool SetProcessDPIAware();
  [DllImport("user32.dll")]
  public static extern bool SetProcessDpiAwarenessContext(IntPtr dpiContext);
  [DllImport("dwmapi.dll")]
  public static extern int DwmGetWindowAttribute(IntPtr hwnd, int dwAttribute, out RECT pvAttribute, int cbAttribute);
  [DllImport("user32.dll")]
  public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);
  [DllImport("user32.dll", CharSet=CharSet.Auto)]
  public static extern bool EnumDisplaySettings(string deviceName, int modeNum, ref DEVMODE devMode);
}
"@
[void][LeagueWindowCaptureNative]::SetProcessDpiAwarenessContext([intptr](-4))
[void][LeagueWindowCaptureNative]::SetProcessDPIAware()
Add-Type -AssemblyName System.Windows.Forms
$p = Get-Process -ErrorAction SilentlyContinue | Where-Object { $_.ProcessName -eq 'League of Legends' -and $_.MainWindowHandle -ne 0 } | Select-Object -First 1
if (-not $p) { '{}'; exit 0 }
$r = New-Object LeagueWindowCaptureNative+RECT
$dwmRect = New-Object LeagueWindowCaptureNative+RECT
$dwmResult = [LeagueWindowCaptureNative]::DwmGetWindowAttribute($p.MainWindowHandle, 9, [ref]$dwmRect, [System.Runtime.InteropServices.Marshal]::SizeOf($dwmRect))
if ($dwmResult -eq 0 -and ($dwmRect.Right -gt $dwmRect.Left) -and ($dwmRect.Bottom -gt $dwmRect.Top)) {
  $r = $dwmRect
} else {
  [void][LeagueWindowCaptureNative]::GetWindowRect($p.MainWindowHandle, [ref]$r)
}
$screen = [System.Windows.Forms.Screen]::FromHandle($p.MainWindowHandle)
$mode = New-Object LeagueWindowCaptureNative+DEVMODE
$mode.dmSize = [System.Runtime.InteropServices.Marshal]::SizeOf($mode)
[void][LeagueWindowCaptureNative]::EnumDisplaySettings($screen.DeviceName, -1, [ref]$mode)
$scaleX = if ($screen.Bounds.Width -gt 0 -and $mode.dmPelsWidth -gt $screen.Bounds.Width) { $mode.dmPelsWidth / $screen.Bounds.Width } else { 1 }
$scaleY = if ($screen.Bounds.Height -gt 0 -and $mode.dmPelsHeight -gt $screen.Bounds.Height) { $mode.dmPelsHeight / $screen.Bounds.Height } else { 1 }
$width = $r.Right - $r.Left
$height = $r.Bottom - $r.Top
if ($scaleX -gt 1 -and $width -le ($screen.Bounds.Width + 8)) {
  $r.Left = [int][math]::Round($r.Left * $scaleX)
  $r.Right = [int][math]::Round($r.Right * $scaleX)
}
if ($scaleY -gt 1 -and $height -le ($screen.Bounds.Height + 8)) {
  $r.Top = [int][math]::Round($r.Top * $scaleY)
  $r.Bottom = [int][math]::Round($r.Bottom * $scaleY)
}
[pscustomobject]@{
  left = $r.Left
  top = $r.Top
  right = $r.Right
  bottom = $r.Bottom
  width = ($r.Right - $r.Left)
  height = ($r.Bottom - $r.Top)
  title = $p.MainWindowTitle
  logicalScreen = "$($screen.Bounds.Width)x$($screen.Bounds.Height)"
  physicalScreen = "$($mode.dmPelsWidth)x$($mode.dmPelsHeight)"
  dpiScale = "$scaleX,$scaleY"
  isForeground = ([LeagueWindowCaptureNative]::GetForegroundWindow() -eq $p.MainWindowHandle)
} | ConvertTo-Json -Compress
`;
  const rectStdout = await run("powershell.exe", [
    "-NoProfile",
    "-WindowStyle", "Hidden",
    "-Command", script
  ]).catch(() => "");
  try {
    const rect = JSON.parse(rectStdout.trim() || "{}");
    const width = Number(rect.width);
    const height = Number(rect.height);
    if (!Number.isFinite(width) || !Number.isFinite(height) || width < 320 || height < 240) return null;
    return {
      left: Math.max(0, Math.round(Number(rect.left) || 0)),
      top: Math.max(0, Math.round(Number(rect.top) || 0)),
      width: Math.round(width),
      height: Math.round(height),
      title: String(rect.title || ""),
      isForeground: Boolean(rect.isForeground),
      logicalScreen: String(rect.logicalScreen || ""),
      physicalScreen: String(rect.physicalScreen || ""),
      dpiScale: String(rect.dpiScale || "")
    };
  } catch {
    return null;
  }
}

async function nextSegmentIndex(sessionRoot) {
  const entries = await fs.readdir(sessionRoot, { withFileTypes: true }).catch(() => []);
  const indexes = entries
    .map((entry) => entry.isFile() ? Number(entry.name.match(/^segment-(\d+)\.mkv$/i)?.[1]) : NaN)
    .filter((index) => Number.isFinite(index));
  return indexes.length ? Math.max(...indexes) + 1 : 0;
}

async function segmentFootprint(sessionRoot) {
  const entries = await fs.readdir(sessionRoot, { withFileTypes: true }).catch(() => []);
  let bytes = 0;
  let count = 0;
  for (const entry of entries) {
    if (!entry.isFile() || !/^segment-\d+\.mkv$/i.test(entry.name)) continue;
    const stat = await fs.stat(path.join(sessionRoot, entry.name)).catch(() => null);
    if (!stat) continue;
    bytes += stat.size;
    count += 1;
  }
  return { bytes, count };
}

async function startCaptureChild(sessionRoot, startNumber = 0, mode = "title") {
  const outputPattern = path.join(sessionRoot, "segment-%04d.mkv");
  const encoder = await encoderProfile();
  const filters = [];
  let inputTarget = captureWindowTitle ? `title=${captureWindowTitle}` : "desktop";
  let inputArgs = ["-i", inputTarget];
  let captureMode = mode;
  let captureRect = null;
  if (mode === "region") {
    const rect = await leagueWindowRect();
    if (rect?.isForeground) {
      captureRect = rect;
      inputTarget = `desktop region ${rect.left},${rect.top} ${rect.width}x${rect.height}`;
      inputArgs = [
        "-offset_x", String(rect.left),
        "-offset_y", String(rect.top),
        "-video_size", `${rect.width}x${rect.height}`,
        "-i", "desktop"
      ];
    } else {
      const reason = rect ? "League window is not foreground" : "League window rectangle is unavailable";
      throw new Error(`${reason}; waiting instead of capturing desktop content.`);
    }
  }
  if (captureScale && !/^(0|none|off)$/i.test(captureScale)) {
    filters.push(`scale=${captureScale}:flags=fast_bilinear`);
  }
  await fs.mkdir(sessionRoot, { recursive: true });
  const args = [
    "-y",
    "-hide_banner",
    "-loglevel", "error",
    "-f", "gdigrab",
    "-framerate", fps,
    "-rtbufsize", "64M",
    "-draw_mouse", "1",
    ...inputArgs,
    "-an",
    ...(filters.length ? ["-vf", filters.join(",")] : []),
    ...encoderArgs(encoder, "capture"),
    "-force_key_frames", `expr:gte(t,n_forced*${segmentSeconds})`,
    "-f", "segment",
    "-segment_time", String(segmentSeconds),
    "-segment_format", "matroska",
    "-segment_start_number", String(startNumber),
    "-break_non_keyframes", "1",
    "-reset_timestamps", "1",
    outputPattern
  ];
  const child = spawn("ffmpeg", args, {
    cwd: appRoot,
    windowsHide: true,
    stdio: ["pipe", "ignore", "pipe"]
  });
  child.stderr.on("data", (chunk) => {
    fs.appendFile(path.join(sessionRoot, "ffmpeg.log"), chunk).catch(() => {});
  });
  child.once("exit", (code, signal) => {
    child.exited = true;
    child.exitCode = code;
    child.exitSignal = signal;
    if (code || signal) {
      fs.appendFile(path.join(sessionRoot, "ffmpeg.log"), `\nffmpeg exited with code ${code ?? ""} signal ${signal ?? ""}\n`).catch(() => {});
    }
  });
  await lowerProcessPriority(child.pid);
  const rectNote = captureRect
    ? `, rect ${captureRect.width}x${captureRect.height}, screen ${captureRect.logicalScreen}/${captureRect.physicalScreen}, dpi ${captureRect.dpiScale}`
    : "";
  await log(`Started low-impact League window capture in ${sessionRoot} using ${encoder.label} at ${fps} fps, ${captureScale || "source"} scale, ${capturePriority} priority, mode ${captureMode}, input ${inputTarget}${rectNote}, segment ${startNumber}.`);
  return { child, encoder: encoder.name, inputTarget, captureMode, captureRect };
}

async function startSession() {
  const startedAt = new Date();
  const sessionRoot = path.join(captureRoot, stamp(startedAt));
  const modes = captureModes();
  const capture = await startCaptureChild(sessionRoot, 0, modes[0]);
  const session = {
    sessionRoot,
    child: capture.child,
    encoder: capture.encoder,
    inputTarget: capture.inputTarget,
    captureMode: capture.captureMode,
    captureRect: capture.captureRect,
    captureModes: modes,
    startedAt,
    startedMs: startedAt.getTime(),
    lastSeenMs: Date.now(),
    lastSegmentBytes: 0,
    lastSegmentGrowthMs: Date.now(),
    pausedForForeground: false,
    foregroundPauseMs: 0,
    foregroundPauseStartedMs: null,
    resumeAfterForegroundPause: false,
    captureRestarts: 0
  };
  await publishRecorderStatus("recording", sessionStatusFields(session, "Capture is active. The finished review will publish after the game ends."), { force: true });
  return session;
}

async function stopCaptureChild(child, graceMs = 5000) {
  if (!child || child.exited || child.killed) return;
  child.stdin?.write("q");
  child.stdin?.end();
  await Promise.race([
    new Promise((resolve) => child.once("exit", resolve)),
    delay(graceMs).then(() => {
      if (!child.killed) child.kill("SIGTERM");
    })
  ]);
  child.exited = true;
}

async function restartCaptureIfNeeded(session) {
  if (session.captureMode === "region") {
    const rect = await leagueWindowRect();
    if (!rect?.isForeground) {
      if (!session.pausedForForeground) {
        await log("League window is not foreground; pausing capture so desktop/browser content is not recorded.");
        await publishRecorderStatus("paused", sessionStatusFields(session, "Region fallback is paused while League is not foreground."), { force: true });
        session.pausedForForeground = true;
        session.foregroundPauseStartedMs = Date.now();
      }
      await stopCaptureChild(session.child);
      session.lastSegmentGrowthMs = Date.now();
      return;
    }
    if (session.pausedForForeground) {
      session.foregroundPauseMs += Date.now() - Number(session.foregroundPauseStartedMs || Date.now());
      session.foregroundPauseStartedMs = null;
      session.pausedForForeground = false;
      session.resumeAfterForegroundPause = true;
      session.child.exited = true;
      await log("League window is foreground again; resuming capture.");
      await publishRecorderStatus("recording", sessionStatusFields(session, "League is foreground again. Capture is resuming."), { force: true });
    }
  }
  await publishRecorderStatus("recording", sessionStatusFields(session, "Capture is active. The finished review will publish after the game ends."), { throttleMs: 30000 });
  const footprint = await segmentFootprint(session.sessionRoot);
  if (footprint.bytes > session.lastSegmentBytes + minCaptureGrowthBytes) {
    session.lastSegmentBytes = footprint.bytes;
    session.lastSegmentGrowthMs = Date.now();
  }
  if (!session.child?.exited && Date.now() - session.lastSegmentGrowthMs > captureStallMs) {
    await log(`League capture has not produced new video data for ${Math.round(captureStallMs / 1000)}s; restarting capture.`);
    session.child.kill("SIGTERM");
    await Promise.race([
      new Promise((resolve) => session.child.once("exit", resolve)),
      delay(5000)
    ]);
    session.child.exited = true;
  }
  if (!session?.child?.exited) return;
  const resumeAfterForegroundPause = Boolean(session.resumeAfterForegroundPause);
  session.resumeAfterForegroundPause = false;
  if (!resumeAfterForegroundPause && session.captureRestarts >= maxCaptureRestarts) {
    await log("League capture stopped too many times during the same game; keeping existing segments and waiting for game end.");
    return;
  }
  if (!resumeAfterForegroundPause) {
    session.captureRestarts += 1;
  }
  const startNumber = await nextSegmentIndex(session.sessionRoot);
  const modes = session.captureModes?.length ? session.captureModes : captureModes();
  const mode = resumeAfterForegroundPause
    ? session.captureMode || modes[0] || "region"
    : modes[Math.min(session.captureRestarts, modes.length - 1)] || modes[0] || "title";
  const restartReason = resumeAfterForegroundPause
    ? "League window is foreground again; capture is resuming"
    : "League window capture stopped while game is still running; restarting capture";
  await log(`${restartReason} at segment ${startNumber} with ${mode} mode.`);
  const capture = await startCaptureChild(session.sessionRoot, startNumber, mode);
  session.child = capture.child;
  session.encoder = capture.encoder;
  session.inputTarget = capture.inputTarget;
  session.captureMode = capture.captureMode;
  session.captureRect = capture.captureRect;
  session.lastSegmentBytes = footprint.bytes;
  session.lastSegmentGrowthMs = Date.now();
  await publishRecorderStatus("recording", sessionStatusFields(session, "Capture restarted and is active."), { force: true });
}

async function waitForNoGame(reason) {
  let logged = false;
  while (await gameIsRunning()) {
    if (!logged) {
      await log(`${reason}; waiting because a League game is running.`);
      logged = true;
    }
    await delay(10000);
  }
}

async function stopSession(session) {
  await log("Stopping League screen capture.");
  await publishRecorderStatus("processing", sessionStatusFields(session, "Game ended. Building the review clip now."), { force: true });
  session.endedAt = new Date();
  session.endedMs = session.endedAt.getTime();
  if (session.pausedForForeground && session.foregroundPauseStartedMs) {
    session.foregroundPauseMs += Date.now() - Number(session.foregroundPauseStartedMs || Date.now());
    session.foregroundPauseStartedMs = null;
  }
  await stopCaptureChild(session.child, 20000);
}

async function writeConcatList(listPath, files) {
  const text = files
    .map((file) => `file '${file.replace(/\\/g, "/").replace(/'/g, "'\\''")}'`)
    .join("\n");
  await fs.writeFile(listPath, `${text}\n`, "utf8");
}

function importantSegmentIndexes(segments) {
  const usable = segments.filter((item) => item.size > 160 * 1024);
  if (!usable.length) return new Set(segments.map((item) => item.index));
  const median = [...usable].sort((a, b) => a.size - b.size)[Math.floor(usable.length / 2)]?.size || 1;
  const top = [...usable]
    .sort((a, b) => b.size - a.size)
    .filter((item, index) => index < 8 || item.size > median * 1.12);
  const byIndex = new Map(segments.map((item) => [item.index, item]));
  const selected = new Set();
  for (const item of top) {
    for (const index of [item.index - 1, item.index, item.index + 1]) {
      if (byIndex.has(index)) selected.add(index);
    }
  }
  return selected;
}

async function processSegment(segment, importantIndexes, sessionRoot) {
  const isImportant = importantIndexes.has(segment.index);
  const speed = isImportant ? 1 : Math.max(1, fastForwardSpeed);
  const encoder = await encoderProfile();
  const outputPath = path.join(sessionRoot, `processed-${String(segment.index).padStart(4, "0")}.mp4`);
  await run("ffmpeg", [
    "-y",
    "-hide_banner",
    "-loglevel", "error",
    "-i", segment.filePath,
    "-vf", `setpts=PTS/${speed},fps=${fps}`,
    "-an",
    ...encoderArgs(encoder, "review"),
    "-movflags", "+faststart",
    outputPath
  ]);
  return {
    ...segment,
    outputPath,
    speed,
    important: isImportant
  };
}

async function nextOutputPath(matchId) {
  const safeMatch = matchId && /^NA1-\d+$/i.test(matchId) ? matchId.toUpperCase() : `NA1-${Date.now()}`;
  for (let index = 1; index <= 99; index += 1) {
    const name = `auto_${safeMatch}_${String(index).padStart(2, "0")}.mp4`;
    const filePath = path.join(sourceDir, name);
    if (!(await fs.stat(filePath).catch(() => null))) return filePath;
  }
  throw new Error(`Could not allocate output filename for ${safeMatch}`);
}

async function finalizeSession(session) {
  const elapsedSeconds = Math.round((session.endedMs - session.startedMs) / 1000);
  const foregroundPauseSeconds = Math.round(Number(session.foregroundPauseMs || 0) / 1000);
  const expectedForegroundSeconds = Math.max(minGameSeconds, elapsedSeconds - foregroundPauseSeconds);
  if (elapsedSeconds < minGameSeconds) {
    await log(`Capture was ${elapsedSeconds}s, below ${minGameSeconds}s; keeping raw segments only.`);
    await publishRecorderStatus("blocked", sessionStatusFields(session, `Capture was ${elapsedSeconds}s, below the ${minGameSeconds}s minimum. No review clip was created.`), { force: true });
    return;
  }
  const entries = await fs.readdir(session.sessionRoot, { withFileTypes: true });
  const segments = [];
  for (const entry of entries) {
    if (!entry.isFile() || !/^segment-\d+\.mkv$/i.test(entry.name)) continue;
    const filePath = path.join(session.sessionRoot, entry.name);
    const stat = await fs.stat(filePath);
    const index = Number(entry.name.match(/segment-(\d+)/i)?.[1]) || 0;
    const duration = await probeDuration(filePath).catch(() => 0);
    segments.push({ filePath, size: stat.size, duration, index });
  }
  segments.sort((a, b) => a.index - b.index);
  if (!segments.length) {
    await log("No usable segments were created.");
    await publishRecorderStatus("blocked", sessionStatusFields(session, "No usable video segments were created. No review clip was published."), { force: true });
    return;
  }
  const usableSegments = segments.filter((item) => item.size >= minCaptureSegmentBytes);
  const estimatedCoverageSeconds = usableSegments.reduce((sum, item) => sum + (Number(item.duration) || segmentSeconds), 0);
  if (estimatedCoverageSeconds < expectedForegroundSeconds * minCaptureCoverage) {
    await log(`Capture incomplete: ${usableSegments.length}/${segments.length} usable segments cover about ${Math.round(estimatedCoverageSeconds)}s of ${expectedForegroundSeconds}s foreground time (${elapsedSeconds}s game, ${foregroundPauseSeconds}s paused). Not creating a misleading auto review clip.`);
    await publishRecorderStatus("blocked", sessionStatusFields(session, "Capture looked incomplete, so it was rejected instead of publishing a misleading review."), { force: true });
    return;
  }

  const replay = await latestReplay(session.startedMs, session.endedMs) || await latestLocalMatch(session.startedMs, session.endedMs);
  const outputPath = await nextOutputPath(replay?.matchId);
  const importantIndexes = importantSegmentIndexes(segments);
  const processed = [];
  for (const segment of segments) {
    await waitForNoGame("Post-game video processing paused");
    processed.push(await processSegment(segment, importantIndexes, session.sessionRoot));
  }
  const listPath = path.join(session.sessionRoot, "processed.txt");
  const joinedPath = path.join(session.sessionRoot, "processed.mp4");
  await writeConcatList(listPath, processed.map((item) => item.outputPath));
  await waitForNoGame("Post-game video join paused");
  await run("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", listPath, "-c", "copy", joinedPath]);
  await fs.mkdir(sourceDir, { recursive: true });
  const encoder = await encoderProfile();
  await waitForNoGame("Post-game final encode paused");
  await run("ffmpeg", [
    "-y",
    "-hide_banner",
    "-loglevel", "error",
    "-i", joinedPath,
    ...encoderArgs(encoder, "review"),
    "-an",
    "-movflags", "+faststart",
    outputPath
  ]);
  const duration = await probeDuration(outputPath);
  const sidecar = {
    createdAt: new Date().toISOString(),
    source: "AO Labs League live recorder",
    matchId: replay?.matchId || "",
    matchSource: replay?.matchSource || "",
    startedAt: session.startedAt.toISOString(),
    endedAt: session.endedAt.toISOString(),
    outputPath,
    durationSeconds: duration,
    sourceDurationSeconds: elapsedSeconds,
    encoder: encoder.name,
    videoQuality: encoder.name === "h264_nvenc" ? `capture CQ ${liveCaptureCq}, review CQ ${liveCq}` : `capture CRF ${x264CaptureCrf}, review CRF ${x264Crf}`,
    segmentSeconds,
    fastForwardSpeed,
    captureFps: Number(fps),
    captureScale,
    capturePriority,
    captureInput: session.inputTarget,
    captureMode: session.captureMode,
    captureRect: session.captureRect || null,
    foregroundPauseSeconds,
    expectedForegroundSeconds,
    allSegmentsPreserved: true,
    segments: processed.map((item) => ({
      index: item.index,
      size: item.size,
      durationSeconds: Math.round(Number(item.duration || 0) * 1000) / 1000,
      speed: item.speed,
      important: item.important
    })),
    validForPublish: true,
    privacyPolicy: "Default capture records the League game window by title so alt-tabbing does not stop the match recording. Region capture is only an explicit fallback and pauses instead of recording desktop/browser content.",
    inputPolicy: "Screen and mouse cursor are recorded. Raw keyboard text is not logged."
  };
  await fs.writeFile(path.join(session.sessionRoot, "review-clip.json"), `${JSON.stringify(sidecar, null, 2)}\n`, "utf8");
  await fs.writeFile(`${outputPath}.json`, `${JSON.stringify(sidecar, null, 2)}\n`, "utf8");
  await log(`Created review clip ${outputPath}`);

  if (publishAfterGame) {
    await waitForNoGame("Publishing paused");
    await log("Publishing updated League recordings.");
    await publishRecorderStatus("publishing", {
      ...sessionStatusFields(session, "Review clip created. Publishing to league.aolabs.io now."),
      matchId: replay?.matchId || ""
    }, { force: true });
    await run(npmBin, ["run", "publish:recordings"]);
    await publishRecorderStatus("published", {
      ...sessionStatusFields(session, "Review clip handed to the publisher. It should appear after the deploy finishes."),
      matchId: replay?.matchId || ""
    }, { force: true });
  } else {
    await publishRecorderStatus("published", sessionStatusFields(session, "Review clip created locally. Auto-publish is disabled."), { force: true });
  }
}

async function main() {
  await acquireLock();
  process.on("exit", () => {
    fs.unlink(lockPath).catch(() => {});
  });
  process.on("SIGINT", async () => {
    await releaseLock();
    process.exit(0);
  });

  await log("League live recorder is watching for game process.");
  await publishRecorderStatus("watching", {
    label: "watching for League",
    detail: "Recorder is running. It will switch to recording when the game process starts.",
    mode: captureModePreference
  }, { force: true });
  let session = null;
  while (true) {
    const running = await gameIsRunning();
    if (running && !session) {
      try {
        session = await startSession();
      } catch (error) {
        await log(`Capture waiting: ${error.message}`);
        await publishRecorderStatus("waiting", {
          label: "waiting for League window",
          detail: "Game process is running, but capture has not started yet.",
          mode: captureModePreference
        }, { force: true });
      }
    }
    if (running && session) {
      session.lastSeenMs = Date.now();
      await restartCaptureIfNeeded(session);
    }
    if (!running && session && Date.now() - session.lastSeenMs > endGraceMs) {
      const current = session;
      session = null;
      try {
        await stopSession(current);
        await finalizeSession(current);
      } catch (error) {
        await log(`Finalize failed: ${error.message}`);
        await publishRecorderStatus("error", sessionStatusFields(current, "Post-game processing failed. Check recorder log."), { force: true });
      }
    }
    if (!running && !session) {
      await publishRecorderStatus("watching", {
        label: "watching for League",
        detail: "Recorder is running. It will switch to recording when the game process starts.",
        mode: captureModePreference
      }, { throttleMs: 60000 });
    }
    await delay(pollMs);
  }
}

main().catch(async (error) => {
  await log(`Live recorder failed: ${error.stack || error.message}`);
  await publishRecorderStatus("error", {
    label: "recorder error",
    detail: "The live recorder stopped unexpectedly.",
    mode: captureModePreference
  }, { force: true }).catch(() => {});
  await releaseLock();
  process.exitCode = 1;
});
