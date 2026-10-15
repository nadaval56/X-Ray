// מפות "איפה זה?" לעמודי העצמים ב"רנטגן בחלל" (sky-<id>.html).
// מחרוזות SVG בלבד, בלי DOM: הקובץ רץ גם בזמן ה-build (scripts/lib/prerender.mjs) וגם בדפדפן.
//
// שלוש מפות, לפי where.home ב-content/sky.json:
//   - מפת השמיים (כל עצם עם ra/dec): על פנורמה אמיתית של כל השמיים (ESO), עם האזור שלא זורח בישראל.
//   - שביל החלב מלמעלה (home: milkyway): על איור של NASA, ביחס לשמש ולמרכז הגלקסיה.
//   - סרגל מרחקים לוגריתמי (lmc / smc / extragalactic), ומסלולי כוכבי הלכת (solar).
// ה-SVG יורש את כיוון העמוד (RTL): text-anchor="start" מיישר לימין ו-"end" לשמאל.
// המקורות למספרים הקבועים כאן ב-content/sources.md, בסעיף "מפות 'איפה זה?'".

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const D = Math.PI / 180;
const f1 = (n) => n.toFixed(1);

// ---------- קואורדינטות ----------

// קוטב הגלקסיה הצפוני ב-J2000 (IAU 1958, בהמרה ל-J2000)
const NGP_RA = 192.85948, NGP_DEC = 27.12825, NCP_L = 122.93192;

/** קואורדינטות גלקטיות (מעלות) → משווניות */
export function galToEq(l, b) {
  const sd = Math.sin(b * D) * Math.sin(NGP_DEC * D) + Math.cos(b * D) * Math.cos(NGP_DEC * D) * Math.cos((NCP_L - l) * D);
  const dec = Math.asin(sd) / D;
  const y = Math.cos(b * D) * Math.sin((NCP_L - l) * D);
  const x = Math.sin(b * D) * Math.cos(NGP_DEC * D) - Math.cos(b * D) * Math.sin(NGP_DEC * D) * Math.cos((NCP_L - l) * D);
  return { ra: (NGP_RA + Math.atan2(y, x) / D + 360) % 360, dec };
}

/** קואורדינטות משווניות (מעלות) → גלקטיות */
export function eqToGal(ra, dec) {
  const sb = Math.sin(dec * D) * Math.sin(NGP_DEC * D) + Math.cos(dec * D) * Math.cos(NGP_DEC * D) * Math.cos((ra - NGP_RA) * D);
  const y = Math.cos(dec * D) * Math.sin((ra - NGP_RA) * D);
  const x = Math.sin(dec * D) * Math.cos(NGP_DEC * D) - Math.cos(dec * D) * Math.sin(NGP_DEC * D) * Math.cos((ra - NGP_RA) * D);
  return { l: (NCP_L - Math.atan2(y, x) / D + 360) % 360, b: Math.asin(sb) / D };
}

// ירושלים, 31.8° צפון. כוכב בנטייה δ מגיע לכל היותר ל-90 − |φ − δ| מעלות מעל האופק.
export const ISRAEL_LAT = 31.8;

/** משפט קצר: האם רואים את האזור מישראל, ועד כמה הוא עולה */
export function israelLine(dec) {
  const max = 90 - Math.abs(ISRAEL_LAT - dec);
  if (max <= 0) return 'האזור הזה בשמיים לא עולה אף פעם מעל האופק בישראל. רואים אותו רק ממקומות דרומיים יותר על כדור הארץ.';
  if (dec >= 90 - ISRAEL_LAT) return 'בישראל האזור הזה לא שוקע אף פעם: הוא מסתובב סביב כוכב הצפון כל הלילה.';
  const deg = Math.round(max);
  if (deg < 2) return 'בישראל האזור הזה בקושי מגיע לאופק הדרומי, ולכן בפועל לא רואים אותו.';
  const side = dec < ISRAEL_LAT ? 'הדרומי' : 'הצפוני';
  return deg < 20
    ? `בישראל האזור הזה עולה רק נמוך מאוד, עד כ-${deg} מעלות מעל האופק ${side}.`
    : `בישראל האזור הזה עולה עד כ-${deg} מעלות מעל האופק ${side}.`;
}

// ---------- מפת השמיים: הרקע והנקודות הקבועות ----------

