import { defineConfig } from 'vite';
import { resolve, basename } from 'node:path';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { SITE, NAV, LAB, DISCLAIMER } from './src/config.js';

const PAGES = [
  'index', 'cases', 'case', 'physics', 'history', 'about',
  'lab', 'lab-thickness', 'lab-scanner', 'lab-window', 'lab-shadows', 'lab-dose', 'privacy', 'accessibility', '404',
];

const SHARE = JSON.parse(readFileSync(resolve(import.meta.dirname, 'content/share.json'), 'utf8'));
const CASES = readdirSync(resolve(import.meta.dirname, 'content/cases'))
  .filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(readFileSync(resolve(import.meta.dirname, 'content/cases', f), 'utf8')));

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

        return html
          .replace('<!-- @labnav -->', labNav(page))
          .replace('<!-- @labpager -->', labPager(page))
          .replace('<!-- @head -->', `${partial('head')}\n    ${og}`)
          .replace('<!-- @header -->', partial('header').replace('{{NAV}}', navItems))
          .replace('<!-- @footer -->', partial('footer').replace('{{DISCLAIMER}}', DISCLAIMER))
          .replaceAll('{{SITE_NAME}}', SITE.name)
          .replaceAll('{{SITE_TAGLINE}}', SITE.tagline);
      },
    },
  };
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
        next();
      });
    },
    generateBundle(_, bundle) {
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
        const html = String(base.source)
          .replace('<html lang="he" dir="rtl">', `<html lang="he" dir="rtl" data-case-id="${attr(c.id)}">`)
          .replace(/<title>.*?<\/title>/, `<title>${attr(title)}</title>`)
          .replace(/<meta name="description" content="[^"]*"/, `<meta name="description" content="${attr(description)}"`)
          .replace(/<!--og-->[\s\S]*?<!--\/og-->/, og);
        this.emitFile({ type: 'asset', fileName: `case-${c.id}.html`, source: html });
      }

      const urls = [
        ...PAGES.filter((p) => p !== 'case' && p !== '404').map((p) => (p === 'index' ? '' : `${p}.html`)),
        ...CASES.map((c) => `case-${c.id}.html`),
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
