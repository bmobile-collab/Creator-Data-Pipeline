#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

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

const ENRICHMENT_HEADERS = [
  ...STAGING_HEADERS,
  'resolved_portfolio_url',
  'page_title',
  'creator_name',
  'location',
  'portfolio_email',
  'social_links',
  'platforms_found',
  'claimed_tiktok_metrics',
  'claimed_instagram_metrics',
  'claimed_facebook_metrics',
  'strongest_platform',
  'parent_flag',
  'kids_flag',
  'gender_flag',
  'creator_categories',
  'brands_worked_with',
  'years_experience',
  'portfolio_summary',
  'confidence_score',
  'needs_review',
  'review_reason',
  'scrape_status'
];

const OUTREACH_HEADERS = [
  'reddit_username',
  'email',
  'reddit_contact_url',
  'portfolio_url',
  'outreach_subject',
  'outreach_body',
  'outreach_status',
  'personalization_note',
  'review_reason'
];

const RUN_LOG_HEADERS = [
  'timestamp',
  'reddit_username',
  'portfolio_url',
  'status',
  'message'
];

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const URL_RE = /https?:\/\/[^\s)\]>"'\\]+/gi;
const SOCIAL_RE = /https?:\/\/[^\s)\]>"'\\]*(?:instagram|tiktok|facebook|youtube|youtu\.be|threads\.net|pinterest|linkedin)[^\s)\]>"'\\]*/gi;
const SOCIAL_URL_RE = /instagram|tiktok|facebook|youtube|youtu\.be|threads\.net|pinterest|linkedin/i;

const CATEGORY_KEYWORDS = [
  'beauty', 'skincare', 'wellness', 'fitness', 'health', 'tech', 'saas', 'app',
  'lifestyle', 'fashion', 'travel', 'food', 'home', 'cleaning', 'organic',
  'pet', 'dog', 'cat', 'parenting', 'mom', 'family', 'baby', 'kids', 'finance',
  'gaming', 'education', 'productivity', 'amazon'
];

function usage() {
  return [
    'Usage:',
    '  node work/enrich_ugc_poc.mjs --input path/to/ugc_staging_export.csv [--out-dir outputs/enriched] [--limit 10]',
    '',
    'Outputs:',
    '  portfolio_enrichment.csv',
    '  outreach_drafts.csv',
    '  run_log.csv'
  ].join('\n');
}

function parseArgs(argv) {
  const args = { outDir: 'outputs/enriched', limit: 0 };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--input') args.input = argv[++i];
    else if (arg === '--out-dir') args.outDir = argv[++i];
    else if (arg === '--limit') args.limit = Number(argv[++i] || 0);
    else if (arg === '--help' || arg === '-h') args.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return args;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (inQuotes) {
      if (char === '"' && next === '"') {
        value += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        value += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(value);
      value = '';
    } else if (char === '\n') {
      row.push(value);
      rows.push(row);
      row = [];
      value = '';
    } else if (char !== '\r') {
      value += char;
    }
  }

  if (value || row.length) {
    row.push(value);
    rows.push(row);
  }

  return rows.filter(items => items.some(item => String(item).trim() !== ''));
}

function rowsToObjects(rows) {
  const headers = rows[0].map(h => h.trim());
  const missing = STAGING_HEADERS.filter(header => !headers.includes(header));
  if (missing.length) {
    throw new Error(`Input is missing staging columns: ${missing.join(', ')}`);
  }

  return rows.slice(1)
    .filter(row => row[headers.indexOf('reddit_username')] !== 'reddit_username')
    .map(row => Object.fromEntries(headers.map((header, index) => [header, row[index] || ''])))
    .filter(row => row.reddit_username);
}

