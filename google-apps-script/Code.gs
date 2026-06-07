const STAGING_SHEET = 'HTML Staging';
const ENRICHMENT_SHEET = 'Portfolio Enrichment';
const OUTREACH_SHEET = 'Outreach Drafts';
const RUN_LOG_SHEET = 'Run Log';
const DEFAULT_LIMIT = 10;
const ARCHIVE_METADATA_HEADERS = ['archive_run_id', 'archived_at', 'round_id', 'campaign_id', 'source_sheet'];

const STAGING_HEADERS = [
  'source_platform',
  'source_post_url',
  'source_post_title',
  'reddit_username',
  'email',
  'portfolio_url',
  'portfolio_url_type',
  'all_urls',
  'all_emails',
  'comment_snippet',
  'upvotes_max',
  'date_posted',
  'reddit_comment_url',
  'has_canva',
  'needs_contact_method',
  'ingest_status',
  'ingest_notes'
];

const CREATORS_HEADERS = [
  'creator_id', 'reddit_username', 'creator_name', 'email_primary', 'contact_method',
  'portfolio_url', 'portfolio_url_type', 'social_links', 'source_platform', 'source_url',
  'first_seen_round', 'last_seen_round', 'creator_status', 'confidence_score',
  'review_status', 'notes'
];

const EVIDENCE_HEADERS = [
  'evidence_id', 'creator_id', 'field_name', 'claimed_value', 'evidence_text',
  'evidence_source', 'evidence_url', 'confidence', 'verified_status', 'created_at'
];

const CAMPAIGNS_HEADERS = [
  'campaign_id', 'brand_name', 'campaign_name', 'product_category', 'required_tags',
  'preferred_tags', 'excluded_tags', 'required_contact_method', 'portfolio_required',
  'location_preference', 'must_be_verified', 'campaign_status', 'notes', 'brand_media_room_url'
];

const MATCHES_HEADERS = [
  'match_id', 'campaign_id', 'creator_id', 'match_score', 'match_tier',
  'matched_reasons', 'missing_requirements', 'needs_review_reason', 'brand_fit_notes', 'created_at'
];

const REVIEW_HEADERS = [
  'review_id', 'creator_id', 'issue_type', 'issue_detail', 'recommended_action',
  'human_decision', 'decision_notes', 'reviewed_at'
];

const OUTREACH_QUEUE_HEADERS = [
  'outreach_id', 'campaign_id', 'creator_id', 'email', 'template_id', 'outreach_subject',
  'outreach_body', 'outreach_status', 'approved_by_human', 'sent_at', 'reply_status',
  'conversion_status', 'notes'
];

const TEMPLATE_LIBRARY_HEADERS = [
  'template_id', 'template_name', 'template_subject', 'template_body', 'template_status', 'notes'
];

const TEMPLATE_PERFORMANCE_HEADERS = [
  'template_id', 'sent_count', 'reply_count', 'positive_reply_count',
  'booking_count', 'conversion_count', 'conversion_rate', 'notes'
];

const AGENT_RUN_LOG_HEADERS = [
  'agent_run_id', 'agent_name', 'started_at', 'ended_at', 'step', 'action_taken',
  'input_ref', 'output_ref', 'status', 'notes'
];

const AGENT_CONTROL_HEADERS = ['control_key', 'control_value', 'description'];
const CONTROL_CENTER_SHEET = 'MVP Control Center';
const BRAND_BRIEF_SHEET = 'Brand Brief';
const BRAND_BRIEF_HEADERS = ['brief_key', 'brief_value', 'description'];
const APPROVED_EXPORT_SHEET = 'Approved Outreach Export';
const APPROVED_EXPORT_HEADERS = [
  'exported_at',
  'campaign_id',
  'creator_id',
  'email',
  'outreach_subject',
  'outreach_body',
  'brand_media_room_url',
  'approval_status',
  'notes'
];

const ARCHIVE_SHEET_MAP = [
  { source: STAGING_SHEET, archive: 'Archive - HTML Staging' },
  { source: 'Creators', archive: 'Archive - Creators' },
  { source: 'Evidence', archive: 'Archive - Evidence' },
  { source: 'Matches', archive: 'Archive - Matches' },
  { source: 'Review Queue', archive: 'Archive - Review Queue' },
  { source: 'Outreach Queue', archive: 'Archive - Outreach Queue' }
];

const RESET_ACTIVE_SHEETS = [
  { name: STAGING_SHEET, headers: STAGING_HEADERS },
  { name: 'Creators', headers: CREATORS_HEADERS },
  { name: 'Evidence', headers: EVIDENCE_HEADERS },
  { name: 'Matches', headers: MATCHES_HEADERS },
  { name: 'Review Queue', headers: REVIEW_HEADERS },
  { name: 'Outreach Queue', headers: OUTREACH_QUEUE_HEADERS }
];

const ENRICHMENT_HEADERS = [
  'reddit_username',
  'source_post_url',
  'portfolio_url',
  'portfolio_url_type',
  'creator_name',
  'location',
  'portfolio_email',
  'social_links',
  'platform_mentions',
  'claimed_followers',
  'claimed_views',
  'claimed_likes',
  'claimed_engagement',
  'strongest_platform',
  'parent_kids_family_flag',
  'gender_flag',
  'categories_niches',
  'brands_worked_with',
  'years_creator_experience',
  'portfolio_summary',
  'confidence_score',
  'needs_review',
  'review_reason',
  'processed_at'
];

const OUTREACH_HEADERS = [
  'reddit_username',
  'email',
  'outreach_subject',
  'outreach_body',
  'outreach_status',
  'personalized_line',
  'processed_at'
];

const RUN_LOG_HEADERS = [
  'processed_at',
  'reddit_username',
  'portfolio_url',
  'status',
  'notes'
];

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('UGC Pipeline')
    .addItem('Setup Agent-First MVP', 'setupAgentFirstMvp')
    .addSeparator()
    .addItem('Archive Current Run + Reset For New Staging', 'archiveCurrentRunAndResetForNewStaging')
    .addItem('Hide Archive Tabs', 'hideArchiveTabs')
    .addItem('Show Archive Tabs', 'showArchiveTabs')
    .addItem('Populate MVP From HTML Staging', 'populateMvpFromHtmlStaging')
    .addItem('Refresh MVP Control Center', 'refreshMvpControlCenter')
    .addItem('Export Approved Outreach List', 'exportApprovedOutreachList')
    .addSeparator()
    .addItem('Run first 10 enrichments', 'runFirst10Enrichments')
    .addItem('Run next blank enrichments', 'runNextBlankEnrichments')
    .addToUi();
}

function setupAgentFirstMvp() {
  const ss = SpreadsheetApp.getActive();
  const now = new Date().toISOString();

  const sheets = {
    creators: ensureSheet_(ss, 'Creators', CREATORS_HEADERS),
    evidence: ensureSheet_(ss, 'Evidence', EVIDENCE_HEADERS),
    campaigns: ensureSheet_(ss, 'Campaigns', CAMPAIGNS_HEADERS),
    brandBrief: ensureSheet_(ss, BRAND_BRIEF_SHEET, BRAND_BRIEF_HEADERS),
    matches: ensureSheet_(ss, 'Matches', MATCHES_HEADERS),
    review: ensureSheet_(ss, 'Review Queue', REVIEW_HEADERS),
    outreach: ensureSheet_(ss, 'Outreach Queue', OUTREACH_QUEUE_HEADERS),
    templateLibrary: ensureSheet_(ss, 'Template Library', TEMPLATE_LIBRARY_HEADERS),
    templatePerformance: ensureSheet_(ss, 'Template Performance', TEMPLATE_PERFORMANCE_HEADERS),
    runLog: ensureSheet_(ss, 'Run Log', [
      'run_id', 'run_type', 'started_at', 'ended_at', 'status', 'rows_processed',
      'ok_count', 'needs_review_count', 'error_count', 'notes'
    ]),
    agentRunLog: ensureSheet_(ss, 'Agent Run Log', AGENT_RUN_LOG_HEADERS),
    agentControl: ensureSheet_(ss, 'Agent Control', AGENT_CONTROL_HEADERS),
    controlCenter: ensureSheet_(ss, CONTROL_CENTER_SHEET, ['metric', 'value', 'status', 'notes'])
  };

  seedAgentControl_(sheets.agentControl);
  seedBrandBrief_(sheets.brandBrief, sheets.campaigns);
  seedSafeTemplates_(sheets.templateLibrary);
  seedTemplatePerformance_(sheets.templatePerformance);
  applyAgentValidations_(sheets);
  normalizeOutreachQueue_(sheets.outreach);
  refreshMvpControlCenter_(ss);
  appendAgentRunLog_(sheets.agentRunLog, now);

  SpreadsheetApp.getUi().alert('Agent-first MVP setup complete. Check Agent Control, dropdowns, and Outreach Queue.');
}

