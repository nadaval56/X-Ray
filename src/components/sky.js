// "השמיים ברנטגן": כרטיס לתמונה מצ'נדרה, רשת ארכיון, וכרטיס "השמש ברנטגן" (שטף קרני X מ-GOES,
// דרך האתר "השמש היום"). הנתונים מ-content/sky.json ומ-content/sun.json — שום דבר לא נטען מבחוץ.

import { h, s } from '../lib/dom.js';

const dateFmt = new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });
export const skyDate = (iso) => dateFmt.format(new Date(`${iso}T12:00:00Z`));
const imgUrl = (file) => `${import.meta.env.BASE_URL}images/${file}`;

/** כרטיס מלא לתמונה אחת */
export function skyFeature(item) {
  const { image: im } = item;
  return h('article', { class: 'sky-feature', id: `sky-${item.id}`, 'aria-labelledby': `sky-t-${item.id}` },
    h('figure', { class: 'sky-figure' },
      h('img', { src: imgUrl(im.file), alt: im.alt, width: im.width, height: im.height, decoding: 'async' }),
      h('figcaption', { dir: 'ltr' }, 'X-ray: ', h('a', { href: im.source.url, rel: 'noopener', target: '_blank', text: im.source.author }))),
    h('div', { class: 'sky-body' },
      h('p', { class: 'sky-date' }, "צ'נדרה · ", h('time', { datetime: item.date, text: skyDate(item.date) })),
      h('h3', { id: `sky-t-${item.id}`, text: item.title }),
      h('p', { class: 'sky-object', dir: 'ltr', lang: 'en', text: item.object }),
      item.text.map((p) => h('p', { text: p })),
      h('dl', { class: 'sky-facts' }, item.facts.map(([k, v]) => h('div', {}, h('dt', { text: k }), h('dd', { text: v })))),
      h('a', { class: 'sky-more', href: item.page, rel: 'noopener', target: '_blank' }, "לעמוד התמונה באתר צ'נדרה (באנגלית)")));
}

/** רשת הארכיון. onPick(item) נקרא בלחיצה. */
export function skyArchive(items, onPick) {
  const buttons = new Map();
  const list = h('ul', { class: 'sky-archive' }, items.map((it) => {
    const b = h('button', { type: 'button', class: 'sky-tile', 'aria-pressed': 'false', onclick: () => onPick(it) },
      h('img', { src: imgUrl(it.image.file), alt: '', loading: 'lazy', decoding: 'async' }),
      h('span', { class: 'sky-tile-title', text: it.title }),
      h('span', { class: 'sky-tile-date', text: skyDate(it.date) }));
    buttons.set(it.id, b);
    return h('li', {}, b);
  }));
  const select = (id) => buttons.forEach((b, key) => b.setAttribute('aria-pressed', String(key === id)));
  return { el: list, select };
}

// ---------- השמש ברנטגן ----------

// סולם ההתפרצויות של NOAA: כל אות חזקה פי 10 מהקודמת (וואט למ"ר, בתחום 0.1–0.8 ננומטר)
const LETTERS = ['A', 'B', 'C', 'M', 'X'];
const MOOD = { A: 'שקט', B: 'שקט', C: 'פעילות קלה', M: 'התפרצות בינונית', X: 'התפרצות חזקה' };
export function flareClass(flux) {
  const e = Math.min(4, Math.max(0, Math.floor(Math.log10(flux)) + 8));
  const letter = LETTERS[e];
  return { letter, label: `${letter}${(flux / 10 ** (e - 8)).toFixed(1)}`, mood: MOOD[letter] };
}

const STALE_DAYS = 3;

/** @param {{latest:{t,flux,class}, peak:{t,flux}, series:Array<[string,number]>}} sun */
export function sunCard(sun, { compact = false } = {}) {
  const t = new Date(sun.latest.t);
  const stale = (Date.now() - t.getTime()) / 864e5 > STALE_DAYS;
  const now = flareClass(sun.latest.flux);
  const peak = flareClass(sun.peak.flux);
  const when = new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jerusalem' }).format(t);

  const head = h('div', { class: 'sun-now' },
    h('span', { class: `sun-badge sun-${now.letter}`, text: now.label }),
    h('div', {},
      h('p', { class: 'sun-mood', text: now.mood }),
      h('p', { class: 'muted' }, 'מדידה מ-', h('time', { datetime: sun.latest.t, text: when }), ' (שעון ישראל)'),
      !compact && h('p', { class: 'muted', text: `השיא ביממה שלפני כן: ${peak.label}` })));

  if (compact) return h('div', { class: 'sun-card is-compact' }, head);

  return h('figure', { class: 'sun-card' },
    head,
    stale
      ? h('p', { class: 'sun-stale' }, 'הנתונים כאן לא עודכנו כמה ימים. את המדידה העדכנית אפשר לראות באתר „השמש היום“.')
      : sunChart(sun.series),
    h('figcaption', {},
      h('a', { href: 'https://sunspots.co.il/#xray-title', rel: 'noopener', target: '_blank' }, 'לגרף החי באתר „השמש היום“'),
      ' · נתונים: לוויין GOES של NOAA'));
}

// גרף לוגריתמי של היממה האחרונה, עם פסים לאותיות A–X
function sunChart(series) {
  const W = 420, H = 230, L = 26, R = 6, T = 8, B = 26;
  const t0 = Date.parse(series[0][0]), t1 = Date.parse(series.at(-1)[0]);
  const x = (t) => L + ((Date.parse(t) - t0) / Math.max(1, t1 - t0)) * (W - L - R);
  const y = (f) => T + ((-3 - Math.log10(f)) / 5) * (H - T - B); // 10⁻⁸ (למטה) עד 10⁻³ (למעלה)
  const bands = LETTERS.map((l, i) => {
    const top = y(10 ** (i - 7)), bot = y(10 ** (i - 8));
    return s('g', { class: `sun-band sun-${l}` },
      s('rect', { x: L, y: top, width: W - L - R, height: bot - top }),
      s('text', { x: L - 8, y: (top + bot) / 2 + 5, 'text-anchor': 'end' }, document.createTextNode(l)));
  });
  const d = series.map(([t, f], i) => `${i ? 'L' : 'M'}${x(t).toFixed(1)},${y(f).toFixed(1)}`).join('');
  const hoursAgo = (t1 - t0) / 36e5;
  const ticks = [0, 0.5, 1].map((p) => s('text', { x: L + p * (W - L - R), y: H - 6, 'text-anchor': p === 0 ? 'start' : p === 1 ? 'end' : 'middle' },
    document.createTextNode(p === 1 ? 'המדידה האחרונה' : `לפני ${Math.round(hoursAgo * (1 - p))} שעות`)));
  return s('svg', { class: 'sun-chart', viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'גרף של עוצמת קרני X מהשמש ביממה האחרונה, בסולם A עד X', direction: 'ltr' },
    ...bands, s('path', { class: 'sun-line', d }), ...ticks);
}
