param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$Args
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$localStripe = Join-Path $projectRoot ".tools\\stripe-cli\\stripe.exe"

if (Test-Path $localStripe) {
  & $localStripe @Args
  exit $LASTEXITCODE
}

$globalStripe = Get-Command "stripe" -ErrorAction SilentlyContinue

if ($globalStripe) {
  & $globalStripe.Source @Args
  exit $LASTEXITCODE
}

throw "Stripe CLI is not installed. Install it from Stripe's official Windows zip release first."
