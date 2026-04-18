param(
  [int]$Port = 3000
)

$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "port-lib.ps1")

$occupancy = @(Get-PortOccupancy -Port $Port)
Write-PortOccupancyReport -Port $Port -Occupancy $occupancy

if ($occupancy.Count -gt 0) {
  exit 1
}

exit 0
