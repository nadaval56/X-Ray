import { defineConfig } from 'vite';
import { resolve, basename } from 'node:path';
import { readFileSync, readdirSync } from 'node:fs';
import { SITE, NAV, DISCLAIMER } from './src/config.js';

const PAGES = [
  'index', 'cases', 'case', 'physics', 'history', 'about',
  'lab', 'lab-attenuation', 'lab-density', 'lab-window', 'lab-shadows', 'lab-dose', '404',
];

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

        const title = html.match(/<title>(.*?)<\/title>/)?.[1] ?? SITE.name;
        const description = html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? '';
        const og = [
          `<meta property="og:type" content="website" />`,
          `<meta property="og:locale" content="he_IL" />`,
          `<meta property="og:site_name" content="{{SITE_NAME}}" />`,
          `<meta property="og:title" content="${title}" />`,
          `<meta property="og:description" content="${description}" />`,
          `<meta property="og:url" content="${SITE.url}${page === 'index' ? '' : `${page}.html`}" />`,
        ].join('\n    ');

        return html
          .replace('<!-- @head -->', `${partial('head')}\n    ${og}`)
          .replace('<!-- @header -->', partial('header').replace('{{NAV}}', navItems))
          .replace('<!-- @footer -->', partial('footer').replace('{{DISCLAIMER}}', DISCLAIMER))
          .replaceAll('{{SITE_NAME}}', SITE.name)
          .replaceAll('{{SITE_TAGLINE}}', SITE.tagline);
      },
    },
  };
}

// sitemap.xml + robots.txt בזמן build. עמודי המקרים נוצרים מרשימת קובצי ה-JSON.
function seoFiles() {
  return {
    name: 'seo-files',
    generateBundle() {
      const cases = readdirSync(resolve(import.meta.dirname, 'content/cases'))
        .filter((f) => f.endsWith('.json'))
        .map((f) => `case.html?id=${basename(f, '.json')}`);
      const urls = [...PAGES.filter((p) => p !== 'case' && p !== '404').map((p) => (p === 'index' ? '' : `${p}.html`)), ...cases]
        .map((u) => `  <url><loc>${SITE.url}${u.replace(/&/g, '&amp;')}</loc></url>`)
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
