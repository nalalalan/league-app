$ErrorActionPreference = "Stop"

$AppRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$Node = (Get-Command node.exe).Source
$TaskName = "AO Labs League live recorder"
$Script = Join-Path $AppRoot "tools\league-live-recorder.mjs"

$Action = New-ScheduledTaskAction `
  -Execute $Node `
  -Argument "`"$Script`"" `
  -WorkingDirectory $AppRoot

$Trigger = New-ScheduledTaskTrigger -AtLogOn
$Settings = New-ScheduledTaskSettingsSet `
  -MultipleInstances IgnoreNew `
  -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries `
  -RestartCount 3 `
  -RestartInterval (New-TimeSpan -Minutes 1)

Register-ScheduledTask `
  -TaskName $TaskName `
  -Action $Action `
  -Trigger $Trigger `
  -Settings $Settings `
  -Description "Watches for League of Legends games, records one local review clip, and publishes it to league.aolabs.io." `
  -Force | Out-Null

Start-ScheduledTask -TaskName $TaskName
Get-ScheduledTask -TaskName $TaskName | Select-Object TaskName, State
