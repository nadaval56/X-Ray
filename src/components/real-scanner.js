// מכונת שיקוף: גוררים חפץ מהמחסן אל הצד הימני של המכונה. המגש נוסע שמאלה על המסוע ונבלע במכונה.
// על המסך צילום הרנטגן "נוסע" יחד עם המגש — נכנס מימין, עובר במרכז ויוצא משמאל, כמו בסורק אמיתי.
// כשהמגש יוצא מהמכונה גם הצילום יוצא מהמסך. אפשר לעצור את המסוע כדי להתבונן, ולשנות את המהירות.
// גוררים את המגש שיצא חזרה ימינה — הוא עובר שוב. גוררים חפץ חדש — הקודם חוזר למחסן.
// במגע ובמקלדת: הקשה / Enter על חפץ שולחת אותו למכונה.
//
// הצילומים אמיתיים, מסורק ביטחוני דו-אנרגטי (מאגר COMPASS-XP, ‏CC BY 4.0) — ראו content/scanner.json.

import { h, prefersReducedMotion } from '../lib/dom.js';

const img = (scan, kind) => `${import.meta.env.BASE_URL}images/scanner/${scan}-${kind}.webp`;

// גאומטריה באחוזים מרוחב הבמה
const ENTRY = 87;            // מרכז המגש בכניסה (ימין)
const EXIT = 13;             // מרכז המגש ביציאה (שמאל)
const BEAM = 50;             // קו הקרינה במרכז המכונה
const TRAY = 20;             // רוחב מגש
const BASE_SPEED = 6;        // אחוזי במה בשנייה במהירות 1 (נסיעה שלמה ≈ 12 שניות)
const SPEEDS = [0.4, 0.6, 1, 1.5, 2.5];

/**
 * @param {object} opts
 * @param {Array<{scan:string,label:string,note:string,link?:{label:string,href:string}}>} opts.items
 * @param {{items:Array<{id:string,label:string,text:string}>}} opts.colors
 */