function archiveCurrentRunAndResetForNewStaging() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert(
    'Archive and reset?',
    'This will copy the current run into Archive tabs, then clear HTML Staging, Creators, Evidence, Matches, Review Queue, and Outreach Queue. No emails will be sent.',
    ui.ButtonSet.YES_NO
  );
  if (response !== ui.Button.YES) return;

  const ss = SpreadsheetApp.getActive();
  const now = new Date().toISOString();
  const agentControl = ensureSheet_(ss, 'Agent Control', AGENT_CONTROL_HEADERS);
  const agentRunLog = ensureSheet_(ss, 'Agent Run Log', AGENT_RUN_LOG_HEADERS);
  const roundId = getControlValue_(agentControl, 'active_round_id') || 'ROUND001';
  const campaignId = getControlValue_(agentControl, 'active_campaign_id') || 'CAMP001';
  const archiveRunId = buildArchiveRunId_(now);
  const metadata = [archiveRunId, now, roundId, campaignId];
  const archiveCounts = {};

  ARCHIVE_SHEET_MAP.forEach(function (item) {
    archiveCounts[item.source] = archiveSheetValues_(ss, item.source, item.archive, metadata);
  });

  appendArchiveIndex_(ss, {
    archive_run_id: archiveRunId,
    archived_at: now,
    round_id: roundId,
    campaign_id: campaignId,
    html_rows: archiveCounts[STAGING_SHEET] || 0,
    creator_rows: archiveCounts.Creators || 0,
    evidence_rows: archiveCounts.Evidence || 0,
    match_rows: archiveCounts.Matches || 0,
    review_rows: archiveCounts['Review Queue'] || 0,
    outreach_rows: archiveCounts['Outreach Queue'] || 0,
    notes: 'Archived active run before clearing working tabs'
  });

  RESET_ACTIVE_SHEETS.forEach(function (item) {
    const sheet = ensureSheet_(ss, item.name, item.headers || getExistingHeaders_(ss, item.name));
    clearDataRows_(sheet);
  });

  setControlValue_(agentControl, 'active_round_id', nextRoundId_(roundId));
  hideArchiveTabs_(ss);
  refreshMvpControlCenter_(ss);
  appendAgentRunLogEntry_(agentRunLog, {
    step: 'archive_reset',
    action_taken: 'Archived active run and cleared working tabs for new HTML Staging',
    input_ref: roundId + ' / ' + campaignId,
    output_ref: archiveRunId,
    status: 'Complete',
    notes: 'Next active_round_id set to ' + nextRoundId_(roundId)
  });

  ui.alert('Archive/reset complete. Archive run: ' + archiveRunId + '. Import your next CSV into HTML Staging, then run Populate MVP From HTML Staging.');
}

function hideArchiveTabs() {
  hideArchiveTabs_(SpreadsheetApp.getActive());
  SpreadsheetApp.getUi().alert('Archive tabs hidden.');
}

function showArchiveTabs() {
  showArchiveTabs_(SpreadsheetApp.getActive());
  SpreadsheetApp.getUi().alert('Archive tabs shown.');
}

function hideArchiveTabs_(ss) {
  getArchiveSheetNames_().forEach(function (name) {
    const sheet = ss.getSheetByName(name);
    if (sheet) sheet.hideSheet();
  });
}

function showArchiveTabs_(ss) {
  getArchiveSheetNames_().forEach(function (name) {
    const sheet = ss.getSheetByName(name);
    if (sheet) sheet.showSheet();
  });
}

function getArchiveSheetNames_() {
  return ['Archive Index'].concat(ARCHIVE_SHEET_MAP.map(function (item) {
    return item.archive;
  }));
}

function populateMvpFromHtmlStaging() {
  const ss = SpreadsheetApp.getActive();
  const ui = SpreadsheetApp.getUi();
  const now = new Date().toISOString();
  const staging = ss.getSheetByName(STAGING_SHEET);
  if (!staging) {
    ui.alert('Missing tab: ' + STAGING_SHEET);
    return;
  }

  const stagingRows = readSheetObjects_(staging).filter(function (row) {
    return normalizeUsername_(row.reddit_username) || row.email || row.portfolio_url || row.reddit_comment_url;
  });
  if (!stagingRows.length) {
    ui.alert('HTML Staging has no creator rows to populate.');
    return;
  }

  const sheets = {
    creators: ensureSheet_(ss, 'Creators', CREATORS_HEADERS),
    evidence: ensureSheet_(ss, 'Evidence', EVIDENCE_HEADERS),
    campaigns: ensureSheet_(ss, 'Campaigns', CAMPAIGNS_HEADERS),
    brandBrief: ensureSheet_(ss, BRAND_BRIEF_SHEET, BRAND_BRIEF_HEADERS),
    matches: ensureSheet_(ss, 'Matches', MATCHES_HEADERS),
    review: ensureSheet_(ss, 'Review Queue', REVIEW_HEADERS),
    outreach: ensureSheet_(ss, 'Outreach Queue', OUTREACH_QUEUE_HEADERS),
    templateLibrary: ensureSheet_(ss, 'Template Library', TEMPLATE_LIBRARY_HEADERS),
    templatePerformance: ensureSheet_(ss, 'Template Performance', TEMPLATE_PERFORMANCE_HEADERS),
    agentControl: ensureSheet_(ss, 'Agent Control', AGENT_CONTROL_HEADERS),
    agentRunLog: ensureSheet_(ss, 'Agent Run Log', AGENT_RUN_LOG_HEADERS),
    controlCenter: ensureSheet_(ss, CONTROL_CENTER_SHEET, ['metric', 'value', 'status', 'notes'])
  };

  seedSafeTemplates_(sheets.templateLibrary);
  seedBrandBrief_(sheets.brandBrief, sheets.campaigns);
  seedTemplatePerformance_(sheets.templatePerformance);
  applyAgentValidations_(sheets);

  clearDataRows_(sheets.creators);
  clearDataRows_(sheets.evidence);
  clearDataRows_(sheets.matches);
  clearDataRows_(sheets.review);
  clearDataRows_(sheets.outreach);

  const roundId = getControlValue_(sheets.agentControl, 'active_round_id') || 'ROUND001';
  const campaignId = getControlValue_(sheets.agentControl, 'active_campaign_id') || 'CAMP001';
  const brandBrief = readBrandBrief_(sheets.brandBrief, sheets.campaigns);
  const creatorRows = [];
  const evidenceRows = [];
  const matchRows = [];
  const reviewRows = [];
  const outreachRows = [];
  let evidenceCounter = 1;

  stagingRows.forEach(function (row, index) {
    const creatorId = 'CR' + Utilities.formatString('%03d', index + 1);
    const username = normalizeUsername_(row.reddit_username);
    const email = row.email || firstValue_(row.all_emails);
    const portfolioUrl = cleanUrl_(row.portfolio_url);
    const allUrls = row.all_urls || '';
    const contactMethod = email ? 'Email' : (row.reddit_comment_url ? 'Reddit DM' : 'Missing');
    const sourceUrl = row.reddit_comment_url || row.source_post_url || '';
    const confidence = scoreStagingConfidence_(row, email, portfolioUrl);
    const creatorStatus = email || row.reddit_comment_url ? 'New' : 'Needs Review';
    const reviewStatus = confidence >= 50 ? 'New' : 'Needs Review';
    const notes = compactJoin_([row.ingest_status, row.ingest_notes], ' | ');

    creatorRows.push([
      creatorId,
      username,
      '',
      email,
      contactMethod,
      portfolioUrl,
      row.portfolio_url_type || classifyUrl_(portfolioUrl),
      extractSocialUrlsFromText_(allUrls).join(' | '),
      row.source_platform || 'reddit',
      sourceUrl,
      roundId,
      roundId,
      creatorStatus,
      confidence,
      reviewStatus,
      notes
    ]);

    if (email) {
      evidenceRows.push(buildEvidenceRow_(evidenceCounter++, creatorId, 'email_primary', email, row.comment_snippet, 'reddit_comment', sourceUrl, 80, now));
    }
    if (portfolioUrl) {
      evidenceRows.push(buildEvidenceRow_(evidenceCounter++, creatorId, 'portfolio_url', portfolioUrl, row.comment_snippet, 'reddit_comment', sourceUrl, 70, now));
    }
    if (row.comment_snippet) {
      evidenceRows.push(buildEvidenceRow_(evidenceCounter++, creatorId, 'reddit_comment_snippet', row.comment_snippet, row.comment_snippet, 'reddit_comment', sourceUrl, 50, now));
    }
    if (allUrls) {
      evidenceRows.push(buildEvidenceRow_(evidenceCounter++, creatorId, 'all_urls', allUrls, row.comment_snippet, 'reddit_comment', sourceUrl, 45, now));
    }

    const match = buildMatchAssessment_(row, email, portfolioUrl, brandBrief);
    matchRows.push([
      'M' + Utilities.formatString('%03d', index + 1),
      campaignId,
      creatorId,
      match.score,
      match.tier,
      match.reasons,
      match.missing,
      match.reviewReason,
      match.brandFitNotes,
      now
    ]);

    reviewRows.push([
      'R' + Utilities.formatString('%03d', index + 1),
      creatorId,
      match.reviewReason ? 'Needs Review' : 'Standard Approval',
      match.reviewReason || 'Ready for human approval check',
      match.reviewReason ? 'Review before outreach' : 'Approve if campaign fit looks good',
      '',
      '',
      ''
    ]);

    outreachRows.push([
      'O' + Utilities.formatString('%03d', index + 1),
      campaignId,
      creatorId,
      email,
      '',
      '',
      '',
      '',
      '',
      '',
      'Not Sent',
      'Not Started',
      email ? 'Awaiting human approval gate' : 'Blocked because no email is available'
    ]);
  });

  if (creatorRows.length) sheets.creators.getRange(2, 1, creatorRows.length, creatorRows[0].length).setValues(creatorRows);
  if (evidenceRows.length) sheets.evidence.getRange(2, 1, evidenceRows.length, evidenceRows[0].length).setValues(evidenceRows);
  if (matchRows.length) sheets.matches.getRange(2, 1, matchRows.length, matchRows[0].length).setValues(matchRows);
  if (reviewRows.length) sheets.review.getRange(2, 1, reviewRows.length, reviewRows[0].length).setValues(reviewRows);
  if (outreachRows.length) sheets.outreach.getRange(2, 1, outreachRows.length, outreachRows[0].length).setValues(outreachRows);

  normalizeOutreachQueue_(sheets.outreach);
  appendAgentRunLogEntry_(sheets.agentRunLog, {
    step: 'populate_from_html_staging',
    action_taken: 'Rebuilt MVP tabs from HTML Staging',
    input_ref: STAGING_SHEET,
    output_ref: 'Creators, Evidence, Matches, Review Queue, Outreach Queue',
    status: 'Complete',
    notes: 'Rows populated: ' + stagingRows.length
  });
  refreshMvpControlCenter_(ss);

  ui.alert('MVP tabs populated from HTML Staging. Creator rows: ' + stagingRows.length + '. Review Queue approvals now control Outreach Queue.');
}

