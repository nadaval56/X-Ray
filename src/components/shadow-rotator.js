// צורה וצל: גוף תלת-ממדי שאפשר לסובב בחופשיות, מקור קרינה מלמעלה, והצל (ההיטל) שלו על הגלאי למטה.
//
// בלי ספריות: רשת משולשים פשוטה, מטריצות סיבוב 3×3, וציור על <canvas>.
// הצל הוא היטל אמיתי: לכל פיקסל בגלאי מחשבים כמה חומר יש בדרך (עובי לאורך קרן אנכית),
// ממירים לגוון כמו בצילום רנטגן — יותר חומר = בהיר יותר.
//
// עובי לאורך קרן: הקרן נכנסת לגוף דרך פאות שפונות למעלה ויוצאת דרך פאות שפונות למטה.
// לכל פיקסל מסכמים +y של כל פאת כניסה ו-−y של כל פאת יציאה, וזה בדיוק אורך הקטעים שבתוך הגוף —
// נכון גם לגופים לא קמורים (טבעת, צורת L). דורש רשת סגורה עם נורמלים כלפי חוץ.
//
// פישוט: הקרניים מקבילות (מקור רחוק). במכשיר אמיתי הקרניים יוצאות מנקודה, והצל מוגדל מעט.

import { h, prefersReducedMotion } from '../lib/dom.js';

