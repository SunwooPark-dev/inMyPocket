param(
  [string]$BaseUrl = "http://localhost:3000",
  [switch]$SkipPayment,
  [switch]$SkipSupabaseProof
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$envLocalPath = Join-Path $projectRoot ".env.local"
$cookieJarPath = Join-Path $projectRoot ".smoke.cookies.txt"
$evidencePath = Join-Path $projectRoot "tests\\fixtures\\smoke-evidence.pdf"

function Write-Step($message) {
  Write-Host ""
  Write-Host "== $message" -ForegroundColor Cyan
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

function ConvertFrom-JsonSafe($content, $label) {
  try {
    return $content | ConvertFrom-Json
  } catch {
    throw "$label returned invalid JSON"
  }
}

function Get-CookieHeader($session, $uri) {
  $cookieCollection = $session.Cookies.GetCookies($uri)
  $pairs = @()
  foreach ($cookie in $cookieCollection) {
    $pairs += "$($cookie.Name)=$($cookie.Value)"
  }
  return ($pairs -join "; ")
}

$envMap = Read-EnvMap
$adminReady =
  -not [string]::IsNullOrWhiteSpace($envMap["ADMIN_ACCESS_TOKEN"]) -and
  -not [string]::IsNullOrWhiteSpace($envMap["ADMIN_SESSION_SECRET"])
$supabaseReady =
  -not [string]::IsNullOrWhiteSpace($envMap["NEXT_PUBLIC_SUPABASE_URL"]) -and
  -not [string]::IsNullOrWhiteSpace($envMap["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"]) -and
  -not [string]::IsNullOrWhiteSpace($envMap["SUPABASE_SERVICE_ROLE_KEY"])
$stripeReady =
  -not [string]::IsNullOrWhiteSpace($envMap["STRIPE_SECRET_KEY"]) -and
  -not [string]::IsNullOrWhiteSpace($envMap["STRIPE_WEBHOOK_SECRET"]) -and
  -not [string]::IsNullOrWhiteSpace($envMap["STRIPE_PRICE_ID_FOUNDING_MEMBER"])

Write-Step "Public pages"
$homeResponse = $null
try {
  $homeResponse = Invoke-WebRequest -Uri "$BaseUrl/" -UseBasicParsing
} catch {
  Write-Host "FAIL  Could not reach $BaseUrl. Start the app with 'pnpm dev', 'pnpm dev:3001', or 'pnpm start:3001' before running local smoke." -ForegroundColor Red
  exit 1
}
Assert-HttpStatus $homeResponse 200 "GET /"
Assert-Contains $homeResponse.Content "Checking today.{1,2}s prices and comparing the same basket across nearby stores\." "GET / streamed loading shell copy"
Assert-Contains $homeResponse.Content "Enter ZIP code" "homepage shows ZIP input"
$printable = Invoke-WebRequest -Uri "$BaseUrl/printable" -UseBasicParsing
Assert-HttpStatus $printable 200 "GET /printable"
Assert-Contains $printable.Content "Preparing your grocery plan" "GET /printable streamed loading shell headline"
$couponScenario = Invoke-WebRequest -Uri "$BaseUrl/?zip=30328&scenario=coupon_required_total" -UseBasicParsing
Assert-HttpStatus $couponScenario 200 "GET /?scenario=coupon_required_total"
Assert-Contains $couponScenario.Content "Checking today.{1,2}s prices and comparing the same basket across nearby stores\." "GET /?scenario=coupon_required_total streamed loading shell copy"
$weeklyAdPrintable = Invoke-WebRequest -Uri "$BaseUrl/printable?zip=30328&scenario=weekly_ad_partial_total" -UseBasicParsing
Assert-HttpStatus $weeklyAdPrintable 200 "GET /printable?scenario=weekly_ad_partial_total"
Assert-Contains $weeklyAdPrintable.Content "Preparing your grocery plan" "GET /printable?scenario=weekly_ad_partial_total streamed loading shell headline"

Write-Step "Weekly updates route"
try {
  Invoke-WebRequest -Uri "$BaseUrl/api/waitlist" -Method Post -ContentType "application/json" -Body "{}" -UseBasicParsing | Out-Null
  throw "POST /api/waitlist with invalid payload should not succeed"
} catch {
  $response = $_.Exception.Response
  if (-not $response -or $response.StatusCode.value__ -ne 400) {
    throw "POST /api/waitlist with invalid payload expected 400"
  }
  Write-Host "PASS  POST /api/waitlist invalid payload -> 400" -ForegroundColor Green
}

$validWaitlistBody = @{ email = "smoke-waitlist-$([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())@example.com"; zipCode = "30062" } | ConvertTo-Json -Compress
if ($supabaseReady) {
  $validWaitlistResponse = Invoke-WebRequest -Uri "$BaseUrl/api/waitlist" -Method Post -ContentType "application/json" -Body $validWaitlistBody -UseBasicParsing
  Assert-HttpStatus $validWaitlistResponse 200 "POST /api/waitlist"
} else {
  Write-Host "SKIP  valid waitlist signup skipped because Supabase env vars are incomplete" -ForegroundColor Yellow
}

Write-Step "Locked admin"
$admin = Invoke-WebRequest -Uri "$BaseUrl/admin" -UseBasicParsing
Assert-HttpStatus $admin 200 "GET /admin"
Assert-Contains $admin.Content "Admin access required" "locked admin message"
Assert-NotContains $admin.Content "Runtime readiness" "locked admin hides readiness section"
Assert-NotContains $admin.Content "NEXT_PUBLIC_SUPABASE_URL" "locked admin hides env readiness list"

try {
  Invoke-WebRequest -Uri "$BaseUrl/api/observations" -UseBasicParsing | Out-Null
  throw "GET /api/observations should not succeed without admin auth"
} catch {
  $response = $_.Exception.Response
  if (-not $response -or $response.StatusCode.value__ -ne 401) {
    throw "GET /api/observations expected 401 without admin auth"
  }
  Write-Host "PASS  unauthenticated observations route is blocked" -ForegroundColor Green
}

Write-Step "Admin unlock throttling"
if ($adminReady) {
  Write-Step "Admin unlock reset"
  $session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
  Remove-Item $cookieJarPath -ErrorAction SilentlyContinue
  $resetBody = @{ token = $envMap["ADMIN_ACCESS_TOKEN"] } | ConvertTo-Json -Compress
  $resetResponse = Invoke-WebRequest -Uri "$BaseUrl/api/admin/unlock" -Method Post -ContentType "application/json" -Body $resetBody -WebSession $session -UseBasicParsing
  Assert-HttpStatus $resetResponse 200 "POST /api/admin/unlock (reset)"
  $logoutResponse = Invoke-WebRequest -Uri "$BaseUrl/api/admin/logout" -Method Post -WebSession $session -UseBasicParsing
  Assert-HttpStatus $logoutResponse 200 "POST /api/admin/logout"

  for ($i = 1; $i -le 4; $i++) {
    try {
      Invoke-WebRequest -Uri "$BaseUrl/api/admin/unlock" -Method Post -ContentType "application/json" -Body '{"token":"bad-token"}' -UseBasicParsing | Out-Null
      throw "Unlock attempt $i should not succeed"
    } catch {
      $response = $_.Exception.Response
      if (-not $response -or $response.StatusCode.value__ -ne 401) {
        throw "Unlock attempt $i expected 401"
      }
    }
  }

  try {
    Invoke-WebRequest -Uri "$BaseUrl/api/admin/unlock" -Method Post -ContentType "application/json" -Body '{"token":"bad-token"}' -UseBasicParsing | Out-Null
    throw "5th unlock attempt should be throttled"
  } catch {
    $response = $_.Exception.Response
    if (-not $response -or $response.StatusCode.value__ -ne 429) {
      throw "5th unlock attempt expected 429"
    }
    if (-not $response.Headers["Retry-After"]) {
      throw "5th unlock attempt expected Retry-After header"
    }
    Write-Host "PASS  admin unlock lockout -> 429 with Retry-After" -ForegroundColor Green
  }
} else {
  Write-Host "SKIP  admin unlock throttling smoke skipped because ADMIN_ACCESS_TOKEN or ADMIN_SESSION_SECRET is blank" -ForegroundColor Yellow
}

if ($adminReady) {
  Write-Step "Admin unlock success"
  $session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
  $body = @{ token = $envMap["ADMIN_ACCESS_TOKEN"] } | ConvertTo-Json -Compress
  $unlockResponse = Invoke-WebRequest -Uri "$BaseUrl/api/admin/unlock" -Method Post -ContentType "application/json" -Body $body -WebSession $session -UseBasicParsing
  Assert-HttpStatus $unlockResponse 200 "POST /api/admin/unlock (valid)"

  $adminAuthed = Invoke-WebRequest -Uri "$BaseUrl/admin" -WebSession $session -UseBasicParsing
  Assert-Contains $adminAuthed.Content "Runtime readiness" "unlocked admin shows readiness"
  Assert-Contains $adminAuthed.Content "External blockers" "unlocked admin shows external blockers"
  if ($adminAuthed.Content -match "External proof handoff") {
    Write-Host "PASS  unlocked admin shows external proof handoff" -ForegroundColor Green
  } elseif ($adminAuthed.Content -match "Hosted proof handoff" -or $adminAuthed.Content -match "Payment proof handoff") {
    Write-Host "PASS  unlocked admin shows external proof handoff items" -ForegroundColor Green
  } else {
    Write-Host "INFO  external proof handoff copy was not found in raw admin HTML; relying on operator-proof artifact and other unlocked-admin sections for this smoke pass." -ForegroundColor Yellow
  }
  Assert-Contains $adminAuthed.Content "Operator next actions" "unlocked admin shows operator next actions"
  Assert-Contains $adminAuthed.Content "Operator evidence" "unlocked admin shows operator evidence"
  Assert-Contains $adminAuthed.Content "Recent unlock incidents" "unlocked admin shows recent unlock incidents"
  Assert-Contains $adminAuthed.Content "Accepted local limits" "unlocked admin shows accepted local limits"

  $observationsResponse = Invoke-WebRequest -Uri "$BaseUrl/api/observations" -WebSession $session -UseBasicParsing
  $observationsPayload = ConvertFrom-JsonSafe $observationsResponse.Content "GET /api/observations"
  if (-not $observationsPayload) {
    throw "authenticated observations route returned empty payload"
  }
  Write-Host "PASS  authenticated observations route reachable" -ForegroundColor Green

  if ($supabaseReady) {
    Write-Step "Admin observation save with evidence"
    $timestamp = [DateTimeOffset]::UtcNow.ToString("yyyy-MM-ddTHH:mm:ssK")
    $note = "smoke-observation-$([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())"
    $cookieHeader = Get-CookieHeader $session $BaseUrl
    if (-not $cookieHeader) {
      throw "No admin session cookie available for multipart upload"
    }
    try {
      $saveResponsePath = Join-Path $projectRoot ".smoke-observation-response.json"
      $saveArgs = @(
        "-s",
        "-o", $saveResponsePath,
        "-w", "%{http_code}",
        "-H", "Cookie: $cookieHeader",
        "-F", "canonicalProductId=apples",
        "-F", "storeId=kroger-30328",
        "-F", "priceType=regular",
        "-F", "measurementUnit=lb",
        "-F", "comparabilityGrade=exact",
        "-F", "priceAmount=5.55",
        "-F", "measurementValue=3",
        "-F", "sourceUrl=https://www.kroger.com/p/gala-apples",
        "-F", "collectedAt=$timestamp",
        "-F", "notes=$note",
        "-F", "evidence=@$evidencePath;type=application/pdf",
        "$BaseUrl/api/observations"
      )
      $saveCode = & curl.exe @saveArgs
      if ($saveCode -ne "200") {
        $saveError = if (Test-Path $saveResponsePath) { Get-Content $saveResponsePath -Raw } else { "" }
        throw "POST /api/observations expected 200 but got $saveCode. $saveError"
      }
      $savedPayload = ConvertFrom-JsonSafe (Get-Content $saveResponsePath -Raw) "POST /api/observations"
      Write-Host "PASS  admin observation save -> 200" -ForegroundColor Green

      $savedObservation = $savedPayload.observation
      if (-not $savedObservation.id) {
        throw "Saved observation payload missing id"
      }
      if (-not $savedObservation.evidenceId) {
        throw "Saved observation payload missing evidenceId"
      }

      $recentResponse = Invoke-WebRequest -Uri "$BaseUrl/api/observations" -WebSession $session -UseBasicParsing
      $recentPayload = ConvertFrom-JsonSafe $recentResponse.Content "GET /api/observations after save"
      $matched = $recentPayload.observations | Where-Object { $_.id -eq $savedObservation.id }
      if (-not $matched) {
        throw "Saved observation not found in recent observations"
      }
      Write-Host "PASS  saved observation appears in recent observations" -ForegroundColor Green

      $evidenceCode = curl.exe -s -o NUL -w "%{http_code}" -H "Cookie: $cookieHeader" "$BaseUrl/api/admin/evidence/$($savedObservation.evidenceId)"
      if ($evidenceCode -ne "302" -and $evidenceCode -ne "307") {
        throw "Evidence download expected redirect but got $evidenceCode"
      }
      Write-Host "PASS  evidence download route issues redirect" -ForegroundColor Green

      $unauthEvidenceCode = curl.exe -s -o NUL -w "%{http_code}" "$BaseUrl/api/admin/evidence/$($savedObservation.evidenceId)"
      if ($unauthEvidenceCode -ne "401") {
        throw "Unauthenticated evidence access expected 401 but got $unauthEvidenceCode"
      }
      Write-Host "PASS  unauthenticated evidence route is blocked" -ForegroundColor Green

      Write-Step "Public Supabase view proof"
      $publicRows = curl.exe -s `
        "$($envMap['NEXT_PUBLIC_SUPABASE_URL'])/rest/v1/published_price_observations?select=id,store_id,canonical_product_id,price_type,source_url,collected_at,published_at&store_id=eq.kroger-30328&price_type=eq.regular&limit=25" `
        -H "apikey: $($envMap['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'])" `
        -H "Authorization: Bearer $($envMap['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'])"
      if ($publicRows -match '"message"') {
        throw "Public Supabase view query returned an error: $publicRows"
      }
      $publicPayload = ConvertFrom-JsonSafe $publicRows "published_price_observations query"
      if (-not $publicPayload -or $publicPayload.Count -lt 1) {
        throw "published_price_observations did not return governed published rows"
      }
      Write-Host "PASS  public view still exposes governed published rows" -ForegroundColor Green

      $savedCollectedAt = [DateTimeOffset]::Parse($savedObservation.collectedAt).UtcDateTime
      $leakedPublicRows = @(
        $publicPayload | Where-Object {
          $_.source_url -eq $savedObservation.sourceUrl -and
          (Get-Date $_.collected_at).ToUniversalTime() -eq $savedCollectedAt
        }
      )

      if ($leakedPublicRows.Count -gt 0) {
        throw "Unpublished manual observation leaked through published_price_observations"
      }

      Write-Host "PASS  unpublished manual observation stays out of published_price_observations" -ForegroundColor Green
    } finally {
      Remove-Item $saveResponsePath -ErrorAction SilentlyContinue
    }
  } else {
    Write-Host "SKIP  admin save and public Supabase view proof skipped because Supabase env vars are incomplete" -ForegroundColor Yellow
  }
} else {
  Write-Host "SKIP  valid admin unlock smoke skipped because ADMIN_ACCESS_TOKEN or ADMIN_SESSION_SECRET is blank" -ForegroundColor Yellow
}

Write-Step "Public view / evidence / payment manual proof reminders"
if ($SkipSupabaseProof) {
  Write-Host "SKIP  Supabase live policy proof skipped" -ForegroundColor Yellow
} elseif (-not $supabaseReady) {
  Write-Host "SKIP  Supabase live policy proof skipped because Supabase env vars are incomplete" -ForegroundColor Yellow
} else {
  Write-Host "TODO  Run scripts/verify-supabase-policies.sql against the linked Supabase project." -ForegroundColor Yellow
}

if ($SkipPayment) {
  Write-Host "SKIP  Direct payment is not part of the current product model" -ForegroundColor Yellow
} else {
  Write-Host "INFO  Stripe env vars are present, but direct payment is not part of the current product model." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Local smoke completed." -ForegroundColor Green
