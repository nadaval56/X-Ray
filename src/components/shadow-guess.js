// נחשו את הצורה מהצללים: גוף תלת-ממדי נסתר, ורואים רק את הצל שלו מכיוון אחד.
// אם הניחוש מתאים לצל אבל לא לגוף — מוסיפים צילום מכיוון נוסף. מלמד למה מצלמים בשני מנחים.
//
// הצללים מוגדרים כצורות SVG בתיבה 100×100. "front" = מלפנים, "side" = מהצד, "top" = מלמעלה.

import { h, s } from '../lib/dom.js';

const SQUARE = { tag: 'rect', x: 20, y: 20, width: 60, height: 60 };
const CIRCLE = { tag: 'circle', cx: 50, cy: 50, r: 32 };
const TALL = { tag: 'rect', x: 30, y: 15, width: 40, height: 70 };
const TRIANGLE = { tag: 'polygon', points: '50,15 82,85 18,85' };
const THIN = { tag: 'rect', x: 46, y: 18, width: 8, height: 64 };
const WIDE = { tag: 'rect', x: 15, y: 30, width: 70, height: 40 };

export const SHAPES = [
  { id: 'cube', label: 'קובייה', views: { front: SQUARE, side: SQUARE, top: SQUARE },
    icon: 'M30 40 L50 30 L70 40 L70 64 L50 74 L30 64 Z M30 40 L50 50 L70 40 M50 50 L50 74' },
  { id: 'cylinder', label: 'גליל עומד', views: { front: TALL, side: TALL, top: CIRCLE },
    icon: 'M34 32 A16 6 0 0 0 66 32 A16 6 0 0 0 34 32 L34 68 A16 6 0 0 0 66 68 L66 32' },
  { id: 'sphere', label: 'כדור', views: { front: CIRCLE, side: CIRCLE, top: CIRCLE },
    icon: 'M50 28 A22 22 0 1 0 50.01 28 Z M28 50 A22 7 0 0 0 72 50' },
  { id: 'cone', label: 'חרוט', views: { front: TRIANGLE, side: TRIANGLE, top: CIRCLE },
    icon: 'M50 26 L34 68 A16 6 0 0 0 66 68 Z' },
  { id: 'pyramid', label: 'פירמידה', views: { front: TRIANGLE, side: TRIANGLE, top: SQUARE },
    icon: 'M50 26 L30 64 L50 74 L70 64 Z M50 26 L50 74' },
  { id: 'coin', label: 'מטבע', views: { front: CIRCLE, side: THIN, top: { ...THIN, x: 18, y: 46, width: 64, height: 8 } },
    icon: 'M50 30 A8 20 0 1 0 50.01 30 Z M50 30 A8 20 0 0 1 58 52' },
  { id: 'prism', label: 'מנסרה משולשת', views: { front: TRIANGLE, side: WIDE, top: WIDE },
    icon: 'M30 66 L42 40 L54 66 Z M42 40 L72 34 L84 60 L54 66 M84 60 L72 34' },
];

const VIEW_LABELS = { front: 'מלפנים', side: 'מהצד', top: 'מלמעלה' };
const ORDER = ['front', 'side', 'top'];
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function shadowSvg(shape, view) {
  const { tag, ...attrs } = shape.views[view];
  return s('svg', { class: 'shadow-svg', viewBox: '0 0 100 100', role: 'img', 'aria-label': `הצל ${VIEW_LABELS[view]}` },
    s('rect', { x: 0, y: 0, width: 100, height: 100, fill: '#05070a' }),
    s(tag, { ...attrs, fill: '#e6e9ee' }),
  );
}

export function createShadowGuess({ shapes = SHAPES } = {}) {
  let hidden; let shown; let solved;
  const views = h('div', { class: 'shadow-views' });
  const feedback = h('div', { class: 'feedback', role: 'status', 'aria-live': 'polite' });
  const options = h('div', { class: 'shadow-options', role: 'group', 'aria-label': 'איזה גוף זה?' });
  const next = h('button', { type: 'button', class: 'btn btn-primary', text: 'גוף חדש', hidden: true });

  const el = h('div', { class: 'shadow-game' },
    h('p', { class: 'muted', text: 'גוף נסתר עומד בין מקור הקרינה לגלאי. רואים רק את הצל שלו. איזה גוף זה?' }),
    views, options, feedback, h('div', { class: 'btn-row', style: 'margin-top:1rem' }, next),
  );

  function renderViews() {
    views.replaceChildren(...ORDER.slice(0, shown).map((v) => h('figure', { class: 'shadow-view' },
      shadowSvg(hidden, v), h('figcaption', { text: `צילום ${VIEW_LABELS[v]}` }))));
  }

  function renderOptions() {
    options.replaceChildren(...shapes.map((sh) => {
      const btn = h('button', { type: 'button', class: 'shadow-option', disabled: solved },
        s('svg', { viewBox: '20 20 70 64', 'aria-hidden': 'true' },
          s('path', { d: sh.icon, fill: 'none', stroke: 'currentColor', 'stroke-width': 2, 'stroke-linejoin': 'round' })),
        h('span', { text: sh.label }));
      btn.addEventListener('click', () => guess(sh, btn));
      return btn;
    }));
  }

  function guess(sh, btn) {
    if (sh.id === hidden.id) {
      solved = true;
      feedback.className = 'feedback is-hit';
      feedback.textContent = shown === 1
        ? `נכון — ${sh.label}! והפעם הספיק צילום אחד.`
        : `נכון — ${sh.label}! היו צריכים ${shown} צילומים כדי להיות בטוחים.`;
      if (shown < ORDER.length) { shown = ORDER.length; renderViews(); }
      next.hidden = false;
      renderOptions();
      next.focus();
      return;
    }
    const fitsAll = ORDER.slice(0, shown).every((v) => same(sh.views[v], hidden.views[v]));
    btn.disabled = true;
    btn.classList.add('is-wrong');
    feedback.className = 'feedback is-miss';
    if (fitsAll && shown < ORDER.length) {
      shown++;
      feedback.textContent = `גם ${sh.label} יוצר בדיוק את הצל הזה! אז צילמנו עוד פעם, ${VIEW_LABELS[ORDER[shown - 1]]}.`;
      renderViews();
    } else {
      feedback.textContent = `${sh.label} היה יוצר צל אחר. נסו שוב.`;
    }
  }

  function start() {
    // מעדיפים גופים שיש להם "תאום" בצל מלפנים — שם השיעור מעניין
    const ambiguous = shapes.filter((a) => shapes.some((b) => b !== a && same(a.views.front, b.views.front)));
    const pool = Math.random() < 0.8 ? ambiguous : shapes;
    let pick = pool[Math.floor(Math.random() * pool.length)];
    if (hidden && pick.id === hidden.id) pick = pool[(pool.indexOf(pick) + 1) % pool.length];
    hidden = pick; shown = 1; solved = false;
    feedback.className = 'feedback'; feedback.textContent = '';
    next.hidden = true;
    renderViews(); renderOptions();
  }
  next.addEventListener('click', start);
  start();
  return { el };
}
