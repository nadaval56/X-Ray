// "השמש ברנטגן": מושך את שטף קרני X של השמש מהאתר "השמש היום" (sunspots.co.il),
// שכבר אוסף אותו מ-NOAA (לוויין GOES). כך לא מושכים את אותם נתונים פעמיים.
//
// רץ בזמן ה-build ב-GitHub Actions (פעם ביום, ב-.github/workflows/pages.yml), ולא בדפדפן:
// האתר לא טוען שום דבר מצד שלישי, והגולש מקבל רק קובץ שלנו.
//
//   node scripts/fetch-sun.mjs
//
// אם המשיכה נכשלת — הקובץ הקיים נשאר כמו שהוא וה-build ממשיך. העמוד מציג את תאריך המדידה,
// ומסתיר את הגרף כשהנתונים ישנים מדי.

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, 'content/sun.json');
const URL = 'https://media.sunspots.co.il/today.json';

async function main() {
  const res = await fetch(URL, { headers: { 'User-Agent': 'XRayEduSite/0.1 (+https://github.com/nadaval56/X-Ray)' }, signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const { xray, generated_at: generatedAt } = await res.json();
  const series = (xray?.series ?? []).filter(([t, f]) => typeof t === 'string' && f > 0);
  if (!xray?.latest?.class || series.length < 10) throw new Error('אין נתוני קרני X בקובץ');
  const peak = series.reduce((a, b) => (b[1] > a[1] ? b : a));
  const out = {
    _comment: 'נוצר אוטומטית ב-scripts/fetch-sun.mjs — לא לערוך ידנית.',
    fetchedAt: new Date().toISOString(),
    generatedAt,
    latest: xray.latest,
    peak: { t: peak[0], flux: peak[1] },
    series: series.map(([t, f]) => [t, Number(f.toPrecision(4))]),
  };
  writeFileSync(OUT, `${JSON.stringify(out)}\n`);
  console.log(`✓ content/sun.json: ${xray.latest.class} (${xray.latest.t}), ${series.length} מדידות`);
}

main().catch((err) => {
  let prev = '';
  try { prev = JSON.parse(readFileSync(OUT, 'utf8')).latest?.t ?? ''; } catch { /* אין קובץ קודם */ }
  console.warn(`⚠ לא הצלחתי למשוך את נתוני השמש (${err.message}). נשאר הקובץ הקודם${prev ? ` (${prev})` : ''}.`);
});