// רקע: פנורמה של כל השמיים, ESO/S. Brunier (eso0932a, CC BY 4.0), בהיטל שווה-מרחקים
// בקואורדינטות גלקטיות: מרכז הגלקסיה באמצע, l גדל שמאלה, b = +90 למעלה.
// כיול: ענן מגלן הגדול (l = 280.5°, b = −32.9°) יושב בתמונה בדיוק במקום שהנוסחה נותנת.
export const PANORAMA = { file: 'sky/maps/milkyway-panorama.webp', credit: 'ESO/S. Brunier', license: 'CC BY 4.0' };
const PAN = { W: 360, H: 180 }; // יחידות המפה: קטנות, כדי שהטקסט ייצא קריא גם בטלפון
const wrapL = (l) => { const x = ((l % 360) + 360) % 360; return x > 180 ? x - 360 : x; };
const pan = (l, b) => [PAN.W * (0.5 - wrapL(l) / 360), PAN.H * (0.5 - b / 180)];
const panEq = (ra, dec) => { const g = eqToGal(ra, dec); return pan(g.l, g.b); };

const range = (a, b, step) => Array.from({ length: Math.floor((b - a) / step) + 1 }, (_, i) => a + i * step);

// כמה קבוצות כוכבים מוכרות, לעיגון (ra, dec). מרכז הקבוצה מתיבת המידע בוויקיפדיה (ראו sources.md).
// מעט תוויות בכוונה: במסך של טלפון יותר מזה כבר מתנגש.
const LANDMARKS = [['אוריון', 75, 5], ['הדובה הגדולה', 160, 55.4], ['אריה', 165, 15], ['ברבור', 309.3, 42]];
// גלקסיות שכנות שרואים בפנורמה (l, b מ-SIMBAD)
const NEIGHBORS = [['אנדרומדה', 121.17, -21.57]];

// ---------- תוויות ----------
// בתוך המפות הטקסט בגודל קבוע (ביחידות של המפה), ולכן אפשר להעריך את רוחבו ולבנות סביבו תיבה.
// התוויות מוצבות כך שאף קו לא חוצה טקסט: נבחר המקום שבו התיבה והחץ לא נוגעים בשום תווית אחרת.

// שם קצר לתווית על המפה: בלי מה שבסוגריים ("Guitar Nebula (PSR B2224+65)" → "Guitar Nebula")
const shortName = (t) => t.replace(/\s*\(.*?\)\s*/g, ' ').trim();
const isLatin = (t) => !/[֐-׿]/.test(t);
// רוחב משוער בגופן Heebo: כחצי מגובה הגופן לאות, רבע לרווח
const textW = (t, fs) => [...t].reduce((w, ch) => w + (ch === ' ' ? 0.28 : /[A-Z0-9]/.test(ch) ? 0.62 : 0.54), 0) * fs;

const rectOf = (cx, cy, w, h) => ({ x: cx - w / 2, y: cy - h / 2, w, h });
const overlap = (a, b, m = 2) => a.x < b.x + b.w + m && b.x < a.x + a.w + m && a.y < b.y + b.h + m && b.y < a.y + a.h + m;
// האם הקטע p→q חוצה את המלבן r (Liang–Barsky)
function segHits([x1, y1], [x2, y2], r) {
  let t0 = 0, t1 = 1;
  const dx = x2 - x1, dy = y2 - y1;
  for (const [pp, qq] of [[-dx, x1 - r.x], [dx, r.x + r.w - x1], [-dy, y1 - r.y], [dy, r.y + r.h - y1]]) {
    if (pp === 0) { if (qq < 0) return false; continue; }
    const t = qq / pp;
    if (pp < 0) { if (t > t1) return false; if (t > t0) t0 = t; } else { if (t < t0) return false; if (t < t1) t1 = t; }
  }
  return true;
}
// נקודה על שפת המלבן, בכיוון של target
function edgePoint(r, [tx, ty]) {
  const cx = r.x + r.w / 2, cy = r.y + r.h / 2, dx = tx - cx, dy = ty - cy;
  const s = Math.min(Math.abs((r.w / 2) / (dx || 1e-9)), Math.abs((r.h / 2) / (dy || 1e-9)));
  return [cx + dx * s, cy + dy * s];
}
const segsCross = ([a, b], [c, d]) => {
  const o = (p, q, r) => Math.sign((q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]));
  return o(a, b, c) !== o(a, b, d) && o(c, d, a) !== o(c, d, b);
};

