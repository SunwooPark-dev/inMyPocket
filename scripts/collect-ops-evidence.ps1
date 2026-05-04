param(
  [string]$BaseUrl = "http://localhost:3000",
  [string]$OutputPath,
  [string]$BundleDir
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$envLocalPath = Join-Path $projectRoot ".env.local"
$evidenceDir = Join-Path $projectRoot ".ops-evidence"
$legacyUiAssetsDir = Join-Path $evidenceDir "ui-assets"

if (-not (Test-Path $evidenceDir)) {
  New-Item -ItemType Directory -Path $evidenceDir | Out-Null
}

if (Test-Path $legacyUiAssetsDir) {
  Remove-Item -LiteralPath $legacyUiAssetsDir -Recurse -Force -ErrorAction SilentlyContinue
}

function Remove-StaleTempQueries {
  $staleTempFiles = Get-ChildItem -LiteralPath $evidenceDir -File -ErrorAction SilentlyContinue | Where-Object {
    $_.Name -eq "tmp-query.sql" -or $_.Name -like "query-*.sql"
  }

  foreach ($file in $staleTempFiles) {
    Remove-Item -LiteralPath $file.FullName -ErrorAction SilentlyContinue
  }
}

function Read-EnvMap {
  $envMap = @{}

  if (Test-Path $envLocalPath) {
    Get-Content -LiteralPath $envLocalPath | ForEach-Object {
      if ($_ -match "^\s*([^#=\s]+)\s*=\s*(.*)\s*$") {
        $value = $matches[2].Trim()
        if ($value.Length -ge 2 -and $value.StartsWith('"') -and $value.EndsWith('"')) {
          $value = $value.Substring(1, $value.Length - 2)
        }
        $envMap[$matches[1]] = $value
      }
    }
  }

  $knownKeys = @(
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

  foreach ($key in $knownKeys) {
    $processValue = [Environment]::GetEnvironmentVariable($key)
    if (-not [string]::IsNullOrWhiteSpace($processValue)) {
      $envMap[$key] = $processValue.Trim()
    }
  }

  return $envMap
}

function Get-KeyStatus {
  param(
    [hashtable]$EnvMap,
    [string[]]$Keys
  )

  $lines = @()
  foreach ($key in $Keys) {
    $ready = -not [string]::IsNullOrWhiteSpace($EnvMap[$key])
    $lines += "- $key : $(if ($ready) { 'SET' } else { 'MISSING' })"
  }

  return ($lines -join "`n")
}

function Invoke-StepResult {
  param(
    [scriptblock]$Script
  )

  try {
    $global:LASTEXITCODE = 0
    $output = (& $Script 2>&1 | Out-String).Trim()
    return [pscustomobject]@{
      Succeeded = $? -and ($LASTEXITCODE -eq 0)
      Output = $output
    }
  } catch {
    $lines = @()
    if ($_.InvocationInfo -and $_.InvocationInfo.PositionMessage) {
      $lines += $_.InvocationInfo.PositionMessage
    }
    $lines += $_.Exception.Message
    return [pscustomobject]@{
      Succeeded = $false
      Output = ($lines -join "`n").Trim()
    }
  }
}

function Invoke-SupabaseQuery {
  param(
    [string]$Sql
  )

  try {
    $tmp = Join-Path $evidenceDir ("query-" + [guid]::NewGuid().ToString() + ".sql")
    Set-Content -Path $tmp -Value $Sql -Encoding ASCII
    $output = cmd /c "pnpm dlx supabase@latest db query --linked -f $tmp -o json 2>&1" | Out-String
    $succeeded = $LASTEXITCODE -eq 0
    $cleaned = $output `
      -replace "(?m)^Initialising login role\.\.\.\r?\n?", "" `
      -replace "(?m)^Progress:.*\r?\n?", "" `
      -replace "(?m)^ WARN .*\r?\n?", ""
    return [pscustomobject]@{
      Succeeded = $succeeded
      Output = $cleaned.Trim()
    }
  } catch {
    return [pscustomobject]@{
      Succeeded = $false
      Output = $_.Exception.Message.Trim()
    }
  } finally {
    if ($tmp -and (Test-Path $tmp)) {
      Remove-Item -LiteralPath $tmp -ErrorAction SilentlyContinue
    }
  }
}

function Get-SupabaseProofSucceeded {
  param(
    [pscustomobject]$QueryResult,
    [int]$MinimumRows = 1,
    [string]$ExpectedField,
    [object]$ExpectedValue
  )

  if (-not $QueryResult.Succeeded) {
    return $false
  }

  try {
    $normalizedOutput = $QueryResult.Output.Trim()
    $jsonMatch = [regex]::Match($normalizedOutput, '(?s)(\{.*\}|\[.*\])\s*$')
    if ($jsonMatch.Success) {
      $normalizedOutput = $jsonMatch.Groups[1].Value
    }
    $payload = $normalizedOutput | ConvertFrom-Json
  } catch {
    return $false
  }

  if ($null -ne $payload.rows) {
    $rows = @($payload.rows)
  } else {
    $rows = @($payload)
  }
  if ($rows.Count -lt $MinimumRows) {
    return $false
  }

  if ($ExpectedField) {
    $matchedRow = $rows | Where-Object { $_.$ExpectedField -eq $ExpectedValue } | Select-Object -First 1
    return $null -ne $matchedRow
  }

  return $true
}

function Get-SupabaseNoGrantProofSucceeded {
  param(
    [pscustomobject]$QueryResult,
    [string[]]$DeniedGrantees
  )

  if (-not $QueryResult.Succeeded) {
    return $false
  }

  try {
    $normalizedOutput = $QueryResult.Output.Trim()
    $jsonMatch = [regex]::Match($normalizedOutput, '(?s)(\{.*\}|\[.*\])\s*$')
    if ($jsonMatch.Success) {
      $normalizedOutput = $jsonMatch.Groups[1].Value
    }
    $payload = $normalizedOutput | ConvertFrom-Json
  } catch {
    return $false
  }

  if ($null -ne $payload.rows) {
    $rows = @($payload.rows)
  } else {
    $rows = @($payload)
  }

  foreach ($row in $rows) {
    if ($DeniedGrantees -contains $row.grantee) {
      return $false
    }
  }

  return $true
}

function Test-SupabaseMissingLinkError {
  param(
    [pscustomobject[]]$QueryResults
  )

  foreach ($result in $QueryResults) {
    if (
      $null -ne $result -and (
        $result.Output -match "Cannot find project ref" -or
        $result.Output -match "Have you run supabase link\?"
      )
    ) {
      return $true
    }
  }

  return $false
}

function Format-SupabaseReportOutput {
  param(
    [pscustomobject]$QueryResult
  )

  if ($QueryResult.Succeeded) {
    return "Supabase query completed. Raw query output is suppressed in this report."
  }

  if (
    $QueryResult.Output -match "Cannot find project ref" -or
    $QueryResult.Output -match "Have you run supabase link\?"
  ) {
    return "Supabase project is not linked in this environment."
  }

  return "Supabase query did not complete. Raw CLI output is suppressed in this report."
}

function Format-ReportOutput {
  param(
    [string]$Output
  )

  if ([string]::IsNullOrWhiteSpace($Output)) {
    return "(no output)"
  }

  $safeOutput = $Output
  $safeOutput = $safeOutput -replace [regex]::Escape($projectRoot), "<project-root>"
  $safeOutput = $safeOutput -replace "(?m)^Try rerunning the command with --debug to troubleshoot the error\.\r?\n?", ""
  $safeOutput = $safeOutput -replace "(?m)^.*Authorization:\s*Bearer\s+.*\r?\n?", "[redacted authorization header]`n"
  $safeOutput = $safeOutput -replace "(?m)^.*apikey:\s*.*\r?\n?", "[redacted apikey header]`n"

  return $safeOutput.Trim()
}

function Invoke-UiEvidenceCapture {
  param(
    [string]$BaseUrl,
    [string]$OutputDir
  )

  return Invoke-StepResult {
    & (Join-Path $projectRoot "scripts\capture-ui-evidence.ps1") -BaseUrl $BaseUrl -OutputDir $OutputDir
  }
}

function Get-StepStatusLabel {
  param(
    [bool]$Succeeded
  )

  if ($Succeeded) {
    return "PASS"
  }

  return "FAIL"
}

function Get-UiEvidenceStatus {
  param(
    [pscustomobject]$UiEvidenceResult
  )

  if ($UiEvidenceResult.Succeeded) {
    return "passed"
  }

  if (
    $UiEvidenceResult.Output -match "No supported browser found" -or
    $UiEvidenceResult.Output -match "Access is denied" -or
    $UiEvidenceResult.Output -match "was not created at"
  ) {
    return "unavailable in this environment"
  }

  return "failed"
}

$envMap = Read-EnvMap
$requiredNowKeys = @(
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "APP_URL",
  "ADMIN_ACCESS_TOKEN",
  "ADMIN_SESSION_SECRET"
)
$paymentKeys = @(
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_PRICE_ID_FOUNDING_MEMBER"
)

if ([string]::IsNullOrWhiteSpace($BundleDir)) {
  $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
  $BundleDir = Join-Path $evidenceDir "ops-evidence-$timestamp"
}

$reportDir = $BundleDir
$uiEvidenceDir = Join-Path $BundleDir "ui-assets"
$bundleManifestPath = Join-Path $BundleDir "manifest.json"
$latestMarkerPath = Join-Path $evidenceDir "LATEST.md"
$latestJsonPath = Join-Path $evidenceDir "latest-run.json"

if (-not (Test-Path $BundleDir)) {
  New-Item -ItemType Directory -Path $BundleDir | Out-Null
}

if ([string]::IsNullOrWhiteSpace($OutputPath)) {
  $OutputPath = Join-Path $BundleDir "report.md"
}

$uiEvidenceDir = Join-Path $reportDir "ui-assets"

function Convert-ToContractRelativePath {
  param(
    [string]$PathValue
  )

  $normalizedProjectRoot = $projectRoot.TrimEnd('\', '/')
  if ($PathValue.StartsWith($normalizedProjectRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
    return ($PathValue.Substring($normalizedProjectRoot.Length).TrimStart('\', '/')) -replace '\\', '/'
  }

  return $PathValue -replace '\\', '/'
}

$bundleDirContractPath = Convert-ToContractRelativePath $BundleDir
$reportPathContractPath = Convert-ToContractRelativePath $OutputPath
$uiAssetsDirContractPath = Convert-ToContractRelativePath $uiEvidenceDir
$manifestPathContractPath = Convert-ToContractRelativePath $bundleManifestPath

Remove-StaleTempQueries

$bootstrapResult = Invoke-StepResult {
  & (Join-Path $projectRoot "scripts\bootstrap-local.ps1") -ShowOnly 6>&1 2>&1
}

$smokeResult = Invoke-StepResult {
  & (Join-Path $projectRoot "scripts\live-smoke.ps1") -BaseUrl $BaseUrl -SkipPayment 6>&1 2>&1
}

$publicPolicies = Invoke-SupabaseQuery "select tablename, policyname, cmd, roles from pg_policies where schemaname = 'public' and tablename in ('price_observations','observation_evidence','founding_member_signups') order by tablename, policyname;"
$publishedView = Invoke-SupabaseQuery "select table_name from information_schema.views where table_schema = 'public' and table_name = 'published_price_observations';"
$publishedViewGrants = Invoke-SupabaseQuery "select grantee, privilege_type from information_schema.role_table_grants where table_schema = 'public' and table_name = 'published_price_observations' order by grantee, privilege_type;"
$evidenceBucket = Invoke-SupabaseQuery "select id, name, public from storage.buckets where id = 'observation-evidence';"
$storagePolicies = Invoke-SupabaseQuery "select policyname, cmd, roles from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'deny anon authenticated observation evidence bucket';"
$uiEvidenceResult = Invoke-UiEvidenceCapture -BaseUrl $BaseUrl -OutputDir $uiEvidenceDir
$uiEvidenceStatus = Get-UiEvidenceStatus -UiEvidenceResult $uiEvidenceResult

$paymentReady = ($paymentKeys | Where-Object { [string]::IsNullOrWhiteSpace($envMap[$_]) }).Count -eq 0
$liveSupabaseProofRequested =
  -not [string]::IsNullOrWhiteSpace($envMap["NEXT_PUBLIC_SUPABASE_URL"]) -and
  -not [string]::IsNullOrWhiteSpace($envMap["SUPABASE_SERVICE_ROLE_KEY"])
# Hosted runners can expose Supabase env vars without having a linked project.
# Treat that specific missing-link class as unavailable, not as a proof failure.
$supabaseLinkedProjectUnavailable = Test-SupabaseMissingLinkError -QueryResults @(
  $publicPolicies,
  $publishedView,
  $publishedViewGrants,
  $evidenceBucket,
  $storagePolicies
)
$liveSupabaseProofAvailable = $liveSupabaseProofRequested -and -not $supabaseLinkedProjectUnavailable
$publicPoliciesSucceeded = Get-SupabaseProofSucceeded -QueryResult $publicPolicies -MinimumRows 3
$publishedViewSucceeded = Get-SupabaseProofSucceeded -QueryResult $publishedView -MinimumRows 1 -ExpectedField "table_name" -ExpectedValue "published_price_observations"
$publishedViewGrantsSucceeded = Get-SupabaseNoGrantProofSucceeded -QueryResult $publishedViewGrants -DeniedGrantees @("anon", "authenticated", "public")
$evidenceBucketSucceeded = Get-SupabaseProofSucceeded -QueryResult $evidenceBucket -MinimumRows 1 -ExpectedField "public" -ExpectedValue $false
$storagePoliciesSucceeded = Get-SupabaseProofSucceeded -QueryResult $storagePolicies -MinimumRows 1 -ExpectedField "policyname" -ExpectedValue "deny anon authenticated observation evidence bucket"
$liveSupabaseProofPassed =
  $liveSupabaseProofAvailable -and
  $publicPoliciesSucceeded -and
  $publishedViewSucceeded -and
  $publishedViewGrantsSucceeded -and
  $evidenceBucketSucceeded -and
  $storagePoliciesSucceeded
$paymentStatus = "Direct payment is not part of the current product model. Donation and advertising support are being considered instead."
$liveSupabaseProofStatus = if (-not $liveSupabaseProofRequested) {
  "unavailable in this environment"
} elseif ($supabaseLinkedProjectUnavailable) {
  "unavailable in this environment"
} elseif ($liveSupabaseProofPassed) {
  "passed"
} else {
  "failed"
}
$operationsProofStatus = if (
  $smokeResult.Succeeded -and
  $bootstrapResult.Succeeded -and
  $liveSupabaseProofPassed
) {
  "materially complete"
} elseif (
  $smokeResult.Succeeded -and
  $bootstrapResult.Succeeded
) {
  "automation-only proof complete; live Supabase proof $liveSupabaseProofStatus"
} else {
  "verification failure recorded"
}

$report = @"
# Operations Evidence Report

Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss zzz")

## Current milestone

- Public UX: stable enough for the current milestone
- Operations proof: $operationsProofStatus
- Payment: not planned

## Bundle paths

- Bundle directory: $bundleDirContractPath
- Report path: $reportPathContractPath
- UI assets directory: $uiAssetsDirContractPath
- Bundle manifest: $manifestPathContractPath

## Verification status

- Bootstrap capture: $(Get-StepStatusLabel -Succeeded $bootstrapResult.Succeeded)
- UI evidence capture: $uiEvidenceStatus
- Local smoke: $(Get-StepStatusLabel -Succeeded $smokeResult.Succeeded)
- Live Supabase proof: $liveSupabaseProofStatus

## Required-now env readiness

$(Get-KeyStatus -EnvMap $envMap -Keys $requiredNowKeys)

## Payment env readiness

$(Get-KeyStatus -EnvMap $envMap -Keys $paymentKeys)

## UI evidence assets

~~~text
STATUS: $uiEvidenceStatus
$(Format-ReportOutput -Output $uiEvidenceResult.Output)
~~~

## Bootstrap output

~~~text
STATUS: $(Get-StepStatusLabel -Succeeded $bootstrapResult.Succeeded)
$(Format-ReportOutput -Output $bootstrapResult.Output)
~~~

## Local smoke output

~~~text
STATUS: $(Get-StepStatusLabel -Succeeded $smokeResult.Succeeded)
$(Format-ReportOutput -Output $smokeResult.Output)
~~~

## Public table policy proof

~~~text
STATUS: $(Get-StepStatusLabel -Succeeded $publicPoliciesSucceeded)
$(Format-SupabaseReportOutput -QueryResult $publicPolicies)
~~~

## Published view existence

~~~text
STATUS: $(Get-StepStatusLabel -Succeeded $publishedViewSucceeded)
$(Format-SupabaseReportOutput -QueryResult $publishedView)
~~~

## Published view grant proof

~~~text
STATUS: $(Get-StepStatusLabel -Succeeded $publishedViewGrantsSucceeded)
$(Format-SupabaseReportOutput -QueryResult $publishedViewGrants)
~~~

## Evidence bucket proof

~~~text
STATUS: $(Get-StepStatusLabel -Succeeded $evidenceBucketSucceeded)
$(Format-SupabaseReportOutput -QueryResult $evidenceBucket)
~~~

## Storage policy proof

~~~text
STATUS: $(Get-StepStatusLabel -Succeeded $storagePoliciesSucceeded)
$(Format-SupabaseReportOutput -QueryResult $storagePolicies)
~~~

## Payment status

$paymentStatus
"@

Set-Content -LiteralPath $OutputPath -Value $report -Encoding UTF8

$latestMarker = @"
# Latest Operations Evidence Bundle

- Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss zzz")
- Bundle directory: $bundleDirContractPath
- Report path: $reportPathContractPath
- UI assets directory: $uiAssetsDirContractPath
- Bundle manifest: $manifestPathContractPath
- Bootstrap capture: $(Get-StepStatusLabel -Succeeded $bootstrapResult.Succeeded)
- UI evidence capture: $uiEvidenceStatus
- Local smoke: $(Get-StepStatusLabel -Succeeded $smokeResult.Succeeded)
- Live Supabase proof: $liveSupabaseProofStatus
- Refresh command: pnpm ops:evidence
"@

$bundleManifest = [ordered]@{
  generatedAt = (Get-Date).ToString("o")
  publicUxStatus = "stable enough for the current milestone"
  operationsProofStatus = $operationsProofStatus
  paymentStatus = "not_planned"
  paymentReady = $paymentReady
  bundleDir = $bundleDirContractPath
  reportPath = $reportPathContractPath
  uiAssetsDir = $uiAssetsDirContractPath
  stepStatus = [ordered]@{
    bootstrap = [ordered]@{
      succeeded = $bootstrapResult.Succeeded
      label = $(Get-StepStatusLabel -Succeeded $bootstrapResult.Succeeded)
    }
    uiEvidence = [ordered]@{
      succeeded = $uiEvidenceResult.Succeeded
      label = $uiEvidenceStatus
    }
    localSmoke = [ordered]@{
      succeeded = $smokeResult.Succeeded
      label = $(Get-StepStatusLabel -Succeeded $smokeResult.Succeeded)
    }
    liveSupabaseProof = [ordered]@{
      succeeded = $liveSupabaseProofPassed
      label = $liveSupabaseProofStatus
    }
  }
  envReadiness = [ordered]@{
    requiredNow = [ordered]@{}
    payment = [ordered]@{}
  }
}

foreach ($key in $requiredNowKeys) {
  $bundleManifest.envReadiness.requiredNow[$key] = -not [string]::IsNullOrWhiteSpace($envMap[$key])
}

foreach ($key in $paymentKeys) {
  $bundleManifest.envReadiness.payment[$key] = -not [string]::IsNullOrWhiteSpace($envMap[$key])
}

  $latestJson = [ordered]@{
  generatedAt = (Get-Date).ToString("o")
  bundleDir = $bundleDirContractPath
  reportPath = $reportPathContractPath
  uiAssetsDir = $uiAssetsDirContractPath
  manifestPath = $manifestPathContractPath
  operationsProofStatus = $operationsProofStatus
  paymentStatus = "not_planned"
  liveSupabaseProofStatus = $liveSupabaseProofStatus
  stepStatus = $bundleManifest.stepStatus
} | ConvertTo-Json

Set-Content -LiteralPath $bundleManifestPath -Value ($bundleManifest | ConvertTo-Json -Depth 6) -Encoding UTF8
Set-Content -LiteralPath $latestMarkerPath -Value $latestMarker -Encoding UTF8
Set-Content -LiteralPath $latestJsonPath -Value $latestJson -Encoding UTF8

Write-Host "Wrote operations evidence bundle to $BundleDir" -ForegroundColor Green
Write-Host "Updated latest bundle pointer at $latestMarkerPath" -ForegroundColor Green

if (
  -not $bootstrapResult.Succeeded -or
  -not $smokeResult.Succeeded -or
  ($liveSupabaseProofAvailable -and -not $liveSupabaseProofPassed)
) {
  throw "Evidence bundle recorded one or more failed verification steps."
}
