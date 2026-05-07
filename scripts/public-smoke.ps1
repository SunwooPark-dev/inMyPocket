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

function Assert-PrintableBasketOrHonestUnavailable($content, $label) {
  if ($content -match "Shop here today:") {
    Assert-NotContains $content "Printable basket unavailable for now\." "$label avoids empty-state fallback when basket renders"
    Write-Host "PASS  $label renders basket" -ForegroundColor Green
    return
  }

  Assert-Contains $content "Printable basket unavailable for now\." "$label shows honest unavailable state when governed rows cannot be loaded"
  Assert-Contains $content "could not load the current published comparison|not enough governed published prices" "$label explains why basket is unavailable"
  Write-Host "PASS  $label classified as unavailable rather than broken" -ForegroundColor Yellow
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
Assert-PrintableBasketOrHonestUnavailable $defaultPrintable.Content "printable 30328"

$alpharettaHome = Invoke-WebRequest -Uri "$BaseUrl/?zip=30022&scenario=base_regular_total" -UseBasicParsing
Assert-HttpStatus $alpharettaHome 200 "GET /?zip=30022"
Assert-Contains $alpharettaHome.Content "Alpharetta East" "homepage shows 30022 pilot area"
Assert-NotContains $alpharettaHome.Content "We don’t support 30022 yet" "homepage treats 30022 as supported pilot ZIP"

$alpharettaPrintable = Invoke-WebRequest -Uri "$BaseUrl/printable?zip=30022&scenario=base_regular_total" -UseBasicParsing
Assert-HttpStatus $alpharettaPrintable 200 "GET /printable?zip=30022"
Assert-PrintableBasketOrHonestUnavailable $alpharettaPrintable.Content "printable 30022"
if ($alpharettaPrintable.Content -match "Shop here today:") {
  Assert-Contains $alpharettaPrintable.Content "Source check:" "printable includes source-quality notes"
}

$unsupportedZip = Invoke-WebRequest -Uri "$BaseUrl/?zip=99999&scenario=base_regular_total" -UseBasicParsing
Assert-HttpStatus $unsupportedZip 200 "GET /?zip=99999"
Assert-Contains $unsupportedZip.Content "We don’t support 99999 yet" "unsupported ZIP shows pilot-only message"

Write-Host ""
Write-Host "Public smoke completed." -ForegroundColor Green
