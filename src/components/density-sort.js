// מיון צפיפויות: מסדרים חומרים מהשחור (עובר הכי הרבה) ללבן (נבלע הכי הרבה).
// גרירה במגע/עכבר, או כפתורי למעלה/למטה (מקלדת וקוראי מסך). הסדר הנכון מחושב מאותם
// מקדמי NIST של סימולטור הבליעה, בעובי קבוע.

import { h } from '../lib/dom.js';
import { transmitted, formatThickness } from './attenuation-sim.js';

const toGray = (t) => {
  const v = Math.round(255 * (1 - t));
  return `rgb(${v}, ${v}, ${v})`;
};

/**
 * @param {object} opts
 * @param {Array} opts.materials  מ-content/materials.json
 * @param {number} [opts.thickness=2] ס״מ
 */
export function createDensitySort({ materials, thickness = 2 }) {
  const correct = [...materials].sort((a, b) => transmitted(b, thickness) - transmitted(a, thickness));
  // סדר התחלתי מעורבב וקבוע, שאינו הסדר הנכון
  let order = [2, 4, 0, 3, 1].map((i) => correct[i]).filter(Boolean);
  if (order.length !== correct.length) order = [...correct].reverse();

  const status = h('p', { class: 'sort-status', role: 'status', 'aria-live': 'polite' });
  const list = h('ol', { class: 'sort-list' });
  const checkBtn = h('button', { type: 'button', class: 'btn btn-primary', text: 'בדיקה' });
  const resetBtn = h('button', { type: 'button', class: 'btn btn-ghost', text: 'ערבוב מחדש' });
  let checked = false;

  const el = h('div', { class: 'sort' },
    h('p', { class: 'sort-end', text: '⬛ שחור בצילום — הקרינה עוברת' }),
    list,
    h('p', { class: 'sort-end', text: '⬜ לבן בצילום — הקרינה נבלעת' }),
    h('div', { class: 'btn-row' }, checkBtn, resetBtn),
    status,
  );

  function move(from, to) {
    if (to < 0 || to >= order.length || from === to) return;
    const [m] = order.splice(from, 1);
    order.splice(to, 0, m);
    checked = false;
    render(to);
  }

  function render(focusIndex) {
    list.replaceChildren(...order.map((m, i) => {
      const ok = checked && correct[i].id === m.id;
      const up = h('button', { type: 'button', class: 'sort-btn', 'aria-label': `הזזת ${m.label} למעלה`, disabled: i === 0, text: '▲' });
      const down = h('button', { type: 'button', class: 'sort-btn', 'aria-label': `הזזת ${m.label} למטה`, disabled: i === order.length - 1, text: '▼' });
      up.addEventListener('click', () => move(i, i - 1));
      down.addEventListener('click', () => move(i, i + 1));
      const handle = h('span', { class: 'sort-handle', 'aria-hidden': 'true', text: '⋮⋮' });
      const li = h('li', {
        class: `sort-item${checked ? (ok ? ' is-ok' : ' is-wrong') : ''}`,
        dataset: { index: String(i) },
      },
        handle,
        h('span', { class: 'sort-label', text: m.label }),
        checked && h('span', { class: 'sort-swatch', style: `background:${toGray(transmitted(m, thickness))}`, 'aria-hidden': 'true' }),
        checked && h('span', { class: 'visually-hidden', text: ok ? ' — במקום הנכון' : ' — לא במקום' }),
        h('span', { class: 'sort-btns' }, up, down),
      );
      li.addEventListener('pointerdown', (e) => startDrag(e, li, i));
      return li;
    }));
    if (focusIndex != null) list.children[focusIndex]?.querySelector('.sort-btn:not(:disabled)')?.focus();
  }

  // גרירה: בזמן התנועה רק מזיזים (transform) — הפריט עוקב אחרי האצבע והשכנים מפנים לו מקום.
  // הסידור עצמו קורה פעם אחת, בשחרור. (שינוי ה-DOM באמצע גרירה מבטל את ה-pointer capture.)
  function startDrag(e, li, index) {
    if (e.target.closest('button')) return;
    e.preventDefault();
    const items = [...list.children];
    const step = items.length > 1
      ? items[1].getBoundingClientRect().top - items[0].getBoundingClientRect().top
      : li.getBoundingClientRect().height;
    const startY = e.clientY;
    let target = index;
    li.classList.add('is-dragging');

    const onMove = (ev) => {
      const dy = ev.clientY - startY;
      target = Math.max(0, Math.min(items.length - 1, index + Math.round(dy / step)));
      li.style.transform = `translateY(${dy}px)`;
      items.forEach((other, j) => {
        if (other === li) return;
        let shift = 0;
        if (index < target && j > index && j <= target) shift = -step;
        if (index > target && j < index && j >= target) shift = step;
        other.style.transform = shift ? `translateY(${shift}px)` : '';
      });
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      if (target !== index) move(index, target);
      else render();
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  }

  checkBtn.addEventListener('click', () => {
    checked = true;
    render();
    const right = order.filter((m, i) => correct[i].id === m.id).length;
    status.textContent = right === order.length
      ? `מצוין! זה הסדר הנכון. הגוונים ליד כל חומר מראים איך נראית שכבה של ${formatThickness(thickness)} ממנו בצילום.`
      : `${right} מתוך ${order.length} במקום הנכון. נסו להזיז את החומרים המסומנים ובדקו שוב.`;
  });
  resetBtn.addEventListener('click', () => {
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    checked = false;
    status.textContent = '';
    render();
  });

  render();
  return { el };
}