function refreshMvpControlCenter() {
  refreshMvpControlCenter_(SpreadsheetApp.getActive());
  SpreadsheetApp.getUi().alert('MVP Control Center refreshed.');
}

function refreshMvpControlCenter_(ss) {
  const sheet = ensureSheet_(ss, CONTROL_CENTER_SHEET, ['metric', 'value', 'status', 'notes']);
  sheet.clearContents();

  const rows = [
    ['metric', 'value', 'status', 'notes'],
    ['current_round_id', '=IFERROR(INDEX(\'Agent Control\'!B:B,MATCH("active_round_id",\'Agent Control\'!A:A,0)),"Missing")', '=IF(B2="Missing","Fix","OK")', 'Active sourcing round for this workbook.'],
    ['active_campaign_id', '=IFERROR(INDEX(\'Agent Control\'!B:B,MATCH("active_campaign_id",\'Agent Control\'!A:A,0)),"Missing")', '=IF(B3="Missing","Fix","OK")', 'Campaign used by Matches and Outreach Queue.'],
    ['brand_media_room_url', '=Campaigns!N2', '=IF(OR(B4="",UPPER(B4)="MISSING"),"Fix","OK")', 'Must be filled before outreach can be approved.'],
    ['brief_required_niches', '=IFERROR(INDEX(\'Brand Brief\'!B:B,MATCH("required_niches",\'Brand Brief\'!A:A,0)),"")', '=IF(B5="","Check","OK")', 'Brand-fit matching uses this for required niche terms.'],
    ['brief_required_platforms', '=IFERROR(INDEX(\'Brand Brief\'!B:B,MATCH("required_platforms",\'Brand Brief\'!A:A,0)),"")', '=IF(B6="","Info","OK")', 'Optional platform terms for matching.'],
    ['staging_creator_rows', '=MAX(COUNTA(\'HTML Staging\'!D:D)-1,0)', '=IF(B7=0,"Check","OK")', 'Rows available from the latest HTML export.'],
    ['creator_rows', '=MAX(COUNTA(Creators!A:A)-1,0)', '=IF(B8=B7,"OK","Check")', 'Creators generated from HTML Staging.'],
    ['best_match_count', '=COUNTIF(Matches!E:E,"Best Match")', '=IF(B9>0,"Ready","Info")', 'Creators currently ranked Best Match.'],
    ['maybe_match_count', '=COUNTIF(Matches!E:E,"Maybe Match")', '=IF(B10>0,"Info","OK")', 'Creators currently ranked Maybe Match.'],
    ['not_fit_count', '=COUNTIF(Matches!E:E,"Not Fit")', '=IF(B11>0,"Review","OK")', 'Creators blocked by excluded terms or low fit.'],
    ['email_ready_count', '=COUNTIF(Creators!E:E,"Email")', '=IF(B12>0,"OK","Check")', 'Creators with email contact method.'],
    ['reddit_dm_count', '=COUNTIF(Creators!E:E,"Reddit DM")', '=IF(B13>0,"Info","OK")', 'Creators without email but with Reddit comment URL.'],
    ['missing_contact_count', '=COUNTIF(Creators!E:E,"Missing")', '=IF(B14>0,"Review","OK")', 'Creators missing contact method.'],
    ['needs_review_count', '=COUNTIFS(\'Review Queue\'!A:A,"<>",\'Review Queue\'!F:F,"")', '=IF(B15>0,"Review","OK")', 'Review rows still waiting for human decision.'],
    ['approved_review_count', '=COUNTIFS(\'Review Queue\'!A:A,"<>",\'Review Queue\'!F:F,"Approved")', '=IF(B16>0,"OK","Info")', 'Creators approved by a human.'],
    ['blocked_outreach_count', '=COUNTIFS(\'Outreach Queue\'!A:A,"<>",\'Outreach Queue\'!H:H,"Blocked")', '=IF(B17>0,"Info","OK")', 'Blocked because email or media room URL is missing.'],
    ['needs_approval_count', '=COUNTIFS(\'Outreach Queue\'!A:A,"<>",\'Outreach Queue\'!H:H,"Needs Approval")', '=IF(B18>0,"Review","OK")', 'Email rows waiting for human approval.'],
    ['approved_to_send_count', '=COUNTIFS(\'Outreach Queue\'!A:A,"<>",\'Outreach Queue\'!H:H,"Approved To Send")', '=IF(B19>0,"Ready","Info")', 'Drafts unlocked by human approval.'],
    ['last_archive_run_id', '=IFERROR(INDEX(\'Archive Index\'!A:A,MAX(FILTER(ROW(\'Archive Index\'!A:A),\'Archive Index\'!A:A<>"",\'Archive Index\'!A:A<>"archive_run_id"))),"None")', '=IF(B20="None","Info","OK")', 'Most recent archive snapshot ID.'],
    ['last_populate_run_at', '=IFERROR(INDEX(\'Agent Run Log\'!C:C,MAX(FILTER(ROW(\'Agent Run Log\'!E:E),\'Agent Run Log\'!E:E="populate_from_html_staging"))),"None")', '=IF(B21="None","Check","OK")', 'Most recent staging-to-MVP populate run.'],
    ['approved_export_rows', '=MAX(COUNTA(\'Approved Outreach Export\'!C:C)-1,0)', '=IF(B22>0,"Ready","Info")', 'Rows currently available in Approved Outreach Export.'],
    ['last_approved_export_at', '=IFERROR(INDEX(\'Agent Run Log\'!C:C,MAX(FILTER(ROW(\'Agent Run Log\'!E:E),\'Agent Run Log\'!E:E="export_approved_outreach"))),"None")', '=IF(B23="None","Info","OK")', 'Most recent approved export run.'],
    ['agent_mode', '=IFERROR(INDEX(\'Agent Control\'!B:B,MATCH("agent_mode",\'Agent Control\'!A:A,0)),"Missing")', '=IF(B24="manual_approval_required","OK","Fix")', 'Hermes/agent must remain human approval gated.'],
    ['auto_outreach_allowed', '=IFERROR(INDEX(\'Agent Control\'!B:B,MATCH("allow_auto_outreach",\'Agent Control\'!A:A,0)),"Missing")', '=IF(B25="No","OK","Fix")', 'Must stay No for MVP.']
  ];

  sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
  sheet.setFrozenRows(1);
  sheet.getRange('A1:D1').setFontWeight('bold');
  sheet.autoResizeColumns(1, 4);
}

