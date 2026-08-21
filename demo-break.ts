/**
 * Demo helper: deliberately break the primary flow so Kane catches a real
 * regression, then let the loop repair it. `--restore` puts it back.
 *
 *   bun demo-break.ts            break it
 *   bun demo-break.ts --restore  undo
 */
import { readFileSync, writeFileSync } from 'node:fs';

const FILE = 'app/index.html';
const GOOD = '<button id="b" type="submit">Run Verification</button>';
const BAD = '<button id="b" type="submit">Submit</button>';

const restore = process.argv.includes('--restore');
const html = readFileSync(FILE, 'utf8');
const [from, to] = restore ? [BAD, GOOD] : [GOOD, BAD];

if (!html.includes(from)) {
  console.log(`nothing to do — ${FILE} is already ${restore ? 'restored' : 'broken'}`);
  process.exit(0);
}
writeFileSync(FILE, html.replace(from, to));
console.log(restore ? 'restored: button reads "Run Verification"' : 'broken: button now reads "Submit" — Kane step 2 will fail');
