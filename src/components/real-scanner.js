// מכונת שיקוף: גוררים חפץ מהמחסן אל הצד הימני של המכונה. המגש נוסע שמאלה על המסוע,
// נבלע במכונה, ובזמן שהוא עובר בפנים צילום הרנטגן נבנה על המסך. אחר כך הוא יוצא בצד השמאלי.
// גוררים אותו שוב ימינה — הוא עובר שוב. גוררים חפץ חדש — הקודם חוזר למחסן.
// במגע ובמקלדת: הקשה / Enter על חפץ שולחת אותו למכונה.
//
// הצילומים אמיתיים, מסורק ביטחוני דו-אנרגטי (מאגר COMPASS-XP, ‏CC BY 4.0) — ראו content/scanner.json.

import { h, prefersReducedMotion } from '../lib/dom.js';

const img = (scan, kind) => `${import.meta.env.BASE_URL}images/scanner/${scan}-${kind}.webp`;

// גאומטריה באחוזים מרוחב הבמה
const ENTRY = 86;          // מרכז המגש בכניסה (ימין)
const EXIT = 14;           // מרכז המגש ביציאה (שמאל)
const BEAM = 50;           // קו הקרינה במרכז המכונה
const TRAY = 21;           // רוחב מגש
const DURATION = 3600;     // זמן נסיעה מכניסה ליציאה (מ"ש)

/**
 * @param {object} opts
 * @param {Array<{scan:string,label:string,note:string,link?:{label:string,href:string}}>} opts.items
 * @param {{items:Array<{id:string,label:string,text:string}>}} opts.colors
 */