// תיבת תווית עם חץ אל הנקודה. box: המלבן, to: הנקודה, gap: כמה לעצור לפניה
function boxLabel({ box, to, text, fs, target = false, arrow, gap }) {
  const [sx, sy] = edgePoint(box, to);
  const len = Math.hypot(to[0] - sx, to[1] - sy) || 1;
  const ex = to[0] - ((to[0] - sx) / len) * gap, ey = to[1] - ((to[1] - sy) / len) * gap;
  const line = len > gap + 4 ? `<line class="map-leader-arrow" x1="${f1(sx)}" y1="${f1(sy)}" x2="${f1(ex)}" y2="${f1(ey)}" marker-end="url(#${arrow})"/>` : '';
  return `${line}<g class="map-box${target ? ' is-target' : ''}"><rect x="${f1(box.x)}" y="${f1(box.y)}" width="${f1(box.w)}" height="${f1(box.h)}" rx="4"/>`
    + `<text x="${f1(box.x + box.w / 2)}" y="${f1(box.y + box.h / 2 + fs * 0.36)}" text-anchor="middle" font-size="${fs}"${isLatin(text) ? ' direction="ltr"' : ''}>${esc(text)}</text></g>`;
}
const labelBox = (text, fs) => ({ w: textW(text, fs) + 12, h: fs + 9 });
const arrowDef = (id) => `<defs><marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path class="map-arrowhead" d="M0,0L10,5L0,10z"/></marker></defs>`;

// תווית קטנה בלי חץ (קבוצת כוכבים, אנדרומדה...) — טקסט עם הילה כהה, מעל הנקודה שלה
const FS_SMALL = 12, FS_BOX = 13;
const plain = (text, x, y, W) => {
  const w = textW(text, FS_SMALL);
  const cx = Math.min(Math.max(x, w / 2 + 3), W - w / 2 - 3);
  return { text, x: cx, y, rect: rectOf(cx, y - FS_SMALL * 0.35, w, FS_SMALL + 2) };
};
const plainSvg = (p, cls) => `<text class="${cls}" x="${f1(p.x)}" y="${f1(p.y)}" text-anchor="middle" font-size="${FS_SMALL}">${esc(p.text)}</text>`;

// ---------- מפת השמיים ----------

export function skyMap({ ra, dec, label: full, imgBase = './images/' }) {
  const name = shortName(full);
  const { W, H } = PAN;
  const [ox, oy] = panEq(ra, dec);
  const far = ([x, y], d) => Math.hypot(x - ox, y - oy) > d;
  // האזור שלא זורח בישראל: עיגול סביב הקוטב השמימי הדרומי, עד δ = φ − 90
  const south = range(0, 360, 3).map((r) => panEq(r, ISRAEL_LAT - 90));
  const scp = panEq(0, -90);
  const [gx, gy] = pan(0, 0);
  const plains = [
    ...LANDMARKS.map(([n, r, d]) => { const [x, y] = panEq(r, d); return { ...plain(n, x, y - 5, W), dot: [x, y], cls: 'map-landmark' }; }),
    ...NEIGHBORS.map(([n, l, b]) => { const [x, y] = pan(l, b); return { ...plain(n, x, y + 14, W), dot: [x, y], cls: 'map-neighbor' }; }),
    { ...plain('מרכז שביל החלב', gx, gy - 9, W), cls: 'map-mw-label' },
    { ...plain('לא זורח בישראל', scp[0], Math.max(...south.map((p) => p[1])) + 13, W), cls: 'map-south-label', keep: true },
  ].filter((p) => p.keep || !overlap(p.rect, rectOf(ox, oy, 22, 22), 4));

  // תיבת שם העצם: מבין כמה מקומות סביבו, זה שלא נוגע בשום תווית ושהקו שלו לא חוצה אף אחת
  const { w, h } = labelBox(name, FS_BOX);
  const clampBox = (cx, cy) => rectOf(Math.min(Math.max(cx, w / 2 + 3), W - w / 2 - 3), Math.min(Math.max(cy, h / 2 + 3), H - h / 2 - 3), w, h);
  const cands = [[0, -42], [0, 42], [-w / 2 - 30, -30], [w / 2 + 30, -30], [-w / 2 - 30, 30], [w / 2 + 30, 30], [-w / 2 - 40, 0], [w / 2 + 40, 0], [0, -70], [0, 70]]
    .map(([dx, dy]) => clampBox(ox + dx, oy + dy));
  const score = (box) => {
    const from = edgePoint(box, [ox, oy]);
    let sc = Math.hypot(from[0] - ox, from[1] - oy);
    if (Math.hypot(from[0] - ox, from[1] - oy) < 14 || overlap(box, rectOf(ox, oy, 16, 16))) sc += 5000;
    for (const p of plains) {
      if (overlap(box, p.rect)) sc += p.keep ? 3000 : 1000;
      if (segHits(from, [ox, oy], p.rect)) sc += 800;
    }
    return sc;
  };
  const box = cands.reduce((best, b) => (score(b) < score(best) ? b : best));
  const from = edgePoint(box, [ox, oy]);
  // תוויות שעדיין מתנגשות בתיבה או בקו — יורדות (חוץ מ"לא זורח בישראל")
  const shown = plains.filter((p) => p.keep || (!overlap(box, p.rect) && !segHits(from, [ox, oy], p.rect)));

  return `<svg class="sky-map" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(`צילום של כל השמיים, עם שביל החלב לרוחבו. ${name} מסומן בעיגול.`)}">`
    + arrowDef('arr-s')
    + `<image href="${imgBase}${PANORAMA.file}" x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="none"/>`
    + `<path class="map-south" d="M${south.map((p) => `${f1(p[0])},${f1(p[1])}`).join('L')}Z"/>`
    + shown.map((p) => (p.dot ? `<circle class="map-dot" cx="${f1(p.dot[0])}" cy="${f1(p.dot[1])}" r="1.5"/>` : '') + plainSvg(p, p.cls)).join('')
    + `<circle class="map-target-ring" cx="${f1(ox)}" cy="${f1(oy)}" r="6"/>`
    + boxLabel({ box, to: [ox, oy], text: name, fs: FS_BOX, target: true, arrow: 'arr-s', gap: 8 })
    + `</svg>`;
}

