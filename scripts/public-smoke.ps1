param(
  [string]$BaseUrl = ""
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($BaseUrl)) {
  $BaseUrl = if (-not [string]::IsNullOrWhiteSpace($env:APP_URL)) {
    $env:APP_URL
  } else {
    "http://localhost:3000"
  }
}

function Write-Step($message) {
  Write-Host ""
  Write-Host "== $message" -ForegroundColor Cyan
}

function Assert-HttpStatus($response, $expected, $label) {
  if ($response.StatusCode -ne $expected) {
    throw "$label expected HTTP $expected but got $($response.StatusCode)"
  }
  Write-Host "PASS  $label -> $($response.StatusCode)" -ForegroundColor Green
}

function Assert-Contains($content, $pattern, $label) {
  if ($content -notmatch $pattern) {
    throw "$label expected content matching [$pattern]"
  }
  Write-Host "PASS  $label" -ForegroundColor Green
}

function Assert-NotContains($content, $pattern, $label) {
  if ($content -match $pattern) {
    throw "$label should not contain [$pattern]"
  }
  Write-Host "PASS  $label" -ForegroundColor Green
}

Write-Step "Public route smoke"

try {
  $defaultHome = Invoke-WebRequest -Uri "$BaseUrl/?zip=30328&scenario=base_regular_total" -UseBasicParsing
} catch {
  Write-Host "FAIL  Could not reach $BaseUrl. Start the app before running public smoke." -ForegroundColor Red
  exit 1
}

Assert-HttpStatus $defaultHome 200 "GET /?zip=30328"
Assert-Contains $defaultHome.Content "Enter ZIP code" "homepage shows ZIP input"
Assert-Contains $defaultHome.Content "Today(?:&apos;|')s lowest total" "homepage renders 30328 comparison"
Assert-NotContains $defaultHome.Content "We couldn(?:&apos;|')t compare this basket right now" "homepage avoids generic comparison failure for 30328"

$defaultPrintable = Invoke-WebRequest -Uri "$BaseUrl/printable?zip=30328&scenario=base_regular_total" -UseBasicParsing
Assert-HttpStatus $defaultPrintable 200 "GET /printable?zip=30328"
Assert-Contains $defaultPrintable.Content "Shop here today:" "printable renders 30328 basket"
Assert-NotContains $defaultPrintable.Content "Printable basket unavailable for now." "printable avoids empty-state fallback for 30328"

$eugeneHome = Invoke-WebRequest -Uri "$BaseUrl/?zip=97401&scenario=base_regular_total" -UseBasicParsing
Assert-HttpStatus $eugeneHome 200 "GET /?zip=97401"
Assert-Contains $eugeneHome.Content "Eugene Core" "homepage shows 97401 pilot area"
Assert-Contains $eugeneHome.Content "Today(?:&apos;|')s lowest total" "homepage renders 97401 comparison"
Assert-Contains $eugeneHome.Content "Walmart" "homepage includes Walmart basket"
Assert-Contains $eugeneHome.Content "Source quality guide" "homepage explains source quality"
Assert-Contains $eugeneHome.Content "Open official source" "homepage exposes official source links"

$eugenePrintable = Invoke-WebRequest -Uri "$BaseUrl/printable?zip=97401&scenario=base_regular_total" -UseBasicParsing
Assert-HttpStatus $eugenePrintable 200 "GET /printable?zip=97401"
Assert-Contains $eugenePrintable.Content "Shop here today:" "printable renders 97401 basket"
Assert-Contains $eugenePrintable.Content "Walmart" "printable includes Walmart basket"
Assert-Contains $eugenePrintable.Content "Source check:" "printable includes source-quality notes"
Assert-Contains $eugenePrintable.Content "Search result - needs item-page check" "printable flags search-result source notes"

$unsupportedZip = Invoke-WebRequest -Uri "$BaseUrl/?zip=99999&scenario=base_regular_total" -UseBasicParsing
Assert-HttpStatus $unsupportedZip 200 "GET /?zip=99999"
Assert-Contains $unsupportedZip.Content "We don’t support 99999 yet" "unsupported ZIP shows pilot-only message"

Write-Host ""
Write-Host "Public smoke completed." -ForegroundColor Green
