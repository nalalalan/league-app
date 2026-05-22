$ErrorActionPreference = "Stop"

$AppRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$Node = (Get-Command node.exe).Source
$PowerShell = Join-Path $env:SystemRoot "System32\WindowsPowerShell\v1.0\powershell.exe"
$WScript = Join-Path $env:SystemRoot "System32\wscript.exe"
$StartupDir = [Environment]::GetFolderPath("Startup")

$RecorderTaskName = "AO Labs League live recorder"
$PublisherTaskName = "AO Labs League recording publisher"
$RecorderScript = Join-Path $AppRoot "tools\league-live-recorder.mjs"
$RecorderStartScript = Join-Path $AppRoot "tools\start-live-recorder.ps1"
$PublisherScript = Join-Path $AppRoot "tools\publish-recordings.ps1"
$PublisherHiddenScript = Join-Path $AppRoot "tools\run-publish-recordings-hidden.vbs"

function Quote-Vbs([string]$Value) {
  return $Value.Replace('"', '""')
}

function Install-StartupVbs([string]$Name, [string]$Command, [string]$WorkingDirectory) {
  New-Item -ItemType Directory -Force -Path $StartupDir | Out-Null
  $Path = Join-Path $StartupDir "$Name.vbs"
  $Body = @"
Set shell = CreateObject("WScript.Shell")
shell.CurrentDirectory = "$(Quote-Vbs $WorkingDirectory)"
shell.Run "$(Quote-Vbs $Command)", 0, False
"@
  Set-Content -LiteralPath $Path -Value $Body -Encoding ASCII
  return $Path
}

function Try-RegisterTask($Name, $Action, $Trigger, $Settings, [string]$Description) {
  try {
    Register-ScheduledTask `
      -TaskName $Name `
      -Action $Action `
      -Trigger $Trigger `
      -Settings $Settings `
      -Description $Description `
      -Force | Out-Null
    return $true
  } catch {
    Write-Host "Scheduled task unavailable for ${Name}: $($_.Exception.Message)"
    return $false
  }
}

$LongRunningSettings = New-ScheduledTaskSettingsSet `
  -MultipleInstances IgnoreNew `
  -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries `
  -StartWhenAvailable `
  -RestartCount 3 `
  -RestartInterval (New-TimeSpan -Minutes 1) `
  -ExecutionTimeLimit (New-TimeSpan -Seconds 0)

$RecorderAction = New-ScheduledTaskAction `
  -Execute $PowerShell `
  -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$RecorderStartScript`"" `
  -WorkingDirectory $AppRoot

$RecorderTrigger = New-ScheduledTaskTrigger -AtLogOn
$RecorderTaskOk = Try-RegisterTask `
  -Name $RecorderTaskName `
  -Action $RecorderAction `
  -Trigger $RecorderTrigger `
  -Settings $LongRunningSettings `
  -Description "Watches for League of Legends games, captures the screen at low priority, creates one review clip, and hands it to league.aolabs.io."

if (-not $RecorderTaskOk) {
  $RecorderCommand = "`"$PowerShell`" -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$RecorderStartScript`""
  $RecorderStartup = Install-StartupVbs -Name "AO Labs League live recorder" -Command $RecorderCommand -WorkingDirectory $AppRoot
  Write-Host "Installed startup recorder: $RecorderStartup"
}

$PublisherAction = New-ScheduledTaskAction `
  -Execute $WScript `
  -Argument "//B //Nologo `"$PublisherHiddenScript`"" `
  -WorkingDirectory $AppRoot

$PublisherTrigger = New-ScheduledTaskTrigger `
  -Once `
  -At (Get-Date).AddMinutes(1) `
  -RepetitionInterval (New-TimeSpan -Minutes 5) `
  -RepetitionDuration (New-TimeSpan -Days 3650)

$PublisherSettings = New-ScheduledTaskSettingsSet `
  -MultipleInstances IgnoreNew `
  -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries `
  -StartWhenAvailable `
  -ExecutionTimeLimit (New-TimeSpan -Hours 2)

$PublisherTaskOk = Try-RegisterTask `
  -Name $PublisherTaskName `
  -Action $PublisherAction `
  -Trigger $PublisherTrigger `
  -Settings $PublisherSettings `
  -Description "Publishes League recordings and retries fallback analysis so league.aolabs.io updates without Codex prompting."

if (-not $PublisherTaskOk -and -not (Get-ScheduledTask -TaskName $PublisherTaskName -ErrorAction SilentlyContinue)) {
  $PublisherLoop = "while (`$true) { & `"$WScript`" //B //Nologo `"$PublisherHiddenScript`"; Start-Sleep -Seconds 300 }"
  $PublisherCommand = "`"$PowerShell`" -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -Command `"$PublisherLoop`""
  $PublisherStartup = Install-StartupVbs -Name "AO Labs League recording publisher" -Command $PublisherCommand -WorkingDirectory $AppRoot
  Write-Host "Installed startup publisher loop: $PublisherStartup"
}

if ($RecorderTaskOk) {
  if ((Get-ScheduledTask -TaskName $RecorderTaskName).State -ne "Running") {
    Start-ScheduledTask -TaskName $RecorderTaskName
  }
} else {
  $ExistingRecorder = Get-CimInstance Win32_Process |
    Where-Object { $_.CommandLine -match [regex]::Escape($RecorderScript) } |
    Select-Object -First 1
  if (-not $ExistingRecorder) {
    Start-Process -FilePath $PowerShell -ArgumentList "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$RecorderStartScript`"" -WorkingDirectory $AppRoot -WindowStyle Hidden
  }
}

if ($PublisherTaskOk) {
  Start-ScheduledTask -TaskName $PublisherTaskName
} else {
  Start-Process -FilePath $WScript -ArgumentList "//B //Nologo `"$PublisherHiddenScript`"" -WorkingDirectory $AppRoot -WindowStyle Hidden
}

@($RecorderTaskName, $PublisherTaskName) |
  ForEach-Object { Get-ScheduledTask -TaskName $_ -ErrorAction SilentlyContinue } |
  Select-Object TaskName, State