function exportApprovedOutreachList() {
  const ss = SpreadsheetApp.getActive();
  const ui = SpreadsheetApp.getUi();
  const now = new Date().toISOString();
  const campaigns = ensureSheet_(ss, 'Campaigns', CAMPAIGNS_HEADERS);
  const outreach = ensureSheet_(ss, 'Outreach Queue', OUTREACH_QUEUE_HEADERS);
  const agentRunLog = ensureSheet_(ss, 'Agent Run Log', AGENT_RUN_LOG_HEADERS);
  const exportSheet = ensureSheet_(ss, APPROVED_EXPORT_SHEET, APPROVED_EXPORT_HEADERS);
  const mediaRoomUrl = String(campaigns.getRange('N2').getDisplayValue() || '').trim();

  if (!mediaRoomUrl || mediaRoomUrl.toUpperCase() === 'MISSING') {
    ui.alert('Export blocked. Campaigns!N2 must contain the brand media room URL.');
    return;
  }

  const rows = readSheetObjects_(outreach)
    .filter(function (row) {
      return row.email &&
        row.outreach_status === 'Approved To Send' &&
        String(row.approved_by_human || '').toUpperCase() === 'TRUE';
    })
    .map(function (row) {
      return [
        now,
        row.campaign_id || '',
        row.creator_id || '',
        row.email || '',
        row.outreach_subject || '',
        row.outreach_body || '',
        mediaRoomUrl,
        'Approved To Send',
        row.notes || ''
      ];
    });

  exportSheet.clearContents();
  exportSheet.getRange(1, 1, 1, APPROVED_EXPORT_HEADERS.length).setValues([APPROVED_EXPORT_HEADERS]);
  if (rows.length) {
    exportSheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  }
  exportSheet.setFrozenRows(1);
  exportSheet.getRange('A1:I1').setFontWeight('bold');
  exportSheet.autoResizeColumns(1, APPROVED_EXPORT_HEADERS.length);

  appendAgentRunLogEntry_(agentRunLog, {
    step: 'export_approved_outreach',
    action_taken: 'Created Approved Outreach Export from approved outreach rows',
    input_ref: 'Outreach Queue',
    output_ref: APPROVED_EXPORT_SHEET,
    status: 'Complete',
    notes: 'Rows exported: ' + rows.length
  });
  refreshMvpControlCenter_(ss);
  ui.alert('Approved Outreach Export complete. Rows exported: ' + rows.length);
}

function archiveSheetValues_(ss, sourceName, archiveName, metadata) {
  const source = ss.getSheetByName(sourceName);
  if (!source || source.getLastRow() < 2) {
    ensureArchiveSheet_(ss, archiveName, getExistingHeaders_(ss, sourceName));
    return 0;
  }

  const sourceHeaders = source.getRange(1, 1, 1, source.getLastColumn()).getValues()[0];
  const sourceValues = source.getRange(2, 1, source.getLastRow() - 1, source.getLastColumn()).getValues()
    .filter(function (row) { return rowHasArchiveData_(sourceName, row); });
  const archive = ensureArchiveSheet_(ss, archiveName, sourceHeaders);
  if (!sourceValues.length) return 0;
  const rows = sourceValues.map(function (row) {
    return metadata.concat([sourceName]).concat(row);
  });
  archive.getRange(archive.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
  return rows.length;
}

function rowHasArchiveData_(sourceName, row) {
  if (sourceName === STAGING_SHEET) {
    return row.some(function (value) { return String(value || '').trim() !== ''; });
  }
  return String(row[0] || '').trim() !== '';
}

function ensureArchiveSheet_(ss, archiveName, sourceHeaders) {
  const headers = ARCHIVE_METADATA_HEADERS.concat(sourceHeaders || []);
  return ensureSheet_(ss, archiveName, headers);
}

function appendArchiveIndex_(ss, row) {
  const headers = [
    'archive_run_id', 'archived_at', 'round_id', 'campaign_id', 'html_rows',
    'creator_rows', 'evidence_rows', 'match_rows', 'review_rows', 'outreach_rows', 'notes'
  ];
  const sheet = ensureSheet_(ss, 'Archive Index', headers);
  appendObjectRow_(sheet, headers, row);
}

function clearDataRows_(sheet) {
  const lastRow = sheet.getLastRow();
  const lastColumn = Math.max(1, sheet.getLastColumn());
  if (lastRow > 1) sheet.getRange(2, 1, lastRow - 1, lastColumn).clearContent();
}

function getExistingHeaders_(ss, sheetName) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() === 0 || sheet.getLastColumn() === 0) return [];
  return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
}

function buildArchiveRunId_(isoDate) {
  return 'RUN_' + String(isoDate || new Date().toISOString())
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z')
    .replace('T', '_');
}

function getControlValue_(sheet, key) {
  const rows = readSheetObjects_(sheet);
  for (const row of rows) {
    if (String(row.control_key || '').trim() === key) return String(row.control_value || '').trim();
  }
  return '';
}

function setControlValue_(sheet, key, value) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    sheet.appendRow([key, value, '']);
    return;
  }

  const keys = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (let index = 0; index < keys.length; index += 1) {
    if (String(keys[index][0] || '').trim() === key) {
      sheet.getRange(index + 2, 2).setValue(value);
      return;
    }
  }
  sheet.appendRow([key, value, '']);
}

function nextRoundId_(roundId) {
  const match = String(roundId || '').match(/^(.*?)(\d+)$/);
  if (!match) return String(roundId || 'ROUND') + '_NEXT';
  const prefix = match[1];
  const numberText = match[2];
  const nextNumber = String(Number(numberText) + 1).padStart(numberText.length, '0');
  return prefix + nextNumber;
}

function buildEvidenceRow_(counter, creatorId, fieldName, claimedValue, evidenceText, source, url, confidence, createdAt) {
  return [
    'EV' + Utilities.formatString('%03d', counter),
    creatorId,
    fieldName,
    claimedValue || '',
    evidenceText || '',
    source || '',
    url || '',
    confidence || '',
    'source_captured',
    createdAt
  ];
}

function scoreStagingConfidence_(row, email, portfolioUrl) {
  let score = 10;
  if (email) score += 30;
  if (portfolioUrl) score += 25;
  if (row.reddit_comment_url) score += 10;
  if (row.comment_snippet) score += 10;
  if (/canva|personal_site/i.test(String(row.portfolio_url_type || classifyUrl_(portfolioUrl)))) score += 10;
  return Math.max(0, Math.min(100, score));
}

function seedBrandBrief_(sheet, campaignsSheet) {
  const existing = {};
  readSheetObjects_(sheet).forEach(function (row) {
    if (row.brief_key) existing[row.brief_key] = row.brief_value;
  });

  const campaign = readSheetObjects_(campaignsSheet)[0] || {};
  const rows = [
    ['brief_key', 'brief_value', 'description'],
    ['brand_name', existing.brand_name || campaign.brand_name || '', 'Brand name used for campaign context.'],
    ['media_room_url', existing.media_room_url || campaign.brand_media_room_url || '', 'Brand media room URL. Also keep Campaigns!N2 filled.'],
    ['product_category', existing.product_category || campaign.product_category || '', 'Main product category.'],
    ['campaign_goal', existing.campaign_goal || '', 'What the brand wants from this creator search.'],
    ['creator_type_needed', existing.creator_type_needed || 'UGC creator', 'Creator type requested by the brand.'],
    ['required_niches', existing.required_niches || campaign.required_tags || '', 'Comma-separated terms that should appear in creator evidence/comment/url.'],
    ['preferred_niches', existing.preferred_niches || campaign.preferred_tags || '', 'Comma-separated nice-to-have creator terms.'],
    ['excluded_niches', existing.excluded_niches || campaign.excluded_tags || '', 'Comma-separated terms that should lower or block fit.'],
    ['required_location', existing.required_location || campaign.location_preference || '', 'Comma-separated location terms if location matters.'],
    ['required_platforms', existing.required_platforms || '', 'Comma-separated platforms such as TikTok, Instagram, YouTube, Amazon.'],
    ['minimum_creator_requirements', existing.minimum_creator_requirements || '', 'Free-text requirements for human review.'],
    ['budget_range', existing.budget_range || '', 'Campaign budget range.'],
    ['deliverables', existing.deliverables || '', 'Expected deliverables.'],
    ['must_have_email', existing.must_have_email || 'Yes', 'Yes means creators without email are not outreach-ready.'],
    ['notes', existing.notes || '', 'Operator notes for this campaign.']
  ];

  sheet.clearContents();
  sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
  sheet.setFrozenRows(1);
  sheet.getRange('A1:C1').setFontWeight('bold');
  sheet.autoResizeColumns(1, 3);
  if (existing.media_room_url) campaignsSheet.getRange('N2').setValue(existing.media_room_url);
}

function readBrandBrief_(sheet, campaignsSheet) {
  const brief = {};
  readSheetObjects_(sheet).forEach(function (row) {
    if (row.brief_key) brief[row.brief_key] = row.brief_value || '';
  });
  const campaign = readSheetObjects_(campaignsSheet)[0] || {};
  return {
    brandName: brief.brand_name || campaign.brand_name || '',
    mediaRoomUrl: brief.media_room_url || campaign.brand_media_room_url || '',
    productCategory: brief.product_category || campaign.product_category || '',
    campaignGoal: brief.campaign_goal || '',
    creatorTypeNeeded: brief.creator_type_needed || 'UGC creator',
    requiredNiches: splitTerms_(brief.required_niches || campaign.required_tags || ''),
    preferredNiches: splitTerms_(brief.preferred_niches || campaign.preferred_tags || ''),
    excludedNiches: splitTerms_(brief.excluded_niches || campaign.excluded_tags || ''),
    requiredLocation: splitTerms_(brief.required_location || campaign.location_preference || ''),
    requiredPlatforms: splitTerms_(brief.required_platforms || ''),
    mustHaveEmail: String(brief.must_have_email || 'Yes').toLowerCase() !== 'no',
    minimumCreatorRequirements: brief.minimum_creator_requirements || '',
    deliverables: brief.deliverables || '',
    budgetRange: brief.budget_range || '',
    notes: brief.notes || ''
  };
}

