param(
  [switch]$Apply,
  [switch]$Verify,
  [switch]$VerifyOnly,
  [switch]$Status
)

$ErrorActionPreference = "Stop"

$hardeningSqlPath = Join-Path $PSScriptRoot "harden-published-view-direct-grants.sql"
$verifySqlPath = Join-Path $PSScriptRoot "verify-published-view-direct-grants.sql"
$supabaseCliPath = Join-Path $PSScriptRoot "supabase-cli.ps1"

function Write-Step($message) {
  Write-Host ""
  Write-Host "== $message" -ForegroundColor Cyan
}

function Stop-Safe($message) {
  Write-Host "FAIL  $message" -ForegroundColor Red
  exit 1
}

function Get-SafeSqlErrorSummary($output) {
  $safePatterns = @(
    "Cannot find project ref",
    "Have you run supabase link",
    "forbidden_direct_grant_count",
    "service_role_select_grant_count",
    "Missing public.published_price_observations",
    "permission denied",
    "does not exist"
  )
  $lines = @($output -split "`r?`n") | Where-Object {
    $line = $_
    $safePatterns | Where-Object { $line -match [regex]::Escape($_) }
  } | Select-Object -First 5

  if ($lines.Count -gt 0) {
    return ($lines -join "`n")
  }

  return "Raw Supabase CLI output suppressed. Check that the project is linked and the current user can run db query."
}

function Invoke-LinkedSupabaseSqlQuiet($path, $label) {
  if (-not (Test-Path -LiteralPath $path)) {
    Stop-Safe "$label SQL file not found: $path"
  }

  Write-Step $label
  $command = "pnpm dlx supabase@latest db query --linked -f `"$path`" 2>&1"
  $output = (cmd /c $command | Out-String).Trim()

  if ($LASTEXITCODE -ne 0) {
    $summary = Get-SafeSqlErrorSummary $output
    Stop-Safe "$label failed. $summary"
  }
}

function Invoke-LinkedSupabaseSqlStatus($path, $label) {
  if (-not (Test-Path -LiteralPath $path)) {
    Stop-Safe "$label SQL file not found: $path"
  }

  Write-Step $label
  $command = "pnpm dlx supabase@latest db query --linked -f `"$path`" 2>&1"
  $output = (cmd /c $command | Out-String).Trim()

  if ($LASTEXITCODE -eq 0) {
    Write-Host "STATUS  direct-grant proof passed" -ForegroundColor Green
    Write-Host "PASS  forbidden_direct_grant_count = 0" -ForegroundColor Green
    Write-Host "PASS  service_role_select_grant_count = 1" -ForegroundColor Green
    return
  }

  $summary = Get-SafeSqlErrorSummary $output
  if ($summary -match "Cannot find project ref" -or $summary -match "Have you run supabase link") {
    Write-Host "STATUS  Supabase project is not linked in this environment." -ForegroundColor Yellow
    Write-Host "NEXT    Use pnpm ops:show-supabase-sql or link the intended Supabase project." -ForegroundColor Yellow
    return
  }

  Stop-Safe "$label failed. $summary"
}

Write-Step "Published view direct-grant hardening"
Write-Host "Target: public.published_price_observations"
Write-Host "Contract: browser/publishable-key direct reads must be denied or return zero governed rows."
Write-Host "Secrets: this script does not print Supabase keys."

if ($Status) {
  Invoke-LinkedSupabaseSqlStatus $verifySqlPath "Checking direct-grant status"
  exit 0
}

if (-not $Apply -and -not $VerifyOnly) {
  Write-Host ""
  Write-Host "Dry run only. No Supabase changes were made." -ForegroundColor Yellow
  Write-Host "To apply the hardening SQL:"
  Write-Host "  pnpm ops:harden-published-view:apply"
  Write-Host ""
  Write-Host "To verify current policies/grants only:"
  Write-Host "  pnpm ops:harden-published-view:verify"
  exit 0
}

if ($Apply) {
  Invoke-LinkedSupabaseSqlQuiet $hardeningSqlPath "Applying hardening SQL"
  Write-Host "PASS  hardening SQL applied" -ForegroundColor Green
}

if ($Verify -or $VerifyOnly) {
  Invoke-LinkedSupabaseSqlQuiet $verifySqlPath "Verifying direct grants"
  Write-Host "PASS  forbidden_direct_grant_count = 0" -ForegroundColor Green
  Write-Host "PASS  service_role_select_grant_count = 1" -ForegroundColor Green
  Write-Host "PASS  anon/authenticated/public direct reads denied by missing grants" -ForegroundColor Green
  Write-Host "PASS  server-side service-role reads preserved" -ForegroundColor Green
}

Write-Step "Next local checks"
Write-Host "Run after a successful apply:"
Write-Host "  pnpm smoke:local -SkipPayment"
Write-Host "  pnpm ops:evidence"
Write-Host "  pnpm ops:verify"
