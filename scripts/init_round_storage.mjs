#!/usr/bin/env node
import { mkdir, writeFile, access } from 'node:fs/promises';
import path from 'node:path';

function usage() {
  return [
    'Usage:',
    '  node scripts/init_round_storage.mjs --round 1 --slug reddit_ugc_paid',
    '',
    'Optional:',
    '  --date YYYY-MM-DD',
    '  --base data'
  ].join('\n');
}

function parseArgs(argv) {
  const args = { base: 'data', date: new Date().toISOString().slice(0, 10), round: '', slug: '' };
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    const value = argv[i + 1];
    if (key === '--round') {
      args.round = value;
      i += 1;
    } else if (key === '--slug') {
      args.slug = value;
      i += 1;
    } else if (key === '--date') {
      args.date = value;
      i += 1;
    } else if (key === '--base') {
      args.base = value;
      i += 1;
    } else if (key === '--help' || key === '-h') {
      args.help = true;
    }
  }
  return args;
}

function sanitizeSlug(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function padRound(value) {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) throw new Error('Round must be a positive number.');
  return String(number).padStart(3, '0');
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function writeIfMissing(filePath, content) {
  if (await exists(filePath)) return;
  await writeFile(filePath, content, 'utf8');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(usage());
    return;
  }
  if (!args.round || !args.slug) throw new Error(`Missing --round or --slug\n\n${usage()}`);

  const round = padRound(args.round);
  const slug = sanitizeSlug(args.slug);
  const folderName = `Round_${round}_${args.date}_${slug}`;
  const root = path.resolve(args.base, folderName);
  const folders = [
    'raw_reddit',
    'staging',
    'sheets',
    'enrichment/run_001',
    'review',
    'outreach',
    'archive'
  ];

  await mkdir(root, { recursive: true });
  for (const folder of folders) {
    await mkdir(path.join(root, folder), { recursive: true });
  }

  await writeIfMissing(path.join(root, 'README.md'), [
    `# ${folderName}`,
    '',
    'Private runtime folder for one UGC creator sourcing round.',
    '',
    'Do not commit this folder to GitHub.',
    '',
    '## Checklist',
    '',
    '- [ ] Save Reddit JSON files in `raw_reddit/`',
    '- [ ] Export staging CSV into `staging/`',
    '- [ ] Link the Google Sheet in `sheets/`',
    '- [ ] Save enrichment outputs in `enrichment/run_001/`',
    '- [ ] QA questionable rows in `review/`',
    '- [ ] Move approved drafts/lists into `outreach/`',
    ''
  ].join('\n'));

  await writeIfMissing(path.join(root, 'enrichment', 'run_001', 'run_manifest.csv'), [
    'field,value',
    `round,${round}`,
    `date,${args.date}`,
    `slug,${slug}`,
    'batch_limit,10',
    'source_platform,reddit',
    'status,created',
    ''
  ].join('\n'));

  await writeIfMissing(path.join(root, 'review', 'qa_notes.md'), [
    '# QA Notes',
    '',
    'Record hallucination risks, extraction failures, and approval decisions here.',
    ''
  ].join('\n'));

  console.log(root);
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
