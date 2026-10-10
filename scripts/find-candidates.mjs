// מחפש מועמדים לתמונות ומפיק רשימה לבדיקה ידנית. לא מוריד תמונות ולא מוסיף מקרים —
// הבחירה הסופית תמיד ידנית.
//
// שימוש:
//   node scripts/find-candidates.mjs --source openi   --query "coin esophagus child" [--n 20]
//   node scripts/find-candidates.mjs --source commons --query "x-ray hand" [--n 20]
//
// פלט: assets-src/candidates/<source>-<query>.md (טבלה לקריאה) ו-.json (לשימוש בסקריפטים).
//
// Open-i (NLM): https://openi.nlm.nih.gov/services
//   שימו לב: השאילתה מתאימה כביטוי שלם. "esophageal coin" מחזיר תוצאות, "coin esophagus" לא.
//   it=x — צילומי רנטגן בלבד; m/n — טווח תוצאות (מבוסס 1).
//   הרישיון ש-Open-i מדווח (ccLicense) הוא רמז בלבד. לכל מועמד אנחנו מושכים את ה-XML של המאמר
//   מ-PMC (efetch) וקוראים את תגית <license> שהמוציא לאור כתב — זה האימות.
// Wikimedia Commons: API של MediaWiki, extmetadata של כל קובץ (LicenseShortName / LicenseUrl).
//   Commons דורש User-Agent מזהה.

import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ROOT } from './lib/load-cases.mjs';

const UA = 'XRayEduSite/0.1 (educational; https://github.com/nadaval56/X-Ray)';
const OUT_DIR = resolve(ROOT, 'assets-src/candidates');

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith('--') ? [...acc, [a.slice(2), all[i + 1]]] : acc), []),
);
const source = args.source;
const query = args.query;
const n = Number(args.n ?? 20);
if (!['openi', 'commons'].includes(source) || !query) {
  console.error('שימוש: --source openi|commons --query "..." [--n 20]');
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function get(url, as = 'json') {
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (res.ok) return as === 'json' ? res.json() : res.text();
    if (res.status !== 429 && res.status < 500) throw new Error(`${res.status} ${url}`);
    await sleep(2000 * 2 ** attempt);
  }
  throw new Error(`נכשל אחרי ניסיונות חוזרים: ${url}`);
}

// ממיר כתובת/שם רישיון למזהה הקנוני שלנו. מחזיר null אם לא מותר.
export function normalizeLicense(text = '') {
  const t = text.toLowerCase();
  if (/(^|[^a-z])(nc|nd|sa)([^a-z]|$)|noncommercial|noderiv|sharealike|by-nc|by-nd|by-sa/.test(t)) return null;
  const v = t.match(/(?:by[/\s-]?)(\d\.\d)/);
  if (/creativecommons\.org\/licenses\/by\/|^cc[\s-]by[\s-]\d/.test(t) && v) return `CC-BY-${v[1]}`;
  if (/publicdomain\/zero|^cc0/.test(t)) return 'CC0-1.0';
  if (/^public domain|^pd([-\s]|$)/.test(t)) return 'Public-Domain';
  return null;
}

