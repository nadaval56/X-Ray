// סרגל קרינה: "לוח שנה של קרינה". בוחרים בדיקה, ולוח השנה מתמלא בימים של קרינת רקע טבעית
// ששווים לה — יחידה שכל ילד מבין. 12 שורות של חודשים, משבצת לכל יום.
// קנה המידה לא משתנה לעולם: בדיקה שקטנה מיום ממלאת חלק ממשבצת אחת, ובדיקה שגדולה משנה
// "גולשת" — כשהלוח מתמלא, מופיע תוך כדי מילוי לוח של שנה נוספת, באותו גודל.
// הערכים וההשוואה לימים לקוחים כמו שהם מהמקור (content/doses.json), לא מחושבים כאן.

import { h, prefersReducedMotion } from '../lib/dom.js';

const MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const YEAR = 365;
const DAYS_PER_SEC = 450; // קצב המילוי
const fmt = (v) => (v < 0.01 ? v.toFixed(3) : String(v));
const ORDINAL = ['הראשונה', 'השנייה', 'השלישית'];

function yearGrid(k) {
  const cells = [];
  const title = h('p', { class: 'rr-year-title', text: 'שנה אחת' });
  const months = MONTHS.map((m, i) => h('div', { class: 'rr-month' },
    h('span', { class: 'rr-month-name', text: m }),
    h('span', { class: 'rr-days' }, Array.from({ length: MONTH_DAYS[i] }, () => {
      const c = h('span', { class: 'rr-day' });
      cells.push(c);
      return c;
    }))));
  const el = h('div', { class: 'rr-year' }, title, ...months);
  return { el, cells, title, k };
}

/**
 * @param {object} opts
 * @param {Array<{id:string,label:string,short:string,mSv:number,lessThan?:boolean,background:string,days:number}>} opts.items
 * @param {{label:string,url:string}} opts.source
 */
export function createRadiationRuler({ items, source }) {
  let anim = 0;

  const picks = items.map((it) => h('button', {
    type: 'button', class: 'rr-pick', 'aria-pressed': 'false',
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
    picks.forEach((b, k) => b.setAttribute('aria-pressed', String(items[k] === it)));
    headline.replaceChildren(
      h('strong', { text: it.label }), ': ',
      it.lessThan ? '' : 'כמו ', h('strong', { class: 'rr-hl-days', text: it.background }), ' של קרינה טבעית.');
    sub.textContent = `${it.lessThan ? 'פחות מ-' : 'בערך '}${fmt(it.mSv)} מיליסיוורט (מיליסיוורט: היחידה שבה מודדים קרינה).`
      + (it.days < 1 ? ' בלוח זה פחות משמינית של משבצת אחת.' : '');

    cancelAnimationFrame(anim);
    const years = [yearGrid(0)];
    calendars.replaceChildren(years[0].el);

    // פחות מיום: חלק יחסי של המשבצת הראשונה, לפי השעות (3 שעות = שמינית)
    if (it.days < 1) {
      const c = years[0].cells[0];
      c.classList.add('is-partial');
      c.style.setProperty('--part', `${it.days * 100}%`);
      return;
    }

    const total = Math.round(it.days);
    let done = 0;
    // מדליק את משבצת מספר i; כשהשנה מתמלאת — מוסיף לוח של שנה חדשה, באותו גודל
    const light = (i) => {
      const y = Math.floor(i / YEAR);
      if (!years[y]) {
        years[y] = yearGrid(y);
        years.forEach((g) => { g.title.textContent = `השנה ${ORDINAL[g.k] ?? g.k + 1}`; });
        calendars.append(years[y].el);
        years[y].el.classList.add('is-new');
      }
      years[y].cells[i % YEAR].classList.add('is-on');
    };
    if (prefersReducedMotion()) {
      for (; done < total; done++) light(done);
      return;
    }
    const t0 = performance.now();
    const step = (t) => {
      const n = Math.min(total, Math.ceil(((t - t0) / 1000) * DAYS_PER_SEC));
      for (; done < n; done++) light(done);
      if (done < total) anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
  }

  select(items.find((it) => it.id === 'chest') ?? items[0]);
  return { el };
}
