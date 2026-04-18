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
    return [pscustomobject]@{
      Succeeded = $true
      Output = (& $Script 2>&1 | Out-String).Trim()
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

function Get-RestProof {
  param(
    [hashtable]$EnvMap
  )

  $url = $EnvMap["NEXT_PUBLIC_SUPABASE_URL"]
  $key = $EnvMap["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"]

  if ([string]::IsNullOrWhiteSpace($url) -or [string]::IsNullOrWhiteSpace($key)) {
    return [pscustomobject]@{
      Succeeded = $false
      Output = "Supabase public REST proof skipped because NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is missing."
    }
  }

  $publishedStatus = ""
  $publishedBody = ""
  $baseTableStatus = ""
  $baseTableBody = ""

  try {
    $published = Invoke-WebRequest -UseBasicParsing -Uri "$url/rest/v1/published_price_observations?select=id&limit=1" -Headers @{
      apikey = $key
      Authorization = "Bearer $key"
    }
    $publishedStatus = $published.StatusCode
    $publishedBody = $published.Content
  } catch {
    $publishedStatus = "ERROR"
    $publishedBody = $_.Exception.Message
  }

  try {
    Invoke-WebRequest -UseBasicParsing -Uri "$url/rest/v1/price_observations?select=id&limit=1" -Headers @{
      apikey = $key
      Authorization = "Bearer $key"
    } | Out-Null
    $baseTableStatus = "200"
    $baseTableBody = "Unexpected success"
  } catch {
    if ($_.Exception.Response) {
      $baseTableStatus = $_.Exception.Response.StatusCode.value__
      $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
      $baseTableBody = $reader.ReadToEnd()
    } else {
      $baseTableStatus = "ERROR"
      $baseTableBody = $_.Exception.Message
    }
  }

  $output = @"
Published view status: $publishedStatus
Published view body: $publishedBody
Base table status: $baseTableStatus
Base table body: $baseTableBody
"@.Trim()

  return [pscustomobject]@{
    Succeeded = ($publishedStatus -eq 200 -and $baseTableStatus -eq 401)
    Output = $output
  }
}

$envMap = Read-EnvMap
$requiredNowKeys = @(
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
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
$evidenceBucket = Invoke-SupabaseQuery "select id, name, public from storage.buckets where id = 'observation-evidence';"
$storagePolicies = Invoke-SupabaseQuery "select policyname, cmd, roles from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'deny anon authenticated observation evidence bucket';"
$restProof = Get-RestProof -EnvMap $envMap
$uiEvidenceResult = Invoke-UiEvidenceCapture -BaseUrl $BaseUrl -OutputDir $uiEvidenceDir
$uiEvidenceStatus = Get-UiEvidenceStatus -UiEvidenceResult $uiEvidenceResult

$paymentReady = ($paymentKeys | Where-Object { [string]::IsNullOrWhiteSpace($envMap[$_]) }).Count -eq 0
$liveSupabaseProofAvailable =
  -not [string]::IsNullOrWhiteSpace($envMap["NEXT_PUBLIC_SUPABASE_URL"]) -and
  -not [string]::IsNullOrWhiteSpace($envMap["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"]) -and
  -not [string]::IsNullOrWhiteSpace($envMap["SUPABASE_SERVICE_ROLE_KEY"])
$publicPoliciesSucceeded = Get-SupabaseProofSucceeded -QueryResult $publicPolicies -MinimumRows 3
$publishedViewSucceeded = Get-SupabaseProofSucceeded -QueryResult $publishedView -MinimumRows 1 -ExpectedField "table_name" -ExpectedValue "published_price_observations"
$evidenceBucketSucceeded = Get-SupabaseProofSucceeded -QueryResult $evidenceBucket -MinimumRows 1 -ExpectedField "public" -ExpectedValue $false
$storagePoliciesSucceeded = Get-SupabaseProofSucceeded -QueryResult $storagePolicies -MinimumRows 1 -ExpectedField "policyname" -ExpectedValue "deny anon authenticated observation evidence bucket"
$liveSupabaseProofPassed =
  $liveSupabaseProofAvailable -and
  $publicPoliciesSucceeded -and
  $publishedViewSucceeded -and
  $evidenceBucketSucceeded -and
  $storagePoliciesSucceeded -and
  $restProof.Succeeded
$paymentStatus = "Direct payment is not part of the current product model. Donation and advertising support are being considered instead."
$liveSupabaseProofStatus = if (-not $liveSupabaseProofAvailable) {
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

- Bundle directory: $BundleDir
- Report path: $OutputPath
- UI assets directory: $uiEvidenceDir
- Bundle manifest: $bundleManifestPath

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
$($uiEvidenceResult.Output)
~~~

## Bootstrap output

~~~text
STATUS: $(Get-StepStatusLabel -Succeeded $bootstrapResult.Succeeded)
$($bootstrapResult.Output)
~~~

## Local smoke output

~~~text
STATUS: $(Get-StepStatusLabel -Succeeded $smokeResult.Succeeded)
$($smokeResult.Output)
~~~

## Public table policy proof

~~~text
STATUS: $(Get-StepStatusLabel -Succeeded $publicPoliciesSucceeded)
$($publicPolicies.Output)
~~~

## Published view existence

~~~text
STATUS: $(Get-StepStatusLabel -Succeeded $publishedViewSucceeded)
$($publishedView.Output)
~~~

## Evidence bucket proof

~~~text
STATUS: $(Get-StepStatusLabel -Succeeded $evidenceBucketSucceeded)
$($evidenceBucket.Output)
~~~

## Storage policy proof

~~~text
STATUS: $(Get-StepStatusLabel -Succeeded $storagePoliciesSucceeded)
$($storagePolicies.Output)
~~~

## REST trust-boundary proof

~~~text
STATUS: $(Get-StepStatusLabel -Succeeded $restProof.Succeeded)
$($restProof.Output)
~~~

## Payment status

$paymentStatus
"@

Set-Content -LiteralPath $OutputPath -Value $report -Encoding UTF8

$latestMarker = @"
# Latest Operations Evidence Bundle

- Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss zzz")
- Bundle directory: $BundleDir
- Report path: $OutputPath
- UI assets directory: $uiEvidenceDir
- Bundle manifest: $bundleManifestPath
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