function csvEscape(value) {
  const text = String(value ?? '');
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCsv(headers, rows) {
  return [
    headers.join(','),
    ...rows.map(row => headers.map(header => csvEscape(row[header])).join(','))
  ].join('\n');
}

function cleanUrl(raw) {
  const cleaned = String(raw || '')
    .trim()
    .replace(/^<|>$/g, '')
    .replace(/^\[|\]$/g, '')
    .replace(/^\(|\)$/g, '')
    .replace(/^\*+|\*+$/g, '')
    .replace(/&amp;/gi, '&')
    .replace(/^https?:\/\/mailto:/i, 'mailto:')
    .replace(/\\_/g, '_')
    .replace(/[.,;:!?]+$/g, '')
    .replace(/[)\]}]+$/g, '')
    .replace(/\*+$/g, '');
  if (/^mailto:/i.test(cleaned)) return '';
  if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/i.test(cleaned)) return '';
  return cleaned;
}

function classifyPortfolioUrl(url) {
  const lower = String(url || '').toLowerCase();
  if (!lower) return 'none';
  if (/\/\/[^/]*\.my\.canva\.site\b/.test(lower)) return 'canva_site';
  if (/\/\/canva\.link\b/.test(lower)) return 'canva_link';
  if (/\/\/(?:www\.)?canva\.com\/design\//.test(lower)) return 'canva_design';
  if (/instagram|tiktok|facebook|youtube|youtu\.be|pinterest|threads\.net|linkedin/.test(lower)) return 'social_only';
  return 'personal_site';
}

function isUsablePortfolioUrl(url) {
  return /^https?:\/\//i.test(url) && classifyPortfolioUrl(url) !== 'none';
}

function decodeEntities(text) {
  const named = {
    amp: '&',
    lt: '<',
    gt: '>',
    quot: '"',
    apos: "'",
    nbsp: ' '
  };
  return String(text || '')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (_, name) => named[name.toLowerCase()] || `&${name};`);
}

function htmlToText(html) {
  return decodeEntities(String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|section|article|header|footer|li|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim());
}

function extractTitle(html) {
  const match = String(html || '').match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? decodeEntities(match[1]).trim() : '';
}

function extractHrefLinks(html) {
  return [...String(html || '').matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi)]
    .map(match => cleanUrl(decodeEntities(match[1])))
    .filter(href => /^https?:\/\//i.test(href));
}

async function fetchWithTimeout(url, timeoutMs = 20000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'user-agent': 'Mozilla/5.0 UGC-Enrichment-POC/1.0',
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });
    const html = await response.text();
    return {
      ok: response.ok,
      status: response.status,
      finalUrl: response.url || url,
      html
    };
  } finally {
    clearTimeout(timer);
  }
}

function uniqueList(items) {
  return [...new Set(items.map(item => cleanUrl(item)).filter(Boolean))];
}

function extractMetricClaims(text, platform) {
  const source = String(text || '');
  const platformRe = new RegExp(`(?:${platform}|${platform === 'instagram' ? 'ig' : platform === 'facebook' ? 'fb' : platform})[^\\n.]{0,90}(followers?|views?|likes?|engagement|posts?)[^\\n.]{0,50}`, 'gi');
  const numberNearPlatformRe = new RegExp(`(?:${platform}|${platform === 'instagram' ? 'ig' : platform === 'facebook' ? 'fb' : platform})[^\\n.]{0,90}(\\d+(?:\\.\\d+)?\\s*[kKmM]?\\+?)`, 'gi');
  return uniqueList([
    ...[...source.matchAll(platformRe)].map(match => match[0]),
    ...[...source.matchAll(numberNearPlatformRe)].map(match => match[0])
  ]).slice(0, 5).join(' | ');
}

function metricWeight(metricText) {
  const matches = String(metricText || '').match(/\d+(?:\.\d+)?\s*[kKmM]?/g) || [];
  return matches.reduce((total, raw) => {
    const number = parseFloat(raw);
    const multiplier = /m/i.test(raw) ? 1_000_000 : /k/i.test(raw) ? 1_000 : 1;
    return total + number * multiplier;
  }, 0);
}

function extractPlatforms(text, links) {
  const combined = `${text}\n${links.join('\n')}`.toLowerCase();
  return ['tiktok', 'instagram', 'facebook', 'youtube'].filter(platform => combined.includes(platform));
}

function strongestPlatform(metrics) {
  const ranked = Object.entries(metrics).sort((a, b) => metricWeight(b[1]) - metricWeight(a[1]));
  if (!ranked.length || metricWeight(ranked[0][1]) === 0) return '';
  return ranked[0][0];
}

