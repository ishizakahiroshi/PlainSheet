<#
.SYNOPSIS
  Builds the Microsoft Store MSIX package from the exe of a published release.

.DESCRIPTION
  Nothing is compiled here. The package wraps the PlainSheet.exe attached to the
  GitHub Release of -Tag, after checking it against that release's
  SHA256SUMS.txt, so the Store ships the same file as every other channel.

  Steps: download and verify the exe, stage it with the Store icons, fill
  {{VERSION}} in the tracked manifest, validate the manifest, pack with
  MakeAppx, then unpack the result and validate its manifest again.

  The Store signs the package itself after certification; a submission package
  needs no signature.

.PARAMETER Tag
  Release tag to package, for example v0.1.0. Stable tags only.

.PARAMETER ExePath
  Use this exe instead of downloading the release asset (local trial builds).
  The result is not the released file, so do not submit it to the Store.

.PARAMETER TestIdentity
  Replace the package identity with a throwaway one. Use it for a trial
  install: a package installed under the real identity collides with the
  version that later arrives from the Store.

.EXAMPLE
  pwsh scripts/release/build-msix.ps1 -Tag v0.1.0
#>
param(
  [Parameter(Mandatory = $true)][string]$Tag,
  [string]$ExePath,
  [switch]$TestIdentity
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$Repository = "ishizakahiroshi/PlainSheet"
$ExeName = "PlainSheet.exe"
$FileTypes = @(".csv", ".tsv", ".md", ".markdown", ".json", ".yaml", ".yml")

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = (Resolve-Path (Join-Path $ScriptDir "..\..")).Path
$IconsDir = Join-Path $RepoRoot "src-tauri\icons"
$ManifestTemplate = Join-Path $ScriptDir "msix\AppxManifest.xml"
$OutDir = Join-Path $RepoRoot "dist\msix"
$StageDir = Join-Path $OutDir "package"
$VerifyDir = Join-Path $OutDir "verified-package"
$AssetsDir = Join-Path $OutDir "release-assets"

if ($Tag -notmatch '^v(\d+\.\d+\.\d+)$') {
  throw "Tag must be a stable release tag like v0.1.0 (got '$Tag')."
}
$packageVersion = "$($Matches[1]).0"

function Find-WindowsSdkTool {
  param([Parameter(Mandatory = $true)][string]$Name)

  $sdkBin = "C:\Program Files (x86)\Windows Kits\10\bin"
  if (-not (Test-Path -LiteralPath $sdkBin)) { return $null }
  Get-ChildItem -LiteralPath $sdkBin -Recurse -Filter $Name -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -match "\\x64\\" } |
    Sort-Object FullName -Descending |
    Select-Object -First 1 -ExpandProperty FullName
}

function Assert-MsixManifest {
  param(
    [Parameter(Mandatory = $true)][string]$Path,
    [Parameter(Mandatory = $true)][string]$ExpectedVersion
  )

  [xml]$document = Get-Content -Raw -LiteralPath $Path -Encoding UTF8
  $namespaces = [System.Xml.XmlNamespaceManager]::new($document.NameTable)
  $namespaces.AddNamespace("f", "http://schemas.microsoft.com/appx/manifest/foundation/windows10")
  $namespaces.AddNamespace("uap", "http://schemas.microsoft.com/appx/manifest/uap/windows10")

  $identity = $document.SelectSingleNode("/f:Package/f:Identity", $namespaces)
  if (-not $identity -or $identity.Version -ne $ExpectedVersion) {
    throw "Manifest Identity Version is not ${ExpectedVersion}: $Path"
  }

  $application = $document.SelectSingleNode("/f:Package/f:Applications/f:Application", $namespaces)
  if (-not $application) { throw "Manifest Application element is missing: $Path" }
  if ($application.Id -ne "App" -or
      $application.Executable -ne $ExeName -or
      $application.EntryPoint -ne "Windows.FullTrustApplication") {
    throw "Manifest Application identity changed unexpectedly: $Path"
  }

  $declared = @($document.SelectNodes(
      "/f:Package/f:Applications/f:Application/f:Extensions/" +
      "uap:Extension[@Category='windows.fileTypeAssociation']/" +
      "uap:FileTypeAssociation/uap:SupportedFileTypes/uap:FileType", $namespaces) |
    ForEach-Object { $_.InnerText })
  $missing = @($FileTypes | Where-Object { $declared -notcontains $_ })
  if ($missing.Count -gt 0) {
    throw "Manifest does not declare the file types $($missing -join ', '): $Path"
  }
}

$makeAppx = Find-WindowsSdkTool -Name "makeappx.exe"
if (-not $makeAppx) { throw "makeappx.exe was not found. Install the Windows SDK." }
if (-not (Test-Path -LiteralPath $ManifestTemplate)) {
  throw "Tracked MSIX manifest was not found: $ManifestTemplate"
}

