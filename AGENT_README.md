# Agent README: Creator Data Pipeline MVP

This document is for any AI agent, automation runner, or human operator taking over the Creator Data Pipeline MVP. Treat it as the operating contract for the current build.

## Mission

Turn Reddit UGC creator comments into a reviewable, searchable, approval-gated Google Sheets workflow for brand outreach preparation.

The current MVP does not send emails. It prepares approved outreach exports only.

## Core Safety Rules

An agent must obey these rules at all times:

- Do not send email.
- Do not auto-approve creators.
- Do not move outreach to `Approved To Send` unless `Review Queue.human_decision` is `Approved`.
- Do not export outreach if `Campaigns!N2` is blank or `MISSING`.
- Do not treat portfolio claims as verified unless they are captured as visible source evidence.
- Do not commit or publish real creator data to GitHub.
- Keep real staging CSVs, creator emails, enrichment outputs, and outreach drafts in Google Drive or the live Google Sheet only.

## Repository Components

Important files:

```text
index.html
google-apps-script/Code.gs
docs/GOOGLE_SHEETS_APPS_SCRIPT.md
docs/STORAGE_ORGANIZATION.md
samples/sample_ugc_staging_export.csv
scripts/enrich_ugc_poc.mjs
```

Primary roles:

- `index.html`: browser app that exports `ugc_staging_export_YYYY-MM-DD.csv`.
- `google-apps-script/Code.gs`: main Google Sheets automation runner.
- `docs/GOOGLE_SHEETS_APPS_SCRIPT.md`: human setup guide for Apps Script.
- `docs/STORAGE_ORGANIZATION.md`: storage and folder rules.
- `scripts/enrich_ugc_poc.mjs`: local enrichment proof of concept.

## Google Sheet Contract

The current workbook is expected to contain these tabs:

```text
HTML Staging
Creators
Evidence
Campaigns
Brand Brief
Matches
Review Queue
Outreach Queue
Template Library
Template Performance
MVP Control Center
Approved Outreach Export
Run Log
Agent Run Log
Agent Control
Archive Index
Archive - HTML Staging
Archive - Creators
Archive - Evidence
Archive - Matches
Archive - Review Queue
Archive - Outreach Queue
```

## HTML Staging Input Schema

The `HTML Staging` tab must use these headers in this order:

```text
source_platform
source_post_url
source_post_title
reddit_username
email
portfolio_url
portfolio_url_type
all_urls
all_emails
comment_snippet
upvotes_max
date_posted
reddit_comment_url
has_canva
needs_contact_method
ingest_status
ingest_notes
```

The source CSV should come from `index.html` and be imported into a Google Sheets tab named exactly `HTML Staging`.

## Apps Script Menu Actions

The Google Sheet custom menu is `UGC Pipeline`.

### `Setup Agent-First MVP`

Creates or repairs core tabs, headers, dropdowns, safe templates, control values, and dashboard structure.

Important behavior:

- Preserves existing `Agent Control` values when they already exist.
- Creates or preserves the `Brand Brief` tab.
- Seeds safe outreach templates `T031` to `T034`.
- Applies dropdowns to review, match, outreach, campaign, and template status columns.
- Refreshes `MVP Control Center`.

### `Populate MVP From HTML Staging`

Reads `HTML Staging` and rebuilds:

```text
Creators
Evidence
Matches
Review Queue
Outreach Queue
```

Important behavior:

- Creates run-scoped creator IDs like `CR001`.
- Creates evidence rows for email, portfolio URL, comment snippet, and all URLs.
- Creates match rows with score, tier, reasons, missing requirements, and review reason.
- Creates one review row per creator.
- Creates one outreach row per creator.
- Runs `normalizeOutreachQueue_()` so outreach statuses are formula-gated.
- Logs `populate_from_html_staging` in `Agent Run Log`.
- Refreshes `MVP Control Center`.

### `Refresh MVP Control Center`

Rebuilds the `MVP Control Center` tab with live formulas.

This tab is the first health check for any run.

Important metrics:

```text
current_round_id
active_campaign_id
brand_media_room_url
staging_creator_rows
creator_rows
email_ready_count
reddit_dm_count
missing_contact_count
needs_review_count
approved_review_count
blocked_outreach_count
needs_approval_count
approved_to_send_count
last_archive_run_id
last_populate_run_at
approved_export_rows
last_approved_export_at
agent_mode
auto_outreach_allowed
```

