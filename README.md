# Creator Data Pipeline

Lightweight POC for turning Reddit UGC creator comments into a clean staging CSV, then enriching creator records from public portfolio pages.

## What This Repo Contains

- `index.html` - browser-based Reddit UGC extractor, ready for GitHub Pages.
- `scripts/enrich_ugc_poc.mjs` - local enrichment script for staging CSV files.
- `google-apps-script/Code.gs` - Google Sheets menu runner for enrichment.
- `samples/sample_ugc_staging_export.csv` - tiny sample input for testing.
- `docs/POC_README.md` - guided workflow for export, enrichment, and Google Sheets import.
- `docs/GOOGLE_SHEETS_APPS_SCRIPT.md` - click-by-click setup for the Sheets runner.

## Quick Start

1. Open `index.html` in a browser, or use the GitHub Pages URL after Pages is enabled.
2. Paste a Reddit post URL.
3. Open Reddit JSON pages, save them as `.txt` or `.json`, and drop them into the app.
4. Click **Export Staging CSV**.
5. Import the downloaded CSV into Google Sheets as `HTML Staging`.

## Run Enrichment Locally

```powershell
node scripts/enrich_ugc_poc.mjs --input samples/sample_ugc_staging_export.csv --out-dir outputs/enriched --limit 10
```

The script writes:

- `portfolio_enrichment.csv`
- `outreach_drafts.csv`
- `run_log.csv`

## Run Enrichment In Google Sheets

Use the Apps Script runner if you want the POC to stay mostly inside Google Sheets:

1. Import the staging CSV into a tab named `HTML Staging`.
2. Copy `google-apps-script/Code.gs` into `Extensions > Apps Script`.
3. Refresh the Sheet.
4. Use `UGC Pipeline > Run first 10 enrichments`.

Full guide: `docs/GOOGLE_SHEETS_APPS_SCRIPT.md`

## Safety Notes

- This POC does not send emails.
- Outreach is draft-only.
- Social profiles are not scraped automatically.
- Portfolio scraping uses visible text and public links only.
