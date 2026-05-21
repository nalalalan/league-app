$ErrorActionPreference = "Stop"

$AppRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$Node = (Get-Command node.exe).Source
$RecorderScript = Join-Path $AppRoot "tools\league-live-recorder.mjs"
$StartLog = Join-Path $AppRoot "_recording-analysis\start-live-recorder.log"

Set-Location $AppRoot
New-Item -ItemType Directory -Force -Path (Split-Path $StartLog) | Out-Null

$statusToken = [Environment]::GetEnvironmentVariable('LEAGUE_STATUS_TOKEN','User')
if (-not $statusToken) { $statusToken = [Environment]::GetEnvironmentVariable('LEAGUE_STATUS_TOKEN','Machine') }
if ($statusToken) { $env:LEAGUE_STATUS_TOKEN = $statusToken }

$env:LEAGUE_LIVE_CAPTURE_MODE = 'desktop'
$env:LEAGUE_LIVE_POLL_MS = '1000'
$env:LEAGUE_LIVE_SEGMENT_SECONDS = '10'
$env:LEAGUE_LIVE_FPS = '4'
$env:LEAGUE_LIVE_CAPTURE_SCALE = '1440:-2'
$env:LEAGUE_LIVE_CAPTURE_CQ = '24'
$env:LEAGUE_LIVE_CAPTURE_BITRATE = '8000k'
$env:LEAGUE_LIVE_CAPTURE_MAXRATE = '10000k'
$env:LEAGUE_LIVE_CAPTURE_BUFSIZE = '12000k'

Add-Content -LiteralPath $StartLog -Value "$(Get-Date -Format o) starting League recorder with fps=$($env:LEAGUE_LIVE_FPS), scale=$($env:LEAGUE_LIVE_CAPTURE_SCALE), cq=$($env:LEAGUE_LIVE_CAPTURE_CQ), segment=$($env:LEAGUE_LIVE_SEGMENT_SECONDS)"
& $Node $RecorderScript
