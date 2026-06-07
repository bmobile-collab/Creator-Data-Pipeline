const STAGING_SHEET = 'HTML Staging';
const ENRICHMENT_SHEET = 'Portfolio Enrichment';
const OUTREACH_SHEET = 'Outreach Drafts';
const RUN_LOG_SHEET = 'Run Log';
const DEFAULT_LIMIT = 10;

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
    .addItem('Run first 10 enrichments', 'runFirst10Enrichments')
    .addItem('Run next blank enrichments', 'runNextBlankEnrichments')
    .addToUi();
}

function setupAgentFirstMvp() {
  const ss = SpreadsheetApp.getActive();
  const now = new Date().toISOString();

  const sheets = {
    creators: ensureSheet_(ss, 'Creators', [
      'creator_id', 'reddit_username', 'creator_name', 'email_primary', 'contact_method',
      'portfolio_url', 'portfolio_url_type', 'social_links', 'source_platform', 'source_url',
      'first_seen_round', 'last_seen_round', 'creator_status', 'confidence_score',
      'review_status', 'notes'
    ]),
    evidence: ensureSheet_(ss, 'Evidence', [
      'evidence_id', 'creator_id', 'field_name', 'claimed_value', 'evidence_text',
      'evidence_source', 'evidence_url', 'confidence', 'verified_status', 'created_at'
    ]),
    campaigns: ensureSheet_(ss, 'Campaigns', [
      'campaign_id', 'brand_name', 'campaign_name', 'product_category', 'required_tags',
      'preferred_tags', 'excluded_tags', 'required_contact_method', 'portfolio_required',
      'location_preference', 'must_be_verified', 'campaign_status', 'notes', 'brand_media_room_url'
    ]),
    matches: ensureSheet_(ss, 'Matches', [
      'match_id', 'campaign_id', 'creator_id', 'match_score', 'match_tier',
      'matched_reasons', 'missing_requirements', 'needs_review_reason', 'created_at'
    ]),
    review: ensureSheet_(ss, 'Review Queue', [
      'review_id', 'creator_id', 'issue_type', 'issue_detail', 'recommended_action',
      'human_decision', 'decision_notes', 'reviewed_at'
    ]),
    outreach: ensureSheet_(ss, 'Outreach Queue', [
      'outreach_id', 'campaign_id', 'creator_id', 'email', 'template_id', 'outreach_subject',
      'outreach_body', 'outreach_status', 'approved_by_human', 'sent_at', 'reply_status',
      'conversion_status', 'notes'
    ]),
    templateLibrary: ensureSheet_(ss, 'Template Library', [
      'template_id', 'template_name', 'template_subject', 'template_body', 'template_status', 'notes'
    ]),
    templatePerformance: ensureSheet_(ss, 'Template Performance', [
      'template_id', 'sent_count', 'reply_count', 'positive_reply_count',
      'booking_count', 'conversion_count', 'conversion_rate', 'notes'
    ]),
    runLog: ensureSheet_(ss, 'Run Log', [
      'run_id', 'run_type', 'started_at', 'ended_at', 'status', 'rows_processed',
      'ok_count', 'needs_review_count', 'error_count', 'notes'
    ]),
    agentRunLog: ensureSheet_(ss, 'Agent Run Log', [
      'agent_run_id', 'agent_name', 'started_at', 'ended_at', 'step', 'action_taken',
      'input_ref', 'output_ref', 'status', 'notes'
    ]),
    agentControl: ensureSheet_(ss, 'Agent Control', [
      'control_key', 'control_value', 'description'
    ])
  };

  seedAgentControl_(sheets.agentControl);
  seedSafeTemplates_(sheets.templateLibrary);
  seedTemplatePerformance_(sheets.templatePerformance);
  applyAgentValidations_(sheets);
  normalizeOutreachQueue_(sheets.outreach);
  appendAgentRunLog_(sheets.agentRunLog, now);

  SpreadsheetApp.getUi().alert('Agent-first MVP setup complete. Check Agent Control, dropdowns, and Outreach Queue.');
}

function seedAgentControl_(sheet) {
  const rows = [
    ['control_key', 'control_value', 'description'],
    ['agent_mode', 'manual_approval_required', 'Hermes prepares work but cannot send outreach.'],
    ['active_campaign_id', 'CAMP001', 'Campaign Hermes should operate on.'],
    ['active_round_id', 'ROUND001', 'Current sourcing round.'],
    ['max_batch_size', '10', 'Maximum creators Hermes can process per run.'],
    ['allow_auto_outreach', 'No', 'Hard block on sending messages automatically.'],
    ['allow_needs_review_outreach', 'No', 'Hard block on needs-review creators.'],
    ['allowed_template_notes', 'Safe Auto', 'Only templates with this notes value can be used automatically.'],
    ['required_media_room_url', 'Yes', 'Campaign must have media room URL before drafts can be approved.'],
    ['human_final_approval_required', 'Yes', 'Human approval is required before outreach can move to Approved To Send.'],
    ['sender_name', 'Baruch', 'Default sender name for safe templates.']
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
  setDropdown_(sheets.agentControl, 'B2:B20', ['manual_approval_required', 'CAMP001', 'ROUND001', '10', 'No', 'Yes', 'Safe Auto', 'Baruch']);
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
  const approvalValues = [];

  for (let row = 2; row <= maxRows; row += 1) {
    templateFormulas.push([`=IF(D${row}="","",CHOOSE(MOD(ROW()-2,4)+1,"T031","T032","T033","T034"))`]);
    subjectFormulas.push([`=IF(E${row}="","",SUBSTITUTE(INDEX('Template Library'!C:C,MATCH(E${row},'Template Library'!A:A,0)),"{brand_name}","this brand campaign"))`]);
    bodyFormulas.push([`=IF(E${row}="","",SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(INDEX('Template Library'!D:D,MATCH(E${row},'Template Library'!A:A,0)),"{creator_greeting}","there"),"{brand_name}","this brand campaign: "&Campaigns!N$2),"{sender_name}",INDEX('Agent Control'!B:B,MATCH("sender_name",'Agent Control'!A:A,0))))`]);
    statusFormulas.push([`=IF(D${row}="","Blocked",IF(OR(Campaigns!N$2="",UPPER(Campaigns!N$2)="MISSING"),"Blocked","Needs Approval"))`]);
    approvalValues.push(['FALSE']);
  }

  sheet.getRange(2, 5, rowCount, 1).setFormulas(templateFormulas);
  sheet.getRange(2, 6, rowCount, 1).setFormulas(subjectFormulas);
  sheet.getRange(2, 7, rowCount, 1).setFormulas(bodyFormulas);
  sheet.getRange(2, 8, rowCount, 1).setFormulas(statusFormulas);
  sheet.getRange(2, 9, rowCount, 1).setValues(approvalValues);
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
    if (needsHeaders) sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
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
