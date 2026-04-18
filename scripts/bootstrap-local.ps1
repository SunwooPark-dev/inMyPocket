param(
  [switch]$ShowOnly
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$envExamplePath = Join-Path $projectRoot ".env.example"
$envLocalPath = Join-Path $projectRoot ".env.local"
$localStripePath = Join-Path $projectRoot ".tools\\stripe-cli\\stripe.exe"

Write-Host "[inMyPoket] Local bootstrap" -ForegroundColor Cyan
Write-Host "Project root: $projectRoot" -ForegroundColor DarkGray

if (-not (Test-Path $envLocalPath)) {
  if (Test-Path $envExamplePath) {
    Copy-Item -LiteralPath $envExamplePath -Destination $envLocalPath
    Write-Host "Created .env.local from .env.example" -ForegroundColor Green
  } else {
    New-Item -ItemType File -Path $envLocalPath -Force | Out-Null
    Write-Host "Created empty .env.local because .env.example is not present in this environment" -ForegroundColor Yellow
  }
} else {
  Write-Host ".env.local already exists" -ForegroundColor Green
}

$requiredKeys = @(
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_PRICE_ID_FOUNDING_MEMBER",
  "APP_URL",
  "ADMIN_ACCESS_TOKEN",
  "ADMIN_SESSION_SECRET"
)

$envMap = @{}
Get-Content -LiteralPath $envLocalPath | ForEach-Object {
  if ($_ -match "^\s*([^#=\s]+)\s*=\s*(.*)\s*$") {
    $envMap[$matches[1]] = $matches[2]
  }
}

foreach ($key in $requiredKeys) {
  $processValue = [Environment]::GetEnvironmentVariable($key)
  if (-not [string]::IsNullOrWhiteSpace($processValue)) {
    $envMap[$key] = $processValue.Trim()
  }
}

Write-Host ""
Write-Host "Environment readiness" -ForegroundColor Yellow
$missing = @()
foreach ($key in $requiredKeys) {
  $value = $envMap[$key]
  if ([string]::IsNullOrWhiteSpace($value)) {
    Write-Host "  - $key : MISSING" -ForegroundColor Red
    $missing += $key
  } else {
    Write-Host "  - $key : SET" -ForegroundColor Green
  }
}

Write-Host ""
Write-Host "CLI availability" -ForegroundColor Yellow
$supabaseReady = $false
try {
  pnpm dlx supabase@latest --version | Out-Null
  $supabaseReady = $true
} catch {}

$stripeReady = $false
$stripeSource = "missing"
if (Test-Path $localStripePath) {
  $stripeReady = $true
  $stripeSource = ".tools\\stripe-cli\\stripe.exe"
} else {
  $globalStripe = Get-Command "stripe" -ErrorAction SilentlyContinue
  if ($globalStripe) {
    $stripeReady = $true
    $stripeSource = $globalStripe.Source
  }
}

Write-Host "  - supabase : $(if ($supabaseReady) { 'READY (pnpm dlx supabase@latest)' } else { 'MISSING' })" -ForegroundColor $(if ($supabaseReady) { 'Green' } else { 'Red' })
Write-Host "  - stripe   : $(if ($stripeReady) { "READY ($stripeSource)" } else { 'MISSING' })" -ForegroundColor $(if ($stripeReady) { 'Green' } else { 'Red' })

Write-Host ""
Write-Host "Correct commands for this repo" -ForegroundColor Yellow
Write-Host "  1. .\\scripts\\supabase-cli.ps1 login"
Write-Host "  2. .\\scripts\\supabase-cli.ps1 init    # only if supabase/config.toml is still missing"
Write-Host "  3. .\\scripts\\supabase-cli.ps1 link --project-ref <YOUR_SUPABASE_PROJECT_ID>"
Write-Host "  4. .\\scripts\\supabase-cli.ps1 db push"
Write-Host "  5. .\\scripts\\stripe-cli.ps1 login"
Write-Host "  6. .\\scripts\\stripe-cli.ps1 listen --forward-to localhost:3000/api/stripe/webhook"
Write-Host "  7. pnpm dev"
Write-Host "  8. pnpm port:check    # shows whether 3000 is already occupied"
Write-Host "  9. pnpm start:3001   # alternate port when 3000 is busy"
Write-Host " 10. pnpm dev:3001     # alternate dev port (best in a normal terminal)"

Write-Host ""
Write-Host "Important route correction" -ForegroundColor Yellow
Write-Host "  - Webhook path is /api/stripe/webhook"
Write-Host "  - It is not /api/webhooks/stripe"

if ($ShowOnly) {
  exit 0
}

if ($missing.Count -gt 0 -or -not $supabaseReady -or -not $stripeReady) {
  Write-Host ""
  Write-Host "Bootstrap finished. Fill .env.local and install missing CLIs before live smoke." -ForegroundColor Cyan
  exit 0
}

Write-Host ""
Write-Host "Environment looks ready for the next manual smoke steps." -ForegroundColor Green
