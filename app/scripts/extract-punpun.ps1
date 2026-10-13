Add-Type -AssemblyName System.IO.Compression.FileSystem
$workspace = Split-Path (Split-Path $PSScriptRoot)
$archive = [System.IO.Compression.ZipFile]::OpenRead((Join-Path $workspace 'References\PunPun_Character.xlsx'))
function Read-Part($name) {
  $reader = [System.IO.StreamReader]::new($archive.GetEntry($name).Open())
  try { [xml]$reader.ReadToEnd() } finally { $reader.Dispose() }
}
try {
  $strings = @((Read-Part 'xl/sharedStrings.xml').SelectNodes('//*[local-name()="si"]') | ForEach-Object { ($_.SelectNodes('.//*[local-name()="t"]') | ForEach-Object { $_.InnerText }) -join '' })
  $workbook = Read-Part 'xl/workbook.xml'
  $relations = Read-Part 'xl/_rels/workbook.xml.rels'
  $tabs = @()
  foreach ($tab in $workbook.SelectNodes('//*[local-name()="sheet"]')) {
    $rid = $tab.GetAttribute('id','http://schemas.openxmlformats.org/officeDocument/2006/relationships')
    $target = $relations.SelectSingleNode("//*[local-name()='Relationship'][@Id='$rid']").Target
    $sheet = Read-Part "xl/$target"
    $cells = @{}
    foreach ($cell in $sheet.SelectNodes('//*[local-name()="sheetData"]//*[local-name()="c"]')) {
      $v = $cell.SelectSingleNode('./*[local-name()="v"]')
      $f = $cell.SelectSingleNode('./*[local-name()="f"]')
      $value = if ($v) { $v.InnerText } else { '' }
      if ($cell.t -eq 's') { $value = $strings[[int]$value] }
      elseif ($cell.t -eq 'b') { $value = $value -eq '1' }
      elseif ($v -and (!$cell.t -or $cell.t -eq 'n') -and $value -ne '') { $value = [double]::Parse($value,[Globalization.CultureInfo]::InvariantCulture) }
      if ($f -or "$value".Trim()) {
        $item = @{value=$value}
        if ($f) { $item.formula = if ($f.InnerText) { '='+$f.InnerText } else { '=SHARED_FORMULA' } }
        $cells[$cell.r] = $item
      }
    }
    $sheetFile = ($target -split '/')[-1]
    $relationPath = "xl/worksheets/_rels/$sheetFile.rels"
    if ($archive.GetEntry($relationPath)) {
      $sheetRelations = Read-Part $relationPath
      foreach ($relation in $sheetRelations.SelectNodes('//*[local-name()="Relationship"]')) {
        if ($relation.Type -like '*/comments') {
          $commentsPath = if ($relation.Target.StartsWith('/')) { $relation.Target.TrimStart('/') } else { 'xl/' + $relation.Target.Replace('../','') }
          if ($archive.GetEntry($commentsPath)) {
            $comments = Read-Part $commentsPath
            foreach ($comment in $comments.SelectNodes('//*[local-name()="comment"]')) {
              if (!$cells.ContainsKey($comment.ref)) { $cells[$comment.ref] = @{value=''} }
              $cells[$comment.ref].note = ($comment.SelectNodes('.//*[local-name()="t"]') | ForEach-Object {$_.InnerText}) -join ''
            }
          }
        }
      }
    }
    $validations = @($sheet.SelectNodes('//*[local-name()="dataValidation"]') | ForEach-Object { @{range=$_.sqref;type=$_.type;source=$_.InnerText;strict=($_.showErrorMessage -eq '1')} })
    $merges = @($sheet.SelectNodes('//*[local-name()="mergeCell"]') | ForEach-Object {$_.ref})
    $tabs += @{title=$tab.name;cells=$cells;validations=$validations;merges=$merges}
  }
  $result = @{title='PunPun Character';source='local workbook';sheets=$tabs}
  [System.IO.File]::WriteAllText((Join-Path $workspace 'app\src\data\punpun.json'), ($result | ConvertTo-Json -Depth 12 -Compress), [System.Text.UTF8Encoding]::new($false))
  $tabs | ForEach-Object { "$($_.title): $($_.cells.Count) cells" }
} finally { $archive.Dispose() }
