# Google Sheets Apps Script Runner

This is the easiest POC path once you have exported `ugc_staging_export_YYYY-MM-DD.csv` from the HTML app.

## What It Does

The Apps Script reads rows from a Google Sheets tab named `HTML Staging`, fetches each usable portfolio URL, and supports the agent-first MVP workflow:

- `Portfolio Enrichment`
- `Outreach Drafts`
- `Run Log`
- `Creators`
- `Evidence`
- `Brand Brief`
- `Matches`
- `Review Queue`
- `Outreach Queue`
- `MVP Control Center`
- `Approved Outreach Export`
- archive tabs for previous runs

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

12. For the first setup, click:

```text
UGC Pipeline > Setup Agent-First MVP
```

13. To build the MVP tabs from your imported CSV, click:

```text
UGC Pipeline > Populate MVP From HTML Staging
```

14. To refresh the dashboard, click:

```text
UGC Pipeline > Refresh MVP Control Center
```

15. To test the portfolio enrichment POC, click:

```text
UGC Pipeline > Run first 10 enrichments
```

16. Google will ask for permission the first time. Approve it.
17. When the script finishes, check these tabs:

```text
Portfolio Enrichment
Outreach Drafts
Run Log
```

## MVP Control Center

Use `MVP Control Center` as the first tab to inspect after setup, populate, archive/reset, or approval changes.

It shows:

- current round ID
- active campaign ID
- brand media room URL status
- staging row count
- creator row count
- email-ready count
- blocked outreach count
- needs-approval count
- approved-to-send count
- approved export row count
- last archive run ID
- last populate run timestamp
- last approved export timestamp
- agent safety controls

Anything marked `Fix`, `Check`, or `Review` needs attention before outreach moves forward.

## Brand Brief

Use `Brand Brief` to tell the workbook what the brand is looking for before running `Populate MVP From HTML Staging`.

Important rows:

```text
brand_name
media_room_url
product_category
campaign_goal
creator_type_needed
required_niches
preferred_niches
excluded_niches
required_location
required_platforms
must_have_email
```

Use comma-separated values for niche, location, and platform fields.

Example:

```text
required_niches: beauty, skincare
preferred_niches: lifestyle, wellness
excluded_niches: gambling, alcohol
required_platforms: TikTok, Instagram
must_have_email: Yes
```

`Populate MVP From HTML Staging` uses `Brand Brief` to score `Matches`.

## Export Approved Outreach List

Use this only after reviewing `Review Queue` and confirming `Outreach Queue` has rows marked `Approved To Send`.

Click:

```text
UGC Pipeline > Export Approved Outreach List
```

The script writes a clean tab:

```text
Approved Outreach Export
```

It only exports rows where:

- `outreach_status` is `Approved To Send`
- `approved_by_human` is `TRUE`
- email exists
- `Campaigns!N2` has a brand media room URL

No emails are sent. This is only a final human-review export.

## Starting A New HTML Staging Run

Use this before importing a fresh staging CSV.

1. Finish reviewing the current run.
2. Click:

```text
UGC Pipeline > Archive Current Run + Reset For New Staging
```

3. Confirm the warning.
4. The script copies the old run into hidden archive tabs:

```text
Archive Index
Archive - HTML Staging
Archive - Creators
Archive - Evidence
Archive - Matches
Archive - Review Queue
Archive - Outreach Queue
```

5. The script clears only the active working tabs:

```text
HTML Staging
Creators
Evidence
Matches
Review Queue
Outreach Queue
```

6. Import the new CSV into `HTML Staging`.
7. Click:

```text
UGC Pipeline > Populate MVP From HTML Staging
```

8. Check `MVP Control Center`.
9. Review the new rows in `Review Queue`.
10. Only rows marked `Approved` in `Review Queue` can move to `Approved To Send` in `Outreach Queue`.

Archive tabs are hidden by default after reset so the workbook stays clean during normal operation.

To inspect archive tabs:

```text
UGC Pipeline > Show Archive Tabs
```

To hide them again:

```text
UGC Pipeline > Hide Archive Tabs
```

## How To Use It Safely

Start with 10 rows. Review the output. If the results look useful, use:

```text
UGC Pipeline > Run next blank enrichments
```

That option skips Reddit usernames already present in `Portfolio Enrichment`.

For the agent-first MVP tabs, use `Populate MVP From HTML Staging` after each fresh CSV import. Outreach rows are blocked unless they have an email, a campaign media room URL, and human approval.

## Expected Limitations

- Some Canva design pages may be image-heavy and need manual review.
- Some portfolios hide text behind JavaScript, which Google Apps Script may not fully extract.
- Social profile scraping is intentionally not included in this POC.
- Email sending is intentionally not included in this POC.

## If Something Breaks

Look at the `Run Log` tab first. The script logs failed URLs there instead of stopping the whole run.
