// סרגל קרינה: "לוח שנה של קרינה". בוחרים בדיקה, ולוח השנה מתמלא בימים של קרינת רקע טבעית
// ששווים לה — יחידה שכל ילד מבין. 12 שורות של חודשים, משבצת לכל יום; מעל שנה — לוח שני.
// בדיקה שקטנה מיום אחד מוצגת כיום אחד מוגדל, עם משבצת לכל שעה.
// הערכים וההשוואה לימים לקוחים כמו שהם מהמקור (content/doses.json), לא מחושבים כאן.

import { h, prefersReducedMotion } from '../lib/dom.js';

const MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const fmt = (v) => (v < 0.01 ? v.toFixed(3) : String(v));

function yearGrid(label) {
  const cells = [];
  const months = MONTHS.map((m, k) => h('div', { class: 'rr-month' },
    h('span', { class: 'rr-month-name', text: m }),
    h('span', { class: 'rr-days' }, Array.from({ length: MONTH_DAYS[k] }, () => {
      const c = h('span', { class: 'rr-day' });
      cells.push(c);
      return c;
    }))));
  const el = h('div', { class: 'rr-year' }, h('p', { class: 'rr-year-title', text: label }), ...months);
  return { el, cells };
}

function dayGrid() {
  const cells = Array.from({ length: 24 }, () => h('span', { class: 'rr-day rr-hour' }));
  const el = h('div', { class: 'rr-year rr-oneday' },
    h('p', { class: 'rr-year-title', text: 'יום אחד, משבצת לכל שעה' }),
    h('span', { class: 'rr-hours' }, cells));
  return { el, cells };
}

/**
 * @param {object} opts
 * @param {Array<{id:string,label:string,short:string,mSv:number,lessThan?:boolean,background:string,days:number,isBackground?:boolean,note?:string}>} opts.items
 * @param {{label:string,url:string}} opts.source
 */
export function createRadiationRuler({ items, source }) {
  let current = items.find((it) => it.id === 'chest') ?? items[0];
  let anim = 0;

  const picks = items.map((it) => h('button', {
    type: 'button', class: `rr-pick${it.isBackground ? ' is-ref' : ''}`, 'aria-pressed': 'false',
    onclick: () => select(it),
  }, h('span', { class: 'rr-pick-name', text: it.short }), h('span', { class: 'rr-pick-days', text: it.background })));

  const headline = h('p', { class: 'rr-headline', 'aria-live': 'polite' });
  const sub = h('p', { class: 'rr-sub muted' });
  const calendars = h('div', { class: 'rr-calendars' });

  const el = h('figure', { class: 'rr' },
    h('div', { class: 'rr-picks', role: 'group', 'aria-label': 'בחירת בדיקה' }, picks),
    headline, sub, calendars,
    h('figcaption', {},
      'כל משבצת בלוח היא יום אחד של קרינה טבעית, זו שכולנו מקבלים מהאדמה, מהאוויר ומהחלל. ',
      h('a', { href: source.url, rel: 'noopener', target: '_blank' }, 'מקור: ', source.label)),
  );

  function select(it) {
    current = it;
    picks.forEach((b, k) => b.setAttribute('aria-pressed', String(items[k] === it)));
    const value = `${it.lessThan ? 'פחות מ-' : 'בערך '}${fmt(it.mSv)} מיליסיוורט`;
    headline.replaceChildren(
      h('strong', { text: it.label }), ': ',
      it.isBackground ? 'לוח שנה מלא.' : h('span', {},
        it.lessThan ? '' : 'כמו ', h('strong', { class: 'rr-hl-days', text: it.background }), ' של קרינה טבעית.'));
    sub.textContent = it.isBackground
      ? `${value} (מיליסיוורט: היחידה שבה מודדים קרינה). ${it.note ?? ''}`.trim()
      : `${value} (מיליסיוורט: היחידה שבה מודדים קרינה).`;

    // בונים את הלוחות: שעות (פחות מיום), שנה אחת, או שתיים
    let grids;
    let filled;
    if (it.days < 1) {
      grids = [dayGrid()];
      filled = Math.round(it.days * 24);
    } else {
      const years = Math.max(1, Math.ceil(it.days / 365));
      grids = Array.from({ length: years }, (_, k) => yearGrid(years > 1 ? `שנה ${k === 0 ? 'ראשונה' : 'שנייה'}` : 'שנה אחת'));
      filled = Math.round(it.days);
    }
    calendars.replaceChildren(...grids.map((g) => g.el));
    calendars.classList.toggle('is-two', grids.length > 1);
    const cells = grids.flatMap((g) => g.cells);
    if (it.lessThan && it.days < 1) cells[filled - 1]?.classList.add('is-partial');

    cancelAnimationFrame(anim);
    if (prefersReducedMotion() || filled <= 1) {
      cells.slice(0, filled).forEach((c) => c.classList.add('is-on'));
      return;
    }
    // מילוי הדרגתי: כ-0.8 שניות, בלי קשר לכמות
    const t0 = performance.now();
    let done = 0;
    const step = (t) => {
      const n = Math.min(filled, Math.ceil(((t - t0) / 800) * filled));
      for (; done < n; done++) cells[done].classList.add('is-on');
      if (done < filled) anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
  }

  select(current);
  return { el };
}