async function verifyPmcLicense(pmcid) {
  const xml = await get(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pmc&id=${pmcid}`, 'text');
  const lic = xml.match(/<license\b[^>]*>[\s\S]*?<\/license>/)?.[0] ?? '';
  const href = lic.match(/xlink:href="([^"]+)"/)?.[1] ?? lic.match(/https?:\/\/creativecommons\.org\/[^\s"<]+/)?.[0] ?? '';
  const statement = lic.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return { licenseUrl: href, statement, license: normalizeLicense(href) };
}

async function openi() {
  const url = `https://openi.nlm.nih.gov/api/search?query=${encodeURIComponent(query)}&it=x&m=1&n=${n}`;
  const data = await get(url);
  const out = [];
  for (const item of data.list ?? []) {
    let verified = { license: null, licenseUrl: '', statement: '' };
    try {
      verified = await verifyPmcLicense(item.pmcid);
    } catch (e) {
      verified.statement = `שגיאה באימות: ${e.message}`;
    }
    out.push({
      source: 'openi',
      title: item.title?.replace(/<[^>]+>/g, ''),
      caption: item.image?.caption?.replace(/<[^>]+>/g, ''),
      authors: item.authors,
      journal: `${item.journal_title} (${item.journal_date?.year ?? '?'})`,
      articleType: item.articleType,
      pageUrl: `https://pmc.ncbi.nlm.nih.gov/articles/PMC${item.pmcid}/`,
      imageUrl: `https://openi.nlm.nih.gov${item.imgLarge}`,
      thumbUrl: `https://openi.nlm.nih.gov${item.imgGrid150}`,
      figureId: item.image?.id,
      claimedLicense: item.ccLicense,
      ...verified,
      allowed: Boolean(verified.license),
    });
    await sleep(350); // NCBI: עד 3 בקשות בשנייה בלי מפתח
  }
  return out;
}

async function commons() {
  // "Category:..." — כל הקבצים בקטגוריה (מדויק יותר מחיפוש חופשי, שמחזיר הרבה סריקות ספרים).
  // אחרת — חיפוש טקסט, מוגבל לתמונות (filetype:bitmap).
  const isCategory = /^category:/i.test(query);
  const params = new URLSearchParams({
    action: 'query', format: 'json', prop: 'imageinfo',
    iiprop: 'url|size|extmetadata', iiurlwidth: '400',
    ...(isCategory
      ? { generator: 'categorymembers', gcmtitle: query, gcmtype: 'file', gcmlimit: String(n) }
      : { generator: 'search', gsrnamespace: '6', gsrsearch: `${query} filetype:bitmap`, gsrlimit: String(n) }),
  });
  const data = await get(`https://commons.wikimedia.org/w/api.php?${params}`);
  return Object.values(data.query?.pages ?? {}).map((p) => {
    const ii = p.imageinfo?.[0] ?? {};
    const m = ii.extmetadata ?? {};
    const val = (k) => (m[k]?.value ?? '').replace(/<[^>]+>/g, '').trim();
    const short = val('LicenseShortName');
    const license = normalizeLicense(val('LicenseUrl') || short) ?? normalizeLicense(short);
    return {
      source: 'commons',
      title: p.title.replace(/^File:/, ''),
      caption: val('ImageDescription').slice(0, 300),
      authors: val('Artist'),
      journal: val('Credit').slice(0, 200),
      pageUrl: ii.descriptionurl,
      imageUrl: ii.url,
      thumbUrl: ii.thumburl,
      size: `${ii.width}×${ii.height}`,
      claimedLicense: short,
      licenseUrl: val('LicenseUrl'),
      statement: val('UsageTerms'),
      license,
      allowed: Boolean(license),
    };
  });
}

const results = source === 'openi' ? await openi() : await commons();
const slug = `${source}-${query.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(resolve(OUT_DIR, `${slug}.json`), JSON.stringify(results, null, 2));

const md = [
  `# מועמדים: ${source} — "${query}"`,
  '',
  `נוצר ${new Date().toISOString().slice(0, 10)}. ${results.filter((r) => r.allowed).length} מתוך ${results.length} עם רישיון מותר.`,
  'הרישיון אומת מול המקור (PMC: תגית license במאמר; Commons: מטא-דאטה של הקובץ). עדיין לבדוק בעין לפני שימוש.',
  '',
  '| # | מותר | רישיון | כותרת | כיתוב | קישור |',
  '|---|---|---|---|---|---|',
  ...results.map((r, i) =>
    `| ${i + 1} | ${r.allowed ? '✓' : '✗'} | ${r.license ?? r.claimedLicense ?? '?'} | ${(r.title ?? '').replace(/\|/g, '/')} | ${(r.caption ?? '').slice(0, 140).replace(/\|/g, '/')} | [מקור](${r.pageUrl}) · [תמונה](${r.imageUrl}) |`),
  '',
].join('\n');
writeFileSync(resolve(OUT_DIR, `${slug}.md`), md);
console.log(`✓ ${results.length} מועמדים (${results.filter((r) => r.allowed).length} מותרים) → assets-src/candidates/${slug}.md`);
