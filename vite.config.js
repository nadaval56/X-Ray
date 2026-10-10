import { defineConfig } from 'vite';
import { resolve, basename } from 'node:path';
import { readFileSync } from 'node:fs';
import { SITE, NAV, DISCLAIMER } from './src/config.js';

const PAGES = ['index', 'cases', 'case', 'physics', 'lab', 'lab-attenuation', 'history', 'about'];

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

        return html
          .replace('<!-- @head -->', partial('head'))
          .replace('<!-- @header -->', partial('header').replace('{{NAV}}', navItems))
          .replace('<!-- @footer -->', partial('footer').replace('{{DISCLAIMER}}', DISCLAIMER))
          .replaceAll('{{SITE_NAME}}', SITE.name)
          .replaceAll('{{SITE_TAGLINE}}', SITE.tagline);
      },
    },
  };
}

export default defineConfig({
  // נתיבים יחסיים: עובד גם ב-GitHub Pages תחת תת-תיקייה וגם בדומיין עצמאי
  base: './',
  plugins: [layoutPartials()],
  build: {
    rollupOptions: {
      input: Object.fromEntries(PAGES.map((p) => [p, resolve(import.meta.dirname, `${p}.html`)])),
    },
  },
});
