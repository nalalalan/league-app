$ErrorActionPreference = "Stop"

$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
$LogDir = Join-Path $Root "_recording-analysis"
$LogPath = Join-Path $LogDir "publish-recordings.log"

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
Set-Location $Root

$statusToken = [Environment]::GetEnvironmentVariable('LEAGUE_STATUS_TOKEN','User')
if (-not $statusToken) { $statusToken = [Environment]::GetEnvironmentVariable('LEAGUE_STATUS_TOKEN','Machine') }
if ($statusToken) { $env:LEAGUE_STATUS_TOKEN = $statusToken }

"[$((Get-Date).ToString("o"))] start League recording publish" | Add-Content -LiteralPath $LogPath

$Command = "npm.cmd run publish:recordings >> `"$LogPath`" 2>&1"
& cmd.exe /d /c $Command
$ExitCode = $LASTEXITCODE

"[$((Get-Date).ToString("o"))] done League recording publish exit=$ExitCode" | Add-Content -LiteralPath $LogPath
exit $ExitCode