function buildMatchAssessment_(row, email, portfolioUrl, brandBrief) {
  const reasons = [];
  const missing = [];
  const reviewReasons = [];
  const brandFitNotes = [];
  const evidenceText = buildCreatorEvidenceText_(row);
  const brief = brandBrief || {};
  let score = 20;

  if (email) {
    score += 20;
    reasons.push('email_available');
  } else if (brief.mustHaveEmail) {
    missing.push('email');
  }

  if (portfolioUrl) {
    score += 15;
    reasons.push('portfolio_available');
  } else {
    missing.push('portfolio');
    reviewReasons.push('No portfolio URL in staging');
  }

  const requiredNicheMatches = findTermMatches_(brief.requiredNiches || [], evidenceText);
  const preferredNicheMatches = findTermMatches_(brief.preferredNiches || [], evidenceText);
  const excludedMatches = findTermMatches_(brief.excludedNiches || [], evidenceText);
  const platformMatches = findTermMatches_(brief.requiredPlatforms || [], evidenceText);
  const locationMatches = findTermMatches_(brief.requiredLocation || [], evidenceText);

  if (requiredNicheMatches.length) {
    score += Math.min(30, requiredNicheMatches.length * 12);
    reasons.push('required_niche:' + requiredNicheMatches.join(','));
  } else if ((brief.requiredNiches || []).length) {
    score -= 20;
    missing.push('required_niche');
    reviewReasons.push('No required niche match found');
  }

  if (preferredNicheMatches.length) {
    score += Math.min(15, preferredNicheMatches.length * 6);
    reasons.push('preferred_niche:' + preferredNicheMatches.join(','));
  }

  if (platformMatches.length) {
    score += Math.min(15, platformMatches.length * 8);
    reasons.push('platform:' + platformMatches.join(','));
  } else if ((brief.requiredPlatforms || []).length) {
    score -= 10;
    missing.push('platform');
  }

  if (locationMatches.length) {
    score += 10;
    reasons.push('location:' + locationMatches.join(','));
  } else if ((brief.requiredLocation || []).length) {
    score -= 10;
    missing.push('location');
  }

  if (excludedMatches.length) {
    score -= 45;
    missing.push('excluded_term:' + excludedMatches.join(','));
    reviewReasons.push('Excluded term found: ' + excludedMatches.join(', '));
  }

  if (row.reddit_comment_url) reasons.push('reddit_comment_source');
  if (row.portfolio_url_type === 'canva_design') reviewReasons.push('Canva design may need manual review');
  if (row.ingest_status && !/ready|ok/i.test(row.ingest_status)) reviewReasons.push(row.ingest_status);

  if ((brief.requiredNiches || []).length) brandFitNotes.push('required_niches=' + brief.requiredNiches.join(', '));
  if ((brief.preferredNiches || []).length) brandFitNotes.push('preferred_niches=' + brief.preferredNiches.join(', '));
  if ((brief.requiredPlatforms || []).length) brandFitNotes.push('required_platforms=' + brief.requiredPlatforms.join(', '));

  const boundedScore = Math.max(0, Math.min(100, score));
  const tier = excludedMatches.length ? 'Not Fit' : (boundedScore >= 75 ? 'Best Match' : (boundedScore >= 50 ? 'Maybe Match' : 'Needs Review'));
  return {
    score: boundedScore,
    tier: tier,
    reasons: reasons.join(' | '),
    missing: missing.join(' | '),
    reviewReason: reviewReasons.join(' | '),
    brandFitNotes: brandFitNotes.join(' | ')
  };
}

function buildCreatorEvidenceText_(row) {
  return [
    row.reddit_username,
    row.email,
    row.portfolio_url,
    row.portfolio_url_type,
    row.all_urls,
    row.all_emails,
    row.comment_snippet,
    row.source_post_title,
    row.ingest_notes
  ].join(' ').toLowerCase();
}

function splitTerms_(value) {
  return String(value || '')
    .split(/[,\n|;]/)
    .map(function (term) { return term.trim().toLowerCase(); })
    .filter(Boolean);
}

function findTermMatches_(terms, text) {
  const source = String(text || '').toLowerCase();
  return unique_(terms.filter(function (term) {
    return term && source.indexOf(term.toLowerCase()) !== -1;
  }));
}

function firstValue_(value) {
  return String(value || '').split(/[|,;]/).map(function (item) { return item.trim(); }).filter(Boolean)[0] || '';
}

function extractSocialUrlsFromText_(text) {
  const matches = String(text || '').match(/https?:\/\/[^\s|,]+/gi) || [];
  return unique_(matches.map(cleanUrl_).filter(isSocialUrl_));
}

function compactJoin_(values, separator) {
  return values.map(function (value) { return String(value || '').trim(); }).filter(Boolean).join(separator);
}

function appendAgentRunLogEntry_(sheet, entry) {
  const now = new Date().toISOString();
  sheet.appendRow([
    'AR' + Utilities.formatString('%03d', Math.max(1, sheet.getLastRow())),
    'Hermes',
    now,
    now,
    entry.step || '',
    entry.action_taken || '',
    entry.input_ref || '',
    entry.output_ref || '',
    entry.status || 'Complete',
    entry.notes || ''
  ]);
}

function seedAgentControl_(sheet) {
  const existingValues = {};
  readSheetObjects_(sheet).forEach(function (row) {
    if (row.control_key) existingValues[row.control_key] = row.control_value;
  });

  const rows = [
    ['control_key', 'control_value', 'description'],
    ['agent_mode', existingValues.agent_mode || 'manual_approval_required', 'Hermes prepares work but cannot send outreach.'],
    ['active_campaign_id', existingValues.active_campaign_id || 'CAMP001', 'Campaign Hermes should operate on.'],
    ['active_round_id', existingValues.active_round_id || 'ROUND001', 'Current sourcing round.'],
    ['max_batch_size', existingValues.max_batch_size || '10', 'Maximum creators Hermes can process per run.'],
    ['allow_auto_outreach', existingValues.allow_auto_outreach || 'No', 'Hard block on sending messages automatically.'],
    ['allow_needs_review_outreach', existingValues.allow_needs_review_outreach || 'No', 'Hard block on needs-review creators.'],
    ['allowed_template_notes', existingValues.allowed_template_notes || 'Safe Auto', 'Only templates with this notes value can be used automatically.'],
    ['required_media_room_url', existingValues.required_media_room_url || 'Yes', 'Campaign must have media room URL before drafts can be approved.'],
    ['human_final_approval_required', existingValues.human_final_approval_required || 'Yes', 'Human approval is required before outreach can move to Approved To Send.'],
    ['sender_name', existingValues.sender_name || 'Baruch', 'Default sender name for safe templates.']
  ];
  sheet.clearContents();
  sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
  sheet.setFrozenRows(1);
}

function seedSafeTemplates_(sheet) {
  const existingRows = readSheetObjects_(sheet);
  const existingIds = {};
  existingRows.forEach(function (row) { existingIds[row.template_id] = true; });

  const templates = [
    ['T031', 'Paid UGC intro', 'Paid UGC collaboration', 'Hi {creator_greeting}, I am reaching out about a possible paid UGC collaboration for {brand_name}. Would you be open to hearing a little more? Best, {sender_name}', 'Active', 'Safe Auto'],
    ['T032', 'Short collab check', 'Quick UGC question', 'Hi {creator_greeting}, are you currently open to paid UGC projects? We are looking for creators for {brand_name}. Best, {sender_name}', 'Active', 'Safe Auto'],
    ['T033', 'Availability check', 'UGC project availability', 'Hi {creator_greeting}, I wanted to check if you are available for new UGC projects. We are putting together creator options for {brand_name}. Best, {sender_name}', 'Active', 'Safe Auto'],
    ['T034', 'Brand intro', 'Creator opportunity', 'Hi {creator_greeting}, I am reaching out about {brand_name}. We are exploring UGC creator collaborations and wanted to see if you are open to hearing more. Best, {sender_name}', 'Active', 'Safe Auto']
  ];

  templates.forEach(function (template) {
    if (!existingIds[template[0]]) sheet.appendRow(template);
  });
}

