// מפות "איפה זה?" לעמודי העצמים ב"רנטגן בחלל" (sky-<id>.html).
// מחרוזות SVG בלבד, בלי DOM: הקובץ רץ גם בזמן ה-build (scripts/lib/prerender.mjs) וגם בדפדפן.
//
// שלוש מפות, לפי where.home ב-content/sky.json:
//   - מפת השמיים (כל עצם עם ra/dec): כל כיפת השמיים בהיטל האמר, רצועת שביל החלב,
//     והאזור שלא עולה אף פעם מעל האופק בישראל.
//   - שביל החלב מלמעלה (home: milkyway): איפה העצם ביחס לשמש ולמרכז הגלקסיה.
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

const SKY = { W: 420, H: 222, cx: 210, cy: 111, s: 200 / (2 * Math.SQRT2) };

// היטל האמר. ra גדל שמאלה, כמו כשמסתכלים על השמיים; במרכז המפה ra = 12h.
function hammer(ra, dec) {
  let lam = (180 - ra) % 360;
  if (lam > 180) lam -= 360;
  if (lam < -180) lam += 360;
  return hammerLam(lam, dec);
}

// lam: מעלות מהמרכז, −180 (שמאל) עד 180 (ימין)
function hammerLam(lam, dec) {
  const phi = dec * D, l = lam * D;
  const z = Math.sqrt(1 + Math.cos(phi) * Math.cos(l / 2));
  return [SKY.cx + SKY.s * (2 * Math.SQRT2 * Math.cos(phi) * Math.sin(l / 2)) / z, SKY.cy - SKY.s * (Math.SQRT2 * Math.sin(phi)) / z];
}

// קו פתוח, שנשבר כשהוא חוצה את קצה המפה
function polyline(points) {
  let d = '', prev;
  for (const p of points) {
    d += `${!prev || Math.abs(p[0] - prev[0]) > 60 ? 'M' : 'L'}${f1(p[0])},${f1(p[1])}`;
    prev = p;
  }
  return d;
}

const range = (a, b, step) => Array.from({ length: Math.floor((b - a) / step) + 1 }, (_, i) => a + i * step);

// כמה קבוצות כוכבים מוכרות, לעיגון. מרכז הקבוצה מתיבת המידע בוויקיפדיה (ראו sources.md).
const LANDMARKS = [
  ['אוריון', 75, 5], ['הדובה הגדולה', 160, 55.4], ['אריה', 165, 15], ['ברבור', 309.3, 42],
  ['עקרב', 253.3, -30.7], ['הצלב הדרומי', 187.5, -60],
];

export function skyMap({ ra, dec, label }) {
  const { W, H } = SKY;
  const grid = [
    ...[-60, -30, 0, 30, 60].map((d) => polyline(range(-180, 180, 4).map((lam) => hammerLam(lam, d)))),
    ...range(0, 330, 30).map((r) => polyline(range(-90, 90, 3).map((d) => hammer(r + 0.001, d)))),
  ].map((d) => `<path class="map-grid" d="${d}"/>`).join('');
  const band = polyline(range(0, 360, 2).map((l) => { const e = galToEq(l, 0); return hammer(e.ra, e.dec); }));
  const gc = galToEq(0, 0);
  const [gx, gy] = hammer(gc.ra, gc.dec);
  // האזור שלא עולה בישראל: מתחת ל-δ = φ − 90
  const limit = ISRAEL_LAT - 90;
  const south = range(-180, 180, 4).map((lam) => hammerLam(lam, limit));
  const pole = hammerLam(0, -90);
  const southPath = `M${south.map((p) => `${f1(p[0])},${f1(p[1])}`).join('L')}L${f1(pole[0])},${f1(pole[1])}Z`;
  const [ox, oy] = hammer(ra, dec);
  const marks = LANDMARKS
    .map(([name, r, d]) => [name, ...hammer(r, d)])
    .filter(([, x, y]) => Math.hypot(x - ox, y - oy) > 34 && Math.hypot(x - gx, y - gy) > 34)
    .map(([name, x, y]) => `<g class="map-landmark"><circle cx="${f1(x)}" cy="${f1(y)}" r="1.8"/><text x="${f1(x)}" y="${f1(y - 5)}" text-anchor="middle">${esc(name)}</text></g>`).join('');
  const gcLabel = Math.hypot(gx - ox, gy - oy) > 30
    ? `<text class="map-mw-label" x="${f1(Math.min(Math.max(gx, 60), 360))}" y="${f1(gy - 9)}" text-anchor="middle">מרכז שביל החלב</text>` : '';
  return `<svg class="sky-map" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(`מפה של כל השמיים. ${label} מסומן בעיגול.`)}">`
    + `<ellipse class="map-sky" cx="${SKY.cx}" cy="${SKY.cy}" rx="${2 * Math.SQRT2 * SKY.s}" ry="${Math.SQRT2 * SKY.s}"/>${grid}`
    + `<path class="map-mw" d="${band}"/>`
    + `<path class="map-south" d="${southPath}"/>`
    + `<text class="map-south-label" x="${f1(Math.abs(ox - SKY.cx) < 60 && oy > pole[1] - 40 ? (ox > SKY.cx ? SKY.cx - 70 : SKY.cx + 70) : SKY.cx)}" y="${f1(pole[1] - 10)}" text-anchor="middle">לא עולה בישראל</text>`
    + `<circle class="map-gc" cx="${f1(gx)}" cy="${f1(gy)}" r="2.5"/>${gcLabel}${marks}`
    + `<circle class="map-target-ring" cx="${f1(ox)}" cy="${f1(oy)}" r="9"/><circle class="map-target" cx="${f1(ox)}" cy="${f1(oy)}" r="3.2"/>`
    + `</svg>`;
}