function flag(text, terms) {
  const source = String(text || '').toLowerCase();
  return terms.some(term => source.includes(term)) ? 'Yes' : 'No';
}

function extractGender(text) {
  const source = String(text || '').toLowerCase();
  if (/\b(woman|female|girl|mom|mother|wife|grandma)\b/.test(source)) return 'Female';
  if (/\b(man|male|dad|father|husband|grandpa)\b/.test(source)) return 'Male';
  return '';
}

function extractYears(text) {
  const match = String(text || '').match(/(\d{1,2})\+?\s*(?:years?|yrs?)\s+(?:of\s+)?(?:ugc|content|creator|experience)/i);
  return match ? match[1] : '';
}

function extractLocation(text) {
  const lines = String(text || '').split(/\n+/).map(line => line.trim()).filter(Boolean);
  const statePattern = /\b(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|IA|ID|IL|IN|KS|KY|LA|MA|MD|ME|MI|MN|MO|MS|MT|NC|ND|NE|NH|NJ|NM|NV|NY|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VA|VT|WA|WI|WV|WY)\b/;
  const locationLine = lines.find(line =>
    /\b(based in|located in|from|detroit|chicago|orlando|toronto|vancouver|canada|united states|usa|u\.s\.)\b/i.test(line) ||
    /[A-Z][a-z]+,\s*[A-Z]{2}\b/.test(line) ||
    statePattern.test(line)
  );
  return locationLine ? locationLine.slice(0, 80) : '';
}

function extractCreatorName(text, title, fallback) {
  const lines = String(text || '').split(/\n+/).map(line => line.trim()).filter(line => line.length >= 2 && line.length <= 60);
  const candidate = lines.find(line =>
    !/@|https?:|portfolio|email|ugc creator|content creator/i.test(line) &&
    /[a-z]/i.test(line)
  );
  return candidate || title || fallback;
}

function extractCategories(text) {
  const source = String(text || '').toLowerCase();
  return CATEGORY_KEYWORDS.filter(keyword => source.includes(keyword)).join(' | ');
}

function extractBrands(text) {
  const source = String(text || '');
  const brandSection = source.match(/(?:brands?|worked with|trusted by|collaborated with)[:\s-]+(.{0,240})/i);
  if (!brandSection) return '';
  return brandSection[1]
    .split(/\n|,|\||\u2022|\u00b7/)
    .map(item => item.trim())
    .filter(item => item.length >= 2 && item.length <= 40)
    .slice(0, 12)
    .join(' | ');
}

function summarize(text) {
  const sentences = String(text || '')
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map(sentence => sentence.trim())
    .filter(sentence => sentence.length >= 30 && !/@|https?:/.test(sentence));
  return (sentences[0] || String(text || '').replace(/\s+/g, ' ').trim()).slice(0, 260);
}

function confidenceScore(enriched) {
  let score = 0;
  if (enriched.scrape_status === 'ok') score += 25;
  if (enriched.creator_name) score += 10;
  if (enriched.location) score += 10;
  if (enriched.portfolio_email || enriched.email) score += 10;
  if (enriched.social_links) score += 10;
  if (enriched.creator_categories) score += 10;
  if (enriched.years_experience) score += 10;
  if (enriched.brands_worked_with) score += 10;
  if (enriched.strongest_platform) score += 15;
  return Math.min(score, 100);
}

