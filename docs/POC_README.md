# Reddit UGC Staging To Canva Enrichment POC

## 1. Export From The HTML App

Open `index.html`, drop the Reddit JSON files, then click **Export Staging CSV**.

Primary output:

```text
ugc_staging_export_YYYY-MM-DD.csv
```

Import that CSV into the Google Sheet as a tab named:

```text
HTML Staging
```

## 2. Run Local Enrichment

For a first 10-row smoke test:

```powershell
node scripts/enrich_ugc_poc.mjs --input samples/sample_ugc_staging_export.csv --out-dir outputs/enriched --limit 10
```

For a real exported CSV:

```powershell
node scripts/enrich_ugc_poc.mjs --input C:\path\to\ugc_staging_export_2026-06-04.csv --out-dir outputs/enriched --limit 10
```

Outputs:

```text
outputs/enriched/portfolio_enrichment.csv
outputs/enriched/outreach_drafts.csv
outputs/enriched/run_log.csv
```

Import these into Google Sheets as:

```text
Portfolio Enrichment
Outreach Drafts
Run Log
```

## Notes

- The script does not send emails.
- Social profiles are not scraped in this POC.
- Social metrics are only extracted if they are visible in the portfolio text.
- Rows with no email are marked `Reddit DM Needed`.
- Canva design pages or image-heavy pages may be marked for manual review.
