// קרדיט לתמונה — נוצר אוטומטית מאובייקט source. משמש בעמוד מקרה ובעמוד אודות.
import { h } from '../lib/dom.js';

const LICENSE_NAMES = {
  'CC0-1.0': 'CC0 (ויתור על זכויות)',
  'Public-Domain': 'נחלת הכלל',
  'US-Gov-PD': 'נחלת הכלל (יצירה של ממשלת ארה"ב)',
  'Owner-Permission': 'באישור בעל הזכויות',
};
const licenseName = (id) => LICENSE_NAMES[id] ?? id.replace(/^CC-BY-/, 'CC BY ');

export function creditItem(image, { context } = {}) {
  const src = image.source;
  return h('li', {},
    h('div', {},
      h('a', { class: 'credit-title', href: src.url, rel: 'noopener', target: '_blank', text: src.title }),
      context && h('span', { class: 'muted', text: ` — ${context}` }),
    ),
    h('dl', {},
      h('dt', { text: 'יוצר' }), h('dd', { text: src.author }),
      h('dt', { text: 'רישיון' }),
      h('dd', {}, h('a', { href: src.licenseUrl, rel: 'noopener license', target: '_blank', text: licenseName(src.license) })),
      h('dt', { text: 'שינויים' }), h('dd', { text: src.modifications }),
      h('dt', { text: 'אומת' }), h('dd', {}, h('time', { datetime: src.verifiedOn, text: src.verifiedOn })),
    ),
  );
}

export const creditsList = (items) => h('ul', { class: 'credits-list' }, items);
