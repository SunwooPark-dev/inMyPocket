function Get-PortOccupancy {
  param(
    [Parameter(Mandatory = $true)]
    [int]$Port
  )

  $processIds = @()
  $portPattern = "^\s*TCP\s+\S+:$Port\s+\S+\s+LISTENING\s+(\d+)\s*$"
  foreach ($line in (netstat -ano -p tcp)) {
    if ($line -match $portPattern) {
      $processIds += [int]$Matches[1]
    }
  }

  if ($processIds.Count -eq 0) {
    return @()
  }

  $rows = foreach ($processId in ($processIds | Sort-Object -Unique)) {
    $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
    [PSCustomObject]@{
      Port = $Port
      ProcessId = $processId
      ProcessName = if ($process) { $process.ProcessName } else { "unknown" }
      Path = if ($process) { $process.Path } else { $null }
      StartedAt = if ($process) { $process.StartTime } else { $null }
    }
  }

  return @($rows)
}

function Write-PortOccupancyReport {
  param(
    [Parameter(Mandatory = $true)]
    [int]$Port,
    [Parameter(Mandatory = $true)]
    [AllowEmptyCollection()]
    [object[]]$Occupancy
  )

  if ($Occupancy.Count -eq 0) {
    Write-Host "Port $Port is available." -ForegroundColor Green
    return
  }

  Write-Host "Port $Port is already in use." -ForegroundColor Yellow
  foreach ($row in $Occupancy) {
    Write-Host "  - PID $($row.ProcessId) :: $($row.ProcessName)" -ForegroundColor Yellow
    if ($row.Path) {
      Write-Host "    Path: $($row.Path)" -ForegroundColor DarkGray
    }
    if ($row.StartedAt) {
      Write-Host "    Started: $($row.StartedAt)" -ForegroundColor DarkGray
    }
  }

  Write-Host ""
  Write-Host "Next steps:" -ForegroundColor Cyan
  Write-Host "  1. Free the port, or" -ForegroundColor Cyan
  Write-Host "  2. Run the app on another port, e.g. pnpm start:3001 or pnpm dev:3001" -ForegroundColor Cyan
}