export function createRealScanner({ items, colors }) {
  let current = null;   // החפץ שעל המסוע
  let mode = 'colour';
  let run = 0;          // מזהה נסיעה, כדי לבטל נסיעה קודמת

  // ---------- המכונה ----------
  const screenImg = h('img', { class: 'xm-xray', alt: '', decoding: 'async' });
  const screenIdle = h('p', { class: 'xm-idle', text: 'המסך של הסורק' });
  const screen = h('div', { class: 'xm-screen' }, screenImg, screenIdle);
  const trayImg = h('img', { alt: '', draggable: 'false' });
  const tray = h('button', { type: 'button', class: 'xm-tray', hidden: true, 'aria-label': 'להעביר שוב בסורק' }, trayImg);
  const dropHint = h('div', { class: 'xm-drop', 'aria-hidden': 'true' }, h('span', { text: 'הניחו כאן' }));
  const stage = h('div', { class: 'xm-stage' },
    h('div', { class: 'xm-belt', 'aria-hidden': 'true' }),
    tray,
    h('div', { class: 'xm-body', 'aria-hidden': 'true' },
      h('div', { class: 'xm-curtain xm-curtain-in' }), h('div', { class: 'xm-curtain xm-curtain-out' })),
    h('div', { class: 'xm-monitor' }, screen),
    h('div', { class: 'xm-beam', 'aria-hidden': 'true' }),
    dropHint,
  );
  const status = h('p', { class: 'visually-hidden', role: 'status', 'aria-live': 'polite' });

  // ---------- המידע מתחת למכונה ----------
  const title = h('h2', { class: 'xm-title', text: 'מכונת השיקוף' });
  const note = h('p', { class: 'xm-note', text: 'גררו חפץ מהמחסן אל הצד הימני של המכונה, או הקישו עליו.' });
  const extra = h('p', { class: 'xm-extra' });
  const modeBtns = [['colour', 'בצבעים'], ['grey', 'בשחור-לבן']].map(([id, label]) =>
    h('button', { type: 'button', class: 'chip', 'aria-pressed': String(id === mode), text: label,
      onclick: () => { mode = id; modeBtns.forEach((b, k) => b.setAttribute('aria-pressed', String(['colour', 'grey'][k] === mode))); updateScreenSrc(); } }));
  const legend = h('ul', { class: 'rs-legend' }, colors.items.map((c) => h('li', {},
    h('span', { class: `rs-swatch rs-${c.id}`, 'aria-hidden': 'true' }),
    h('strong', { text: c.label }), ' — ', c.text)));
  const info = h('div', { class: 'xm-info' },
    h('div', { class: 'xm-info-head' }, title, h('div', { class: 'chip-row', role: 'group', 'aria-label': 'תצוגת הסורק' }, modeBtns)),
    note, extra, legend);

  // ---------- המחסן ----------
  const shelfItems = items.map((it) => {
    const b = h('button', { type: 'button', class: 'rs-item', 'aria-label': `${it.label} — לשלוח לסורק` },
      h('img', { src: img(it.scan, 'photo'), alt: '', loading: 'lazy', decoding: 'async', draggable: 'false' }),
      h('span', { text: it.label }));
    makeDraggable(b, it);
    return b;
  });
  const shelf = h('section', { class: 'xm-shelf', 'aria-label': 'המחסן' },
    h('p', { class: 'rs-shelf-title', text: 'המחסן' }),
    h('div', { class: 'rs-grid' }, shelfItems));

  const el = h('div', { class: 'xm' }, stage, info, shelf, status);

  // ---------- גרירה ----------
  // עכבר: גוררים מיד. מגע: גם גרירה עובדת, וגם הקשה פשוטה שולחת את החפץ.
  function makeDraggable(node, it) {
    node.addEventListener('click', () => { if (!node.dataset.dragged) load(it); delete node.dataset.dragged; });
    node.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      const x0 = e.clientX, y0 = e.clientY;
      let ghost = null;
      const move = (ev) => {
        if (!ghost && Math.hypot(ev.clientX - x0, ev.clientY - y0) < 8) return;
        if (!ghost) {
          ghost = h('img', { class: 'xm-ghost', src: img(it.scan, 'photo'), alt: '' });
          document.body.append(ghost);
          el.classList.add('is-dragging');
        }
        ghost.style.left = `${ev.clientX}px`;
        ghost.style.top = `${ev.clientY}px`;
        stage.classList.toggle('is-over', overStage(ev));
      };
      const up = (ev) => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        window.removeEventListener('pointercancel', up);
        if (!ghost) return;
        ghost.remove();
        el.classList.remove('is-dragging');
        stage.classList.remove('is-over');
        node.dataset.dragged = '1';
        setTimeout(() => delete node.dataset.dragged, 0);
        if (ev.type === 'pointerup' && overStage(ev)) load(it);
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
      window.addEventListener('pointercancel', up);
    });
  }
  const overStage = (ev) => {
    const r = stage.getBoundingClientRect();
    return ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom;
  };
  // המגש שיצא משמאל: גוררים / מקישים — עובר שוב
  makeDraggable(tray, { get scan() { return current?.scan; }, get label() { return current?.label; } });

  // ---------- נסיעה על המסוע ----------
  function placeTray(centerPct) { tray.style.left = `${centerPct - TRAY / 2}%`; }

  function updateScreenSrc() {
    if (!current || el.dataset.scanned !== current.scan) return;
    screenImg.src = img(current.scan, mode);
    screenImg.alt = `צילום הסורק של ${current.label}${mode === 'colour' ? ', בצבעים' : ', בשחור-לבן'}`;
    legend.hidden = mode !== 'colour';
  }

  function load(it) {
    if (!it?.scan) return;
    const token = ++run;
    const same = current && current.scan === it.scan;
    current = items.find((x) => x.scan === it.scan);
    // חפץ קודם על המסוע "נדרס" וחוזר למחסן — מספיק להעלים אותו
    tray.hidden = false;
    tray.classList.remove('is-out');
    trayImg.src = img(current.scan, 'photo');
    trayImg.alt = current.label;
    tray.setAttribute('aria-label', `${current.label} — להעביר שוב בסורק`);
    shelfItems.forEach((b, k) => b.classList.toggle('is-on-belt', items[k] === current));
    title.textContent = current.label;
    note.textContent = 'החפץ בדרך לסורק…';
    extra.replaceChildren();
    // המסך מתנקה ומתכונן לצילום החדש
    el.dataset.scanned = current.scan;
    screenImg.src = img(current.scan, mode);
    screenImg.alt = `צילום הסורק של ${current.label}${mode === 'colour' ? ', בצבעים' : ', בשחור-לבן'}`;
    legend.hidden = mode !== 'colour';
    screen.classList.add('has-image');
    status.textContent = `${current.label} נכנס לסורק.`;

    const finish = () => {
      if (token !== run) return;
      placeTray(EXIT);
      screenImg.style.clipPath = '';
      stage.classList.remove('is-running');
      tray.classList.add('is-out');
      note.textContent = current.note;
      extra.replaceChildren(...(current.link ? [h('a', { href: `./${current.link.href}`, text: current.link.label })] : []));
      status.textContent = `${current.label} יצא מהסורק. ${current.note}`;
    };

    if (prefersReducedMotion()) { finish(); return; }

    placeTray(ENTRY);
    screenImg.style.clipPath = 'inset(0 100% 0 0)';
    stage.classList.add('is-running');
    const go = () => {
      const t0 = performance.now();
      const step = (t) => {
        if (token !== run) return;
        const p = Math.min(1, (t - t0) / DURATION);
        const ease = p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2;
        const c = ENTRY - (ENTRY - EXIT) * ease;
        placeTray(c);
        // הצילום נבנה כשהמגש עובר את קו הקרינה: הקצה המוביל (השמאלי) קודם
        const passed = Math.max(0, Math.min(1, (BEAM - (c - TRAY / 2)) / TRAY));
        screenImg.style.clipPath = `inset(0 ${(1 - passed) * 100}% 0 0)`;
        if (p < 1) requestAnimationFrame(step); else finish();
      };
      requestAnimationFrame(step);
    };
    // רגע קטן בכניסה לפני שהמסוע מתחיל לנוע
    setTimeout(() => { if (token === run) go(); }, same ? 150 : 350);
    if (stage.getBoundingClientRect().top < 0) stage.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  legend.hidden = false;
  return { el };
}