// ---------- שביל החלב מלמעלה ----------

// רקע: איור של שביל החלב במבט מלמעלה, NASA/JPL-Caltech/R. Hurt (PIA10748), חתוך לריבוע 8%–92%.
// מקום השמש באיור נלקח מהגרסה המסומנת של אותו איור (PIA19341, מסובבת ב-90°) — ראו sources.md.
export const GALAXY_ART = { file: 'sky/maps/milkyway-top.webp', credit: 'NASA/JPL-Caltech/R. Hurt', license: 'NASA (public domain)' };
const SUN_IN_ART = [0.5131, 0.7169];
const GAL_W = 360;
// המרחק מהשמש למרכז הגלקסיה: כ-26,000 שנות אור (כמו בכרטיסים של Sgr A* ו-Sgr A East)
export const SUN_TO_CENTER_LY = 26000;

export function galaxyMap({ ra, dec, distanceLy, label: full, imgBase = './images/' }) {
  const name = shortName(full);
  const W = GAL_W, cx = W / 2, cy = W / 2;
  const sun = [SUN_IN_ART[0] * W, SUN_IN_ART[1] * W];
  const r0 = Math.hypot(cx - sun[0], cy - sun[1]), k = r0 / SUN_TO_CENTER_LY;
  // l = 0: מהשמש אל המרכז. מבט מהקוטב הצפוני של הגלקסיה, ולכן l = 90° שמאלה ממנו.
  const u0 = [(cx - sun[0]) / r0, (cy - sun[1]) / r0], u90 = [u0[1], -u0[0]];
  const { l } = eqToGal(ra, dec);
  const d = distanceLy * k, c = Math.cos(l * D), sn = Math.sin(l * D);
  const o = [sun[0] + d * (c * u0[0] + sn * u90[0]), sun[1] + d * (c * u0[1] + sn * u90[1])];

  // שלוש תוויות בפינות הכהות של האיור. בוחרים את השיבוץ (מתוך כל האפשרויות) שבו הקווים קצרים,
  // לא חוצים זה את זה ולא עוברים דרך תיבה אחרת.
  const items = [
    { text: 'מרכז הגלקסיה', to: [cx, cy], gap: 7 },
    { text: 'מערכת השמש (אנחנו)', to: sun, gap: 6 },
    { text: name, to: o, gap: 8, target: true },
  ].map((it) => ({ ...it, ...labelBox(it.text, FS_BOX) }));
  const m = 6;
  const corner = (key, { w, h }) => ({
    tl: { x: m, y: m }, tr: { x: W - m - w, y: m }, bl: { x: m, y: W - m - h }, br: { x: W - m - w, y: W - m - h },
  })[key];
  const keys = ['tl', 'tr', 'bl', 'br'];
  let best = null;
  for (const a of keys) for (const b of keys) for (const cc of keys) {
    if (new Set([a, b, cc]).size < 3) continue;
    const boxes = [a, b, cc].map((key, i) => ({ ...corner(key, items[i]), w: items[i].w, h: items[i].h }));
    const segs = boxes.map((bx, i) => [edgePoint(bx, items[i].to), items[i].to]);
    let sc = segs.reduce((t, [p, q]) => t + Math.hypot(q[0] - p[0], q[1] - p[1]), 0);
    segs.forEach((sg, i) => boxes.forEach((bx, j) => { if (i !== j && segHits(...sg, bx)) sc += 2000; }));
    for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) if (segsCross(segs[i], segs[j])) sc += 1000;
    if (!best || sc < best.sc) best = { sc, boxes };
  }
  return `<svg class="galaxy-map" viewBox="0 0 ${W} ${W}" role="img" aria-label="${esc(`איור של שביל החלב במבט מלמעלה: המרכז, מערכת השמש, ו${name}.`)}">`
    + arrowDef('arr-g')
    + `<image href="${imgBase}${GALAXY_ART.file}" x="0" y="0" width="${W}" height="${W}"/>`
    + `<circle class="map-sun" cx="${f1(sun[0])}" cy="${f1(sun[1])}" r="3"/>`
    + `<circle class="map-target-ring" cx="${f1(o[0])}" cy="${f1(o[1])}" r="6"/>`
    + items.map((it, i) => boxLabel({ box: best.boxes[i], to: it.to, text: it.text, fs: FS_BOX, target: it.target, arrow: 'arr-g', gap: it.gap })).join('')
    + `</svg>`;
}

