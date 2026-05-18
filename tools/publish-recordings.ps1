$ErrorActionPreference = "Stop"

$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
$LogDir = Join-Path $Root "_recording-analysis"
$LogPath = Join-Path $LogDir "publish-recordings.log"

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
Set-Location $Root

"[$((Get-Date).ToString("o"))] start League recording publish" | Add-Content -LiteralPath $LogPath

& npm.cmd run publish:recordings *>> $LogPath
$ExitCode = $LASTEXITCODE

"[$((Get-Date).ToString("o"))] done League recording publish exit=$ExitCode" | Add-Content -LiteralPath $LogPath
exit $ExitCode