Status meanings:

- `OK`: healthy.
- `Info`: acceptable informational state.
- `Ready`: ready for human action or export.
- `Review`: human review required.
- `Check`: inspect before continuing.
- `Fix`: do not proceed until corrected.

### `Export Approved Outreach List`

Creates or replaces the `Approved Outreach Export` tab.

Exports only rows from `Outreach Queue` where all of the following are true:

```text
email exists
outreach_status = Approved To Send
approved_by_human = TRUE
Campaigns!N2 has a media room URL
```

Output columns:

```text
exported_at
campaign_id
creator_id
email
outreach_subject
outreach_body
brand_media_room_url
approval_status
notes
```

This action does not send email.

### `Archive Current Run + Reset For New Staging`

Archives current working tabs into values-only archive tabs, then clears working tabs for a new CSV import.

Archived tabs:

```text
Archive Index
Archive - HTML Staging
Archive - Creators
Archive - Evidence
Archive - Matches
Archive - Review Queue
Archive - Outreach Queue
```

Cleared active tabs:

```text
HTML Staging
Creators
Evidence
Matches
Review Queue
Outreach Queue
```

Preserved tabs:

```text
Campaigns
Template Library
Template Performance
MVP Control Center
Approved Outreach Export
Run Log
Agent Run Log
Agent Control
```

The function increments `Agent Control.active_round_id` using `nextRoundId_()`.

Archive tabs are hidden automatically after this action to keep the workbook usable during normal operation.

### `Hide Archive Tabs` and `Show Archive Tabs`

Controls archive tab visibility.

Hidden archive tabs are not deleted. They remain available for audit and recovery.

Agents should use `Show Archive Tabs` only when inspecting previous runs, then use `Hide Archive Tabs` again before handing the workbook back to an operator.

### `Run first 10 enrichments` and `Run next blank enrichments`

Legacy/lightweight portfolio enrichment POC.

These actions read `HTML Staging`, attempt visible text extraction from portfolio pages, and write:

```text
Portfolio Enrichment
Outreach Drafts
Run Log
```

This workflow is separate from the current agent-first MVP review/export loop.

## Current Main Workflow

Use this sequence for a fresh run:

```text
1. Export staging CSV from index.html.
2. Import CSV into Google Sheets tab named HTML Staging.
3. Run UGC Pipeline > Populate MVP From HTML Staging.
4. Inspect MVP Control Center.
5. Review creators in Review Queue.
6. Set human_decision = Approved only for selected creators.
7. Verify Outreach Queue updates approved rows to Approved To Send.
8. Run UGC Pipeline > Export Approved Outreach List.
9. Inspect Approved Outreach Export.
10. Before next CSV, run Archive Current Run + Reset For New Staging.
```

## Approval Logic

`Outreach Queue` is controlled by formulas from `normalizeOutreachQueue_()`.

Formula behavior:

- If email is blank, `outreach_status = Blocked`.
- If `Campaigns!N2` is blank or `MISSING`, `outreach_status = Blocked`.
- If `Review Queue.human_decision = Approved`, `approved_by_human = TRUE`.
- If email exists, media room URL exists, and `approved_by_human = TRUE`, then `outreach_status = Approved To Send`.
- Otherwise, `outreach_status = Needs Approval`.

Agents must not bypass this logic.

## Agent Control Contract

`Agent Control` must preserve these safety defaults:

```text
agent_mode = manual_approval_required
allow_auto_outreach = No
allow_needs_review_outreach = No
required_media_room_url = Yes
human_final_approval_required = Yes
```

`sender_name` may be customized by the user and must not be overwritten by setup.

`active_campaign_id` and `active_round_id` may be changed by the user or by archive/reset logic and must not be reset casually.

## Campaign Requirements

`Campaigns` row 2 is the active MVP campaign row.

Required cells:

```text
A2 = campaign_id, usually CAMP001
L2 = campaign_status, usually Active
N2 = brand_media_room_url
```

If `Campaigns!N2` is blank or `MISSING`, outreach export must be blocked.

## Brand Brief Rules

`Brand Brief` is the brand intent layer. Agents should inspect it before judging match quality.

The tab is key/value based:

```text
brief_key
brief_value
description
```

