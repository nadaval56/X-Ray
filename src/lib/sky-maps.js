// מפות "איפה זה?" לעמודי העצמים ב"רנטגן בחלל" (sky-<id>.html).
// מחרוזות SVG בלבד, בלי DOM: הקובץ רץ גם בזמן ה-build (scripts/lib/prerender.mjs) וגם בדפדפן.
//
// שלוש מפות, לפי where.home ב-content/sky.json:
//   - מפת השמיים (כל עצם עם ra/dec): על פנורמה אמיתית של כל השמיים (ESO), עם האזור שלא עולה בישראל.
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
  const side = dec < ISRAEL_LAT ? 'הדרומי' : 'הצפוני';
  return deg < 20
    ? `בישראל האזור הזה עולה רק נמוך מאוד, עד כ-${deg} מעלות מעל האופק ${side}.`
    : `בישראל האזור הזה עולה עד כ-${deg} מעלות מעל האופק ${side}.`;
}

// ---------- מפת השמיים ----------

// רקע: פנורמה של כל השמיים, ESO/S. Brunier (eso0932a, CC BY 4.0), בהיטל שווה-מרחקים
// בקואורדינטות גלקטיות: מרכז הגלקסיה באמצע, l גדל שמאלה, b = +90 למעלה.
// כיול: ענן מגלן הגדול (l = 280.5°, b = −32.9°) יושב בתמונה בדיוק במקום שהנוסחה נותנת.
export const PANORAMA = { file: 'sky/maps/milkyway-panorama.webp', credit: 'ESO/S. Brunier', license: 'CC BY 4.0' };
const PAN = { W: 420, H: 210 };
const wrapL = (l) => { const x = ((l % 360) + 360) % 360; return x > 180 ? x - 360 : x; };
const pan = (l, b) => [PAN.W * (0.5 - wrapL(l) / 360), PAN.H * (0.5 - b / 180)];
const panEq = (ra, dec) => { const g = eqToGal(ra, dec); return pan(g.l, g.b); };

const range = (a, b, step) => Array.from({ length: Math.floor((b - a) / step) + 1 }, (_, i) => a + i * step);

// כמה קבוצות כוכבים מוכרות, לעיגון (ra, dec). מרכז הקבוצה מתיבת המידע בוויקיפדיה (ראו sources.md).
// מעט תוויות בכוונה: במסך של טלפון יותר מזה כבר מתנגש.
const LANDMARKS = [['אוריון', 75, 5], ['הדובה הגדולה', 160, 55.4], ['אריה', 165, 15], ['ברבור', 309.3, 42]];
// גלקסיות שכנות שרואים בפנורמה (l, b מ-SIMBAD)
const NEIGHBORS = [['אנדרומדה', 121.17, -21.57]];

// תווית שלא יוצאת מהמפה: ליד הקצוות היא נצמדת פנימה (ב-RTL: start = מיושר לימין)
const label = (cls, x, y, text, W = 420) => {
  const anchor = x < 50 ? 'end' : x > W - 50 ? 'start' : 'middle';
  const ax = x < 50 ? Math.max(x - 8, 4) : x > W - 50 ? Math.min(x + 8, W - 4) : x;
  return `<text class="${cls}" x="${f1(ax)}" y="${f1(y)}" text-anchor="${anchor}">${esc(text)}</text>`;
};