// ---------- מתמטיקה ----------
const I3 = () => [1, 0, 0, 0, 1, 0, 0, 0, 1];
const mul = (a, b) => {
  const r = new Array(9);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
    r[i * 3 + j] = a[i * 3] * b[j] + a[i * 3 + 1] * b[3 + j] + a[i * 3 + 2] * b[6 + j];
  }
  return r;
};
const apply = (m, v) => [
  m[0] * v[0] + m[1] * v[1] + m[2] * v[2],
  m[3] * v[0] + m[4] * v[1] + m[5] * v[2],
  m[6] * v[0] + m[7] * v[1] + m[8] * v[2],
];
const transpose = (m) => [m[0], m[3], m[6], m[1], m[4], m[7], m[2], m[5], m[8]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = (v) => { const l = Math.hypot(...v) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
function axisAngle([x, y, z], t) {
  const c = Math.cos(t), s = Math.sin(t), k = 1 - c;
  return [
    c + x * x * k, x * y * k - z * s, x * z * k + y * s,
    y * x * k + z * s, c + y * y * k, y * z * k - x * s,
    z * x * k - y * s, z * y * k + x * s, c + z * z * k,
  ];
}
// מתקן סטייה מספרית אחרי הרבה סיבובים (גרם-שמידט על השורות)
function orthonormalize(m) {
  const a = norm([m[0], m[1], m[2]]);
  let b = [m[3], m[4], m[5]];
  const d = dot(a, b);
  b = norm([b[0] - d * a[0], b[1] - d * a[1], b[2] - d * a[2]]);
  const c = cross(a, b);
  return [...a, ...b, ...c];
}

// ---------- גופים ----------
// כל גוף: { verts, tris } עם נורמלים כלפי חוץ. tri(a,b,c,hint) הופך את סדר הקודקודים
// אם הנורמל לא פונה לכיוון hint (וקטור "החוצה" ידוע לאותה פאה).
function mesh() {
  const verts = [];
  const tris = [];
  const v = (x, y, z) => verts.push([x, y, z]) - 1;
  const tri = (a, b, c, hint) => {
    const n = cross(sub(verts[b], verts[a]), sub(verts[c], verts[a]));
    tris.push(dot(n, hint) >= 0 ? [a, b, c] : [a, c, b]);
  };
  const quad = (a, b, c, d, hint) => { tri(a, b, c, hint); tri(a, c, d, hint); };
  const centroid = (...ids) => ids.reduce((s, i) => [s[0] + verts[i][0] / ids.length, s[1] + verts[i][1] / ids.length, s[2] + verts[i][2] / ids.length], [0, 0, 0]);
  return { verts, tris, v, tri, quad, centroid };
}

function box(hx, hy, hz) {
  const m = mesh();
  const p = [];
  for (const x of [-hx, hx]) for (const y of [-hy, hy]) for (const z of [-hz, hz]) p.push(m.v(x, y, z));
  const at = (i, j, k) => p[i * 4 + j * 2 + k];
  const faces = [
    [at(0, 0, 0), at(0, 1, 0), at(0, 1, 1), at(0, 0, 1)], [at(1, 0, 0), at(1, 1, 0), at(1, 1, 1), at(1, 0, 1)],
    [at(0, 0, 0), at(1, 0, 0), at(1, 0, 1), at(0, 0, 1)], [at(0, 1, 0), at(1, 1, 0), at(1, 1, 1), at(0, 1, 1)],
    [at(0, 0, 0), at(1, 0, 0), at(1, 1, 0), at(0, 1, 0)], [at(0, 0, 1), at(1, 0, 1), at(1, 1, 1), at(0, 1, 1)],
  ];
  for (const f of faces) m.quad(...f, m.centroid(...f));
  return m;
}

// גוף סיבוב סביב ציר y: פרופיל של נקודות [r, y] מלמטה למעלה; r=0 בקצה = חוד או מרכז מכסה
function lathe(profile, n = 40) {
  const m = mesh();
  const rings = profile.map(([r, y]) => (r === 0
    ? [m.v(0, y, 0)]
    : Array.from({ length: n }, (_, i) => m.v(r * Math.cos((2 * Math.PI * i) / n), y, r * Math.sin((2 * Math.PI * i) / n)))));
  for (let k = 0; k < rings.length - 1; k++) {
    const A = rings[k], B = rings[k + 1];
    for (let i = 0; i < n; i++) {
      const i2 = (i + 1) % n;
      const ang = (2 * Math.PI * (i + 0.5)) / n;
      // כיוון "החוצה": רדיאלי, עם הטיה לפי שיפוע הפרופיל
      const [r0, y0] = profile[k], [r1, y1] = profile[k + 1];
      const hint = [Math.cos(ang) * (y1 - y0), -(r1 - r0), Math.sin(ang) * (y1 - y0)];
      if (A.length === 1) m.tri(A[0], B[i], B[i2], hint);
      else if (B.length === 1) m.tri(A[i], A[i2], B[0], hint);
      else m.quad(A[i], A[i2], B[i2], B[i], hint);
    }
  }
  // מכסים לטבעות קצה שאינן חוד
  const cap = (ring, y, up) => {
    if (ring.length === 1) return;
    const c = m.v(0, y, 0);
    for (let i = 0; i < n; i++) m.tri(c, ring[i], ring[(i + 1) % n], [0, up ? 1 : -1, 0]);
  };
  cap(rings[0], profile[0][1], false);
  cap(rings.at(-1), profile.at(-1)[1], true);
  return m;
}

function sphere(r = 0.95, nu = 36, nv = 20) {
  const prof = [[0, -r]];
  for (let j = 1; j < nv; j++) {
    const t = -Math.PI / 2 + (Math.PI * j) / nv;
    prof.push([r * Math.cos(t), r * Math.sin(t)]);
  }
  prof.push([0, r]);
  return lathe(prof, nu);
}

function torus(R = 0.68, r = 0.3, nu = 40, nv = 18) {
  const m = mesh();
  const id = [];
  for (let i = 0; i < nu; i++) {
    const u = (2 * Math.PI * i) / nu;
    id.push([]);
    for (let j = 0; j < nv; j++) {
      const w = (2 * Math.PI * j) / nv;
      id[i].push(m.v((R + r * Math.cos(w)) * Math.cos(u), r * Math.sin(w), (R + r * Math.cos(w)) * Math.sin(u)));
    }
  }
  for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
    const i2 = (i + 1) % nu, j2 = (j + 1) % nv;
    const u = (2 * Math.PI * (i + 0.5)) / nu, w = (2 * Math.PI * (j + 0.5)) / nv;
    const hint = [Math.cos(w) * Math.cos(u), Math.sin(w), Math.cos(w) * Math.sin(u)];
    m.quad(id[i][j], id[i2][j], id[i2][j2], id[i][j2], hint);
  }
  return m;
}

// מנסרה מצולע (x,z) בעובי 2·hy — לצורת L
function prism(poly, hy) {
  const m = mesh();
  const lo = poly.map(([x, z]) => m.v(x, -hy, z));
  const hi = poly.map(([x, z]) => m.v(x, hy, z));
  const area = poly.reduce((s, [x, z], i) => { const [x2, z2] = poly[(i + 1) % poly.length]; return s + x * z2 - x2 * z; }, 0);
  for (let i = 0; i < poly.length; i++) {
    const i2 = (i + 1) % poly.length;
    const dx = poly[i2][0] - poly[i][0], dz = poly[i2][1] - poly[i][1];
    const out = area > 0 ? [dz, 0, -dx] : [-dz, 0, dx];
    m.quad(lo[i], lo[i2], hi[i2], hi[i], out);
  }
  return { m, lo, hi };
}
function lShape() {
  // L: מצולע עם 6 קודקודים, מחולק ידנית לשני מלבנים למכסים
  const P = [[-0.8, -0.8], [0.8, -0.8], [0.8, -0.3], [-0.3, -0.3], [-0.3, 0.8], [-0.8, 0.8]];
  const { m, lo, hi } = prism(P, 0.25);
  for (const [ring, up] of [[hi, 1], [lo, -1]]) {
    m.quad(ring[0], ring[1], ring[2], ring[3], [0, up, 0]);
    m.quad(ring[0], ring[3], ring[4], ring[5], [0, up, 0]);
  }
  return m;
}

function pyramid() {
  const m = mesh();
  const b = [[-0.8, -0.8], [0.8, -0.8], [0.8, 0.8], [-0.8, 0.8]].map(([x, z]) => m.v(x, -0.6, z));
  const apex = m.v(0, 0.95, 0);
  m.quad(b[0], b[1], b[2], b[3], [0, -1, 0]);
  for (let i = 0; i < 4; i++) {
    const i2 = (i + 1) % 4;
    m.tri(b[i], b[i2], apex, m.centroid(b[i], b[i2], apex));
  }
  return m;
}

export const SHAPES = [
  { id: 'coin', label: 'מטבע', make: () => lathe([[0.95, -0.07], [0.95, 0.07]]) },
  { id: 'cube', label: 'קובייה', make: () => box(0.7, 0.7, 0.7) },
  { id: 'cylinder', label: 'גליל', make: () => lathe([[0.5, -0.9], [0.5, 0.9]]) },
  { id: 'cone', label: 'חרוט', make: () => lathe([[0.8, -0.7], [0, 0.95]]) },
  { id: 'pyramid', label: 'פירמידה', make: pyramid },
  { id: 'sphere', label: 'כדור', make: () => sphere() },
  { id: 'ring', label: 'טבעת', make: () => torus() },
  { id: 'l', label: 'צורת L', make: lShape },
];

// ---------- סצנה ----------
const PLATE_Y = -1.6;   // גובה הגלאי
const PLATE = 1.4;      // חצי רוחב הגלאי
const SOURCE_Y = 2.35;  // גובה מקור הקרינה
const N = 300;          // רזולוציית הצל (פיקסלים לכל צד)
const MU = 1.15;        // "בליעה" ליחידת עובי — לגוון בלבד
const VIEW = mul(axisAngle([1, 0, 0], 0.4), axisAngle([0, 1, 0], -0.55)); // מצלמה: קצת מלמעלה ומהצד
const VIEW_T = transpose(VIEW);

/**
 * @param {object} [opts]
 * @param {string} [opts.idPrefix='sr']
 */
export function createShadowRotator({ idPrefix = 'sr' } = {}) {
  let shape = SHAPES[0];
  let geo = shape.make();
  let R = I3();
  let world = [];        // קודקודים אחרי סיבוב
  let anim = 0;

  // קנבסים
  const scene = h('canvas', {
    class: 'sr-scene',
    width: 840,
    height: 760,
    tabindex: '0',
    role: 'img',
    'aria-label': 'הצורה, מקור הקרינה מעליה והגלאי מתחתיה. גררו כדי לסובב את הצורה, או השתמשו בחיצים.',
  });
  const sctx = scene.getContext('2d');
  const shadow = h('canvas', { width: N, height: N });
  const shctx = shadow.getContext('2d');
  const shadowImg = shctx.createImageData(N, N);
  const thick = new Float32Array(N * N);
  const detector = h('canvas', { class: 'sr-detector', width: N * 2, height: N * 2, role: 'img', 'aria-label': 'הצל של הצורה על הגלאי — כך היא נראית בצילום' });
  const dctx = detector.getContext('2d');

  // פקדים
  const picker = h('fieldset', {},
    h('legend', { text: 'צורה' }),
    h('div', { class: 'chip-row' }, SHAPES.map((sh) => h('label', { class: 'chip' },
      h('input', { type: 'radio', name: `${idPrefix}-shape`, value: sh.id, checked: sh === shape, onchange: () => setShape(sh) }),
      sh.label,
    ))),
  );
  const turn = (axis, label) => h('button', { type: 'button', class: 'btn', text: label, onclick: () => rotateBy(axis, Math.PI / 4) });
  const buttons = h('div', { class: 'sr-buttons' },
    turn([0, 1, 0], 'סיבוב 45°'),
    turn([1, 0, 0], 'הטיה קדימה 45°'),
    turn([0, 0, 1], 'הטיה הצידה 45°'),
    h('button', { type: 'button', class: 'btn btn-ghost', text: 'איפוס', onclick: () => { cancelAnimationFrame(anim); R = I3(); render(); } }),
  );
  const snaps = h('div', { class: 'sr-snaps', 'aria-live': 'polite' });
  const snapBtn = h('button', { type: 'button', class: 'btn', text: 'שמירת צילום', onclick: snapshot });

  const el = h('div', { class: 'sr' },
    picker,
    h('div', { class: 'sr-stage' },
      h('figure', { class: 'sr-fig' }, scene, h('figcaption', { text: 'גררו את הצורה כדי לסובב אותה לכל כיוון.' })),
      h('figure', { class: 'sr-fig' }, detector, h('figcaption', { text: 'מה רואים בצילום: הצל על הגלאי. יותר חומר בדרך = בהיר יותר.' })),
    ),
    h('div', { class: 'sr-controls' },
      h('div', {}, h('p', { class: 'sim-label', text: 'סיבוב' }), buttons),
      h('div', {},
        h('p', { class: 'sim-label', text: 'צילומים שמורים (עד 3) — כמו רופא שמצלם מכמה כיוונים' }),
        h('div', { class: 'sr-snap-row' }, snapBtn, snaps)),
    ),
  );

  function setShape(sh) {
    shape = sh;
    geo = sh.make();
    snaps.replaceChildren();
    render();
  }

  // ---------- סיבוב ----------
  const rotateNow = (axis, ang) => { R = orthonormalize(mul(axisAngle(axis, ang), R)); };
  function rotateBy(axis, total) {
    cancelAnimationFrame(anim);
    if (prefersReducedMotion()) { rotateNow(axis, total); render(); return; }
    const t0 = performance.now(), dur = 350;
    let done = 0;
    const step = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      const eased = 1 - (1 - p) ** 3;
      rotateNow(axis, total * eased - done);
      done = total * eased;
      render();
      if (p < 1) anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
  }

  // גרירה: אופקית — סביב הציר האנכי של המסך; אנכית — סביב הציר האופקי של המסך
  const screenUp = apply(VIEW_T, [0, 1, 0]);
  const screenRight = apply(VIEW_T, [1, 0, 0]);
  let drag = null;
  scene.addEventListener('pointerdown', (e) => {
    cancelAnimationFrame(anim);
    drag = { x: e.clientX, y: e.clientY };
    scene.setPointerCapture(e.pointerId);
    scene.classList.add('is-dragging');
  });
  scene.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const k = (2.6 * Math.PI) / scene.getBoundingClientRect().width; // רוחב הקנבס ≈ 1.3 סיבובים
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    drag = { x: e.clientX, y: e.clientY };
    if (dx) rotateNow(screenUp, dx * k);
    if (dy) rotateNow(screenRight, dy * k);
    render();
  });
  const endDrag = () => { drag = null; scene.classList.remove('is-dragging'); };
  scene.addEventListener('pointerup', endDrag);
  scene.addEventListener('pointercancel', endDrag);
  scene.addEventListener('keydown', (e) => {
    const a = (e.shiftKey ? 45 : 15) * (Math.PI / 180);
    const moves = { ArrowLeft: [screenUp, -a], ArrowRight: [screenUp, a], ArrowUp: [screenRight, -a], ArrowDown: [screenRight, a] };
    if (!moves[e.key]) return;
    e.preventDefault();
    rotateBy(...moves[e.key]);
  });

  // ---------- הצל ----------
  function computeShadow() {
    thick.fill(0);
    const s = N / (2 * PLATE);
    for (const [a, b, c] of geo.tris) {
      const A = world[a], B = world[b], C = world[c];
      const ny = (B[2] - A[2]) * (C[0] - A[0]) - (B[0] - A[0]) * (C[2] - A[2]); // רכיב y של הנורמל
      if (Math.abs(ny) < 1e-12) continue;
      const sign = ny > 0 ? 1 : -1; // פונה למעלה = כניסה (+y), למטה = יציאה (−y)
      const ax = (A[0] + PLATE) * s, az = (A[2] + PLATE) * s;
      const bx = (B[0] + PLATE) * s, bz = (B[2] + PLATE) * s;
      const cx = (C[0] + PLATE) * s, cz = (C[2] + PLATE) * s;
      const area = (bx - ax) * (cz - az) - (bz - az) * (cx - ax);
      if (Math.abs(area) < 1e-12) continue;
      const x0 = Math.max(0, Math.floor(Math.min(ax, bx, cx))), x1 = Math.min(N - 1, Math.ceil(Math.max(ax, bx, cx)));
      const z0 = Math.max(0, Math.floor(Math.min(az, bz, cz))), z1 = Math.min(N - 1, Math.ceil(Math.max(az, bz, cz)));
      // נקודת הדגימה מוזזת מעט ממרכז הפיקסל, כדי שלא תיפול בדיוק על צלע משותפת לשני משולשים
      // (אחרת היא נספרת פעמיים ונוצרים קווים בצל)
      for (let j = z0; j <= z1; j++) {
        const pz = j + 0.5 + 1.37e-4;
        for (let i = x0; i <= x1; i++) {
          const px = i + 0.5 + 2.91e-4;
          const w0 = ((cx - bx) * (pz - bz) - (cz - bz) * (px - bx)) / area;
          const w1 = ((ax - cx) * (pz - cz) - (az - cz) * (px - cx)) / area;
          const w2 = 1 - w0 - w1;
          if (w0 < 0 || w1 < 0 || w2 < 0) continue;
          thick[j * N + i] += sign * (w0 * A[1] + w1 * B[1] + w2 * C[1]);
        }
      }
    }
    const d = shadowImg.data;
    for (let p = 0, q = 0; p < thick.length; p++, q += 4) {
      const v = 1 - Math.exp(-MU * Math.max(0, thick[p]));
      const g = 14 + v * 241;
      d[q] = g; d[q + 1] = g; d[q + 2] = g + (1 - v) * 6; d[q + 3] = 255;
    }
    shctx.putImageData(shadowImg, 0, 0);
  }

  // ---------- ציור הסצנה ----------
  const W = scene.width, H = scene.height;
  const S = 150;                          // פיקסלים ליחידה
  const CX = W / 2, CY = H * 0.47;
  const toScreen = (p) => { const q = apply(VIEW, p); return [CX + S * q[0], CY - S * q[1], q[2]]; };
  const LIGHT = norm([-0.45, 0.75, 0.5]);

  function drawScene() {
    sctx.setTransform(1, 0, 0, 1, 0, 0);
    sctx.clearRect(0, 0, W, H);

    // הגלאי, עם הצל עליו (מיפוי אפיני — מדויק בהטלה מקבילה)
    const P0 = toScreen([-PLATE, PLATE_Y, -PLATE]);
    const P1 = toScreen([PLATE, PLATE_Y, -PLATE]);
    const P2 = toScreen([-PLATE, PLATE_Y, PLATE]);
    const P3 = toScreen([PLATE, PLATE_Y, PLATE]);
    sctx.save();
    sctx.setTransform((P1[0] - P0[0]) / N, (P1[1] - P0[1]) / N, (P2[0] - P0[0]) / N, (P2[1] - P0[1]) / N, P0[0], P0[1]);
    sctx.drawImage(shadow, 0, 0);
    sctx.restore();
    // מסגרת ועובי לגלאי
    sctx.lineWidth = 3;
    sctx.strokeStyle = '#36404d';
    sctx.beginPath();
    sctx.moveTo(P0[0], P0[1]); sctx.lineTo(P1[0], P1[1]); sctx.lineTo(P3[0], P3[1]); sctx.lineTo(P2[0], P2[1]); sctx.closePath();
    sctx.stroke();
    sctx.fillStyle = '#1c222b';
    sctx.beginPath();
    sctx.moveTo(P2[0], P2[1]); sctx.lineTo(P3[0], P3[1]); sctx.lineTo(P3[0], P3[1] + 16); sctx.lineTo(P2[0], P2[1] + 16); sctx.closePath();
    sctx.fill();
    sctx.beginPath();
    sctx.moveTo(P1[0], P1[1]); sctx.lineTo(P3[0], P3[1]); sctx.lineTo(P3[0], P3[1] + 16); sctx.lineTo(P1[0], P1[1] + 16); sctx.closePath();
    sctx.fillStyle = '#161b22';
    sctx.fill();

    // קרניים: קווים אנכיים מקווקווים מהמקור לגלאי (מאחורי הגוף)
    sctx.setLineDash([6, 10]);
    sctx.lineWidth = 2;
    sctx.strokeStyle = 'rgba(124, 199, 220, 0.28)';
    for (const x of [-1.05, 0, 1.05]) for (const z of [-1.05, 0, 1.05]) {
      const a = toScreen([x * 0.9, SOURCE_Y - 0.25, z * 0.9]);
      const b = toScreen([x, PLATE_Y, z]);
      sctx.beginPath(); sctx.moveTo(a[0], a[1]); sctx.lineTo(b[0], b[1]); sctx.stroke();
    }
    sctx.setLineDash([]);

    // הגוף: פאות פונות למצלמה, מהרחוקה לקרובה, בהצללה שטוחה
    const faces = [];
    for (const [a, b, c] of geo.tris) {
      const A = world[a], B = world[b], C = world[c];
      const nv = apply(VIEW, norm(cross(sub(B, A), sub(C, A))));
      if (nv[2] <= 0) continue;
      const pa = toScreen(A), pb = toScreen(B), pc = toScreen(C);
      faces.push({ pa, pb, pc, z: (pa[2] + pb[2] + pc[2]) / 3, l: Math.max(0, dot(nv, LIGHT)) });
    }
    faces.sort((f, g) => f.z - g.z);
    sctx.lineJoin = 'round';
    sctx.lineWidth = 1;
    for (const f of faces) {
      const k = 0.32 + 0.68 * f.l;
      const col = `rgb(${Math.round(150 * k + 20)}, ${Math.round(190 * k + 20)}, ${Math.round(205 * k + 22)})`;
      sctx.fillStyle = col;
      sctx.strokeStyle = col;
      sctx.beginPath();
      sctx.moveTo(f.pa[0], f.pa[1]); sctx.lineTo(f.pb[0], f.pb[1]); sctx.lineTo(f.pc[0], f.pc[1]); sctx.closePath();
      sctx.fill();
      sctx.stroke();
    }

    // מקור הקרינה
    const src = toScreen([0, SOURCE_Y, 0]);
    const glow = sctx.createRadialGradient(src[0], src[1], 4, src[0], src[1], 60);
    glow.addColorStop(0, 'rgba(124, 199, 220, 0.55)');
    glow.addColorStop(1, 'rgba(124, 199, 220, 0)');
    sctx.fillStyle = glow;
    sctx.beginPath(); sctx.arc(src[0], src[1], 60, 0, Math.PI * 2); sctx.fill();
    sctx.fillStyle = '#1c222b';
    sctx.strokeStyle = '#7cc7dc';
    sctx.lineWidth = 3;
    roundRect(sctx, src[0] - 46, src[1] - 22, 92, 36, 10);
    sctx.fill(); sctx.stroke();
    sctx.fillStyle = '#7cc7dc';
    sctx.beginPath(); sctx.arc(src[0], src[1] + 14, 6, 0, Math.PI * 2); sctx.fill();

    // תוויות
    sctx.font = '500 26px Heebo, system-ui, sans-serif';
    sctx.direction = 'rtl';
    sctx.textAlign = 'right';
    sctx.fillStyle = '#b4bdc8';
    sctx.fillText('מקור הקרינה', src[0] - 60, src[1] + 8);
    sctx.fillText('גלאי', P3[0] - 12, P3[1] + 50);
  }

  function drawDetector() {
    dctx.imageSmoothingEnabled = true;
    dctx.drawImage(shadow, 0, 0, detector.width, detector.height);
  }

  function render() {
    world = geo.verts.map((p) => apply(R, p));
    computeShadow();
    drawScene();
    drawDetector();
  }

  function snapshot() {
    const c = h('canvas', { class: 'sr-snap', width: N, height: N, role: 'img', 'aria-label': `צילום שמור של ${shape.label}` });
    c.getContext('2d').drawImage(shadow, 0, 0);
    snaps.prepend(c);
    while (snaps.children.length > 3) snaps.lastChild.remove();
  }

  render();
  // הגופן נטען אחרי הציור הראשון — לצייר שוב בשביל התוויות
  document.fonts?.ready.then(render);
  return { el };
}

function roundRect(ctx, x, y, w, hgt, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + hgt, r);
  ctx.arcTo(x + w, y + hgt, x, y + hgt, r);
  ctx.arcTo(x, y + hgt, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
