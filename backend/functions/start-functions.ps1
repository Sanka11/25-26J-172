$scriptPath = Join-Path $PSScriptRoot "..\scripts\start-functions.ps1"

if (-not (Test-Path $scriptPath)) {
  throw "Could not find launcher script at: $scriptPath"
}

powershell -NoProfile -ExecutionPolicy Bypass -File $scriptPath
