param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("dev", "start")]
  [string]$Mode,
  [int]$Port = 3000
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$nextCmd = Join-Path $projectRoot "node_modules\\.bin\\next.cmd"

. (Join-Path $PSScriptRoot "port-lib.ps1")

if (-not (Test-Path -LiteralPath $nextCmd)) {
  Write-Host "Could not find Next.js CLI at $nextCmd" -ForegroundColor Red
  Write-Host "Run 'pnpm install' first." -ForegroundColor Yellow
  exit 1
}

$occupancy = @(Get-PortOccupancy -Port $Port)
if ($occupancy.Count -gt 0) {
  Write-PortOccupancyReport -Port $Port -Occupancy $occupancy
  exit 1
}

$env:PORT = [string]$Port
Write-Host "Starting Next.js in $Mode mode on port $Port" -ForegroundColor Cyan
Write-Host "URL: http://localhost:$Port" -ForegroundColor DarkGray

& $nextCmd $Mode
$exitCode = $LASTEXITCODE

if ($exitCode -ne 0 -and $Mode -eq "dev") {
  Write-Host ""
  Write-Host "Dev mode failed." -ForegroundColor Yellow
  Write-Host "If stderr shows 'spawn EPERM', this terminal is blocking Next.js dev child-process startup." -ForegroundColor Yellow
  Write-Host "Try 'pnpm dev:3001' in a normal terminal, or use 'pnpm start:3001' here." -ForegroundColor Yellow
}

exit $exitCode
