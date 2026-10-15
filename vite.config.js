import { defineConfig } from 'vite';
import { resolve, basename } from 'node:path';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { SITE, NAV, LAB, DISCLAIMER, SISTER_SITES, SISTER_INVITE } from './src/config.js';
import * as prerender from './scripts/lib/prerender.mjs';

const PAGES = [
  'index', 'cases', 'case', 'physics', 'history', 'sky', 'sky-object', 'about',
  'lab', 'lab-thickness', 'lab-scanner', 'lab-window', 'lab-shadows', 'lab-dose', 'privacy', 'accessibility', '404',
];

const SHARE = JSON.parse(readFileSync(resolve(import.meta.dirname, 'content/share.json'), 'utf8'));
const CASES = readdirSync(resolve(import.meta.dirname, 'content/cases'))
  .filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(readFileSync(resolve(import.meta.dirname, 'content/cases', f), 'utf8')));

const readContent = (f) => JSON.parse(readFileSync(resolve(import.meta.dirname, 'content', f), 'utf8'));
const CATEGORIES = readContent('categories.json');

// מכניס HTML סטטי לתוך אלמנט ריק (או אלמנט שיש בו רק <noscript>) בעמוד שנבנה
function fill(html, open, inner) {
  const re = new RegExp(`(${open.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})(?:\\s*<noscript>[\\s\\S]*?</noscript>\\s*)?(</div>)`);
  if (!re.test(html)) throw new Error(`prerender: לא נמצא ${open}`);
  return html.replace(re, (_, a, b) => `${a}${inner}${b}`);
}

const attr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const pageUrl = (page) => `${SITE.url}${page === 'index' ? '' : `${page}.html`}`;