Important keys:

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
minimum_creator_requirements
budget_range
deliverables
must_have_email
notes
```

Fields such as `required_niches`, `preferred_niches`, `excluded_niches`, `required_location`, and `required_platforms` are comma-separated terms.

`media_room_url` should match or support `Campaigns!N2`. If the user updates `Brand Brief.media_room_url`, keep `Campaigns!N2` aligned before export.

## Template Rules

Safe auto templates are seeded in `Template Library`:

```text
T031
T032
T033
T034
```

The MVP uses generic, low-risk outreach copy. Agents must not generate aggressive personalization from weak portfolio scraping.

Template bodies may contain:

```text
{creator_greeting}
{brand_name}
{sender_name}
```

`normalizeOutreachQueue_()` substitutes:

- `{creator_greeting}` with `there`
- `{brand_name}` with `this brand campaign: ` plus `Campaigns!N2`
- `{sender_name}` from `Agent Control.sender_name`

## Evidence Rules

The `Evidence` tab stores source-captured support for creator fields.

Current evidence types:

```text
email_primary
portfolio_url
reddit_comment_snippet
all_urls
```

Agents should prefer `Evidence` over unsupported assumptions when explaining creator fit.

## Matching Rules

`Matches` is the brand-fit scoring layer.

It records:

```text
match_id
campaign_id
creator_id
match_score
match_tier
matched_reasons
missing_requirements
needs_review_reason
brand_fit_notes
created_at
```

Current scoring considers:

```text
email availability
portfolio availability
required niche term matches
preferred niche term matches
excluded term matches
required platform term matches
required location term matches
source comment availability
Canva design review risk
ingest status
```

Tier rules:

```text
Best Match: score >= 75 and no excluded term
Maybe Match: score >= 50 and no excluded term
Needs Review: score < 50 and no excluded term
Not Fit: excluded term found
```

Do not treat match score as final approval. It is only a triage hint. Human approval in `Review Queue` is still required.

## Archiving Rules

Archive rows are values-only snapshots. They should not depend on formulas after archiving.

Every archived row is prepended with:

```text
archive_run_id
archived_at
round_id
campaign_id
source_sheet
```

The archive function filters out formula-filled blank rows so archive counts remain meaningful.

## Failure Handling

If a menu action does not appear:

```text
1. Confirm google-apps-script/Code.gs was copied from the latest GitHub commit.
2. Save Apps Script.
3. Refresh the Google Sheet browser tab.
4. Reopen the UGC Pipeline menu.
```

If `Matches`, `Review Queue`, or `Outreach Queue` are empty:

```text
1. Confirm HTML Staging has rows.
2. Run Populate MVP From HTML Staging.
3. Check Agent Run Log for step = populate_from_html_staging.
```

If dashboard run timestamps show `None`:

```text
1. Check Agent Run Log for the expected step.
2. Run Refresh MVP Control Center.
3. If still wrong, inspect formulas in MVP Control Center.
```

If export returns zero rows:

```text
1. Confirm Review Queue has at least one human_decision = Approved.
2. Confirm Outreach Queue has that creator as Approved To Send.
3. Confirm approved_by_human = TRUE.
4. Confirm email exists.
5. Confirm Campaigns!N2 has a media room URL.
```

If archive tabs appear missing:

```text
1. Run UGC Pipeline > Show Archive Tabs.
2. Inspect Archive Index and the Archive - ... tabs.
3. Run UGC Pipeline > Hide Archive Tabs after inspection.
```

## Do Not Do These Things

Agents must not:

- Send emails.
- Use Gmail APIs.
- Scrape private social profiles.
- Override human review.
- Treat Reddit DM rows as email-ready.
- Delete archive tabs.
- Reset active round IDs without archiving.
- Commit real creator data to GitHub.
- Replace safe templates with unreviewed generated copy.

## Current MVP Definition

The MVP is considered operational when this loop works:

```text
HTML Staging
  -> Populate MVP From HTML Staging
  -> Creators / Evidence / Matches / Review Queue / Outreach Queue
  -> Human approves selected creators
  -> Export Approved Outreach List
  -> Approved Outreach Export
  -> Archive Current Run + Reset For New Staging
```

The MVP is not an autonomous outreach agent yet. It is an approval-gated creator sourcing and outreach-prep pipeline.