function buildOutreach(enriched) {
  const email = enriched.email || enriched.portfolio_email || '';
  const name = enriched.creator_name || enriched.reddit_username;
  const category = String(enriched.creator_categories || '').split(' | ')[0] || 'UGC';
  const personal = enriched.portfolio_summary || enriched.comment_snippet || `I saw your ${category} creator profile.`;
  if (email) {
    return {
      reddit_username: enriched.reddit_username,
      email,
      reddit_contact_url: enriched.reddit_comment_url,
      portfolio_url: enriched.resolved_portfolio_url || enriched.portfolio_url,
      outreach_subject: `UGC collaboration opportunity`,
      outreach_body: [
        `Hi ${name},`,
        '',
        `I came across your portfolio and liked this angle: ${personal.slice(0, 180)}`,
        '',
        'We are putting together a UGC creator shortlist for upcoming brand collaborations and I think your content could be a strong fit.',
        '',
        'Would you be open to hearing a little more about the opportunity?',
        '',
        'Best,'
      ].join('\n'),
      outreach_status: 'Draft Ready',
      personalization_note: personal.slice(0, 220),
      review_reason: enriched.review_reason
    };
  }

  return {
    reddit_username: enriched.reddit_username,
    email: '',
    reddit_contact_url: enriched.reddit_comment_url,
    portfolio_url: enriched.resolved_portfolio_url || enriched.portfolio_url,
    outreach_subject: '',
    outreach_body: '',
    outreach_status: enriched.reddit_comment_url ? 'Reddit DM Needed' : 'Missing Contact',
    personalization_note: personal.slice(0, 220),
    review_reason: enriched.review_reason || 'No email available'
  };
}

export async function enrichRow(row) {
  const startedAt = new Date().toISOString();
  const portfolioUrl = cleanUrl(row.portfolio_url);
  const base = {
    ...row,
    portfolio_url: portfolioUrl,
    portfolio_url_type: row.portfolio_url_type || classifyPortfolioUrl(portfolioUrl),
    resolved_portfolio_url: '',
    page_title: '',
    creator_name: '',
    location: '',
    portfolio_email: '',
    social_links: '',
    platforms_found: '',
    claimed_tiktok_metrics: '',
    claimed_instagram_metrics: '',
    claimed_facebook_metrics: '',
    strongest_platform: '',
    parent_flag: 'No',
    kids_flag: 'No',
    gender_flag: '',
    creator_categories: '',
    brands_worked_with: '',
    years_experience: '',
    portfolio_summary: '',
    confidence_score: 0,
    needs_review: 'No',
    review_reason: '',
    scrape_status: 'skipped'
  };

  if (!isUsablePortfolioUrl(portfolioUrl)) {
    return {
      enriched: {
        ...base,
        portfolio_email: row.email || '',
        needs_review: 'Yes',
        review_reason: row.email || row.reddit_comment_url ? 'Contact-only row; no usable portfolio URL' : 'No usable portfolio URL',
        scrape_status: 'skipped'
      },
      log: { timestamp: startedAt, reddit_username: row.reddit_username, portfolio_url: portfolioUrl, status: 'skipped', message: row.email || row.reddit_comment_url ? 'Contact-only row; no usable portfolio URL' : 'No usable portfolio URL' }
    };
  }

  try {
    const fetched = await fetchWithTimeout(portfolioUrl);
    const links = uniqueList([...extractHrefLinks(fetched.html), ...(fetched.html.match(URL_RE) || [])]);
    const text = htmlToText(fetched.html);
    const title = extractTitle(fetched.html);
    const emails = uniqueList([...(text.match(EMAIL_RE) || []), ...(fetched.html.match(EMAIL_RE) || [])]).map(email => email.toLowerCase());
    const socialLinks = uniqueList([...(text.match(SOCIAL_RE) || []), ...links.filter(link => SOCIAL_URL_RE.test(link))]);

    const metrics = {
      tiktok: extractMetricClaims(text, 'tiktok'),
      instagram: extractMetricClaims(text, 'instagram'),
      facebook: extractMetricClaims(text, 'facebook')
    };

    const textTooSmall = text.length < 120;
    const dynamicCanva = base.portfolio_url_type === 'canva_design' && textTooSmall;
    const enriched = {
      ...base,
      resolved_portfolio_url: fetched.finalUrl,
      portfolio_url_type: classifyPortfolioUrl(fetched.finalUrl) === 'none' ? base.portfolio_url_type : classifyPortfolioUrl(fetched.finalUrl),
      page_title: title,
      creator_name: extractCreatorName(text, title, row.reddit_username),
      location: extractLocation(text),
      portfolio_email: emails[0] || '',
      social_links: socialLinks.join(' | '),
      platforms_found: extractPlatforms(text, socialLinks).join(' | '),
      claimed_tiktok_metrics: metrics.tiktok,
      claimed_instagram_metrics: metrics.instagram,
      claimed_facebook_metrics: metrics.facebook,
      strongest_platform: strongestPlatform(metrics),
      parent_flag: flag(text, ['mom', 'mother', 'parent', 'dad', 'father', 'family']),
      kids_flag: flag(text, ['kids', 'children', 'child', 'baby', 'toddler', 'son', 'daughter']),
      gender_flag: extractGender(text),
      creator_categories: extractCategories(text),
      brands_worked_with: extractBrands(text),
      years_experience: extractYears(text),
      portfolio_summary: summarize(text),
      needs_review: (!fetched.ok || textTooSmall || dynamicCanva) ? 'Yes' : 'No',
      review_reason: !fetched.ok
        ? `HTTP ${fetched.status}`
        : dynamicCanva
          ? 'Canva design page returned little visible text'
          : textTooSmall
            ? 'Portfolio returned little visible text'
            : '',
      scrape_status: fetched.ok ? 'ok' : 'http_error'
    };
    enriched.confidence_score = confidenceScore(enriched);

    return {
      enriched,
      log: {
        timestamp: startedAt,
        reddit_username: row.reddit_username,
        portfolio_url: portfolioUrl,
        status: enriched.scrape_status,
        message: enriched.review_reason || `Extracted ${text.length} text chars and ${links.length} links`
      }
    };
  } catch (error) {
    return {
      enriched: {
        ...base,
        portfolio_email: row.email || '',
        needs_review: 'Yes',
        review_reason: error.name === 'AbortError' ? 'Fetch timed out' : error.message,
        scrape_status: 'needs_review'
      },
      log: {
        timestamp: startedAt,
        reddit_username: row.reddit_username,
        portfolio_url: portfolioUrl,
        status: 'needs_review',
        message: error.name === 'AbortError' ? 'Fetch timed out' : error.message
      }
    };
  }
}