function seedTemplatePerformance_(sheet) {
  const rows = [
    ['T031', '=COUNTIF(\'Outreach Queue\'!E:E,A2)', '=COUNTIFS(\'Outreach Queue\'!E:E,A2,\'Outreach Queue\'!K:K,"Replied")', '=COUNTIFS(\'Outreach Queue\'!E:E,A2,\'Outreach Queue\'!K:K,"Positive Reply")', '=COUNTIFS(\'Outreach Queue\'!E:E,A2,\'Outreach Queue\'!L:L,"Booked")', '=COUNTIFS(\'Outreach Queue\'!E:E,A2,\'Outreach Queue\'!L:L,"Converted")', '=IF(B2=0,0,F2/B2)', 'Safe Auto template'],
    ['T032', '=COUNTIF(\'Outreach Queue\'!E:E,A3)', '=COUNTIFS(\'Outreach Queue\'!E:E,A3,\'Outreach Queue\'!K:K,"Replied")', '=COUNTIFS(\'Outreach Queue\'!E:E,A3,\'Outreach Queue\'!K:K,"Positive Reply")', '=COUNTIFS(\'Outreach Queue\'!E:E,A3,\'Outreach Queue\'!L:L,"Booked")', '=COUNTIFS(\'Outreach Queue\'!E:E,A3,\'Outreach Queue\'!L:L,"Converted")', '=IF(B3=0,0,F3/B3)', 'Safe Auto template'],
    ['T033', '=COUNTIF(\'Outreach Queue\'!E:E,A4)', '=COUNTIFS(\'Outreach Queue\'!E:E,A4,\'Outreach Queue\'!K:K,"Replied")', '=COUNTIFS(\'Outreach Queue\'!E:E,A4,\'Outreach Queue\'!K:K,"Positive Reply")', '=COUNTIFS(\'Outreach Queue\'!E:E,A4,\'Outreach Queue\'!L:L,"Booked")', '=COUNTIFS(\'Outreach Queue\'!E:E,A4,\'Outreach Queue\'!L:L,"Converted")', '=IF(B4=0,0,F4/B4)', 'Safe Auto template'],
    ['T034', '=COUNTIF(\'Outreach Queue\'!E:E,A5)', '=COUNTIFS(\'Outreach Queue\'!E:E,A5,\'Outreach Queue\'!K:K,"Replied")', '=COUNTIFS(\'Outreach Queue\'!E:E,A5,\'Outreach Queue\'!K:K,"Positive Reply")', '=COUNTIFS(\'Outreach Queue\'!E:E,A5,\'Outreach Queue\'!L:L,"Booked")', '=COUNTIFS(\'Outreach Queue\'!E:E,A5,\'Outreach Queue\'!L:L,"Converted")', '=IF(B5=0,0,F5/B5)', 'Safe Auto template']
  ];
  sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
}

function applyAgentValidations_(sheets) {
  setDropdown_(sheets.creators, 'M2:M1000', ['New', 'Needs Review', 'Approved', 'Rejected', 'Contact Only', 'Duplicate']);
  setDropdown_(sheets.creators, 'O2:O1000', ['New', 'Needs Review', 'Approved', 'Rejected']);
  setDropdown_(sheets.campaigns, 'L2:L1000', ['Draft', 'Active', 'Paused', 'Complete', 'Archived']);
  setDropdown_(sheets.matches, 'E2:E1000', ['Best Match', 'Maybe Match', 'Needs Review', 'Not Fit']);
  setDropdown_(sheets.review, 'F2:F1000', ['Approved', 'Reject', 'Maybe', 'Needs More Info']);
  setDropdown_(sheets.outreach, 'H2:H1000', ['Needs Approval', 'Approved To Send', 'Sent', 'Replied', 'Positive Reply', 'Not Interested', 'No Response', 'Blocked']);
  setDropdown_(sheets.outreach, 'I2:I1000', ['FALSE', 'TRUE']);
  setDropdown_(sheets.outreach, 'K2:K1000', ['Not Sent', 'Replied', 'Positive Reply', 'Not Interested', 'No Response']);
  setDropdown_(sheets.outreach, 'L2:L1000', ['Not Started', 'Booked', 'Converted', 'Lost']);
  setDropdown_(sheets.templateLibrary, 'E2:E1000', ['Active', 'Paused', 'Human Review', 'Archived']);
  if (sheets.brandBrief) setDropdown_(sheets.brandBrief, 'B16:B16', ['Yes', 'No']);
  sheets.agentControl.getRange('B2:B20').clearDataValidations();
}

