// סורק מזוודות: רשימת חפצים → התלמיד מנחש כמה כל חפץ ייראה → מעבירים בסורק ורואים.
//
// הצילום מחושב: כל חפץ בנוי מחלקים פשוטים (מלבן, עיגול, מוט, כדור…), ולכל חלק חומר ועובי.
// לכל פיקסל מסכמים μ·עובי של כל מה שנמצא מעליו ומתחתיו, והקרינה שעוברת היא e^(−Σμt).
// מקדמי הבליעה מ-NIST (content/scanner.json). העוביים והצפיפויות של החפצים הם הערכות סבירות.
//
// כמו בסורקי מזוודות: מה שעוצר הרבה קרינה נראה כהה, ורקע ריק לבן (הפוך מצילום בבית חולים).

import { h, prefersReducedMotion } from '../lib/dom.js';

// ---------- חלקים (יחידות: ס״מ, בקואורדינטות של החפץ) ----------
// כל חלק: { bbox: [x0,y0,x1,y1], mt(u, v, mu) → Σμt בנקודה }
const chord = (r, d) => (d < r ? 2 * Math.sqrt(r * r - d * d) : 0);

function rect(cx, cy, w, hgt, t, mat) {
  return { mat, bbox: [cx - w / 2, cy - hgt / 2, cx + w / 2, cy + hgt / 2],
    at: (u, v) => (Math.abs(u - cx) <= w / 2 && Math.abs(v - cy) <= hgt / 2 ? t : 0) };
}
function ellipse(cx, cy, rx, ry, t, mat) {
  return { mat, bbox: [cx - rx, cy - ry, cx + rx, cy + ry],
    at: (u, v) => (((u - cx) / rx) ** 2 + ((v - cy) / ry) ** 2 <= 1 ? t : 0) };
}
const disk = (cx, cy, r, t, mat) => ellipse(cx, cy, r, r, t, mat);
function ring(cx, cy, R, w, t, mat) {
  return { mat, bbox: [cx - R - w, cy - R - w, cx + R + w, cy + R + w],
    at: (u, v) => (Math.abs(Math.hypot(u - cx, v - cy) - R) <= w / 2 ? t : 0) };
}
// כדור (למשל תפוח): העובי הוא המיתר דרך הכדור
function sphere(cx, cy, r, mat) {
  return { mat, bbox: [cx - r, cy - r, cx + r, cy + r], at: (u, v) => chord(r, Math.hypot(u - cx, v - cy)) };
}
// מוט/צינור שוכב בין שתי נקודות (קפסולה). wall: עובי דופן לצינור חלול
function rod(x1, y1, x2, y2, r, mat, wall = 0) {
  const dx = x2 - x1, dy = y2 - y1, L2 = dx * dx + dy * dy || 1;
  return { mat, bbox: [Math.min(x1, x2) - r, Math.min(y1, y2) - r, Math.max(x1, x2) + r, Math.max(y1, y2) + r],
    at: (u, v) => {
      const k = Math.max(0, Math.min(1, ((u - x1) * dx + (v - y1) * dy) / L2));
      const d = Math.hypot(u - x1 - k * dx, v - y1 - k * dy);
      return wall ? chord(r, d) - chord(r - wall, d) : chord(r, d);
    } };
}
// הפנים של צינור/בקבוק שוכב (רק החלק שבתוך הדופן) — לתוכן כמו מים או דבש
const rodInside = (x1, y1, x2, y2, r, wall, mat) => rod(x1, y1, x2, y2, r - wall, mat);
// דיסקית שעומדת על הצד (מכסה של צנצנת שוכבת): רואים פס דק, והקרן עוברת לאורך הדיסקית
function edgeDisk(cx, cy, r, sheet, mat) {
  const w = 0.15;
  return { mat, bbox: [cx - w / 2, cy - r, cx + w / 2, cy + r],
    at: (u, v) => (Math.abs(u - cx) <= w / 2 ? chord(r, Math.abs(v - cy)) * (sheet / w) : 0) };
}
function poly(points, t, mat) {
  const xs = points.map((p) => p[0]), ys = points.map((p) => p[1]);
  return { mat, bbox: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)],
    at: (u, v) => {
      let inside = false;
      for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        const [xi, yi] = points[i], [xj, yj] = points[j];
        if ((yi > v) !== (yj > v) && u < ((xj - xi) * (v - yi)) / (yj - yi) + xi) inside = !inside;
      }
      return inside ? t : 0;
    } };
}

