param(
  [string]$BaseUrl = "http://localhost:3000",
  [string]$OutputDir
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot

function Resolve-PythonCommand {
  $python = Get-Command "python" -ErrorAction SilentlyContinue
  if ($python) {
    return $python.Source
  }

  $python3 = Get-Command "python3" -ErrorAction SilentlyContinue
  if ($python3) {
    return $python3.Source
  }

  return $null
}

$pythonCommand = Resolve-PythonCommand

function Test-PlaywrightAvailable {
  if (-not $pythonCommand) {
    return $false
  }

  try {
    $result = @'
import importlib.util
print("yes" if importlib.util.find_spec("playwright") else "no")
'@ | & $pythonCommand -
    return $result.Trim() -eq "yes"
  } catch {
    return $false
  }
}

function Resolve-BrowserPath {
  $candidates = @(
    "C:\Program Files\Google\Chrome\Application\chrome.exe",
    "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    "C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
  )

  foreach ($candidate in $candidates) {
    if (Test-Path $candidate) {
      return $candidate
    }
  }

  return $null
}

function Assert-AssetCreated {
  param(
    [string]$Path,
    [string]$Label
  )

  for ($attempt = 0; $attempt -lt 50; $attempt += 1) {
    if (Test-Path $Path) {
      $file = Get-Item -LiteralPath $Path
      if ($file.Length -gt 0) {
        return
      }
    }

    Start-Sleep -Milliseconds 200
  }

  throw "$Label was not created at $Path"
}

function Invoke-BrowserCapture {
  param(
    [string[]]$Arguments,
    [string]$AssetPath,
    [string]$Label
  )

  $attempts = @("old", "new")

  foreach ($mode in $attempts) {
    $modeArguments = @()
    foreach ($argument in $Arguments) {
      if ($argument -eq "--headless=new") {
        $modeArguments += "--headless=$mode"
      } else {
        $modeArguments += $argument
      }
    }

    & $browserPath @modeArguments *> $null
    if (Test-Path $AssetPath) {
      $file = Get-Item -LiteralPath $AssetPath
      if ($file.Length -gt 0) {
        return
      }
      Remove-Item -LiteralPath $AssetPath -ErrorAction SilentlyContinue
    }
  }
  Assert-AssetCreated -Path $AssetPath -Label $Label
}

if ([string]::IsNullOrWhiteSpace($OutputDir)) {
  $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
  $OutputDir = Join-Path $projectRoot ".ops-evidence\ui-$timestamp"
}

if (-not (Test-Path $OutputDir)) {
  New-Item -ItemType Directory -Path $OutputDir | Out-Null
}

$playwrightAvailable = Test-PlaywrightAvailable

if ($playwrightAvailable) {
  @"
$(& $pythonCommand (Join-Path $projectRoot "scripts\capture-ui-evidence.py") --base-url $BaseUrl --output-dir $OutputDir)
"@.Trim() | Write-Output
  exit 0
}

$browserPath = Resolve-BrowserPath
if (-not $browserPath) {
  throw "No supported browser found for UI evidence capture."
}

$assets = @{
  homeDesktop = Join-Path $OutputDir "home-desktop.png"
  homeMobile = Join-Path $OutputDir "home-mobile.png"
  printableMobile = Join-Path $OutputDir "printable-mobile.png"
  printablePdf = Join-Path $OutputDir "printable.pdf"
}

$homeDesktopPath = $assets["homeDesktop"]
$homeMobilePath = $assets["homeMobile"]
$printableMobilePath = $assets["printableMobile"]
$printablePdfPath = $assets["printablePdf"]

Invoke-BrowserCapture -Arguments @("--headless=new", "--disable-gpu", "--virtual-time-budget=8000", "--window-size=1440,2200", "--screenshot=$homeDesktopPath", "$BaseUrl/") -AssetPath $homeDesktopPath -Label "Home desktop screenshot"
Invoke-BrowserCapture -Arguments @("--headless=new", "--disable-gpu", "--virtual-time-budget=8000", "--window-size=430,3400", "--screenshot=$homeMobilePath", "$BaseUrl/") -AssetPath $homeMobilePath -Label "Home mobile screenshot"
Invoke-BrowserCapture -Arguments @("--headless=new", "--disable-gpu", "--virtual-time-budget=8000", "--window-size=430,2400", "--screenshot=$printableMobilePath", "$BaseUrl/printable") -AssetPath $printableMobilePath -Label "Printable mobile screenshot"
Invoke-BrowserCapture -Arguments @("--headless=new", "--disable-gpu", "--print-to-pdf=$printablePdfPath", "$BaseUrl/printable") -AssetPath $printablePdfPath -Label "Printable PDF"

Write-Output "BROWSER=$browserPath"
Write-Output "HOME_DESKTOP=$homeDesktopPath"
Write-Output "HOME_MOBILE=$homeMobilePath"
Write-Output "PRINTABLE_MOBILE=$printableMobilePath"
Write-Output "PRINTABLE_PDF=$printablePdfPath"