function setDropdown_(sheet, rangeA1, values) {
  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(values, true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(rangeA1).setDataValidation(rule);
}

function normalizeOutreachQueue_(sheet) {
  const maxRows = Math.min(sheet.getMaxRows(), 1000);
  if (maxRows < 2) return;

  const rowCount = maxRows - 1;
  const templateFormulas = [];
  const subjectFormulas = [];
  const bodyFormulas = [];
  const statusFormulas = [];
  const approvalFormulas = [];

  for (let row = 2; row <= maxRows; row += 1) {
    templateFormulas.push([`=IF(D${row}="","",CHOOSE(MOD(ROW()-2,4)+1,"T031","T032","T033","T034"))`]);
    subjectFormulas.push([`=IF(E${row}="","",SUBSTITUTE(INDEX('Template Library'!C:C,MATCH(E${row},'Template Library'!A:A,0)),"{brand_name}","this brand campaign"))`]);
    bodyFormulas.push([`=IF(E${row}="","",SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(INDEX('Template Library'!D:D,MATCH(E${row},'Template Library'!A:A,0)),"{creator_greeting}","there"),"{brand_name}","this brand campaign: "&Campaigns!N$2),"{sender_name}",INDEX('Agent Control'!B:B,MATCH("sender_name",'Agent Control'!A:A,0))))`]);
    statusFormulas.push([`=IF(D${row}="","Blocked",IF(OR(Campaigns!N$2="",UPPER(Campaigns!N$2)="MISSING"),"Blocked",IF(I${row}="TRUE","Approved To Send","Needs Approval")))`]);
    approvalFormulas.push([`=IFERROR(IF(INDEX('Review Queue'!F:F,MATCH(C${row},'Review Queue'!B:B,0))="Approved","TRUE","FALSE"),"FALSE")`]);
  }

  sheet.getRange(2, 5, rowCount, 1).setFormulas(templateFormulas);
  sheet.getRange(2, 6, rowCount, 1).setFormulas(subjectFormulas);
  sheet.getRange(2, 7, rowCount, 1).setFormulas(bodyFormulas);
  sheet.getRange(2, 8, rowCount, 1).setFormulas(statusFormulas);
  sheet.getRange(2, 9, rowCount, 1).setFormulas(approvalFormulas);
}

function appendAgentRunLog_(sheet, now) {
  sheet.appendRow([
    'AR' + Utilities.formatString('%03d', Math.max(1, sheet.getLastRow())),
    'Hermes',
    now,
    now,
    'agent_first_setup',
    'Created Agent Control, validations, safe templates, and outreach guardrails',
    'UGC Creator Pipeline POC - Round 1',
    'Agent Control, dropdowns, Outreach Queue, Template Performance',
    'Complete',
    'Executed by Apps Script menu inside Google Sheets'
  ]);
}

function runFirst10Enrichments() {
  runEnrichment_({ limit: DEFAULT_LIMIT, skipAlreadyProcessed: false });
}

function runNextBlankEnrichments() {
  runEnrichment_({ limit: DEFAULT_LIMIT, skipAlreadyProcessed: true });
}

function runEnrichment_(options) {
  const ss = SpreadsheetApp.getActive();
  const staging = ss.getSheetByName(STAGING_SHEET);
  if (!staging) {
    SpreadsheetApp.getUi().alert('Missing tab: ' + STAGING_SHEET);
    return;
  }

  const stagingRows = readSheetObjects_(staging);
  const enrichmentSheet = ensureSheet_(ss, ENRICHMENT_SHEET, ENRICHMENT_HEADERS);
  const outreachSheet = ensureSheet_(ss, OUTREACH_SHEET, OUTREACH_HEADERS);
  const runLogSheet = ensureSheet_(ss, RUN_LOG_SHEET, RUN_LOG_HEADERS);
  const alreadyProcessed = getAlreadyProcessed_(enrichmentSheet);

  let processed = 0;
  const now = new Date().toISOString();

  for (const row of stagingRows) {
    if (processed >= options.limit) break;

    const username = normalizeUsername_(row.reddit_username);
    const portfolioUrl = cleanUrl_(row.portfolio_url);
    if (!isUsablePortfolioUrl_(portfolioUrl)) {
      if (row.email || row.reddit_comment_url) {
        appendObjectRow_(outreachSheet, OUTREACH_HEADERS, buildContactOnlyOutreach_(row, now));
        appendObjectRow_(runLogSheet, RUN_LOG_HEADERS, {
          processed_at: now,
          reddit_username: username,
          portfolio_url: portfolioUrl,
          status: 'skipped',
          notes: 'No usable portfolio URL; contact-only row'
        });
        processed++;
      }
      continue;
    }
    if (options.skipAlreadyProcessed && alreadyProcessed[username]) continue;

    try {
      const enrichment = enrichPortfolio_(row, portfolioUrl, now);
      appendObjectRow_(enrichmentSheet, ENRICHMENT_HEADERS, enrichment);
      appendObjectRow_(outreachSheet, OUTREACH_HEADERS, buildOutreachDraft_(row, enrichment, now));
      appendObjectRow_(runLogSheet, RUN_LOG_HEADERS, {
        processed_at: now,
        reddit_username: username,
        portfolio_url: portfolioUrl,
        status: enrichment.needs_review === 'Yes' ? 'needs_review' : 'ok',
        notes: enrichment.review_reason
      });
      processed++;
    } catch (error) {
      const fallback = buildFetchFailureEnrichment_(row, portfolioUrl, now, error);
      appendObjectRow_(enrichmentSheet, ENRICHMENT_HEADERS, fallback);
      appendObjectRow_(outreachSheet, OUTREACH_HEADERS, buildOutreachDraft_(row, fallback, now));
      appendObjectRow_(runLogSheet, RUN_LOG_HEADERS, {
        processed_at: now,
        reddit_username: username,
        portfolio_url: portfolioUrl,
        status: 'needs_review',
        notes: String(error && error.message ? error.message : error)
      });
      processed++;
    }
  }

  SpreadsheetApp.getUi().alert('UGC enrichment finished. Rows processed: ' + processed);
}

function buildFetchFailureEnrichment_(stagingRow, portfolioUrl, processedAt, error) {
  const message = String(error && error.message ? error.message : error);
  return {
    reddit_username: normalizeUsername_(stagingRow.reddit_username),
    source_post_url: stagingRow.source_post_url || '',
    portfolio_url: portfolioUrl,
    portfolio_url_type: stagingRow.portfolio_url_type || classifyUrl_(portfolioUrl),
    creator_name: normalizeUsername_(stagingRow.reddit_username),
    location: '',
    portfolio_email: stagingRow.email || '',
    social_links: '',
    platform_mentions: '',
    claimed_followers: '',
    claimed_views: '',
    claimed_likes: '',
    claimed_engagement: '',
    strongest_platform: '',
    parent_kids_family_flag: '',
    gender_flag: '',
    categories_niches: '',
    brands_worked_with: '',
    years_creator_experience: '',
    portfolio_summary: '',
    confidence_score: stagingRow.email ? 35 : 15,
    needs_review: 'Yes',
    review_reason: 'Portfolio fetch failed: ' + message,
    processed_at: processedAt
  };
}

function buildContactOnlyOutreach_(stagingRow, processedAt) {
  const email = stagingRow.email || '';
  const username = normalizeUsername_(stagingRow.reddit_username);
  if (email) {
    return {
      reddit_username: username,
      email: email,
      outreach_subject: 'UGC collaboration idea',
      outreach_body: 'Hi there,\n\nI saw your comment about UGC work and wanted to reach out about a possible brand collaboration.\n\nWould you be open to hearing a little more?\n\nBest,\nBaruch',
      outreach_status: 'Draft Ready',
      personalized_line: 'I saw your comment about UGC work.',
      processed_at: processedAt
    };
  }

  return {
    reddit_username: username,
    email: '',
    outreach_subject: '',
    outreach_body: '',
    outreach_status: stagingRow.reddit_comment_url ? 'Reddit DM Needed' : 'Missing Contact',
    personalized_line: '',
    processed_at: processedAt
  };
}

function enrichPortfolio_(stagingRow, portfolioUrl, processedAt) {
  const resolved = resolveCanvaLink_(portfolioUrl);
  const finalUrl = resolved.finalUrl;
  const html = fetchPortfolioHtml_(finalUrl);
  const title = extractTitle_(html);
  const links = extractLinks_(html, finalUrl);
  const text = htmlToVisibleText_(html);
  const textReliable = text.length >= 250;
  const emails = unique_([].concat(extractEmails_(text), extractEmails_(links.join(' '))));
  const socialLinks = links.filter(isSocialUrl_);
  const platformMentions = textReliable ? extractPlatformMentions_(text + ' ' + socialLinks.join(' ')) : [];
  const metrics = textReliable ? extractMetrics_(text) : { followers: [], views: [], likes: [], engagement: [] };
  const categories = textReliable ? extractCategories_(text) : [];
  const brands = textReliable ? extractBrands_(text) : [];
  const creatorName = extractCreatorName_(title, text, stagingRow.reddit_username);
  const reviewReasons = [];

  if (resolved.status === 'redirect_failed') reviewReasons.push('canva.link redirect could not be resolved');
  if (text.length < 250) reviewReasons.push('portfolio has very little extractable text');
  if (String(stagingRow.portfolio_url_type || '').toLowerCase() === 'canva_design') {
    reviewReasons.push('Canva design pages often need manual review');
  }

  return {
    reddit_username: normalizeUsername_(stagingRow.reddit_username),
    source_post_url: stagingRow.source_post_url || '',
    portfolio_url: finalUrl,
    portfolio_url_type: stagingRow.portfolio_url_type || classifyUrl_(finalUrl),
    creator_name: creatorName,
    location: extractLocation_(text),
    portfolio_email: emails[0] || '',
    social_links: socialLinks.join(' | '),
    platform_mentions: platformMentions.join(' | '),
    claimed_followers: metrics.followers.join(' | '),
    claimed_views: metrics.views.join(' | '),
    claimed_likes: metrics.likes.join(' | '),
    claimed_engagement: metrics.engagement.join(' | '),
    strongest_platform: chooseStrongestPlatform_(platformMentions, text),
    parent_kids_family_flag: extractFamilyFlag_(text),
    gender_flag: extractGenderFlag_(text),
    categories_niches: categories.join(' | '),
    brands_worked_with: brands.join(' | '),
    years_creator_experience: extractYearsExperience_(text),
    portfolio_summary: summarizePortfolio_(creatorName, categories, platformMentions, metrics, text),
    confidence_score: scoreConfidence_(text, emails, socialLinks, metrics, reviewReasons),
    needs_review: reviewReasons.length ? 'Yes' : 'No',
    review_reason: reviewReasons.join(' | '),
    processed_at: processedAt
  };
}

function buildOutreachDraft_(stagingRow, enrichment, processedAt) {
  const email = enrichment.portfolio_email || stagingRow.email || '';
  const name = enrichment.creator_name || enrichment.reddit_username || 'there';
  const personalizedLine = buildPersonalizedLine_(enrichment, stagingRow);

  if (email) {
    return {
      reddit_username: enrichment.reddit_username,
      email: email,
      outreach_subject: 'UGC collaboration idea',
      outreach_body: 'Hi ' + name + ',\n\n' + personalizedLine + '\n\nI am reaching out because we are looking for creators for a brand collaboration and your portfolio looked like a strong fit.\n\nWould you be open to hearing a little more?\n\nBest,\nBaruch',
      outreach_status: 'Draft Ready',
      personalized_line: personalizedLine,
      processed_at: processedAt
    };
  }

  return {
    reddit_username: enrichment.reddit_username,
    email: '',
    outreach_subject: '',
    outreach_body: '',
    outreach_status: stagingRow.reddit_comment_url ? 'Reddit DM Needed' : 'Missing Contact',
    personalized_line: personalizedLine,
    processed_at: processedAt
  };
}

function resolveCanvaLink_(url) {
  if (!/canva\.link/i.test(url)) return { finalUrl: url, status: 'not_redirect' };

  try {
    const response = UrlFetchApp.fetch(url, {
      followRedirects: false,
      muteHttpExceptions: true,
      headers: { 'User-Agent': 'Mozilla/5.0 UGC Pipeline POC' }
    });
    const location = response.getHeaders().Location || response.getAllHeaders().Location;
    return { finalUrl: cleanUrl_(location || url), status: location ? 'redirected' : 'no_location_header' };
  } catch (error) {
    return { finalUrl: url, status: 'redirect_failed' };
  }
}

function fetchPortfolioHtml_(url) {
  const response = UrlFetchApp.fetch(url, {
    followRedirects: true,
    muteHttpExceptions: true,
    headers: { 'User-Agent': 'Mozilla/5.0 UGC Pipeline POC' }
  });
  const code = response.getResponseCode();
  if (code < 200 || code >= 400) {
    throw new Error('Fetch failed with HTTP ' + code);
  }
  return response.getContentText();
}

function readSheetObjects_(sheet) {
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0].map(function (header) { return String(header).trim(); });

  return values.slice(1).map(function (row) {
    const object = {};
    headers.forEach(function (header, index) {
      object[header] = row[index] == null ? '' : String(row[index]).trim();
    });
    return object;
  });
}

function ensureSheet_(ss, name, headers) {
  const sheet = ss.getSheetByName(name) || ss.insertSheet(name);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
  } else {
    const existing = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
    const needsHeaders = existing.join('').trim() === '';
    const headersChanged = existing.map(String).join('|') !== headers.map(String).join('|');
    if (needsHeaders || headersChanged) sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  return sheet;
}

