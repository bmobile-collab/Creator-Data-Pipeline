# Storage Organization

Use this structure for every sourcing round. The goal is simple: keep the code in GitHub, keep private creator data in Google Drive or local runtime folders, and make every run traceable.

## Golden Rule

GitHub stores:

- app code
- scripts
- docs
- synthetic samples

Google Drive or local runtime folders store:

- Reddit JSON files
- real staging CSVs
- creator emails
- portfolio enrichment outputs
- outreach drafts
- review notes

Do not commit real creator data to GitHub.

## Google Drive Folder Structure

Create this folder in Google Drive:

```text
Creator Data Pipeline/
```

Inside it:

```text
Creator Data Pipeline/
  00_Admin/
  01_Raw_Reddit/
  02_HTML_Staging_Exports/
  03_Google_Sheets_Workbooks/
  04_Portfolio_Enrichment_Runs/
  05_Review_And_QA/
  06_Outreach_Drafts/
  07_Final_Approved_Lists/
  99_Archive/
```

## Round Folder Structure

Each campaign/source run gets a round folder:

```text
Round_001_YYYY-MM-DD_reddit_ugc_paid/
```

Use this exact shape:

```text
Round_001_YYYY-MM-DD_reddit_ugc_paid/
  raw_reddit/
    page_001.json
    page_002.json
  staging/
    ugc_staging_export_YYYY-MM-DD.csv
  sheets/
    UGC Creator Pipeline POC - Round 1.url
  enrichment/
    run_001/
      portfolio_enrichment.csv
      outreach_drafts.csv
      run_log.csv
      run_manifest.csv
  review/
    qa_notes.md
    rejected_rows.csv
    approved_contact_ready.csv
  outreach/
    draft_ready.csv
    reddit_dm_needed.csv
  archive/
```

## File Naming Rules

Use predictable names:

```text
ugc_staging_export_YYYY-MM-DD.csv
portfolio_enrichment_run_001_YYYY-MM-DD.csv
outreach_drafts_run_001_YYYY-MM-DD.csv
run_log_run_001_YYYY-MM-DD.csv
approved_contact_ready_round_001_YYYY-MM-DD.csv
```

Avoid vague names like:

```text
final.csv
new.csv
test2.csv
fixed.csv
```

## Status Definitions

Use these statuses consistently:

```text
Ready
Contact Only
Needs Review
Approved
Rejected
Draft Ready
Reddit DM Needed
Missing Contact
```

## QA Rule

A creator can move to `Approved` only when the useful fields are supported by source evidence:

- email from Reddit comment or portfolio
- portfolio URL from Reddit comment or resolved page
- category/niche from visible comment or verified portfolio text
- brand/platform/follower claims only from visible creator-provided text

If the portfolio scrape says `needs_review`, do not treat its extracted category, summary, or metrics as verified.

## Scaling Rule

Run in batches:

```text
10 creators -> QA
50 creators -> QA
100 creators -> QA
500 creators -> only after stable error patterns
```

Every batch should have its own `run_###` folder or clearly separated Google Sheet output tabs.
