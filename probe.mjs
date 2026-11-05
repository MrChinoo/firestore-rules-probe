#!/usr/bin/env node
// Tests deployed Firestore rules by listing collections through the live REST API.
// Run it only against projects you own or are authorized to test.
import { fileURLToPath } from 'node:url';

export function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) args[argv[i].slice(2)] = argv[i + 1];
  }
  const list = (value) => (value || '').split(',').map((s) => s.trim()).filter(Boolean);
  return { project: args.project, key: args.key, idToken: args['id-token'], denied: list(args.denied), open: list(args.public) };
}

// A collection that must stay private is a finding only when the API lets us list it.
export function isFinding(expectation, status) {
  return expectation === 'denied' && status === 200;
}

// Returns field names from the response, never their values.
export function fieldNames(body) {
  const first = body.documents?.[0]?.fields;
  return first ? Object.keys(first).slice(0, 12) : [];
}

async function probe({ project, key, idToken }, collection) {
  const url = `https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents/`
    + `${encodeURIComponent(collection)}?key=${key}&pageSize=1`;
  const headers = idToken ? { Authorization: `Bearer ${idToken}` } : {};
  try {
    const response = await fetch(url, { headers });
    const body = await response.json().catch(() => ({}));
    return { status: response.status, fields: fieldNames(body) };
  } catch (error) {
    return { status: `network error: ${error.message}`, fields: [] };
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (!options.project || !options.key || (!options.denied.length && !options.open.length)) {
    console.error('Usage: probe.mjs --project <id> --key <webApiKey> --denied a,b [--public c,d] [--id-token <token>]');
    process.exitCode = 1;
    return;
  }
  console.log(`Project ${options.project}, ${options.idToken ? 'signed-in user' : 'anonymous'}\n`);
  let findings = 0;
  for (const [expectation, collections] of [['denied', options.denied], ['public', options.open]]) {
    for (const collection of collections) {
      const { status, fields } = await probe(options, collection);
      const finding = isFinding(expectation, status);
      if (finding) findings++;
      const detail = finding ? `  EXPOSED${fields.length ? ` (fields: ${fields.join(', ')})` : ''}` : '';
      console.log(`${String(status).padEnd(5)} ${expectation.padEnd(7)} ${collection}${detail}`);
    }
  }
  console.log(findings ? `\n${findings} private collection(s) exposed.` : '\nNo private collection was listable.');
  process.exitCode = findings ? 2 : 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await main();