function appendObjectRow_(sheet, headers, object) {
  sheet.appendRow(headers.map(function (header) { return object[header] || ''; }));
}

function getAlreadyProcessed_(sheet) {
  const rows = readSheetObjects_(sheet);
  const seen = {};
  rows.forEach(function (row) {
    const username = normalizeUsername_(row.reddit_username);
    if (username) seen[username] = true;
  });
  return seen;
}

function htmlToVisibleText_(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractTitle_(html) {
  const match = String(html || '').match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? htmlToVisibleText_(match[1]) : '';
}

function extractLinks_(html, baseUrl) {
  const links = [];
  const regex = /href=["']([^"']+)["']/gi;
  let match;
  while ((match = regex.exec(String(html || ''))) !== null) {
    const cleaned = cleanUrl_(match[1]);
    if (!cleaned || cleaned.indexOf('javascript:') === 0 || cleaned.indexOf('#') === 0) continue;
    links.push(resolveUrl_(cleaned, baseUrl));
  }
  return unique_(links);
}

function resolveUrl_(url, baseUrl) {
  if (/^https?:\/\//i.test(url)) return url;
  if (/^\/\//.test(url)) return 'https:' + url;
  const origin = String(baseUrl || '').match(/^(https?:\/\/[^\/]+)/i);
  return origin ? origin[1] + (url.charAt(0) === '/' ? url : '/' + url) : url;
}

function extractEmails_(text) {
  const matches = String(text || '').match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi);
  return unique_(matches || []);
}

function extractPlatformMentions_(text) {
  const platforms = ['TikTok', 'Instagram', 'YouTube', 'Amazon', 'Pinterest', 'Facebook', 'Snapchat', 'LinkedIn', 'Reddit'];
  const lower = String(text || '').toLowerCase();
  return platforms.filter(function (platform) { return lower.indexOf(platform.toLowerCase()) !== -1; });
}

function extractMetrics_(text) {
  const source = String(text || '');
  return {
    followers: matchMetric_(source, '(followers|following|audience|subscribers|subs)'),
    views: matchMetric_(source, '(views|impressions|reach)'),
    likes: matchMetric_(source, '(likes|hearts)'),
    engagement: matchMetric_(source, '(engagement|engagement rate|er)')
  };
}

function matchMetric_(text, labelPattern) {
  const regex = new RegExp('([0-9][0-9,.]*\\s?(?:k|m|b|%|percent)?)\\s+' + labelPattern, 'gi');
  const results = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    results.push((match[1] + ' ' + match[2]).trim());
  }
  return unique_(results).slice(0, 6);
}

function chooseStrongestPlatform_(platforms, text) {
  if (!platforms.length) return '';
  const lower = String(text || '').toLowerCase();
  const priority = ['TikTok', 'Instagram', 'YouTube', 'Amazon', 'Pinterest'];
  for (const platform of priority) {
    if (platforms.indexOf(platform) !== -1 && lower.indexOf(platform.toLowerCase()) !== -1) return platform;
  }
  return platforms[0];
}

function extractCategories_(text) {
  const categories = {
    Beauty: /beauty|skincare|makeup|haircare/i,
    Fashion: /fashion|style|outfit|apparel/i,
    Fitness: /fitness|wellness|workout|health/i,
    Food: /food|recipe|cooking|kitchen/i,
    Home: /home|decor|organization|cleaning/i,
    Parenting: /parent|mom|dad|kids|family|baby|toddler/i,
    Pets: /pet|dog|cat/i,
    Travel: /travel|hotel|vacation/i,
    Tech: /tech|app|software|gadget/i,
    Lifestyle: /lifestyle|ugc creator|content creator/i
  };
  return Object.keys(categories).filter(function (name) { return categories[name].test(text); });
}

function extractBrands_(text) {
  const brands = [];
  const regex = /(?:brands?|worked with|collaborated with|clients?)[:\s]+([A-Z0-9][A-Za-z0-9 &,.+-]{2,120})/g;
  let match;
  while ((match = regex.exec(String(text || ''))) !== null) {
    brands.push(match[1].replace(/\s+/g, ' ').trim());
  }
  return unique_(brands).slice(0, 8);
}

function extractCreatorName_(title, text, fallback) {
  const titleName = String(title || '').split('|')[0].split('-')[0].trim();
  if (titleName && titleName.length <= 60 && !/portfolio|canva|ugc/i.test(titleName)) return titleName;

  const match = String(text || '').match(/\b(?:Hi,? I'?m|I am|My name is)\s+([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)?)/);
  if (match) return match[1].trim();
  return normalizeUsername_(fallback);
}

function extractLocation_(text) {
  const match = String(text || '').match(/\b(?:based in|located in|from)\s+([A-Z][A-Za-z .,-]{2,60})/);
  return match ? match[1].replace(/\s+/g, ' ').trim() : '';
}

function extractFamilyFlag_(text) {
  return /parent|mom|mother|dad|father|kids|children|family|baby|toddler/i.test(text) ? 'Yes' : 'No';
}

function extractGenderFlag_(text) {
  if (/\b(she\/her|female creator|mom|mother|wife)\b/i.test(text)) return 'Female indicated';
  if (/\b(he\/him|male creator|dad|father|husband)\b/i.test(text)) return 'Male indicated';
  return '';
}

function extractYearsExperience_(text) {
  const match = String(text || '').match(/([0-9]+)\+?\s+(?:years?|yrs?)\s+(?:of\s+)?(?:ugc|creator|content|marketing)?\s*experience/i);
  return match ? match[1] : '';
}

function summarizePortfolio_(name, categories, platforms, metrics, text) {
  const pieces = [];
  if (name) pieces.push(name);
  if (categories.length) pieces.push('focuses on ' + categories.slice(0, 3).join(', '));
  if (platforms.length) pieces.push('mentions ' + platforms.slice(0, 3).join(', '));
  const metricCount = metrics.followers.length + metrics.views.length + metrics.likes.length + metrics.engagement.length;
  if (metricCount) pieces.push('includes visible performance claims');
  if (!pieces.length && text) pieces.push(text.slice(0, 180));
  return pieces.join('; ');
}

function scoreConfidence_(text, emails, socialLinks, metrics, reviewReasons) {
  let score = 20;
  if (String(text || '').length > 500) score += 25;
  if (emails.length) score += 15;
  if (socialLinks.length) score += 15;
  if (metrics.followers.length || metrics.views.length || metrics.likes.length || metrics.engagement.length) score += 15;
  if (reviewReasons.length) score -= 20;
  return Math.max(0, Math.min(100, score));
}

function buildPersonalizedLine_(enrichment, stagingRow) {
  const confidence = Number(enrichment.confidence_score || 0);
  if (enrichment.needs_review === 'Yes' || confidence < 50) {
    if (stagingRow && stagingRow.comment_snippet) return 'I saw your Reddit comment about UGC work.';
    return 'I saw your UGC creator information and wanted to reach out.';
  }
  if (enrichment.categories_niches) {
    return 'I liked that your portfolio highlights ' + enrichment.categories_niches.split(' | ').slice(0, 2).join(' and ') + ' content.';
  }
  if (enrichment.strongest_platform) {
    return 'I noticed your work on ' + enrichment.strongest_platform + ' and thought your creator style could be a strong fit.';
  }
  return 'I took a look at your portfolio and liked the way you present your creator work.';
}

function isSocialUrl_(url) {
  return /instagram\.com|tiktok\.com|youtube\.com|youtu\.be|facebook\.com|pinterest\.com|linkedin\.com|threads\.net|x\.com|twitter\.com/i.test(url);
}

function classifyUrl_(url) {
  if (/\.my\.canva\.site/i.test(url)) return 'canva_site';
  if (/canva\.link/i.test(url)) return 'canva_link';
  if (/canva\.com\/design/i.test(url)) return 'canva_design';
  if (isSocialUrl_(url)) return 'social_only';
  return url ? 'personal_site' : 'none';
}

function isUsablePortfolioUrl_(url) {
  const value = String(url || '').trim();
  if (!value) return false;
  if (/^mailto:/i.test(value)) return false;
  if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/i.test(value)) return false;
  if (!/^https?:\/\//i.test(value)) return false;
  return classifyUrl_(value) !== 'none';
}

function cleanUrl_(url) {
  return String(url || '')
    .replace(/&amp;/g, '&')
    .replace(/^https?:\/\/mailto:/i, 'mailto:')
    .replace(/^\[|\]$/g, '')
    .replace(/^\(|\)$/g, '')
    .replace(/\*\*/g, '')
    .replace(/[),.;\]]+$/g, '')
    .trim();
}

function normalizeUsername_(username) {
  return String(username || '').replace(/^u\//i, '').replace(/^@/, '').trim().toLowerCase();
}

function unique_(values) {
  const seen = {};
  return values.filter(function (value) {
    const key = String(value || '').trim();
    if (!key || seen[key]) return false;
    seen[key] = true;
    return true;
  });
}
