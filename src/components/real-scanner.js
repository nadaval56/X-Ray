// סורק מזוודות עם צילומים אמיתיים: בוחרים חפץ, הוא עובר בסורק, ורואים מה הסורק רואה.
// הצילומים מסורק ביטחוני דו-אנרגטי (מאגר COMPASS-XP, ‏CC BY 4.0) — ראו content/scanner.json.
// אין כאן ניחוש חובה: מעבירים, מסתכלים, משווים. אפשר לעבור בין תצוגת צבע לתצוגת אפור.

import { h, prefersReducedMotion } from '../lib/dom.js';

const img = (scan, kind) => `${import.meta.env.BASE_URL}images/scanner/${scan}-${kind}.webp`;

/**
 * @param {object} opts
 * @param {Array<{scan:string,label:string,note:string,link?:{label:string,href:string}}>} opts.items
 * @param {{items:Array<{id:string,label:string,text:string}>}} opts.colors
 */
export function createRealScanner({ items, colors }) {
  let current = null;
  let mode = 'colour';
  let busy = 0;

  // ---------- הבמה: בעין / בסורק ----------
  const photo = h('img', { class: 'rs-photo', alt: '', decoding: 'async' });
  const xray = h('img', { class: 'rs-xray', alt: '', decoding: 'async' });
  const beam = h('div', { class: 'rs-beam', 'aria-hidden': 'true' });
  const idle = h('p', { class: 'rs-idle', text: 'בחרו חפץ, והוא יעבור בסורק.' });
  const title = h('h2', { class: 'rs-title', text: 'מה עובר בסורק?' });
  const note = h('p', { class: 'rs-note', 'aria-live': 'polite' });
  const extra = h('p', { class: 'rs-extra' });

  const modeBtns = [['colour', 'בצבעים'], ['grey', 'בשחור-לבן']].map(([id, label]) =>
    h('button', { type: 'button', class: 'chip', 'aria-pressed': String(id === mode), text: label,
      onclick: () => { mode = id; modeBtns.forEach((b, k) => b.setAttribute('aria-pressed', String(['colour', 'grey'][k] === mode))); showXray(false); } }));

  const legend = h('ul', { class: 'rs-legend' }, colors.items.map((c) => h('li', {},
    h('span', { class: `rs-swatch rs-${c.id}`, 'aria-hidden': 'true' }),
    h('strong', { text: c.label }), ' — ', c.text)));

  const stage = h('section', { class: 'rs-stage', 'aria-labelledby': 'rs-title' },
    h('div', { class: 'rs-head' }, title, h('div', { class: 'chip-row rs-modes', role: 'group', 'aria-label': 'תצוגת הסורק' }, modeBtns)),
    h('div', { class: 'rs-panels' },
      h('figure', { class: 'rs-panel' }, h('div', { class: 'rs-frame rs-frame-photo' }, photo), h('figcaption', { text: 'בעין' })),
      h('figure', { class: 'rs-panel' }, h('div', { class: 'rs-frame rs-frame-xray' }, xray, beam, idle), h('figcaption', { text: 'בסורק' })),
    ),
    note, extra, legend,
  );
  title.id = 'rs-title';

  // ---------- החפצים ----------
  const buttons = items.map((it) => h('button', { type: 'button', class: 'rs-item', 'aria-pressed': 'false', onclick: () => select(it) },
    h('img', { src: img(it.scan, 'photo'), alt: '', loading: 'lazy', decoding: 'async' }),
    h('span', { text: it.label })));
  const shelf = h('section', { class: 'rs-shelf', 'aria-label': 'חפצים' },
    h('p', { class: 'rs-shelf-title', text: 'מה נכניס לסורק?' }),
    h('div', { class: 'rs-grid' }, buttons));

  const el = h('div', { class: 'rs' }, stage, shelf);

  function showXray(animate) {
    if (!current) return;
    const token = ++busy;
    xray.src = img(current.scan, mode);
    xray.alt = `צילום הסורק של ${current.label}${mode === 'colour' ? ', בצבעים' : ', בשחור-לבן'}`;
    legend.hidden = mode !== 'colour';
    if (!animate || prefersReducedMotion()) {
      el.classList.remove('is-scanning');
      xray.style.clipPath = '';
      return;
    }
    // הצילום נבנה פס אחרי פס, כמו בסורק אמיתי שהחפץ נוסע דרכו
    el.classList.add('is-scanning');
    xray.style.clipPath = 'inset(0 0 0 100%)';
    const t0 = performance.now(), dur = 1300;
    const step = (t) => {
      if (token !== busy) return;
      const p = Math.min(1, (t - t0) / dur);
      xray.style.clipPath = `inset(0 0 0 ${100 - p * 100}%)`;
      beam.style.insetInlineStart = `${p * 100}%`;
      if (p < 1) requestAnimationFrame(step);
      else { xray.style.clipPath = ''; el.classList.remove('is-scanning'); }
    };
    const start = () => requestAnimationFrame(step);
    if (xray.complete) start(); else xray.addEventListener('load', start, { once: true });
  }

  function select(it) {
    current = it;
    buttons.forEach((b, k) => b.setAttribute('aria-pressed', String(items[k] === it)));
    el.classList.add('has-item');
    title.textContent = it.label;
    photo.src = img(it.scan, 'photo');
    photo.alt = `${it.label}, בצילום רגיל`;
    note.textContent = it.note;
    extra.replaceChildren(...(it.link ? [h('a', { href: `./${it.link.href}`, text: it.link.label })] : []));
    showXray(true);
    if (stage.getBoundingClientRect().top < 0) stage.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
  }

  legend.hidden = false;
  return { el };
}