// ---------- סרגל מרחקים ----------

// נקודות ייחוס (שנות אור). מקורות ב-sources.md.
const REFS = [
  { id: 'gc', name: 'מרכז שביל החלב', ly: SUN_TO_CENTER_LY },
  { id: 'lmc', name: 'ענן מגלן הגדול', ly: 160000 },
  { id: 'm31', name: 'גלקסיית אנדרומדה', ly: 2500000 },
];

// מסדר תיבות בשורה אחת: כל אחת קרובה ככל האפשר למקום שלה, בלי חפיפה, בתוך הגבולות. הסדר נשמר,
// ולכן הקווים מהתיבות אל הנקודות לא חוצים זה את זה.
function pushApart(boxes, lo, hi, gap = 6) {
  const bs = [...boxes].sort((p, q) => p.want - q.want);
  let edge = lo;
  for (const b of bs) { b.cx = Math.max(b.want, edge + b.w / 2); edge = b.cx + b.w / 2 + gap; }
  edge = hi;
  for (const b of [...bs].reverse()) { b.cx = Math.min(b.cx, edge - b.w / 2); edge = b.cx - b.w / 2 - gap; }
  return bs;
}

export function distanceScale({ distanceLy, label: full, home }) {
  const label = shortName(full);
  const W = 360, H = 124, L = 18, Rm = 18, axisY = 58, FS_REF = 12;
  const lo = 4, hi = 10; // 10⁴ עד 10¹⁰ שנות אור
  const x = (ly) => L + ((Math.min(Math.max(Math.log10(ly), lo), hi) - lo) / (hi - lo)) * (W - L - Rm);
  const ox = x(distanceLy);
  // שם העצם בתיבה מעל הציר, עם חץ אל הנקודה
  const tb = labelBox(label, FS_BOX);
  const tcx = Math.min(Math.max(ox, tb.w / 2 + 3), W - tb.w / 2 - 3);
  const tBox = rectOf(tcx, 6 + tb.h / 2, tb.w, tb.h);
  const tFrom = edgePoint(tBox, [ox, axisY]);
  // תוויות השנתות מעל הציר — חוץ ממי שהחץ של העצם עובר דרכה
  const tickLabels = [[1e4, '10 אלף'], [1e6, 'מיליון'], [1e9, 'מיליארד']]
    .map(([v, t]) => ({ t, x: x(v), w: textW(t, FS_SMALL) }))
    .map((k) => ({ ...k, x: Math.min(Math.max(k.x, k.w / 2 + 2), W - k.w / 2 - 2) }))
    .filter((k) => !segHits(tFrom, [ox, axisY], rectOf(k.x, axisY - 12, k.w + 4, FS_SMALL + 2)) && !overlap(tBox, rectOf(k.x, axisY - 12, k.w, FS_SMALL)));
  // נקודות הייחוס: תיבות קטנות בשורה מתחת לציר, וקו אל הנקודה של כל אחת
  const refs = pushApart(REFS.filter((r) => !(home === 'lmc' && r.id === 'lmc'))
    .map((r) => ({ ...r, want: x(r.ly), ...labelBox(r.name, FS_REF) })), 3, W - 3);
  const refSvg = refs.map((r) => {
    const box = rectOf(r.cx, axisY + 34, r.w, r.h);
    return `<circle class="map-ref" cx="${f1(x(r.ly))}" cy="${axisY}" r="3.5"/>`
      + boxLabel({ box, to: [x(r.ly), axisY], text: r.name, fs: FS_REF, arrow: 'arr-d', gap: 5 });
  }).join('');
  const ticks = [1e4, 1e5, 1e6, 1e7, 1e8, 1e9, 1e10].map((v) => `<line class="map-tick" x1="${f1(x(v))}" y1="${axisY - 4}" x2="${f1(x(v))}" y2="${axisY + 4}"/>`).join('')
    + tickLabels.map((k) => `<text class="map-tick-label" x="${f1(k.x)}" y="${axisY - 9}" text-anchor="middle" font-size="${FS_SMALL}">${k.t}</text>`).join('');
  return `<svg class="distance-scale" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(`סרגל מרחקים: ${label}, לעומת מרכז שביל החלב, ${home === 'lmc' ? '' : 'ענן מגלן הגדול, '}וגלקסיית אנדרומדה.`)}">`
    + arrowDef('arr-d')
    + `<line class="map-axis" x1="${L}" y1="${axisY}" x2="${W - Rm}" y2="${axisY}"/>${ticks}${refSvg}`
    + `<circle class="map-target" cx="${f1(ox)}" cy="${axisY}" r="5"/>`
    + boxLabel({ box: tBox, to: [ox, axisY], text: label, fs: FS_BOX, target: true, arrow: 'arr-d', gap: 7 })
    + `</svg>`;
}

