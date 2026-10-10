// טעינת קובצי מקרים ונתוני עזר — משותף ל-validate-cases ול-check-licenses.
import { readdirSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
export const CASES_DIR = resolve(ROOT, 'content/cases');
export const IMAGES_DIR = resolve(ROOT, 'public/images/cases');

export const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));

export function loadCases() {
  return readdirSync(CASES_DIR)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((file) => {
      const path = resolve(CASES_DIR, file);
      try {
        return { file, data: readJson(path) };
      } catch (err) {
        return { file, error: `JSON לא תקין: ${err.message}` };
      }
    });
}

// ריכוז שגיאות והדפסה אחידה. יציאה עם קוד 1 אם יש שגיאה כלשהי, כדי שה-build ייכשל.
export function report(title, errors, okMessage) {
  if (errors.length) {
    console.error(`\n✗ ${title}: ${errors.length} שגיאות\n`);
    for (const e of errors) console.error(`  • ${e}`);
    console.error('');
    process.exit(1);
  }
  console.log(`✓ ${okMessage}`);
}
