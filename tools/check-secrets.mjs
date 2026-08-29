// Fail if a secret reached the client bundle.  node tools/check-secrets.mjs
//
// Acceptance criterion 13. The first version of this check grepped the build
// for whatever `SUPABASE_SERVICE_KEY` happened to contain — which passed for
// the wrong reason when the keys were swapped in .env.local and the *secret*
// key was sitting in NEXT_PUBLIC_SUPABASE_ANON_KEY. A check that depends on
// the thing being checked is not a check.
//
// So this looks for the SHAPE of a secret, wherever it came from.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const DIR = ".next/static";

// Patterns that must never appear in anything served to a browser.
const FORBIDDEN = [
  { name: "Supabase secret key", re: /\bsb_secret_[A-Za-z0-9_-]{8,}/ },
  { name: "Supabase service_role JWT", re: /"role"\s*:\s*"service_role"/ },
  { name: "Google API key", re: /\bAIza[0-9A-Za-z_-]{35}\b/ },
  { name: "private key block", re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
];

function* files(dir) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const entry of entries) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) yield* files(path);
    else yield path;
  }
}

const found = [];
let scanned = 0;

for (const file of files(DIR)) {
  if (!/\.(js|mjs|css|json|map|txt|html)$/.test(file)) continue;
  scanned += 1;
  const text = readFileSync(file, "utf8");
  for (const { name, re } of FORBIDDEN) {
    if (re.test(text)) found.push(`${name} in ${file}`);
  }
}

if (scanned === 0) {
  console.error(`No files scanned under ${DIR}. Run \`npm run build\` first.`);
  process.exit(1);
}

if (found.length > 0) {
  console.error(`FAIL — ${found.length} secret(s) in the client bundle:\n`);
  for (const f of found) console.error(`  ${f}`);
  console.error("\nA shipped secret is a total compromise. Rotate it, then fix the leak.");
  process.exit(1);
}

console.log(`ok — ${scanned} client files scanned, no secrets found`);
