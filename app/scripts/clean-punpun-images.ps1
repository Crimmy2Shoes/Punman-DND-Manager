param([string]$Workspace = (Split-Path (Split-Path $PSScriptRoot)))
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$sourcePath = Join-Path $Workspace 'References\PunPun_Character.xlsx'
$outputPath = Join-Path $Workspace 'References\PunPun_Character_NoExternalImages.xlsx'
if (Test-Path -LiteralPath $outputPath) { throw 'The output already exists. Choose a new output name before running again.' }
$sourceHash = (Get-FileHash -LiteralPath $sourcePath -Algorithm SHA256).Hash
$source = [System.IO.Compression.ZipFile]::OpenRead($sourcePath)
$output = [System.IO.Compression.ZipFile]::Open($outputPath, [System.IO.Compression.ZipArchiveMode]::Create)
$removed = @()
$preserved = @{}
try {
  foreach ($entry in $source.Entries) {
    $input = $entry.Open()
    $memory = [System.IO.MemoryStream]::new()
    try { $input.CopyTo($memory); $bytes = $memory.ToArray() } finally { $input.Dispose(); $memory.Dispose() }
    if ($entry.FullName -match '^xl/worksheets/sheet\d+\.xml$') {
      $document = [System.Xml.XmlDocument]::new()
      $document.PreserveWhitespace = $true
      $document.LoadXml([System.Text.Encoding]::UTF8.GetString($bytes))
      $cells = @($document.SelectNodes('//*[local-name()="sheetData"]//*[local-name()="c"]'))
      $imageGroups = @{}
      foreach ($cell in $cells) {
        $formula = $cell.SelectSingleNode('./*[local-name()="f"]')
        if ($formula -and $formula.InnerText -match '(?i)\bIMAGE\s*\(' -and $formula.GetAttribute('t') -eq 'shared') { $imageGroups[$formula.GetAttribute('si')] = $true }
      }
      foreach ($cell in $cells) {
        $formula = $cell.SelectSingleNode('./*[local-name()="f"]')
        if (!$formula) { continue }
        if ($formula.InnerText -match '(?i)\bIMAGE\s*\(' -or ($formula.GetAttribute('t') -eq 'shared' -and $imageGroups.ContainsKey($formula.GetAttribute('si')))) {
          $removed += "$($entry.FullName)!$($cell.GetAttribute('r'))"
          foreach ($node in @($cell.SelectNodes('./*[local-name()="f" or local-name()="v" or local-name()="is"]'))) { [void]$cell.RemoveChild($node) }
          $cell.RemoveAttribute('t')
        } else {
          $preserved["$($entry.FullName)!$($cell.GetAttribute('r'))"] = $formula.OuterXml
        }
      }
      $serialized = [System.IO.MemoryStream]::new()
      $settings = [System.Xml.XmlWriterSettings]::new()
      $settings.Encoding = [System.Text.UTF8Encoding]::new($false)
      $writer = [System.Xml.XmlWriter]::Create($serialized, $settings)
      try { $document.Save($writer); $writer.Flush(); $bytes = $serialized.ToArray() } finally { $writer.Dispose(); $serialized.Dispose() }
    }
    $newEntry = $output.CreateEntry($entry.FullName, [System.IO.Compression.CompressionLevel]::Optimal)
    $newEntry.LastWriteTime = $entry.LastWriteTime
    $stream = $newEntry.Open()
    try { $stream.Write($bytes, 0, $bytes.Length) } finally { $stream.Dispose() }
  }
} finally { $output.Dispose(); $source.Dispose() }
# Verify the saved copy, not just the in-memory modifications.
$check = [System.IO.Compression.ZipFile]::OpenRead($outputPath)
$verified = 0
try {
  foreach ($entry in $check.Entries) {
    if ($entry.FullName -notmatch '^xl/worksheets/sheet\d+\.xml$') { continue }
    $reader = [System.IO.StreamReader]::new($entry.Open())
    try { [xml]$document = $reader.ReadToEnd() } finally { $reader.Dispose() }
    foreach ($cell in $document.SelectNodes('//*[local-name()="sheetData"]//*[local-name()="c"]')) {
      $formula = $cell.SelectSingleNode('./*[local-name()="f"]')
      if (!$formula) { continue }
      if ($formula.InnerText -match '(?i)\bIMAGE\s*\(') { throw 'An external image formula remains.' }
      $key = "$($entry.FullName)!$($cell.GetAttribute('r'))"
      if (!$preserved.ContainsKey($key) -or $preserved[$key] -ne $formula.OuterXml) { throw "A calculation formula changed: $key" }
      $verified++
    }
  }
} finally { $check.Dispose() }
if ($verified -ne $preserved.Count) { throw 'Calculation formula count changed.' }
if ((Get-FileHash -LiteralPath $sourcePath -Algorithm SHA256).Hash -ne $sourceHash) { throw 'Original workbook changed.' }
"Created: $outputPath"
"Removed image formulas (including shared followers): $($removed.Count)"
"Verified unchanged calculation formulas: $verified"
"Original workbook unchanged: $sourceHash"