export async function runPoc(args) {
  if (!args.input) throw new Error(`Missing --input\n\n${usage()}`);

  const csvText = await readFile(args.input, 'utf8');
  const rows = rowsToObjects(parseCsv(csvText));
  const selectedRows = args.limit > 0 ? rows.slice(0, args.limit) : rows;
  const enrichedRows = [];
  const outreachRows = [];
  const logRows = [];

  await mkdir(args.outDir, { recursive: true });

  for (let index = 0; index < selectedRows.length; index += 1) {
    const row = selectedRows[index];
    console.log(`[${index + 1}/${selectedRows.length}] ${row.reddit_username} ${row.portfolio_url || '(no portfolio)'}`);
    const { enriched, log } = await enrichRow(row);
    enrichedRows.push(enriched);
    outreachRows.push(buildOutreach(enriched));
    logRows.push(log);
  }

  await writeFile(path.join(args.outDir, 'portfolio_enrichment.csv'), toCsv(ENRICHMENT_HEADERS, enrichedRows), 'utf8');
  await writeFile(path.join(args.outDir, 'outreach_drafts.csv'), toCsv(OUTREACH_HEADERS, outreachRows), 'utf8');
  await writeFile(path.join(args.outDir, 'run_log.csv'), toCsv(RUN_LOG_HEADERS, logRows), 'utf8');

  return {
    outDir: args.outDir,
    selectedRows: selectedRows.length,
    enrichmentPath: path.join(args.outDir, 'portfolio_enrichment.csv'),
    outreachPath: path.join(args.outDir, 'outreach_drafts.csv'),
    runLogPath: path.join(args.outDir, 'run_log.csv')
  };
}

export function parseStagingCsv(text) {
  return rowsToObjects(parseCsv(text));
}

export function classifyUrlForPoc(url) {
  return classifyPortfolioUrl(url);
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    console.log(usage());
    return;
  }
  const result = await runPoc(args);
  console.log(`\nDone. Wrote ${result.selectedRows} enriched rows to ${result.outDir}`);
}

if (globalThis.process?.argv?.[1] && import.meta.url === new URL(globalThis.process.argv[1], 'file:///').href) {
  main().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
