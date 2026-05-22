Set fso = CreateObject("Scripting.FileSystemObject")
Set shell = CreateObject("WScript.Shell")

scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
appRoot = fso.GetParentFolderName(scriptDir)
powerShell = shell.ExpandEnvironmentStrings("%SystemRoot%") & "\System32\WindowsPowerShell\v1.0\powershell.exe"
publisher = fso.BuildPath(scriptDir, "publish-recordings.ps1")

shell.CurrentDirectory = appRoot
command = """" & powerShell & """ -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File """ & publisher & """"
exitCode = shell.Run(command, 0, True)
WScript.Quit exitCode
