param(
  [string]$BaseUrl = "http://localhost:3000"
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$baselineDir = Join-Path $projectRoot "tests\visual-baseline"
$captureDir = Join-Path $projectRoot ".ops-evidence\visual-baseline-update"

if (Test-Path $captureDir) {
  Remove-Item -LiteralPath $captureDir -Recurse -Force
}

if (-not (Test-Path $baselineDir)) {
  New-Item -ItemType Directory -Path $baselineDir -Force | Out-Null
}

& (Join-Path $projectRoot "scripts\capture-ui-evidence.ps1") -BaseUrl $BaseUrl -OutputDir $captureDir

Copy-Item -LiteralPath (Join-Path $captureDir "home-desktop.png") -Destination (Join-Path $baselineDir "home-desktop.png") -Force
Copy-Item -LiteralPath (Join-Path $captureDir "home-mobile.png") -Destination (Join-Path $baselineDir "home-mobile.png") -Force
Copy-Item -LiteralPath (Join-Path $captureDir "printable-mobile.png") -Destination (Join-Path $baselineDir "printable-mobile.png") -Force

$baselineConfig = @"
{
  "maxDifferenceRatio": 0.015,
  "images": [
    "home-desktop.png",
    "home-mobile.png",
    "printable-mobile.png"
  ]
}
"@

Set-Content -LiteralPath (Join-Path $baselineDir "baseline-config.json") -Value $baselineConfig -Encoding UTF8
Write-Host "Updated visual baseline at $baselineDir" -ForegroundColor Green