// ---------- ספריית החפצים ----------
function key(x, y, rot) {
  const c = Math.cos(rot), s = Math.sin(rot);
  const T = ([a, b]) => [x + a * c - b * s, y + a * s + b * c];
  const blade = [[0, -0.45], [5, -0.45], [5.2, 0], [4.6, 0.45], [4.2, 0.2], [3.8, 0.45], [3.3, 0.2], [2.8, 0.45], [0, 0.45]].map(T);
  const [hx, hy] = T([-1.3, 0]);
  return [poly(blade, 0.2, 'steel'), ring(hx, hy, 1.0, 0.75, 0.2, 'steel')];
}

export const ITEMS = {
  shirt: { label: 'חולצה מקופלת', w: 28, h: 22, parts: () => [
    rect(0, 0, 28, 22, 2, 'cloth'),
    ...[-7, -2, 3, 8].map((v) => disk(0, v, 0.55, 0.25, 'plastic')),
  ] },
  sandwich: { label: 'כריך', w: 12, h: 11, parts: () => [
    rect(0, 0, 12, 11, 4, 'bread'), rect(0, 0, 10.5, 9.5, 0.6, 'water'),
  ] },
  apple: { label: 'תפוח', w: 8, h: 8, parts: () => [sphere(0, 0, 4, 'apple'), rod(0, -3.6, 0.4, -4.6, 0.15, 'wood')] },
  bottleFull: { label: 'בקבוק מים מלא', w: 24, h: 7, parts: () => [
    rod(-10, 0, 9, 0, 3.4, 'pet', 0.03), rodInside(-10, 0, 9, 0, 3.4, 0.03, 'water'),
    rod(9.6, 0, 11.2, 0, 1.4, 'plastic', 0.15),
  ] },
  bottleEmpty: { label: 'בקבוק ריק', w: 24, h: 7, parts: () => [
    rod(-10, 0, 9, 0, 3.4, 'pet', 0.03), rod(9.6, 0, 11.2, 0, 1.4, 'plastic', 0.15),
  ] },
  book: { label: 'ספר עבה', w: 22, h: 15, parts: () => [rect(0, 0, 22, 15, 3.5, 'paper')] },
  notebook: { label: 'מחברת עם ספירלה', w: 21, h: 15, parts: () => [
    rect(0.6, 0, 20, 15, 0.5, 'paper'),
    ...Array.from({ length: 14 }, (_, i) => ring(-10, -6.5 + i, 0.45, 0.08, 0.08, 'steel')),
  ] },
  pencilCase: { label: 'קלמר עם עפרונות', w: 20, h: 6, parts: () => [
    rect(0, 0, 20, 6, 2.5, 'cloth'),
    ...[-1.8, -0.6, 0.6, 1.8].map((v) => rod(-8, v, 8, v, 0.35, 'wood')),
    rect(7.5, 1.6, 1.8, 1.4, 1, 'aluminum'),
    ...Array.from({ length: 38 }, (_, i) => rect(-9.5 + i * 0.5, -3, 0.25, 0.3, 0.12, 'steel')),
  ] },
  ruler: { label: 'סרגל מתכת', w: 30, h: 2.6, parts: () => [rect(0, 0, 30, 2.6, 0.12, 'steel')] },
  calculator: { label: 'מחשבון', w: 15, h: 8, parts: () => [
    rect(0, 0, 15, 8, 1.2, 'plastic'), disk(5, -2, 1, 0.3, 'steel'), rect(-1, 0, 9, 6, 0.01, 'copper'),
  ] },
  laptop: { label: 'מחשב נייד', w: 33, h: 23, parts: () => [
    rect(0, 0, 33, 23, 1.6, 'plastic'), rect(0, 0, 33, 23, 0.12, 'aluminum'),
    rect(0, 6.5, 26, 7, 0.7, 'aluminum'), rect(-4, -4, 14, 9, 0.01, 'copper'),
    ring(9, -5, 2.4, 0.4, 0.6, 'aluminum'),
    ...[[-15.5, -10.5], [15.5, -10.5], [-15.5, 10.5], [15.5, 10.5], [0, -10.5]].map(([x, y]) => disk(x, y, 0.3, 0.6, 'steel')),
    rod(-12, -11.2, -7, -11.2, 0.5, 'steel', 0.08), rod(7, -11.2, 12, -11.2, 0.5, 'steel', 0.08),
  ] },
  charger: { label: 'מטען', w: 16, h: 6, parts: () => [
    rect(0, 0, 6, 6, 3, 'plastic'), rect(0, 0, 2.6, 2.6, 2, 'steel'),
    rod(3, 0, 8, 1.5, 0.08, 'copper'), rod(8, 1.5, 11, -1, 0.08, 'copper'),
    rod(3, 0, 8, 1.5, 0.25, 'plastic'), rod(8, 1.5, 11, -1, 0.25, 'plastic'),
  ] },
  phone: { label: 'טלפון', w: 15, h: 7.2, parts: () => [
    rect(0, 0, 15, 7.2, 0.1, 'glass'), rect(0, 0, 15, 7.2, 0.6, 'plastic'),
    rect(0.5, 0, 9, 5.6, 0.45, 'aluminum'), disk(-5.8, -2.2, 0.6, 0.4, 'steel'),
  ] },
  headphones: { label: 'אוזניות', w: 20, h: 9, parts: () => [
    rod(-7, 0, -3, -3.5, 0.6, 'plastic'), rod(-3, -3.5, 3, -3.5, 0.6, 'plastic'), rod(3, -3.5, 7, 0, 0.6, 'plastic'),
    disk(-7, 1, 3.4, 2, 'plastic'), disk(7, 1, 3.4, 2, 'plastic'),
    disk(-7, 1, 1.3, 0.35, 'steel'), disk(7, 1, 1.3, 0.35, 'steel'),
  ] },
  keys: { label: 'צרור מפתחות', w: 12, h: 9, parts: () => [
    ring(-3, 0, 1.6, 0.18, 0.2, 'steel'),
    ...key(-1.4, -0.6, -0.35), ...key(-1.4, 0.8, 0.4),
  ] },
  coins: { label: 'מטבעות', w: 8, h: 6, parts: () =>
    [[-2.4, -1], [0, -1.6], [2.2, -0.6], [-1, 1.4], [1.6, 1.8]].map(([x, y], i) => disk(x, y, 1.05 + (i % 3) * 0.12, 0.18, 'copper')) },
  umbrella: { label: 'מטרייה מקופלת', w: 32, h: 5, parts: () => [
    rect(0, 0, 25, 4.4, 0.6, 'plastic'),
    rod(-15, 0, 13, 0, 0.45, 'steel', 0.05),
    ...[-1.6, -0.9, 0.9, 1.6].map((v) => rod(-11, v * 0.4, 12, v, 0.08, 'steel')),
    rod(13, 0, 16, 0, 1.1, 'plastic'),
  ] },
  shoe: { label: 'נעל', w: 27, h: 10, parts: () => [
    poly([[-13, -2], [-10, -4.5], [4, -4.8], [11, -3.5], [13.5, 0], [11, 3.6], [3, 4.6], [-10, 4], [-13, 2]], 2.6, 'rubber'),
    poly([[-9, -3.5], [4, -4], [10, -2.8], [10, 2.8], [3, 3.8], [-9, 3.2]], 4, 'cloth'),
    ...[-1, 1.2, 3.4, 5.6].flatMap((x) => [ring(x, -1.6, 0.35, 0.14, 0.15, 'steel'), ring(x, 1.6, 0.35, 0.14, 0.15, 'steel')]),
  ] },
  sunglasses: { label: 'משקפי שמש', w: 14, h: 5, parts: () => [
    ellipse(-3.3, 0, 2.7, 2, 0.2, 'plastic'), ellipse(3.3, 0, 2.7, 2, 0.2, 'plastic'),
    ring(-3.3, 0, 2.5, 0.35, 0.5, 'plastic'), ring(3.3, 0, 2.5, 0.35, 0.5, 'plastic'),
    rod(-0.7, -0.6, 0.7, -0.6, 0.25, 'plastic'),
    rect(-6.2, -0.6, 0.6, 0.5, 0.4, 'steel'), rect(6.2, -0.6, 0.6, 0.5, 0.4, 'steel'),
  ] },
  honey: { label: 'צנצנת דבש מזכוכית', w: 10, h: 9, parts: () => [
    rod(-4, 0, 4, 0, 4, 'glass', 0.35), rodInside(-4, 0, 3.6, 0, 4, 0.35, 'honey'),
    edgeDisk(4.6, 0, 4.1, 0.03, 'steel'),
  ] },
  teddy: { label: 'בובת פרווה', w: 14, h: 18, parts: () => [
    ellipse(0, 3, 5.5, 6.5, 8, 'stuffing'), disk(0, -6, 4, 7, 'stuffing'),
    disk(-3.2, -9, 1.5, 3, 'stuffing'), disk(3.2, -9, 1.5, 3, 'stuffing'),
    disk(-1.4, -6.6, 0.45, 0.6, 'plastic'), disk(1.4, -6.6, 0.45, 0.6, 'plastic'),
  ] },
  scarf: { label: 'צעיף', w: 26, h: 10, parts: () => [rect(0, 0, 26, 10, 1.8, 'cloth')] },
};

