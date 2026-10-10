// קרדיטים מרוכזים — נוצרים מנתוני המקרים ומקובץ החומרים, בלי רשימה ידנית.
import { h } from '../lib/dom.js';
import { cases, materials, caseUrl } from '../data/content.js';
import { creditItem, creditsList } from '../components/credits.js';

const images = cases.flatMap((c) => c.images.map((im) => ({ c, im })));
document.getElementById('credits-images').append(
  images.length
    ? creditsList(images.map(({ c, im }) => {
      const li = creditItem(im);
      li.append(h('div', { class: 'muted' }, 'מופיעה במקרה: ', h('a', { href: caseUrl(c.id), text: c.title })));
      return li;
    }))
    : h('p', { class: 'muted', text: 'עדיין אין תמונות.' }),
);

const src = materials.source;
document.getElementById('credits-data').append(creditsList([
  h('li', {},
    h('a', { class: 'credit-title', href: src.url, rel: 'noopener', target: '_blank', text: src.title }),
    h('div', {}, `מקדמי הבליעה בסימולטור (${materials.energyKeV} keV). אומת: `, h('time', { datetime: src.verifiedOn, text: src.verifiedOn })),
    h('div', { class: 'muted', text: 'National Institute of Standards and Technology — נתונים של ממשלת ארה"ב.' }),
  ),
]));