export function skyMap({ ra, dec, label: full, imgBase = './images/' }) {
  const name = shortName(full);
  const { W, H } = PAN;
  const [ox, oy] = panEq(ra, dec);
  const far = ([x, y], d = 30) => Math.hypot(x - ox, y - oy) > d;
  // האזור שלא עולה בישראל: עיגול סביב הקוטב השמימי הדרומי, עד δ = φ − 90
  const south = range(0, 360, 3).map((r) => panEq(r, ISRAEL_LAT - 90));
  const scp = panEq(0, -90);
  const marks = LANDMARKS.map(([n, r, d]) => [n, panEq(r, d)]).filter(([, p]) => far(p, 50))
    .map(([n, [x, y]]) => `<g class="map-landmark"><circle cx="${f1(x)}" cy="${f1(y)}" r="1.6"/>${label('', x, y - 5, n)}</g>`).join('');
  const hoods = NEIGHBORS.map(([n, l, b]) => [n, pan(l, b)]).filter(([, p]) => far(p, 36))
    .map(([n, [x, y]]) => label('map-neighbor', x, y + 14, n)).join('');
  const [gx, gy] = pan(0, 0);
  return `<svg class="sky-map" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(`צילום של כל השמיים, עם שביל החלב לרוחבו. ${name} מסומן בעיגול.`)}">`
    + arrowDef('arr-s')
    + `<image href="${imgBase}${PANORAMA.file}" x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="none"/>`
    + `<path class="map-south" d="M${south.map((p) => `${f1(p[0])},${f1(p[1])}`).join('L')}Z"/>`
    + label('map-south-label', scp[0], Math.max(...south.map((p) => p[1])) + 13, 'לא עולה בישראל')
    + (far([gx, gy]) ? label('map-mw-label', gx, gy - 12, 'מרכז שביל החלב') : '')
    + marks + hoods
    + `<circle class="map-target-ring" cx="${f1(ox)}" cy="${f1(oy)}" r="7"/>`
    // שם העצם למעלה, בשמיים הכהים שמעל שביל החלב (או למטה, אם העצם עצמו למעלה), עם חץ אליו
    + callout({ to: [ox, oy], at: [Math.min(Math.max(ox, 12 + name.length * 4), W - 12 - name.length * 4), oy > 60 ? 18 : H - 8], text: name, cls: 'map-callout map-callout-target', arrow: 'arr-s', gap: 9 })
    + `</svg>`;
}

// ---------- שביל החלב מלמעלה ----------

// רקע: איור של שביל החלב במבט מלמעלה, NASA/JPL-Caltech/R. Hurt (PIA10748), חתוך לריבוע 8%–92%.
// מקום השמש באיור נלקח מהגרסה המסומנת של אותו איור (PIA19341, מסובבת ב-90°) — ראו sources.md.
export const GALAXY_ART = { file: 'sky/maps/milkyway-top.webp', credit: 'NASA/JPL-Caltech/R. Hurt', license: 'NASA (public domain)' };
const SUN_IN_ART = [0.5131, 0.7169];
// המרחק מהשמש למרכז הגלקסיה: כ-26,000 שנות אור (כמו בכרטיסים של Sgr A* ו-Sgr A East)
export const SUN_TO_CENTER_LY = 26000;

// תווית רחוקה מהנקודה, עם קו וחץ אליה. align הוא הצד הוויזואלי: 'left' = הטקסט מתחיל ב-x ונמשך ימינה.
// שם קצר לתווית על המפה: בלי מה שבסוגריים ("Guitar Nebula (PSR B2224+65)" → "Guitar Nebula")
const shortName = (t) => t.replace(/\s*\(.*?\)\s*/g, ' ').trim();
const isLatin = (t) => !/[֐-׿]/.test(t);
function callout({ to, at, text, align = 'center', cls = 'map-callout', arrow, gap = 11 }) {
  const latin = isLatin(text);
  const anchor = align === 'center' ? 'middle' : (align === 'left') === latin ? 'start' : 'end';
  const [tx, ty] = at;
  // הקו יוצא מקצה הטקסט שקרוב לנקודה: מתחת לטקסט אם הנקודה למטה, מעליו אם למעלה
  const below = to[1] > ty;
  const sx = align === 'center' ? tx : align === 'left' ? tx + 14 : tx - 14;
  const sy = below ? ty + 6 : ty - 16;
  const len = Math.hypot(to[0] - sx, to[1] - sy);
  const ex = to[0] - ((to[0] - sx) / len) * gap, ey = to[1] - ((to[1] - sy) / len) * gap;
  return `<line class="map-leader-arrow" x1="${f1(sx)}" y1="${f1(sy)}" x2="${f1(ex)}" y2="${f1(ey)}" marker-end="url(#${arrow})"/>`
    + `<text class="${cls}" x="${f1(tx)}" y="${f1(ty)}" text-anchor="${anchor}"${latin ? ' direction="ltr"' : ''}>${esc(text)}</text>`;
}
const arrowDef = (id) => `<defs><marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="map-arrowhead" d="M0,0L10,5L0,10z"/></marker></defs>`;