// המזוודה עצמה: בד, רוכסן מסביב, ושני צינורות של ידית טרולי
function bagParts(W, H) {
  const parts = [rect(W / 2, H / 2, W, H, 0.6, 'cloth')];
  for (let x = 1; x < W - 1; x += 0.5) parts.push(rect(x, 0.8, 0.22, 0.35, 0.1, 'steel'), rect(x, H - 0.8, 0.22, 0.35, 0.1, 'steel'));
  for (let y = 1.3; y < H - 1; y += 0.5) parts.push(rect(0.8, y, 0.35, 0.22, 0.1, 'steel'), rect(W - 0.8, y, 0.35, 0.22, 0.1, 'steel'));
  parts.push(rod(4, 3, W - 4, 3, 0.9, 'aluminum', 0.12), rod(4, H - 3, W - 4, H - 3, 0.9, 'aluminum', 0.12));
  return parts;
}

// ---------- חישוב הצילום ----------
const BAG_W = 60, BAG_H = 40;
const PX = 14; // פיקסלים לס״מ

const LOOKS = [
  { id: 'clear', label: 'כמעט לא רואים' },
  { id: 'faint', label: 'רואים חלש' },
  { id: 'strong', label: 'רואים חזק' },
];
// איך חפץ "נראה": לפי עשרת האחוזים הכהים ביותר של שטחו — מה שהעין קולטת ראשון
const lookOf = (darkT) => (darkT > 0.85 ? 'clear' : darkT > 0.45 ? 'faint' : 'strong');