foreach ($path in @($StageDir, $VerifyDir, $AssetsDir)) {
  if (Test-Path -LiteralPath $path) { Remove-Item -LiteralPath $path -Recurse -Force }
}
New-Item -ItemType Directory -Force -Path (Join-Path $StageDir "Assets") | Out-Null

if ($ExePath) {
  $sourceExe = (Resolve-Path -LiteralPath $ExePath).Path
  Write-Warning "Packaging a local exe, not the released file. Do not submit this package."
} else {
  gh release download $Tag --repo $Repository --dir $AssetsDir --pattern $ExeName --pattern "SHA256SUMS.txt"
  if ($LASTEXITCODE -ne 0) { throw "Could not download $ExeName from release $Tag." }
  $sourceExe = Join-Path $AssetsDir $ExeName
  $line = Get-Content -LiteralPath (Join-Path $AssetsDir "SHA256SUMS.txt") |
    Where-Object { $_ -match "^([0-9a-f]{64})\s+\*?$([regex]::Escape($ExeName))$" } |
    Select-Object -First 1
  if (-not $line) { throw "SHA256SUMS.txt of $Tag has no entry for $ExeName." }
  $expected = ($line -split '\s+')[0]
  $actual = (Get-FileHash -LiteralPath $sourceExe -Algorithm SHA256).Hash.ToLowerInvariant()
  if ($actual -ne $expected) { throw "Checksum mismatch for ${ExeName}: $actual != $expected" }
  Write-Host "Verified $ExeName of $Tag (sha256 $expected)"
}
Copy-Item -LiteralPath $sourceExe -Destination (Join-Path $StageDir $ExeName)

$logoNames = @(
  "Square30x30Logo.png", "Square44x44Logo.png", "Square71x71Logo.png",
  "Square89x89Logo.png", "Square107x107Logo.png", "Square142x142Logo.png",
  "Square150x150Logo.png", "Square284x284Logo.png", "Square310x310Logo.png",
  "StoreLogo.png"
)
foreach ($name in $logoNames) {
  $source = Join-Path $IconsDir $name
  if (-not (Test-Path -LiteralPath $source)) { throw "Store icon is missing: $source" }
  Copy-Item -LiteralPath $source -Destination (Join-Path $StageDir "Assets\$name")
}

$manifest = Get-Content -Raw -LiteralPath $ManifestTemplate -Encoding UTF8
$manifest = $manifest.Replace("{{VERSION}}", $packageVersion)
$suffix = ""
if ($TestIdentity) {
  $manifest = $manifest.Replace('Name="ishizakahiroshi.PlainSheet"', 'Name="PlainSheet.LocalTrial"')
  $manifest = $manifest.Replace("<DisplayName>PlainSheet</DisplayName>", "<DisplayName>PlainSheet (local trial)</DisplayName>")
  $manifest = $manifest.Replace('DisplayName="PlainSheet"', 'DisplayName="PlainSheet (local trial)"')
  $suffix = "-local-trial"
}
$stagedManifest = Join-Path $StageDir "AppxManifest.xml"
Set-Content -LiteralPath $stagedManifest -Value $manifest -Encoding UTF8 -NoNewline
Assert-MsixManifest -Path $stagedManifest -ExpectedVersion $packageVersion

$msixPath = Join-Path $OutDir "PlainSheet-$packageVersion$suffix.msix"
if (Test-Path -LiteralPath $msixPath) { Remove-Item -LiteralPath $msixPath -Force }
& $makeAppx pack /d $StageDir /p $msixPath /o | Out-Null
if ($LASTEXITCODE -ne 0) { throw "MakeAppx pack failed with exit code $LASTEXITCODE" }

& $makeAppx unpack /p $msixPath /d $VerifyDir /o | Out-Null
if ($LASTEXITCODE -ne 0) { throw "MakeAppx unpack failed with exit code $LASTEXITCODE" }
Assert-MsixManifest -Path (Join-Path $VerifyDir "AppxManifest.xml") -ExpectedVersion $packageVersion
$packedExe = (Get-FileHash -LiteralPath (Join-Path $VerifyDir $ExeName) -Algorithm SHA256).Hash
if ($packedExe -ne (Get-FileHash -LiteralPath $sourceExe -Algorithm SHA256).Hash) {
  throw "The exe inside the package differs from the source exe."
}

$size = (Get-Item -LiteralPath $msixPath).Length
Write-Host ""
Write-Host "MSIX package is ready ($packageVersion, $size bytes):"
Write-Host "  $msixPath"
Write-Host "Unpacked copy for inspection or a developer-mode trial:"
Write-Host "  $VerifyDir"