export function galaxyMap({ ra, dec, distanceLy, label: full, imgBase = './images/' }) {
  const name = shortName(full);
  const W = 420, cx = W / 2, cy = W / 2;
  const sun = [SUN_IN_ART[0] * W, SUN_IN_ART[1] * W];
  const r0 = Math.hypot(cx - sun[0], cy - sun[1]), k = r0 / SUN_TO_CENTER_LY;
  // l = 0: מהשמש אל המרכז. מבט מהקוטב הצפוני של הגלקסיה, ולכן l = 90° שמאלה ממנו.
  const u0 = [(cx - sun[0]) / r0, (cy - sun[1]) / r0], u90 = [u0[1], -u0[0]];
  const { l } = eqToGal(ra, dec);
  const d = distanceLy * k, c = Math.cos(l * D), sn = Math.sin(l * D);
  const o = [sun[0] + d * (c * u0[0] + sn * u90[0]), sun[1] + d * (c * u0[1] + sn * u90[1])];
  // התוויות בפינות הכהות של האיור, עם חץ אל הנקודה. כל נקודה מקבלת את הפינה הפנויה הקרובה אליה.
  const corners = { tl: [{ at: [12, 24], align: 'left' }], tr: [{ at: [W - 12, 24], align: 'right' }], br: [{ at: [W - 12, W - 14], align: 'right' }], bl: [{ at: [12, W - 14], align: 'left' }] };
  const free = new Set(['tl', 'tr', 'br', 'bl']);
  const pick = (pt) => {
    const best = [...free].sort((p, q) => Math.hypot(corners[p][0].at[0] - pt[0], corners[p][0].at[1] - pt[1]) - Math.hypot(corners[q][0].at[0] - pt[0], corners[q][0].at[1] - pt[1]))[0];
    free.delete(best);
    return corners[best][0];
  };
  const sunC = pick(sun), objC = pick(o), cenC = pick([cx, cy]);
  return `<svg class="galaxy-map" viewBox="0 0 ${W} ${W}" role="img" aria-label="${esc(`איור של שביל החלב במבט מלמעלה: המרכז, מערכת השמש, ו${name}.`)}">`
    + arrowDef('arr-g')
    + `<image href="${imgBase}${GALAXY_ART.file}" x="0" y="0" width="${W}" height="${W}"/>`
    + `<circle class="map-sun" cx="${f1(sun[0])}" cy="${f1(sun[1])}" r="3.5"/>`
    + `<circle class="map-target-ring" cx="${f1(o[0])}" cy="${f1(o[1])}" r="7"/>`
    + callout({ to: [cx, cy], ...cenC, text: 'מרכז הגלקסיה', arrow: 'arr-g', gap: 8 })
    + callout({ to: sun, ...sunC, text: 'מערכת השמש (אנחנו)', arrow: 'arr-g', gap: 6 })
    + callout({ to: o, ...objC, text: name, cls: 'map-callout map-callout-target', arrow: 'arr-g', gap: 9 })
    + `</svg>`;
}

// ---------- סרגל מרחקים ----------

// נקודות ייחוס (שנות אור). מקורות ב-sources.md.
const REFS = [
  { id: 'gc', name: 'מרכז שביל החלב', ly: SUN_TO_CENTER_LY },
  { id: 'lmc', name: 'ענן מגלן הגדול', ly: 160000 },
  { id: 'm31', name: 'גלקסיית אנדרומדה', ly: 2500000 },
];

// תווית העצם (בדרך כלל שם באנגלית): משמאל לימין, ובצד שלא חורג מהמפה
function targetLabel(label, x, y, W) {
  const latin = !/[\u0590-\u05ff]/.test(label);
  const [ax, anchor] = x > W * 0.62 ? [Math.min(x + 12, W - 4), 'end'] : x < W * 0.38 ? [Math.max(x - 12, 4), 'start'] : [x, 'middle'];
  return `<text class="map-target-label" x="${f1(ax)}" y="${y}" text-anchor="${latin ? anchor : { start: 'end', end: 'start', middle: 'middle' }[anchor]}"${latin ? ' direction="ltr"' : ''}>${esc(label)}</text>`;
}

