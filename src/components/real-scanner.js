// מכונת שיקוף: גוררים חפץ מהמחסן אל הצד הימני של המכונה. המגש נוסע שמאלה על המסוע, נבלע במכונה,
// יוצא מהצד השני וממשיך עד שהוא נעלם. על המסך צילום הרנטגן "נוסע" יחד עם המגש — נכנס מימין,
// עובר במרכז ויוצא משמאל, כמו בסורק אמיתי. אפשר להעמיס כמה חפצים: כולם נוסעים יחד, כמו במסוע רגיל.
// שנייה וחצי אחרי שהמגש האחרון נעלם, המסוע עוצר. אפשר לעצור אותו ידנית כדי להתבונן, ולשנות מהירות.
// במגע ובמקלדת: הקשה / Enter על חפץ שולחת אותו למכונה.
//
// הצילומים אמיתיים, מסורק ביטחוני דו-אנרגטי (מאגר COMPASS-XP, ‏CC BY 4.0) — ראו content/scanner.json.

import { h, prefersReducedMotion } from '../lib/dom.js';

const img = (scan, kind) => `${import.meta.env.BASE_URL}images/scanner/${scan}-${kind}.webp`;

// גאומטריה באחוזים מרוחב הבמה
const ENTRY = 87;            // מרכז המגש בכניסה (ימין)
const GONE = -11;            // מרכז המגש כשהוא כבר מחוץ לבמה (שמאל)
const GAP = 4;               // רווח מינימלי בין מגשים על המסוע
const IDLE_STOP = 1.5;       // שניות של מסוע ריק עד שהמכונה עוצרת
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
  let trays = [];         // {it, pos, trayEl, xrayEl, seen} — מימין לשמאל לפי סדר ההעמסה
  let mode = 'colour';
  let running = false;
  let idle = 0;           // כמה זמן המסוע ריק
  let paused = false;
  let speed = 1;
  let raf = 0;
  let last = 0;

  // ---------- המכונה ----------
  const screen = h('div', { class: 'xm-screen' },
    h('p', { class: 'xm-idle', text: 'המסך של הסורק' }),
    h('span', { class: 'xm-scanlines', 'aria-hidden': 'true' }));
  const trayLayer = h('div', { class: 'xm-trays', 'aria-hidden': 'true' });

  // לוח הבקרה על גוף המכונה: כפתור עגול (אדום = עצירה, ירוק = המשך), מתג צבע/אפור ומחוון מהירות
  const pauseBtn = h('button', { type: 'button', class: 'xm-power', 'aria-pressed': 'false', disabled: true, onclick: () => setPaused(!paused) },
    h('span', { class: 'xm-power-icon', 'aria-hidden': 'true' }), h('span', { class: 'xm-pause-text visually-hidden', text: 'עצירה' }));
  const modeBtns = [['colour', 'צבע'], ['grey', 'אפור']].map(([id, label]) =>
    h('button', { type: 'button', class: `xm-mode xm-mode-${id}`, 'aria-pressed': String(id === mode), onclick: () => setMode(id) },
      h('span', { class: 'xm-mode-led', 'aria-hidden': 'true' }), label));
  const speedInput = h('input', { type: 'range', class: 'xm-speed-input', min: '0', max: String(SPEEDS.length - 1), step: '1', value: '2',
    'aria-label': 'מהירות המסוע', 'aria-valuetext': 'רגילה' });
  speedInput.addEventListener('input', () => {
    speed = SPEEDS[Number(speedInput.value)];
    speedInput.setAttribute('aria-valuetext', ['איטית מאוד', 'איטית', 'רגילה', 'מהירה', 'מהירה מאוד'][Number(speedInput.value)]);
  });
  const chevrons = (n) => h('span', { class: 'xm-chev', 'aria-hidden': 'true', text: '‹'.repeat(n) });

  const trefoil = () => h('span', { class: 'xm-trefoil', 'aria-hidden': 'true' });
  const dropHint = h('div', { class: 'xm-drop', 'aria-hidden': 'true' }, h('span', { text: 'הניחו כאן' }));
  const stage = h('div', { class: 'xm-stage' },
    h('div', { class: 'xm-belt', 'aria-hidden': 'true' },
      h('span', { class: 'xm-belt-surface' }), h('span', { class: 'xm-rollers' }),
      h('span', { class: 'xm-leg xm-leg-r' }), h('span', { class: 'xm-leg xm-leg-l' }),
      h('span', { class: 'xm-plate' }, trefoil())),
    trayLayer,
    h('div', { class: 'xm-body' },
      h('div', { class: 'xm-curtain xm-curtain-in', 'aria-hidden': 'true' }),
      h('div', { class: 'xm-curtain xm-curtain-out', 'aria-hidden': 'true' }),
      h('div', { class: 'xm-panel' },
        pauseBtn,
        h('div', { class: 'xm-modes', role: 'group', 'aria-label': 'תצוגת הסורק' }, modeBtns),
        h('label', { class: 'xm-speed' }, h('span', { class: 'visually-hidden', text: 'מהירות' }), chevrons(1), speedInput, chevrons(3))),
      h('div', { class: 'xm-window', 'aria-hidden': 'true' }, h('span', { class: 'xm-beam' })),
      h('div', { class: 'xm-sticker', 'aria-hidden': 'true' }, trefoil(), h('span', { text: 'קרינה' }))),
    h('div', { class: 'xm-neck', 'aria-hidden': 'true' }),
    h('div', { class: 'xm-monitor' },
      h('div', { class: 'xm-status', 'aria-hidden': 'true' },
        h('span', { class: 'xm-led' }),
        h('span', { class: 'xm-st xm-st-idle', text: 'מוכן' }), h('span', { class: 'xm-st xm-st-run', text: 'סורק' }), h('span', { class: 'xm-st xm-st-pause', text: 'מושהה' }),
        h('span', { class: 'xm-brand', text: 'X-RAY' })),
      screen,
      ['tl', 'tr', 'bl', 'br'].map((c) => h('span', { class: `xm-screw xm-screw-${c}`, 'aria-hidden': 'true' }))),
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

  // ---------- תצוגה ----------
  function setMode(id) {
    mode = id;
    modeBtns.forEach((b, k) => b.setAttribute('aria-pressed', String(['colour', 'grey'][k] === mode)));
    legend.hidden = mode !== 'colour';
    trays.forEach((t) => { t.xrayEl.src = img(t.it.scan, mode); });
  }

  function setPaused(v) {
    paused = v;
    pauseBtn.setAttribute('aria-pressed', String(paused));
    pauseBtn.querySelector('.xm-pause-text').textContent = paused ? 'המשך' : 'עצירה';
    stage.classList.toggle('is-paused', paused);
    if (!paused) last = performance.now();
  }

  // מיקום כל מגש וכל צילום. הצילום זז על המסך באותו קצב: כשהמגש במרכז המכונה הצילום במרכז המסך,
  // וכל רוחב-מגש של נסיעה מזיז את הצילום ברוחב מסך שלם.
  function render() {
    let onScreen = false;
    for (const t of trays) {
      t.trayEl.style.left = `${t.pos - TRAY / 2}%`;
      const shift = (t.pos - BEAM) / TRAY; // 1 = מחוץ למסך מימין, ‎−1 = מחוץ למסך משמאל
      t.xrayEl.style.transform = `translateX(${shift * 100}%)`;
      if (Math.abs(shift) < 1) onScreen = true;
    }
    screen.classList.toggle('has-image', onScreen);
  }

  function remove(t) {
    t.trayEl.remove();
    t.xrayEl.remove();
    trays = trays.filter((x) => x !== t);
  }

  // החפץ הגיע למרכז הסורק: המידע מתחת למכונה עובר אליו
  function showInfo(it) {
    title.textContent = it.label;
    note.textContent = it.note;
    extra.replaceChildren(...(it.link ? [h('a', { href: `./${it.link.href}`, text: it.link.label })] : []));
    status.textContent = `${it.label} בסורק. ${it.note}`;
  }

  function tick(t) {
    const dt = Math.min(0.1, (t - last) / 1000);
    last = t;
    if (!paused) {
      for (const tr of trays) {
        tr.pos -= BASE_SPEED * speed * dt;
        if (!tr.seen && tr.pos <= BEAM) { tr.seen = true; showInfo(tr.it); }
      }
      trays.filter((tr) => tr.pos <= GONE).forEach(remove);
      idle = trays.length ? 0 : idle + dt;
    }
    render();
    if (idle < IDLE_STOP) { raf = requestAnimationFrame(tick); return; }
    stop();
  }

  function start() {
    stage.classList.add('is-running');
    pauseBtn.disabled = false;
    idle = 0;
    if (running) return;
    running = true;
    last = performance.now();
    raf = requestAnimationFrame(tick);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(raf);
    stage.classList.remove('is-running');
    setPaused(false);
    pauseBtn.disabled = true;
  }

  function load(it) {
    if (!it?.scan) return;
    const item = items.find((x) => x.scan === it.scan);
    const t = {
      it: item,
      seen: false,
      trayEl: h('div', { class: 'xm-tray' }, h('img', { src: img(item.scan, 'photo'), alt: '', draggable: 'false' })),
      xrayEl: h('img', { class: 'xm-xray', src: img(item.scan, mode), alt: `צילום הסורק של ${item.label}`, decoding: 'async', draggable: 'false' }),
    };

    if (prefersReducedMotion()) {
      // בלי תנועה: חפץ אחד בכל פעם, עומד במרכז המכונה עם הצילום על המסך. "המשך" מוציא אותו.
      [...trays].forEach(remove);
      t.pos = BEAM;
      t.seen = true;
      trays.push(t);
      trayLayer.append(t.trayEl);
      screen.append(t.xrayEl);
      render();
      showInfo(item);
      stage.classList.add('is-running');
      pauseBtn.disabled = false;
      setPaused(true);
      return;
    }

    // מגש חדש נכנס מימין; אם יש מגש קרוב לכניסה, החדש מחכה מאחוריו על המסוע
    const back = trays.length ? trays[trays.length - 1].pos : -Infinity;
    t.pos = Math.max(ENTRY, back + TRAY + GAP);
    trays.push(t);
    trayLayer.append(t.trayEl);
    screen.append(t.xrayEl);
    if (trays.every((x) => x === t || x.seen)) {
      // אין חפץ אחר בדרך למרכז: המידע מתחיל להראות את החפץ החדש
      title.textContent = item.label;
      note.textContent = 'החפץ נוסע בסורק. אפשר לעצור את המסוע כדי להתבונן בצילום.';
      extra.replaceChildren();
    }
    status.textContent = `${item.label} עלה על המסוע.`;
    render();
    if (paused) setPaused(false);
    start();
    if (stage.getBoundingClientRect().top < 0) stage.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // בלי תנועה: "המשך" מוציא את החפץ מיד
  pauseBtn.addEventListener('click', () => {
    if (prefersReducedMotion() && !paused && trays.length) { [...trays].forEach(remove); render(); stop(); }
  });

  legend.hidden = false;
  return { el };
}