// ---------- שביל החלב מלמעלה ----------

// המרחק מהשמש למרכז הגלקסיה: כ-26,000 שנות אור (כמו בכרטיסים של Sgr A* ו-Sgr A East)
export const SUN_TO_CENTER_LY = 26000;
const DISK_LY = 50000; // רדיוס הדיסק בציור. כ-100,000 שנות אור קוטר — ראו sources.md

export function galaxyMap({ ra, dec, distanceLy, label }) {
  const W = 420, H = 300, cx = 210, cy = 146, R = 128, k = R / DISK_LY;
  const sun = [cx, cy + SUN_TO_CENTER_LY * k];
  const { l } = eqToGal(ra, dec);
  // מבט מהקוטב הצפוני של הגלקסיה: l = 0 לכיוון המרכז (למעלה), l = 90° שמאלה
  const o = [sun[0] - distanceLy * Math.sin(l * D) * k, sun[1] - distanceLy * Math.cos(l * D) * k];
  const atCenter = Math.hypot(o[0] - cx, o[1] - cy) < 8;
  const bar = 10000 * k;
  return `<svg class="galaxy-map" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(`שביל החלב במבט מלמעלה: המרכז, השמש, ו${label}.`)}">`
    + `<defs><radialGradient id="mw-disk"><stop offset="0" class="mw-stop-0"/><stop offset=".25" class="mw-stop-1"/><stop offset="1" class="mw-stop-2"/></radialGradient></defs>`
    + `<circle cx="${cx}" cy="${cy}" r="${R}" fill="url(#mw-disk)"/>`
    + `<line class="map-sightline" x1="${f1(sun[0])}" y1="${f1(sun[1])}" x2="${f1(o[0])}" y2="${f1(o[1])}"/>`
    + `<circle class="map-gc" cx="${cx}" cy="${cy}" r="3"/>`
    + `<text class="map-label" x="${cx}" y="${cy - (atCenter ? 16 : 9)}" text-anchor="middle">מרכז הגלקסיה</text>`
    + `<circle class="map-sun" cx="${f1(sun[0])}" cy="${f1(sun[1])}" r="4"/>`
    + `<text class="map-label" x="${f1(sun[0])}" y="${f1(sun[1] + 17)}" text-anchor="middle">השמש (אנחנו)</text>`
    + `<circle class="map-target-ring" cx="${f1(o[0])}" cy="${f1(o[1])}" r="9"/><circle class="map-target" cx="${f1(o[0])}" cy="${f1(o[1])}" r="3.2"/>`
    + `<g class="map-scale"><line x1="${W - 16 - bar}" y1="${H - 14}" x2="${W - 16}" y2="${H - 14}"/>`
    + `<text x="${W - 16}" y="${H - 22}" text-anchor="start">10,000 שנות אור</text></g>`
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

export function distanceScale({ distanceLy, label, home }) {
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