export function createRealScanner({ items, colors }) {
  let current = null;     // החפץ שעל המסוע
  let mode = 'colour';
  let pos = EXIT;         // מרכז המגש
  let paused = false;
  let speed = 1;
  let raf = 0;
  let last = 0;

  // ---------- המכונה ----------
  const screenImg = h('img', { class: 'xm-xray', alt: '', decoding: 'async', draggable: 'false' });
  const screen = h('div', { class: 'xm-screen' }, screenImg, h('p', { class: 'xm-idle', text: 'המסך של הסורק' }));
  const trayImg = h('img', { alt: '', draggable: 'false' });
  const tray = h('button', { type: 'button', class: 'xm-tray', hidden: true, 'aria-label': 'להעביר שוב בסורק' }, trayImg);

  const modeBtns = [['colour', 'צבע'], ['grey', 'אפור']].map(([id, label]) =>
    h('button', { type: 'button', class: 'xm-key', 'aria-pressed': String(id === mode), text: label,
      onclick: () => setMode(id) }));
  const pauseBtn = h('button', { type: 'button', class: 'xm-key xm-pause', 'aria-pressed': 'false', disabled: true, onclick: () => setPaused(!paused) },
    h('span', { class: 'xm-pause-icon', 'aria-hidden': 'true' }), h('span', { class: 'xm-pause-text', text: 'עצירה' }));
  const speedInput = h('input', { type: 'range', class: 'xm-speed-input', min: '0', max: String(SPEEDS.length - 1), step: '1', value: '2',
    'aria-label': 'מהירות המסוע', 'aria-valuetext': 'רגילה' });
  speedInput.addEventListener('input', () => {
    speed = SPEEDS[Number(speedInput.value)];
    speedInput.setAttribute('aria-valuetext', ['איטית מאוד', 'איטית', 'רגילה', 'מהירה', 'מהירה מאוד'][Number(speedInput.value)]);
  });

  const dropHint = h('div', { class: 'xm-drop', 'aria-hidden': 'true' }, h('span', { text: 'הניחו כאן' }));
  const stage = h('div', { class: 'xm-stage' },
    h('div', { class: 'xm-belt', 'aria-hidden': 'true' }),
    tray,
    h('div', { class: 'xm-body', 'aria-hidden': 'true' },
      h('div', { class: 'xm-curtain xm-curtain-in' }), h('div', { class: 'xm-curtain xm-curtain-out' })),
    h('div', { class: 'xm-beam', 'aria-hidden': 'true' }),
    h('div', { class: 'xm-monitor' },
      screen,
      h('div', { class: 'xm-keys' }, pauseBtn, h('div', { class: 'xm-modes', role: 'group', 'aria-label': 'תצוגת הסורק' }, modeBtns))),
    h('label', { class: 'xm-speed' }, h('span', { text: 'מהירות' }), speedInput),
    dropHint,
  );
  const status = h('p', { class: 'visually-hidden', role: 'status', 'aria-live': 'polite' });

  // ---------- המידע מתחת למכונה ----------
  const title = h('h2', { class: 'xm-title', text: 'מכונת השיקוף' });
  const note = h('p', { class: 'xm-note', text: 'גררו חפץ מהמחסן אל הצד הימני של המכונה, או הקישו עליו.' });
  const extra = h('p', { class: 'xm-extra' });
  const legend = h('ul', { class: 'rs-legend' }, colors.items.map((c) => h('li', {},
    h('span', { class: `rs-swatch rs-${c.id}`, 'aria-hidden': 'true' }),
    h('strong', { text: c.label }), ' — ', c.text)));
  const info = h('div', { class: 'xm-info' }, title, note, extra, legend);

  // ---------- המחסן ----------
  const shelfItems = items.map((it) => {
    const b = h('button', { type: 'button', class: 'rs-item', 'aria-label': `${it.label} — לשלוח לסורק` },
      h('img', { src: img(it.scan, 'photo'), alt: '', loading: 'lazy', decoding: 'async', draggable: 'false' }),
      h('span', { text: it.label }));
    makeDraggable(b, () => it);
    return b;
  });
  const shelf = h('section', { class: 'xm-shelf', 'aria-label': 'המחסן' },
    h('p', { class: 'rs-shelf-title', text: 'המחסן' }),
    h('div', { class: 'rs-grid' }, shelfItems));

  const el = h('div', { class: 'xm' }, stage, info, shelf, status);

  // ---------- גרירה ----------
  // עכבר ומגע: גוררים אל המכונה. הקשה פשוטה (בלי גרירה) שולחת את החפץ גם היא.
  function makeDraggable(node, getItem) {
    let dragged = false;
    node.addEventListener('click', () => { if (!dragged) load(getItem()); dragged = false; });
    node.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      const x0 = e.clientX, y0 = e.clientY;
      const it = getItem();
      let ghost = null;
      dragged = false;
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
        dragged = true;
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
  makeDraggable(tray, () => current);

  // ---------- תצוגה ----------
  function setMode(id) {
    mode = id;
    modeBtns.forEach((b, k) => b.setAttribute('aria-pressed', String(['colour', 'grey'][k] === mode)));
    legend.hidden = mode !== 'colour';
    if (current) screenImg.src = img(current.scan, mode);
  }

  function setPaused(v) {
    paused = v;
    pauseBtn.setAttribute('aria-pressed', String(paused));
    pauseBtn.querySelector('.xm-pause-text').textContent = paused ? 'המשך' : 'עצירה';
    stage.classList.toggle('is-paused', paused);
    if (!paused) last = performance.now();
  }

  // מיקום המגש והצילום. הצילום זז על המסך באותו קצב: כשהמגש במרכז המכונה הצילום במרכז המסך,
  // וכל רוחב-מגש של נסיעה מזיז את הצילום ברוחב מסך שלם.
  function render() {
    tray.style.left = `${pos - TRAY / 2}%`;
    const shift = (pos - BEAM) / TRAY; // 1 = מחוץ למסך מימין, ‎−1 = מחוץ למסך משמאל
    screenImg.style.transform = `translateX(${shift * 100}%)`;
    screen.classList.toggle('has-image', Math.abs(shift) < 1);
  }

  function tick(t) {
    const dt = Math.min(0.1, (t - last) / 1000);
    last = t;
    if (!paused) pos = Math.max(EXIT, pos - BASE_SPEED * speed * dt);
    render();
    if (pos > EXIT) { raf = requestAnimationFrame(tick); return; }
    done();
  }

  function done() {
    stage.classList.remove('is-running');
    pauseBtn.disabled = true;
    tray.classList.add('is-out');
    note.textContent = current.note;
    extra.replaceChildren(...(current.link ? [h('a', { href: `./${current.link.href}`, text: current.link.label })] : []));
    status.textContent = `${current.label} יצא מהסורק. ${current.note}`;
  }

  function load(it) {
    if (!it?.scan) return;
    cancelAnimationFrame(raf);
    current = items.find((x) => x.scan === it.scan);
    // חפץ קודם על המסוע "נדרס" וחוזר למחסן — מספיק להחליף את המגש
    tray.hidden = false;
    tray.classList.remove('is-out');
    trayImg.src = img(current.scan, 'photo');
    trayImg.alt = current.label;
    tray.setAttribute('aria-label', `${current.label} — להעביר שוב בסורק`);
    shelfItems.forEach((b, k) => b.classList.toggle('is-on-belt', items[k] === current));
    title.textContent = current.label;
    note.textContent = 'החפץ נוסע בסורק. אפשר לעצור את המסוע כדי להתבונן בצילום.';
    extra.replaceChildren();
    screenImg.src = img(current.scan, mode);
    screenImg.alt = `צילום הסורק של ${current.label}`;
    status.textContent = `${current.label} נכנס לסורק.`;
    setPaused(false);

    if (prefersReducedMotion()) {
      // בלי תנועה: המגש עומד במרכז המכונה והצילום על המסך, עם כפתור "המשך" להוצאה
      pos = BEAM;
      render();
      stage.classList.add('is-running');
      pauseBtn.disabled = false;
      setPaused(true);
      return;
    }
    pos = ENTRY;
    render();
    stage.classList.add('is-running');
    pauseBtn.disabled = false;
    last = performance.now();
    raf = requestAnimationFrame(tick);
    if (stage.getBoundingClientRect().top < 0) stage.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // בלי תנועה: "המשך" מוציא את המגש מיד
  pauseBtn.addEventListener('click', () => {
    if (prefersReducedMotion() && !paused && current) { pos = EXIT; render(); done(); }
  });

  legend.hidden = false;
  return { el };
}
