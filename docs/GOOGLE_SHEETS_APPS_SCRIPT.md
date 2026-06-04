# Google Sheets Apps Script Runner

This is the easiest POC path once you have exported `ugc_staging_export_YYYY-MM-DD.csv` from the HTML app.

## What It Does

The Apps Script reads rows from a Google Sheets tab named `HTML Staging`, fetches each usable portfolio URL, and writes three new tabs:

- `Portfolio Enrichment`
- `Outreach Drafts`
- `Run Log`

It does not send emails.

## Step By Step

1. Open Google Sheets.
2. Create a new spreadsheet.
3. Import your staging CSV.
4. Rename the imported tab exactly:

```text
HTML Staging
```

5. In Google Sheets, click:

```text
Extensions > Apps Script
```

6. Delete any starter code in the editor.
7. Open this repo file:

```text
google-apps-script/Code.gs
```

8. Paste the full code into Apps Script.
9. Click Save.
10. Go back to the Google Sheet and refresh the browser tab.
11. You should see a new menu:

```text
UGC Pipeline
```

12. Click:

```text
UGC Pipeline > Run first 10 enrichments
```

13. Google will ask for permission the first time. Approve it.
14. When the script finishes, check these tabs:

```text
Portfolio Enrichment
Outreach Drafts
Run Log
```

## How To Use It Safely

Start with 10 rows. Review the output. If the results look useful, use:

```text
UGC Pipeline > Run next blank enrichments
```

That option skips Reddit usernames already present in `Portfolio Enrichment`.

## Expected Limitations

- Some Canva design pages may be image-heavy and need manual review.
- Some portfolios hide text behind JavaScript, which Google Apps Script may not fully extract.
- Social profile scraping is intentionally not included in this POC.
- Email sending is intentionally not included in this POC.

## If Something Breaks

Look at the `Run Log` tab first. The script logs failed URLs there instead of stopping the whole run.