// תגיות שיתוף ו-canonical לעמוד. התמונה נוצרת מראש ב-scripts/make-og.mjs אל public/og/.
function metaTags({ page, title, description, ogTitle, ogText, imageAlt }) {
  const img = existsSync(resolve(import.meta.dirname, `public/og/${page}.jpg`)) ? `${SITE.url}og/${page}.jpg` : `${SITE.url}og/index.jpg`;
  return [
    '<!--og-->',
    page === '404' ? '' : `<link rel="canonical" href="${pageUrl(page)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:locale" content="he_IL" />`,
    `<meta property="og:site_name" content="${attr(SITE.name)}" />`,
    `<meta property="og:title" content="${attr(ogTitle || title)}" />`,
    `<meta property="og:description" content="${attr(ogText || description)}" />`,
    `<meta property="og:url" content="${pageUrl(page)}" />`,
    `<meta property="og:image" content="${img}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${attr(imageAlt || ogTitle || title)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    '<!--/og-->',
  ].filter(Boolean).join('\n    ');
}

const partial = (name) => readFileSync(resolve(import.meta.dirname, 'src/partials', `${name}.html`), 'utf8');

// מחליף <!-- @header --> / <!-- @footer --> בכל עמוד ב-partial המשותף,
// מסמן את פריט הניווט הפעיל וממלא את שם האתר מקובץ ההגדרות.
function layoutPartials() {
  return {
    name: 'layout-partials',
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        const page = basename(ctx.filename, '.html');
        const navItems = NAV.map((item) => {
          const current = item.pages.includes(page) ? ' aria-current="page"' : '';
          return `<li><a href="./${item.href}"${current}>${item.label}</a></li>`;
        }).join('\n          ');

        const title = html.match(/<title>(.*?)<\/title>/)?.[1]?.replaceAll('{{SITE_NAME}}', SITE.name) ?? SITE.name;
        const description = html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? '';
        const share = SHARE.pages[page === 'case' ? 'cases' : page] ?? {};
        const og = metaTags({ page: page === 'case' ? 'cases' : page, title, description, ogTitle: share.title, ogText: share.text });

        const isTool = LAB.some((t) => t.page === page);
        return html
          // בעמודי כלי המעבדה: תווית "מעבדה" מעל הכותרת, כמו בשאר העמודים
          .replace('<header class="page-head">', isTool ? '<header class="page-head">\n          <span class="eyebrow">מעבדה</span>' : '<header class="page-head">')
          .replace('<!-- @labnav -->', labNav(page))
          .replace('<!-- @labpager -->', labPager(page))
          .replace('<!-- @head -->', `${partial('head')}\n    ${og}`)
          .replace('<!-- @header -->', partial('header').replace('{{NAV}}', navItems))
          .replace('<!-- @footer -->', partial('footer').replace('{{DISCLAIMER}}', DISCLAIMER).replace('{{SISTER}}', sisterNav()))
          .replaceAll('{{SITE_NAME}}', SITE.name)
          .replaceAll('{{SITE_TAGLINE}}', SITE.tagline);
      },
    },
  };
}

// פס "עוד אתרים שלי". הרשימה כתובה פעמיים: העותק השני קיים רק כדי שהגלילה האיטית
// (public/sister.js) תהיה רציפה; הוא מוסתר מקורא מסך ומהמקלדת, וב"בלי תנועה" מוסתר לגמרי.
function sisterNav() {
  const items = (clone) => SISTER_SITES.map(([emoji, url, text, tail]) => {
    const tab = clone ? ' tabindex="-1"' : '';
    const icon = `<span aria-hidden="true">${emoji}</span>`;
    if (tail) return `<span class="sister-item">${icon} <a href="${url}" rel="noopener"${tab}>${attr(text)}</a>${attr(tail)}</span>`;
    const cls = url === SISTER_INVITE ? ' class="sister-invite"' : '';
    return `<a href="${url}" rel="noopener"${cls}${tab}>${icon} ${attr(text)}</a>`;
  }).join('');
  return `<nav class="sister" aria-label="האתרים הנוספים שלי"><span class="sister-lbl">עוד אתרים שלי</span>`
    + `<div class="sister-view"><div class="sister-track"><div class="sister-set">${items(false)}</div>`
    + `<div class="sister-set sister-clone" aria-hidden="true">${items(true)}</div></div></div></nav>`
    + `<script src="./sister.js" defer vite-ignore></script>`;
}

// תפריט המעבדה בראש כל עמוד כלי: כל הכלים, עם הכלי הנוכחי מסומן
function labNav(page) {
  const items = LAB.map(({ page: p, label }) =>
    `<li><a href="./${p}.html"${p === page ? ' aria-current="page"' : ''}>${label}</a></li>`).join('');
  return `<nav class="subnav" aria-label="כלי המעבדה"><ul><li><a href="./lab.html">כל המעבדה</a></li>${items}</ul></nav>`;
}

// מעבר לכלי הקודם / הבא בתחתית עמוד כלי
function labPager(page) {
  const i = LAB.findIndex((t) => t.page === page);
  if (i < 0) return '';
  const prev = LAB[i - 1], next = LAB[i + 1];
  const link = (t, dir) => (t
    ? `<a class="pager-link pager-${dir}" href="./${t.page}.html"><span class="pager-dir">${dir === 'prev' ? 'הכלי הקודם' : 'הכלי הבא'}</span><span class="pager-title">${t.label}</span></a>`
    : '<span></span>');
  return `<nav class="pager" aria-label="מעבר בין כלי המעבדה">${link(prev, 'prev')}${link(next, 'next')}</nav>`;
}

// sitemap.xml + robots.txt בזמן build. עמודי המקרים נוצרים מרשימת קובצי ה-JSON.
function seoFiles() {
  return {
    name: 'seo-files',
    enforce: 'post', // אחרי שעמודי ה-HTML כבר בחבילה
    // בשרת הפיתוח אין עמודים סטטיים למקרים: case-<id>.html מוגש כ-case.html?id=<id>
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const m = req.url?.match(/^\/case-([\w-]+)\.html(\?.*)?$/);
        if (m) req.url = `/case.html?id=${m[1]}`;
        // עמודי "השמיים ברנטגן" נבנים רק ב-build (npm run build && npm run preview)
        if (/^\/sky-(?!object)[\w-]+\.html/.test(req.url ?? '')) req.url = '/sky-object.html';
        next();
      });
    },
    generateBundle(_, bundle) {
      // תוכן סטטי לעמודים שנבנים ב-JS (scripts/lib/prerender.mjs) — ה-JS מחליף אותו כשהוא רץ
      const page = (name, fn) => { bundle[name].source = fn(String(bundle[name].source)); };
      const sorted = [...CASES].sort((a, b) => a.difficulty - b.difficulty || a.title.localeCompare(b.title, 'he'));
      page('cases.html', (html) => fill(html, '<div id="cases-root">', prerender.casesList(sorted, CATEGORIES)));
      page('history.html', (html) => fill(html, '<div id="timeline-root">', prerender.timeline(readContent('timeline.json'))));
      page('sky.html', (html) => {
        const sky = readContent('sky.json');
        html = fill(html, '<div id="sky-feature">', prerender.skyFeature(sky));
        html = fill(html, '<div id="sky-archive">', prerender.skyArchive(sky));
        return fill(html, '<div id="sun-root">', prerender.sunSummary(readContent('sun.json')));
      });

      // עמוד סטטי לכל מקרה: עותק של case.html עם כותרת, תיאור ותמונת שיתוף משלו.
      // כך קישור למקרה שמשותף ברשת מציג את המקרה עצמו, ולא כרטיס כללי.
      const base = bundle['case.html'];
      for (const c of CASES) {
        const title = `${c.title} · ${SITE.name}`;
        const description = `${c.question} ${c.story}`.slice(0, 158);
        const main = c.images.find((im) => im.role === 'main');
        const og = metaTags({
          page: `case-${c.id}`, title, description,
          ogTitle: c.title, ogText: SHARE.case.text.replace('{question}', c.question),
          imageAlt: main?.alt,
        });
        let html = String(base.source)
          .replace('<html lang="he" dir="rtl">', `<html lang="he" dir="rtl" data-case-id="${attr(c.id)}">`)
          .replace(/<title>.*?<\/title>/, `<title>${attr(title)}</title>`)
          .replace(/<meta name="description" content="[^"]*"/, `<meta name="description" content="${attr(description)}"`)
          .replace(/<!--og-->[\s\S]*?<!--\/og-->/, og);
        html = fill(html, '<div class="container" id="case-root">', prerender.caseBody(c, CATEGORIES));
        this.emitFile({ type: 'asset', fileName: `case-${c.id}.html`, source: html });
      }

      // עמוד סטטי לכל תמונה ב"השמיים ברנטגן": sky-<id>.html
      const skyItems = [...readContent('sky.json').items].sort((a, b) => b.date.localeCompare(a.date));
      const skyBase = bundle['sky-object.html'];
      for (const it of skyItems) {
        const title = `${it.title} · השמיים ברנטגן · ${SITE.name}`;
        const description = `${it.object}: ${it.text[0]}`.slice(0, 158);
        const og = metaTags({ page: `sky-${it.id}`, title, description, ogTitle: it.title, ogText: description, imageAlt: it.image.alt });
        let html = String(skyBase.source)
          .replace(/<title>.*?<\/title>/, `<title>${attr(title)}</title>`)
          .replace(/<meta name="description" content="[^"]*"/, `<meta name="description" content="${attr(description)}"`)
          .replace(/<!--og-->[\s\S]*?<!--\/og-->/, og);
        html = fill(html, '<div class="container sky-object-page" id="sky-object-root">', prerender.skyObject(it, skyItems));
        this.emitFile({ type: 'asset', fileName: `sky-${it.id}.html`, source: html });
      }
      delete bundle['sky-object.html'];

      const urls = [
        ...PAGES.filter((p) => p !== 'case' && p !== 'sky-object' && p !== '404').map((p) => (p === 'index' ? '' : `${p}.html`)),
        ...CASES.map((c) => `case-${c.id}.html`),
        ...skyItems.map((it) => `sky-${it.id}.html`),
      ]
        .map((u) => `  <url><loc>${SITE.url}${u}</loc></url>`)
        .join('\n');
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n` });
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: `User-agent: *\nAllow: /\nSitemap: ${SITE.url}sitemap.xml\n` });
    },
  };
}

export default defineConfig({
  // נתיבים יחסיים: עובד גם ב-GitHub Pages תחת תת-תיקייה וגם בדומיין עצמאי
  base: './',
  plugins: [layoutPartials(), seoFiles()],
  build: {
    rollupOptions: {
      input: Object.fromEntries(PAGES.map((p) => [p, resolve(import.meta.dirname, `${p}.html`)])),
    },
  },
});
