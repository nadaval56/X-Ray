// מייצר את תמונות השיתוף (Open Graph, ‏1200×630) לכל עמוד ולכל מקרה, אל public/og/.
// לא חלק מה-build: מריצים ידנית אחרי שינוי בתוכן, ומכניסים את התמונות ל-git.
//
//   npm run build && npx vite preview --port 4173 &
//   node scripts/make-og.mjs [http://localhost:4173]
//
// נדרש Playwright (לא תלות של הפרויקט). אם הוא לא מותקן מקומית, אפשר להצביע עליו:
//   PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs CHROMIUM_PATH=/path/to/chrome node scripts/make-og.mjs
//
// הטקסטים מ-content/share.json. הקרדיט לכל צילום נלקח מאובייקט ה-source שלו בתוכן.

import { readFileSync, readdirSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = (process.argv[2] || 'http://localhost:4173').replace(/\/$/, '');
const OUT = resolve(ROOT, 'public/og');
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');

const json = (p) => JSON.parse(readFileSync(resolve(ROOT, p), 'utf8'));
const share = json('content/share.json');
const cases = readdirSync(resolve(ROOT, 'content/cases')).filter((f) => f.endsWith('.json')).map((f) => json(`content/cases/${f}`));
const categories = json('content/categories.json');
const catLabel = (id) => categories[id] ?? '';

// קרדיט לכל קובץ תמונה, מכל מקורות התוכן
const credits = {};
const credit = (s) => (s ? [s.author, s.license].filter(Boolean).join(' · ') : '');
for (const c of cases) for (const im of c.images) credits[`cases/${im.file}`] = credit(im.source);
for (const e of json('content/timeline.json').events ?? []) if (e.image) credits[e.image.file] = credit(e.image.source);
for (const m of Object.values(json('content/media.json')).flat().filter((m) => m && m.file)) credits[m.file] = credit(m.source);
const scanner = json('content/scanner.json');
const SCANNER_CREDIT = `COMPASS-XP (UCL) · ${scanner.source.license}`;

const b64 = (p) => readFileSync(p).toString('base64');
const fontCss = ['hebrew', 'latin'].map((s) => `@font-face{font-family:H;font-weight:100 900;src:url(data:font/woff2;base64,${
  b64(resolve(ROOT, `node_modules/@fontsource-variable/heebo/files/heebo-${s}-wght-normal.woff2`))}) format('woff2');}`).join('');
const imgUri = (file) => `data:image/webp;base64,${b64(resolve(ROOT, 'public/images', file))}`;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

const LOGO = `<svg viewBox="0 0 64 64" width="54" height="54"><rect x="2" y="2" width="60" height="60" rx="14" fill="none" stroke="#7cc7dc" stroke-width="3"/><g fill="none" stroke="#7cc7dc" stroke-linecap="round"><path d="M32 11v42" stroke-width="4"/><path stroke-width="3.4" d="M29.5 17C21 16 14 19.5 13.5 27.5M34.5 17C43 16 50 19.5 50.5 27.5M29.5 26.5C20 25.5 12.5 30 13 39M34.5 26.5C44 25.5 51.5 30 51 39M29.5 36C21 36 15 40.5 16.5 48M34.5 36C43 36 49 40.5 47.5 48"/></g></svg>`;

// כרטיס: טקסט מימין, תמונה משמאל. בלי תמונה — הטקסט לכל הרוחב, עם סמל גדול.
function card({ kicker, title, text, visual, credit: cr, fit = 'contain' }) {
  const panel = visual
    ? `<div class="panel"><img src="${visual}" style="object-fit:${fit}">${cr ? `<span class="cr">${esc(cr)}</span>` : ''}</div>`
    : `<div class="panel empty">${LOGO.replace(/width="54" height="54"/, 'width="300" height="300"')}</div>`;
  return `<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8"><style>${fontCss}
*{box-sizing:border-box;margin:0}
body{width:1200px;height:630px;overflow:hidden;font-family:H,sans-serif;color:#e8ecf1;
 background:radial-gradient(ellipse at 80% 0%,#18232d,#0b0e12 70%);display:flex;gap:44px;padding:48px 56px}
.txt{flex:1;display:flex;flex-direction:column;min-width:0}
.brand{display:flex;align-items:center;gap:16px;font-size:34px;font-weight:700}
.brand small{display:block;font-size:20px;font-weight:400;color:#8a95a3}
.kicker{margin-top:auto;font-size:24px;font-weight:600;color:#7cc7dc;letter-spacing:.02em}
h1{margin-top:10px;font-size:62px;line-height:1.1;font-weight:800}
p{margin-top:18px;font-size:28px;line-height:1.45;color:#b4bdc8;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden}
.bar{margin-top:auto;height:6px;width:120px;border-radius:3px;background:#7cc7dc}
.panel{position:relative;flex:none;width:520px;height:534px;border-radius:22px;overflow:hidden;background:#05070a;border:2px solid #262e39;display:grid;place-items:center}
.panel img{width:100%;height:100%}
.panel.empty{background:radial-gradient(circle,#132028,#05070a 75%)}
.cr{position:absolute;inset-inline:0;bottom:0;padding:8px 14px;font-size:15px;color:#c8d0d9;background:linear-gradient(transparent,rgba(0,0,0,.85));direction:ltr;text-align:left;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
</style></head><body>
<div class="txt"><div class="brand">${LOGO}<div>רנטגן<small>לראות מבפנים</small></div></div>
<div class="kicker">${esc(kicker || '')}</div><h1>${esc(title)}</h1><p>${esc(text)}</p><div class="bar" style="margin-top:28px"></div></div>
${panel}</body></html>`;
}

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
mkdirSync(OUT, { recursive: true });

async function shot(spec) {
  // width: רוחב חלון אופציונלי — כלי רחב צולם בחלון צר כדי שייכנס יפה למסגרת המרובעת
  const p = await browser.newPage({ viewport: { width: spec.width ?? 1280, height: 900 }, deviceScaleFactor: 2, reducedMotion: 'no-preference' });
  await p.goto(`${BASE}/${spec.page}`);
  await p.waitForTimeout(600);
  if (spec.load) {
    // סורק: מהירות מרבית, ומחכים שהמגש יגיע לאמצע המכונה
    await p.locator('.xm-speed-input').fill('4');
    await p.getByRole('button', { name: new RegExp(`^${spec.load}`) }).click();
    await p.waitForFunction(() => {
      const t = document.querySelector('.xm-tray');
      return t && parseFloat(t.style.left) < 41;
    }, null, { timeout: 15000 });
    await p.locator('.xm-power').click();
  }
  if (spec.keys) {
    const t = p.locator(spec.keys.selector).first();
    await t.focus();
    for (const k of spec.keys.press) { await p.keyboard.press(k); await p.waitForTimeout(80); }
    await p.waitForTimeout(300);
  }
  if (spec.page.startsWith('lab-dose')) { await p.getByRole('button', { name: /^גב תחתון/ }).click(); await p.waitForTimeout(900); }
  const el = p.locator(spec.selector).first();
  await el.evaluate((n) => n.scrollIntoView({ block: 'center' }));
  const buf = await el.screenshot();
  await p.close();
  return `data:image/png;base64,${buf.toString('base64')}`;
}

async function render(name, html) {
  const p = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await p.setContent(html, { waitUntil: 'load' });
  await p.waitForTimeout(150);
  await p.screenshot({ path: resolve(OUT, `${name}.jpg`), type: 'jpeg', quality: 84 });
  await p.close();
  console.log('✓', `og/${name}.jpg`);
}

const KICKERS = { lab: 'מעבדה', privacy: 'פרטיות', accessibility: 'נגישות', history: 'היסטוריה', physics: 'איך זה עובד', cases: 'מקרים' };
for (const [page, s] of Object.entries(share.pages)) {
  let visual = null, cr = '', fit = 'contain';
  if (s.image) { visual = imgUri(s.image); cr = credits[s.image] ?? ''; }
  if (s.screenshot) {
    visual = await shot(s.screenshot);
    fit = 'contain';
    if (s.screenshot.page.includes('scanner')) cr = SCANNER_CREDIT;
  }
  await render(page, card({ kicker: KICKERS[page] ?? (page.startsWith('lab-') ? 'מעבדה' : ''), title: s.title, text: s.text, visual, credit: cr, fit }));
}
for (const c of cases) {
  const im = c.images.find((i) => i.role === 'main');
  await render(`case-${c.id}`, card({
    kicker: `מקרה לחקירה · ${catLabel(c.category)}`,
    title: c.title,
    text: share.case.text.replace('{question}', c.question),
    visual: imgUri(`cases/${im.file}`),
    credit: credit(im.source),
  }));
}
await browser.close();