// ---------- מערכת השמש ----------

// מרחק ממוצע מהשמש, מיליוני ק"מ (NASA Planetary Fact Sheet)
const PLANETS = [['כדור הארץ', 149.6, 30], ['מאדים', 228.0, 210], ['צדק', 778.5, 120], ['שבתאי', 1432.0, 320]];

export function solarMap({ label }) {
  const W = 360, H = 230, cx = W / 2, cy = H / 2, k = 100 / 1432;
  // כל כוכב לכת בתיבה בפינה אחרת, עם חץ אליו (הזוויות על המסלול נבחרו כך שאף קו לא חוצה תיבה)
  const spots = ['tr', 'bl', 'tl', 'br'];
  const svg = PLANETS.map(([name, d, a], i) => {
    const r = d * k, px = cx + r * Math.cos(a * D), py = cy - r * Math.sin(a * D);
    const target = i === PLANETS.length - 1;
    const { w, h } = labelBox(name, FS_BOX);
    const at = { tl: [6, 6], tr: [W - 6 - w, 6], bl: [6, H - 6 - h], br: [W - 6 - w, H - 6 - h] }[spots[i]];
    return `<circle class="map-orbit" cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(r)}"/>`
      + `<circle class="${target ? 'map-target' : 'map-planet'}" cx="${f1(px)}" cy="${f1(py)}" r="${target ? 4.5 : 2.6}"/>`
      + boxLabel({ box: { x: at[0], y: at[1], w, h }, to: [px, py], text: name, fs: FS_BOX, target, arrow: 'arr-o', gap: 6 });
  }).join('');
  return `<svg class="solar-map" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(`מסלולי כוכבי הלכת סביב השמש, עד ${label}, בקנה מידה.`)}">`
    + arrowDef('arr-o') + `<circle class="map-sun" cx="${f1(cx)}" cy="${f1(cy)}" r="4"/>${svg}</svg>`;
}
