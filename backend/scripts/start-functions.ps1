param(
  [int]$Port = 5002,
  [string]$HostAddress = "127.0.0.1"
)

$ErrorActionPreference = "Stop"

function Stop-ProcessesByPort {
  param([int]$TargetPort)

  $connections = Get-NetTCPConnection -LocalPort $TargetPort -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess -Unique

  if (-not $connections) {
    Write-Host "No active process found on port $TargetPort" -ForegroundColor DarkGray
    return
  }

  foreach ($procId in $connections) {
    if ($procId -eq 0) { continue }
    try {
      $proc = Get-Process -Id $procId -ErrorAction Stop
      Write-Host "Stopping process on port $TargetPort -> PID=$procId Name=$($proc.ProcessName)" -ForegroundColor Yellow
      Stop-Process -Id $procId -Force -ErrorAction Stop
    } catch {
      Write-Host "Could not stop PID=${procId}: $($_.Exception.Message)" -ForegroundColor DarkYellow
    }
  }
}

function Stop-StaleFirebaseProcesses {
  $stale = Get-CimInstance Win32_Process -Filter "Name='node.exe'" |
    Where-Object {
      $_.CommandLine -and
      $_.CommandLine -match "firebase\.js" -and
      $_.CommandLine -match "emulators:start" -and
      $_.CommandLine -match "functions"
    }

  if (-not $stale) {
    Write-Host "No stale Firebase emulator process found" -ForegroundColor DarkGray
    return
  }

  foreach ($proc in $stale) {
    try {
      Write-Host "Stopping stale Firebase process -> PID=$($proc.ProcessId)" -ForegroundColor Yellow
      Stop-Process -Id $proc.ProcessId -Force -ErrorAction Stop
    } catch {
      Write-Host "Could not stop stale Firebase PID=$($proc.ProcessId): $($_.Exception.Message)" -ForegroundColor DarkYellow
    }
  }
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Split-Path -Parent $scriptDir

Write-Host "Preparing Firebase Functions emulator on $HostAddress`:$Port" -ForegroundColor Cyan

Stop-ProcessesByPort -TargetPort $Port
Stop-StaleFirebaseProcesses

Start-Sleep -Seconds 1

$listener = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
if ($listener) {
  throw "Port $Port is still occupied by PID $($listener.OwningProcess). Please close that process manually."
}

$dataDir = Join-Path $backendDir "emulator-data"
if (-not (Test-Path $dataDir)) {
  New-Item -ItemType Directory -Path $dataDir | Out-Null
  Write-Host "Created emulator data directory: $dataDir" -ForegroundColor DarkGray
}

Write-Host "Starting emulator from: $backendDir" -ForegroundColor Green
Push-Location $backendDir
try {
  firebase emulators:start --import=./emulator-data --export-on-exit=./emulator-data
} finally {
  Pop-Location
}