function placeParts(placed) {
  const def = ITEMS[placed.item];
  const a = ((placed.rot ?? 0) * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
  return def.parts().map((p) => {
    // bbox בעולם: ארבע הפינות של bbox המקומי אחרי סיבוב
    const [x0, y0, x1, y1] = p.bbox;
    const pts = [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].map(([u, v]) => [placed.x + u * c - v * s, placed.y + u * s + v * c]);
    return {
      mat: p.mat,
      bbox: [Math.min(...pts.map((q) => q[0])), Math.min(...pts.map((q) => q[1])), Math.max(...pts.map((q) => q[0])), Math.max(...pts.map((q) => q[1]))],
      at: (X, Y) => { const dx = X - placed.x, dy = Y - placed.y; return p.at(dx * c + dy * s, -dx * s + dy * c); },
    };
  });
}

// מסכם μt לתוך מערך, רק בתחום ה-bbox של כל חלק
function accumulate(parts, mu, buf, W, Hpx) {
  for (const p of parts) {
    const m = mu[p.mat];
    const i0 = Math.max(0, Math.floor(p.bbox[0] * PX)), i1 = Math.min(W - 1, Math.ceil(p.bbox[2] * PX));
    const j0 = Math.max(0, Math.floor(p.bbox[1] * PX)), j1 = Math.min(Hpx - 1, Math.ceil(p.bbox[3] * PX));
    for (let j = j0; j <= j1; j++) {
      const Y = (j + 0.5) / PX;
      for (let i = i0; i <= i1; i++) {
        const t = p.at((i + 0.5) / PX, Y);
        if (t > 0) buf[j * W + i] += m * t;
      }
    }
  }
}

export function scanBag(bag, materials) {
  const mu = Object.fromEntries(Object.entries(materials).map(([k, m]) => [k, m.muRho * m.density]));
  const W = BAG_W * PX, Hpx = BAG_H * PX;
  const total = new Float32Array(W * Hpx);
  accumulate(bagParts(BAG_W, BAG_H), mu, total, W, Hpx);
  const items = bag.items.map((placed) => {
    const parts = placeParts(placed);
    const own = new Float32Array(W * Hpx);
    accumulate(parts, mu, own, W, Hpx);
    for (let k = 0; k < own.length; k++) total[k] += own[k];
    // מראה החפץ לבד: הקרינה שעוברת בעשרת האחוזים הכהים ביותר של שטחו
    const vals = [];
    for (let k = 0; k < own.length; k++) if (own[k] > 0.002) vals.push(own[k]);
    vals.sort((p, q) => q - p);
    const darkT = Math.exp(-(vals[Math.floor(vals.length * 0.1)] ?? 0));
    const bb = parts.reduce((b, p) => [Math.min(b[0], p.bbox[0]), Math.min(b[1], p.bbox[1]), Math.max(b[2], p.bbox[2]), Math.max(b[3], p.bbox[3])], [Infinity, Infinity, -Infinity, -Infinity]);
    return { ...placed, label: ITEMS[placed.item].label, look: lookOf(darkT), darkT, bbox: bb };
  });
  return { W, H: Hpx, total, items };
}

// ---------- הרכיב ----------
/**
 * @param {object} opts
 * @param {object} opts.materials  content/scanner.json → materials
 * @param {Array}  opts.bags       content/scanner.json → bags
 */
export function createBagScanner({ materials, bags }) {
  let index = 0;
  let scan = null;
  let guesses = {};
  let scanned = false;
  let highlight = null;

  const title = h('h2', { class: 'bs-title' });
  const counter = h('span', { class: 'bs-counter' });
  const list = h('ol', { class: 'bs-items' });
  const scanBtn = h('button', { type: 'button', class: 'btn btn-primary', text: 'העבירו בסורק' });
  const hint = h('p', { class: 'bs-hint muted' });
  const lesson = h('p', { class: 'bs-lesson', hidden: true, role: 'status' });
  const nextBtn = h('button', { type: 'button', class: 'btn', hidden: true });

  const image = h('canvas', { class: 'bs-image', role: 'img' });
  const overlay = h('canvas', { class: 'bs-overlay', 'aria-hidden': 'true' });
  const screen = h('div', { class: 'bs-screen' },
    h('div', { class: 'bs-screen-frame' }, image, overlay,
      h('div', { class: 'bs-empty', text: 'המסך של הסורק. המזוודה עוד לא עברה.' })),
  );
  const tunnel = h('div', { class: 'bs-belt', 'aria-hidden': 'true' },
    h('div', { class: 'bs-tunnel' }), h('div', { class: 'bs-bag' }));

  const main = h('div', { class: 'bs-main' }, tunnel, screen);
  const el = h('div', { class: 'bs' },
    h('div', { class: 'bs-head' }, title, counter),
    h('div', { class: 'bs-body' },
      main,
      h('div', { class: 'bs-side' },
        h('p', { class: 'bs-intro', text: 'אלה החפצים במזוודה. לפני הסריקה — נחשו: כמה כל אחד מהם ייראה בצילום?' }),
        list, h('div', { class: 'btn-row' }, scanBtn), hint, lesson, h('div', { class: 'btn-row' }, nextBtn)),
    ),
  );

  function load(i) {
    index = i;
    const bag = bags[i];
    scan = scanBag(bag, materials);
    guesses = {};
    scanned = false;
    highlight = null;
    title.textContent = bag.title;
    counter.textContent = `מזוודה ${i + 1} מתוך ${bags.length}`;
    lesson.hidden = true;
    nextBtn.hidden = true;
    screen.classList.remove('is-on');
    el.classList.remove('is-scanned');
    image.width = overlay.width = scan.W;
    image.height = overlay.height = scan.H;
    image.getContext('2d').clearRect(0, 0, scan.W, scan.H);
    overlay.getContext('2d').clearRect(0, 0, scan.W, scan.H);
    image.setAttribute('aria-label', `צילום רנטגן של ${bag.title}`);
    renderList();
    update();
  }

  function renderList() {
    list.replaceChildren(...scan.items.map((it, k) => {
      const name = `${bags[index].id}-${k}`;
      const options = LOOKS.map((lk) => h('label', { class: 'bs-opt' },
        h('input', { type: 'radio', name, value: lk.id, checked: guesses[k] === lk.id, disabled: scanned,
          onchange: () => { guesses[k] = lk.id; update(); } }),
        h('span', { text: lk.label })));
      const result = scanned && h('div', { class: `bs-result ${guesses[k] === it.look ? 'is-right' : 'is-surprise'}` },
        h('span', { text: guesses[k] === it.look ? 'צדקתם: ' : 'הפתעה! ' }),
        LOOKS.find((l) => l.id === it.look).label,
        h('button', { type: 'button', class: 'bs-show', 'aria-pressed': String(highlight === k), text: 'הראו לי',
          onclick: () => { highlight = highlight === k ? null : k; drawOverlay(); renderList(); } }));
      return h('li', { class: `bs-item${highlight === k ? ' is-highlight' : ''}` },
        h('div', { class: 'bs-item-name', text: it.label }),
        h('fieldset', { class: 'bs-opts' }, h('legend', { class: 'visually-hidden', text: `כמה ${it.label} ייראה בצילום?` }), options),
        result);
    }));
  }

  function update() {
    const left = scan.items.length - Object.keys(guesses).length;
    scanBtn.disabled = scanned || left > 0;
    scanBtn.hidden = scanned;
    hint.textContent = scanned ? '' : left > 0 ? `נשארו ${left} חפצים לנחש.` : 'מוכנים? העבירו את המזוודה בסורק.';
  }

  function drawImage() {
    const ctx = image.getContext('2d');
    const img = ctx.createImageData(scan.W, scan.H);
    let seed = 11;
    for (let k = 0; k < scan.total.length; k++) {
      seed = (seed * 16807) % 2147483647;
      const T = Math.exp(-scan.total[k]);
      const g = 248 * T ** 0.75 + ((seed / 2147483647) - 0.5) * 6;
      img.data[k * 4] = g; img.data[k * 4 + 1] = g; img.data[k * 4 + 2] = g + 3; img.data[k * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }

  function drawOverlay() {
    const ctx = overlay.getContext('2d');
    ctx.clearRect(0, 0, overlay.width, overlay.height);
    if (highlight == null) return;
    const [x0, y0, x1, y1] = scan.items[highlight].bbox.map((v) => v * PX);
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#e0a300';
    ctx.setLineDash([18, 10]);
    ctx.strokeRect(x0 - 8, y0 - 8, x1 - x0 + 16, y1 - y0 + 16);
  }

  scanBtn.addEventListener('click', () => {
    scanned = true;
    update();
    drawImage();
    const done = () => {
      el.classList.add('is-scanned');
      renderList();
      lesson.textContent = bags[index].lesson;
      lesson.hidden = false;
      nextBtn.textContent = index < bags.length - 1 ? 'למזוודה הבאה' : 'מההתחלה';
      nextBtn.hidden = false;
    };
    screen.classList.add('is-on');
    // בנייד המסך נמצא מעל הרשימה — לגלול אליו כדי לראות את הסריקה
    if (main.getBoundingClientRect().top < 0) main.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
    if (prefersReducedMotion()) { done(); return; }
    // המזוודה נוסעת על המסוע, והצילום נבנה פס אחרי פס (כמו בסורק אמיתי)
    el.classList.add('is-scanning');
    image.style.clipPath = 'inset(0 0 0 100%)';
    const t0 = performance.now(), dur = 1800;
    const step = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      image.style.clipPath = `inset(0 0 0 ${100 - p * 100}%)`;
      if (p < 1) requestAnimationFrame(step);
      else { image.style.clipPath = ''; el.classList.remove('is-scanning'); done(); }
    };
    requestAnimationFrame(step);
  });
  nextBtn.addEventListener('click', () => {
    load((index + 1) % bags.length);
    el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
  });

  load(0);
  return { el };
}
