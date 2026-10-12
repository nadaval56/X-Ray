// קרדיטים מרוכזים — נוצרים מנתוני המקרים ומקובץ החומרים, בלי רשימה ידנית.
import { h } from '../lib/dom.js';
import { cases, materials, media, caseUrl, imageUrl, mediaUrl } from '../data/content.js';
import { creditItem, creditsList } from '../components/credits.js';
import { initLessonNav } from '../lib/lesson-nav.js';
import doses from '../../content/doses.json';
import timeline from '../../content/timeline.json';

const images = [
  ...cases.flatMap((c) => c.images.map((im) => ({ c, im }))),
  ...media.map((im) => ({ im })),
  ...timeline.events.filter((e) => e.image).map((e) => ({ im: e.image, where: `ציר הזמן: ${e.title}` })),
];
document.getElementById('credits-images').append(
  images.length
    ? creditsList(images.map(({ c, im, where }) => {
      const li = creditItem(im, { context: where });
      if (c) li.append(h('div', { class: 'muted' }, 'מופיעה במקרה: ', h('a', { href: caseUrl(c.id), text: c.title })));
      // תמונה ממוזערת, כדי שיהיה ברור לאיזו תמונה הקרדיט שייך
      li.prepend(h('img', { class: 'credit-thumb', src: c ? imageUrl(im.file) : mediaUrl(im.file), alt: '', loading: 'lazy', decoding: 'async' }));
      li.classList.add('has-thumb');
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
  h('li', {},
    h('a', { class: 'credit-title', href: doses.source.url, rel: 'noopener', target: '_blank', text: doses.source.label }),
    h('div', { text: 'מנות הקרינה בסרגל הקרינה.' }),
  ),
  ...timeline.events.flatMap((e) => [e.source, ...(e.moreSources ?? [])].map((src) => h('li', {},
    h('a', { class: 'credit-title', href: src.url, rel: 'noopener', target: '_blank', text: src.label }),
    h('div', { text: `ציר הזמן: ${e.title} (${e.date})` }),
  ))),
]));

initLessonNav(document.querySelector('.lesson-nav'));
