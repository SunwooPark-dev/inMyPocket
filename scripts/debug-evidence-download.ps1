param(
  [string]$BaseUrl = 'http://localhost:3000'
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$envLocalPath = Join-Path $projectRoot '.env.local'
$envMap = @{}
Get-Content -LiteralPath $envLocalPath | ForEach-Object {
  if ($_ -match '^\s*([^#=\s]+)\s*=\s*(.*)\s*$') {
    $value = $matches[2].Trim()
    if ($value.Length -ge 2 -and $value.StartsWith('"') -and $value.EndsWith('"')) {
      $value = $value.Substring(1, $value.Length - 2)
    }
    $envMap[$matches[1]] = $value
  }
}

$base = $BaseUrl
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$body = @{ token = $envMap['ADMIN_ACCESS_TOKEN'] } | ConvertTo-Json -Compress
Invoke-WebRequest -Uri "$base/api/admin/unlock" -Method Post -ContentType 'application/json' -Body $body -WebSession $session -UseBasicParsing | Out-Null

$cookieCollection = $session.Cookies.GetCookies($base)

$tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("inmypoket-smoke-debug-" + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $tempRoot -Force | Out-Null
$respPath = Join-Path $tempRoot 'response.json'
$cookieJarPath = Join-Path $tempRoot 'cookies.txt'
$timestamp = [DateTimeOffset]::UtcNow.ToString('yyyy-MM-ddTHH:mm:ssK')
$note = "smoke-debug-$([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())"
$evidencePath = Join-Path (Join-Path (Join-Path $projectRoot 'tests') 'fixtures') 'smoke-evidence.pdf'
$baseUri = [Uri]$base
@('# Netscape HTTP Cookie File') | Set-Content -LiteralPath $cookieJarPath
foreach ($cookie in $cookieCollection) {
  $cookieDomain = if ([string]::IsNullOrWhiteSpace($cookie.Domain)) { $baseUri.Host } else { $cookie.Domain.TrimStart('.') }
  $cookiePath = if ([string]::IsNullOrWhiteSpace($cookie.Path)) { '/' } else { $cookie.Path }
  $cookieSecure = if ($cookie.Secure) { 'TRUE' } else { 'FALSE' }
  $cookieLine = "{0}`tTRUE`t{1}`t{2}`t0`t{3}`t{4}" -f $cookieDomain, $cookiePath, $cookieSecure, $cookie.Name, $cookie.Value
  Add-Content -LiteralPath $cookieJarPath -Value $cookieLine
}
$saveArgs = @(
  '-s',
  '-o', $respPath,
  '-w', '%{http_code}',
  '-b', $cookieJarPath,
  '-c', $cookieJarPath,
  '-F', 'canonicalProductId=apples',
  '-F', 'storeId=kroger-30328',
  '-F', 'priceType=regular',
  '-F', 'measurementUnit=lb',
  '-F', 'comparabilityGrade=exact',
  '-F', 'priceAmount=5.55',
  '-F', 'measurementValue=3',
  '-F', 'sourceUrl=https://www.kroger.com/p/gala-apples',
  '-F', "collectedAt=$timestamp",
  '-F', "notes=$note",
  '-F', "evidence=@$evidencePath;type=application/pdf",
  "$base/api/admin/observations"
)
$evidenceRespPath = Join-Path $tempRoot 'evidence.txt'
$evidenceHeaderPath = Join-Path $tempRoot 'evidence.headers.txt'

try {
  $saveCode = & curl.exe @saveArgs
  if ($saveCode -notmatch '^[23]\\d\\d$') {
    throw "Observation save failed with HTTP $saveCode."
  }
  $savedPayload = (Get-Content $respPath -Raw | ConvertFrom-Json)
  if (-not $savedPayload.observation -or -not $savedPayload.observation.id -or -not $savedPayload.observation.evidenceId) {
    throw 'Observation save response did not include the expected observation/evidence identifiers.'
  }
  $evidenceId = $savedPayload.observation.evidenceId
  $evidenceCode = & curl.exe -s -b $cookieJarPath -c $cookieJarPath -D $evidenceHeaderPath -o $evidenceRespPath -w '%{http_code}' "$base/api/admin/evidence/$evidenceId"
  $evidenceHeaders = Get-Content $evidenceHeaderPath -Raw
  $locationHeader = $null
  foreach ($line in ($evidenceHeaders -split "`r?`n")) {
    if ($line -match '^Location:\s*(.+)$') {
      $locationHeader = $matches[1].Trim()
      break
    }
  }

  $hasEvidenceLocation = -not [string]::IsNullOrWhiteSpace($locationHeader)

  $result = [ordered]@{
    saveCode = $saveCode
    savedObservationId = $savedPayload.observation.id
    evidenceCode = $evidenceCode
    evidenceLocationPresent = $hasEvidenceLocation
    tempArtifactsRemoved = $true
  }

  $result | ConvertTo-Json -Compress | Write-Output
}
finally {
  if (Test-Path $tempRoot) {
    Remove-Item -LiteralPath $tempRoot -Recurse -Force
  }
}