export function distanceScale({ distanceLy, label: full, home }) {
  const label = shortName(full);
  const W = 420, H = 190, L = 22, Rm = 22, axisY = 50;
  const lo = 4, hi = 10; // 10⁴ עד 10¹⁰ שנות אור
  const x = (ly) => L + ((Math.log10(ly) - lo) / (hi - lo)) * (W - L - Rm);
  const ticks = [1e4, 1e5, 1e6, 1e7, 1e8, 1e9, 1e10].map((v) => `<line class="map-tick" x1="${f1(x(v))}" y1="${axisY - 4}" x2="${f1(x(v))}" y2="${axisY + 4}"/>`).join('')
    + [[1e4, '10 אלף'], [1e6, 'מיליון'], [1e9, 'מיליארד']]
      .map(([v, t], i, a) => `<text class="map-tick-label" x="${f1(x(v))}" y="${axisY - 10}" text-anchor="${i === 0 ? 'end' : i === a.length - 1 ? 'start' : 'middle'}">${t}</text>`).join('');
  const refs = REFS.filter((r) => !(home === 'lmc' && r.id === 'lmc'))
    .map((r, i) => {
      const rx = x(r.ly), row = axisY + 26 + i * 22;
      return `<line class="map-leader" x1="${f1(rx)}" y1="${axisY}" x2="${f1(rx)}" y2="${row - 12}"/><circle class="map-ref" cx="${f1(rx)}" cy="${axisY}" r="3.5"/>`
        + `<text class="map-ref-label" x="${f1(Math.max(L, rx))}" y="${row}" text-anchor="${rx < L + 60 ? 'end' : 'middle'}">${esc(r.name)}</text>`;
    }).join('');
  const ox = x(distanceLy);
  const ty = axisY + 26 + 3 * 22 + 12;
  return `<svg class="distance-scale" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(`סרגל מרחקים: ${label}, לעומת מרכז שביל החלב, ${home === 'lmc' ? '' : 'ענן מגלן הגדול, '}וגלקסיית אנדרומדה.`)}">`
    + `<line class="map-axis" x1="${L}" y1="${axisY}" x2="${W - Rm}" y2="${axisY}"/>${ticks}${refs}`
    + `<line class="map-target-stem" x1="${f1(ox)}" y1="${axisY}" x2="${f1(ox)}" y2="${ty - 14}"/>`
    + `<circle class="map-target" cx="${f1(ox)}" cy="${axisY}" r="5"/>`
    + targetLabel(label, ox, ty, W)
    + `</svg>`;
}

// ---------- מערכת השמש ----------

// מרחק ממוצע מהשמש, מיליוני ק"מ (NASA Planetary Fact Sheet)
const PLANETS = [['כדור הארץ', 149.6, 30], ['מאדים', 228.0, 210], ['צדק', 778.5, 120], ['שבתאי', 1432.0, 320]];

export function solarMap({ label }) {
  const W = 420, H = 240, cx = 210, cy = 120, k = 108 / 1432;
  const orbits = PLANETS.map(([name, d, a], i) => {
    const r = d * k, px = cx + r * Math.cos(a * D), py = cy - r * Math.sin(a * D);
    const target = i === PLANETS.length - 1;
    // כדור הארץ ומאדים קרובים מדי לשמש: התווית בצד, עם קו מוביל
    const tx = i < 2 ? cx + (i ? -62 : 62) : px, ty = i < 2 ? cy + (i ? 48 : -40) : py + (py < cy ? -12 : 20);
    return `<circle class="map-orbit" cx="${cx}" cy="${cy}" r="${f1(r)}"/>`
      + `<circle class="${target ? 'map-target' : 'map-planet'}" cx="${f1(px)}" cy="${f1(py)}" r="${target ? 4.5 : 2.6}"/>`
      + (i < 2 ? `<line class="map-leader" x1="${f1(px)}" y1="${f1(py)}" x2="${f1(tx)}" y2="${f1(ty + (i ? -14 : 5))}"/>` : '')
      + `<text class="${target ? 'map-target-label' : 'map-label'}" x="${f1(tx)}" y="${f1(ty)}" text-anchor="middle">${esc(name)}</text>`;
  }).join('');
  return `<svg class="solar-map" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(`מסלולי כוכבי הלכת סביב השמש, עד ${label}, בקנה מידה.`)}">`
    + `${orbits}<circle class="map-sun" cx="${cx}" cy="${cy}" r="4.5"/></svg>`;
}
