$ErrorActionPreference = "Stop"

$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
$LogDir = Join-Path $Root "_recording-analysis"
$LogPath = Join-Path $LogDir "publish-recordings.log"
$Node = (Get-Command node.exe).Source

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
Set-Location $Root

$statusToken = [Environment]::GetEnvironmentVariable('LEAGUE_STATUS_TOKEN','User')
if (-not $statusToken) { $statusToken = [Environment]::GetEnvironmentVariable('LEAGUE_STATUS_TOKEN','Machine') }
if ($statusToken) { $env:LEAGUE_STATUS_TOKEN = $statusToken }

"[$((Get-Date).ToString("o"))] start League recording publish" | Add-Content -LiteralPath $LogPath

$OutPath = Join-Path $LogDir "publish-recordings.stdout.tmp"
$ErrPath = Join-Path $LogDir "publish-recordings.stderr.tmp"
Remove-Item -LiteralPath $OutPath, $ErrPath -Force -ErrorAction SilentlyContinue

$Process = Start-Process `
  -FilePath $Node `
  -ArgumentList @("tools\publish-recordings.mjs") `
  -WorkingDirectory $Root `
  -WindowStyle Hidden `
  -RedirectStandardOutput $OutPath `
  -RedirectStandardError $ErrPath `
  -Wait `
  -PassThru

if (Test-Path -LiteralPath $OutPath) {
  Get-Content -LiteralPath $OutPath -ErrorAction SilentlyContinue | Add-Content -LiteralPath $LogPath
}
if (Test-Path -LiteralPath $ErrPath) {
  Get-Content -LiteralPath $ErrPath -ErrorAction SilentlyContinue | Add-Content -LiteralPath $LogPath
}
Remove-Item -LiteralPath $OutPath, $ErrPath -Force -ErrorAction SilentlyContinue

$ExitCode = $Process.ExitCode

"[$((Get-Date).ToString("o"))] done League recording publish exit=$ExitCode" | Add-Content -LiteralPath $LogPath
exit $ExitCode
