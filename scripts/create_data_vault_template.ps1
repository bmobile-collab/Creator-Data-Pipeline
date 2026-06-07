param(
  [string]$OutputPath = "..\outputs\UGC_Creator_Data_Vault_Template.xlsx"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Convert-ToColumnName {
  param([int]$Index)
  $name = ""
  while ($Index -gt 0) {
    $mod = ($Index - 1) % 26
    $name = [char](65 + $mod) + $name
    $Index = [math]::Floor(($Index - $mod) / 26)
  }
  return $name
}

function Escape-XmlText {
  param([string]$Value)
  if ($null -eq $Value) { return "" }
  return [System.Security.SecurityElement]::Escape($Value)
}

function New-SheetXml {
  param(
    [string[]]$Headers,
    [string[][]]$Rows
  )

  $allRows = @()
  $allRows += ,$Headers
  foreach ($row in $Rows) { $allRows += ,$row }

  $sheetRows = New-Object System.Collections.Generic.List[string]
  for ($r = 0; $r -lt $allRows.Count; $r++) {
    $rowNumber = $r + 1
    $cells = New-Object System.Collections.Generic.List[string]
    for ($c = 0; $c -lt $allRows[$r].Count; $c++) {
      $cellRef = "$(Convert-ToColumnName ($c + 1))$rowNumber"
      $style = if ($rowNumber -eq 1) { ' s="1"' } else { "" }
      $value = Escape-XmlText $allRows[$r][$c]
      $cells.Add("<c r=`"$cellRef`" t=`"inlineStr`"$style><is><t>$value</t></is></c>")
    }
    $sheetRows.Add("<row r=`"$rowNumber`">$($cells -join '')</row>")
  }

  $dimensionEnd = "$(Convert-ToColumnName $Headers.Count)$($allRows.Count)"
  return @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetViews>
    <sheetView workbookViewId="0">
      <pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>
      <selection pane="bottomLeft" activeCell="A2" sqref="A2"/>
    </sheetView>
  </sheetViews>
  <dimension ref="A1:$dimensionEnd"/>
  <sheetData>
    $($sheetRows -join "`n    ")
  </sheetData>
</worksheet>
"@
}

$sheets = @(
  @{
    Name = "Creator Master"
    Headers = @(
      "vault_creator_id",
      "canonical_creator_key",
      "display_name",
      "reddit_username",
      "normalized_reddit_username",
      "primary_email",
      "primary_portfolio_url",
      "primary_social_url",
      "strongest_platform",
      "niches",
      "location",
      "creator_type",
      "family_parent_flag",
      "gender_flag",
      "confidence_score",
      "first_seen_at",
      "last_seen_at",
      "first_seen_round_id",
      "last_seen_round_id",
      "status",
      "review_notes"
    )
    Rows = @(
      @("VC000001", "reddit:examplecreator", "Example Creator", "u/examplecreator", "examplecreator", "creator@example.com", "https://example.com/portfolio", "https://instagram.com/examplecreator", "Instagram", "beauty, lifestyle", "New York, NY", "UGC Creator", "Unknown", "Unknown", "0.70", "2026-06-07T00:00:00Z", "2026-06-07T00:00:00Z", "ROUND001", "ROUND001", "Active", "Example row. Delete after import.")
    )
  },
  @{
    Name = "Contact Methods"
    Headers = @(
      "contact_id",
      "vault_creator_id",
      "contact_type",
      "contact_value",
      "normalized_contact_value",
      "source_url",
      "source_round_id",
      "first_seen_at",
      "last_seen_at",
      "verified_status",
      "notes"
    )
    Rows = @(
      @("CT000001", "VC000001", "email", "creator@example.com", "creator@example.com", "https://example.com/portfolio", "ROUND001", "2026-06-07T00:00:00Z", "2026-06-07T00:00:00Z", "Unverified", "Example row. Delete after import.")
    )
  },
  @{
    Name = "Creator Evidence"
    Headers = @(
      "evidence_id",
      "vault_creator_id",
      "field_name",
      "claimed_value",
      "evidence_text",
      "evidence_source",
      "evidence_url",
      "source_round_id",
      "confidence",
      "verified_status",
      "created_at"
    )
    Rows = @(
      @("EV000001", "VC000001", "niche", "beauty", "Creator portfolio says beauty and lifestyle UGC.", "portfolio", "https://example.com/portfolio", "ROUND001", "0.60", "Unverified", "2026-06-07T00:00:00Z")
    )
  },
  @{
    Name = "Portfolio Snapshots"
    Headers = @(
      "snapshot_id",
      "vault_creator_id",
      "portfolio_url",
      "resolved_url",
      "url_type",
      "page_title",
      "extracted_text",
      "extracted_links",
      "extracted_emails",
      "extraction_status",
      "review_reason",
      "source_round_id",
      "captured_at"
    )
    Rows = @(
      @("PS000001", "VC000001", "https://example.com/portfolio", "https://example.com/portfolio", "personal_site", "Example Creator Portfolio", "Example extracted text goes here.", "https://instagram.com/examplecreator", "creator@example.com", "ok", "", "ROUND001", "2026-06-07T00:00:00Z")
    )
  },
  @{
    Name = "Outreach History"
    Headers = @(
      "outreach_event_id",
      "vault_creator_id",
      "campaign_id",
      "round_id",
      "channel",
      "email_or_handle",
      "template_id",
      "subject",
      "body_preview",
      "status",
      "approved_by_human",
      "sent_at",
      "response_status",
      "response_at",
      "notes"
    )
    Rows = @(
      @("OH000001", "VC000001", "CAMP001", "ROUND001", "Email", "creator@example.com", "T001", "Example subject", "Example body preview.", "Draft Ready", "FALSE", "", "", "", "Example row. Delete after import.")
    )
  },
  @{
    Name = "Vault Run Log"
    Headers = @(
      "run_log_id",
      "action",
      "source_workbook_id",
      "source_round_id",
      "records_read",
      "creators_created",
      "creators_updated",
      "evidence_added",
      "errors",
      "started_at",
      "finished_at",
      "run_by",
      "notes"
    )
    Rows = @(
      @("VRL000001", "template_created", "", "", "0", "0", "0", "0", "0", "2026-06-07T00:00:00Z", "2026-06-07T00:00:00Z", "Codex", "Example row. Delete after import.")
    )
  },
  @{
    Name = "Vault Config"
    Headers = @(
      "config_key",
      "config_value",
      "description"
    )
    Rows = @(
      @("schema_version", "0.1", "Data Vault schema version."),
      @("dedupe_priority", "email, normalized_reddit_username, portfolio_url, social_url", "Order used to connect new rows to existing creators."),
      @("auto_outreach_allowed", "No", "Must stay No for MVP.")
    )
  }
)

$root = Resolve-Path "."
$outputFullPath = [System.IO.Path]::GetFullPath((Join-Path $root $OutputPath))
$outputDir = Split-Path -Parent $outputFullPath
New-Item -ItemType Directory -Force -Path $outputDir | Out-Null

$tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("ugc-data-vault-xlsx-" + [guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Force -Path $tempRoot | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $tempRoot "_rels") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $tempRoot "xl") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $tempRoot "xl\_rels") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $tempRoot "xl\worksheets") | Out-Null

$sheetContentTypes = New-Object System.Collections.Generic.List[string]
$sheetEntries = New-Object System.Collections.Generic.List[string]
$sheetRels = New-Object System.Collections.Generic.List[string]

for ($i = 0; $i -lt $sheets.Count; $i++) {
  $sheetNumber = $i + 1
  $sheetPath = Join-Path $tempRoot "xl\worksheets\sheet$sheetNumber.xml"
  New-SheetXml -Headers $sheets[$i].Headers -Rows $sheets[$i].Rows | Out-File -FilePath $sheetPath -Encoding utf8
  $sheetContentTypes.Add("<Override PartName=`"/xl/worksheets/sheet$sheetNumber.xml`" ContentType=`"application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml`"/>")
  $sheetEntries.Add("<sheet name=`"$($sheets[$i].Name)`" sheetId=`"$sheetNumber`" r:id=`"rId$sheetNumber`"/>")
  $sheetRels.Add("<Relationship Id=`"rId$sheetNumber`" Type=`"http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet`" Target=`"worksheets/sheet$sheetNumber.xml`"/>")
}

@"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  $($sheetContentTypes -join "`n  ")
</Types>
"@ | Out-File -LiteralPath (Join-Path $tempRoot "[Content_Types].xml") -Encoding utf8

@"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>
"@ | Out-File -FilePath (Join-Path $tempRoot "_rels\.rels") -Encoding utf8

@"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    $($sheetEntries -join "`n    ")
  </sheets>
</workbook>
"@ | Out-File -FilePath (Join-Path $tempRoot "xl\workbook.xml") -Encoding utf8

@"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  $($sheetRels -join "`n  ")
  <Relationship Id="rId$($sheets.Count + 1)" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>
"@ | Out-File -FilePath (Join-Path $tempRoot "xl\_rels\workbook.xml.rels") -Encoding utf8

@"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2">
    <font><sz val="11"/><name val="Arial"/></font>
    <font><b/><sz val="11"/><name val="Arial"/></font>
  </fonts>
  <fills count="2">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFEAF2FF"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="2">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="1" borderId="0" xfId="0" applyFont="1" applyFill="1"/>
  </cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>
"@ | Out-File -FilePath (Join-Path $tempRoot "xl\styles.xml") -Encoding utf8

if (Test-Path $outputFullPath) {
  Remove-Item -LiteralPath $outputFullPath -Force
}

Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory($tempRoot, $outputFullPath)
Remove-Item -LiteralPath $tempRoot -Recurse -Force

Write-Host "Created $outputFullPath"
