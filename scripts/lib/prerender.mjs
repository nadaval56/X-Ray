// HTML סטטי לעמודים שנבנים ב-JavaScript: רשימת המקרים, עמוד מקרה, ציר הזמן ו"רנטגן בחלל".
// נכנס לקובצי ה-HTML בזמן ה-build (vite.config.js), כדי שמי שקורא את ה-HTML בלי להריץ JS —
// סורקים, תצוגות קישור, דפדפן בלי JS — יקבל את התוכן. כשה-JS רץ הוא מחליף את התוכן הזה בגרסה האינטראקטיבית,
// ולכן המבנה והמחלקות כאן תואמים לרכיבים ב-src/ (כדי שלא תהיה קפיצה בעמוד).
//
// בעמוד מקרה נכנסים רק הסיפור, השאלה והצילום — לא התשובה ("חקירה לפני הסבר").

import { skyMap, galaxyMap, distanceScale, solarMap, israelLine } from '../../src/lib/sky-maps.js';

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const img = (file) => `./images/${file}`;
const DIFFICULTY_LABELS = { 1: 'מתחילים', 2: 'בינוני', 3: 'מאתגר' };

const difficultyBadge = (level) => `<span class="difficulty"><span class="difficulty-dots" aria-hidden="true">${
  [1, 2, 3].map((i) => `<i class="${i <= level ? 'on' : ''}"></i>`).join('')}</span>רמה ${level} · ${DIFFICULTY_LABELS[level]}</span>`;

// ---------- מקרים ----------

export function casesList(cases, categories) {
  const cards = cases.map((c) => {
    const main = c.images.find((im) => im.role === 'main');
    return `<article class="card"><div class="card-thumb"><img src="${img(`cases/${esc(main.file)}`)}" alt="" loading="lazy" decoding="async"></div>`
      + `<div class="card-body"><h2><a class="card-link" href="./case-${esc(c.id)}.html">${esc(c.title)}</a></h2><p>${esc(c.question)}</p>`
      + `<div class="card-meta"><span class="tag">${esc(categories[c.category])}</span>${difficultyBadge(c.difficulty)}</div></div></article>`;
  }).join('');
  return `<p class="result-count">${cases.length} תיקים</p><div class="grid">${cards}</div>`;
}

export function caseBody(c, categories) {
  const main = c.images.find((im) => im.role === 'main');
  return `<div class="case-head"><nav class="breadcrumb" aria-label="נתיב"><a href="./cases.html">התיקים</a> / ${esc(categories[c.category])}</nav>`
    + `<div class="case-tags"><span class="tag">${esc(categories[c.category])}</span>${difficultyBadge(c.difficulty)}</div>`
    + `<h1>${esc(c.title)}</h1>`
    + `<section class="step" aria-labelledby="step-story"><div class="step-label"><span class="num" aria-hidden="true">1</span>הסיפור</div>`
    + `<h2 class="visually-hidden" id="step-story">הסיפור</h2><p class="story">${esc(c.story)}</p></section></div>`
    + `<section class="step" aria-labelledby="step-q"><div class="step-label"><span class="num" aria-hidden="true">2</span>${c.challenge?.identify ? 'מה רואים?' : 'איפה?'}</div>`
    + `<h2 class="visually-hidden" id="step-q">השאלה</h2><p>${esc(c.question)}</p>`
    + `<figure class="xray-figure"><div class="xray-frame"><img src="${img(`cases/${esc(main.file)}`)}" alt="${esc(main.alt)}" decoding="async"></div>`
    + `${main.caption ? `<figcaption>${esc(main.caption)}</figcaption>` : ''}</figure>`
    + `<noscript><p class="empty-state">כדי לסמן על הצילום ולגלות את התשובה צריך להפעיל JavaScript בדפדפן.</p></noscript></section>`;
}

// ---------- ציר הזמן (אותו מבנה כמו src/components/timeline.js) ----------

export function timeline({ events }) {
  const link = (l) => (/^https?:/.test(l.href)
    ? `<a class="tl-case" href="${esc(l.href)}" rel="noopener" target="_blank">${esc(l.label)}</a>`
    : `<a class="tl-case" href="./${esc(l.href)}">${esc(l.label)}</a>`);
  const nav = `<nav class="tl-nav" aria-label="קפיצה לשנה"><ol>${events.map((e) => `<li><a href="#tl-${esc(e.id)}" data-id="${esc(e.id)}">${esc(e.year)}</a></li>`).join('')}</ol></nav>`;
  const items = events.map((e) => {
    const fig = e.image ? `<figure class="tl-figure"><img src="${img(esc(e.image.file))}" alt="${esc(e.image.alt)}" loading="lazy" decoding="async">`
      + `<figcaption>${esc(e.image.caption)} ${e.image.oldPrint ? '<span>זו הדפסה על נייר מהנגטיב, ולכן העצמות כהות (<a href="./physics.html#old-prints">למה?</a>). </span>' : ''}`
      + `<a href="${esc(e.image.source.url)}" rel="noopener" target="_blank">מקור התמונה</a></figcaption></figure>` : '';
    const sources = [e.source, ...(e.moreSources ?? [])].map((s, i) => `<a href="${esc(s.url)}" rel="noopener" target="_blank">${i ? '' : 'מקור: '}${esc(s.label)}</a>`).join('');
    return `<li class="tl-item" id="tl-${esc(e.id)}"><div class="tl-marker" aria-hidden="true"><span>${esc(e.year)}</span></div><article class="tl-card">${fig}`
      + `<p class="tl-date">${esc(e.date)}</p><h2 class="tl-title">${esc(e.title)}</h2><p class="tl-text">${esc(e.text)}</p>`
      + `<p class="tl-meta">${sources}${e.link ? link(e.link) : ''}</p></article></li>`;
  }).join('');
  return `<div class="timeline">${nav}<ol class="tl-list">${items}</ol></div>`;
}

// ---------- רנטגן בחלל ----------

const dateFmt = new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });
const skyDate = (iso) => dateFmt.format(new Date(`${iso}T12:00:00Z`));
const newestFirst = (items) => [...items].sort((a, b) => b.date.localeCompare(a.date));

export function skyFeature(sky) {
  const it = newestFirst(sky.items)[0];
  const im = it.image;
  return `<article class="sky-feature" id="sky-${esc(it.id)}" aria-labelledby="sky-t-${esc(it.id)}">`
    + `<figure class="sky-figure"><img src="${img(esc(im.file))}" alt="${esc(im.alt)}" width="${im.width}" height="${im.height}" decoding="async">`
    + `<figcaption dir="ltr">X-ray: <a href="${esc(im.source.url)}" rel="noopener" target="_blank">${esc(im.source.author)}</a></figcaption></figure>`
    + `<div class="sky-body"><p class="sky-date">טלסקופ החלל צ'נדרה · <time datetime="${esc(it.date)}">${skyDate(it.date)}</time></p>`
    + `<h3 id="sky-t-${esc(it.id)}">${esc(it.title)}</h3><p class="sky-object" dir="ltr" lang="en">${esc(it.object)}</p>`
    + it.text.map((p) => `<p>${esc(p)}</p>`).join('')
    + `<dl class="sky-facts">${it.facts.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>`
    + `<a class="sky-more btn" href="./sky-${esc(it.id)}.html">לעמוד המלא: איפה זה בשמיים, ועוד</a></div></article>`;
}

// הארכיון: קישור לעמוד של כל תמונה (sky-<id>.html)
export function skyArchive(sky) {
  return `<ul class="sky-archive">${newestFirst(sky.items).map((it) => `<li><a class="sky-tile" href="./sky-${esc(it.id)}.html">`
    + `<img src="${img(esc(it.image.file))}" alt="" loading="lazy" decoding="async"><span class="sky-tile-title">${esc(it.title)}</span>`
    + `<span class="sky-tile-date">${skyDate(it.date)}</span></a></li>`).join('')}</ul>`;
}

// ---------- עמוד לכל תמונה (sky-<id>.html) ----------

const fact = (it, key) => it.facts.find(([k]) => k === key)?.[1];

function whereSection(it) {
  const w = it.where;
  if (!w) return '';
  const name = esc(it.object);
  const dist = fact(it, 'מרחק');
  const lightAgo = dist && /שנות אור/.test(dist) ? `האור שצ'נדרה קלט ממנו יצא לדרך לפני ${esc(dist.replace('שנות אור', 'שנה'))}` : '';
  if (w.home === 'solar') {
    return `<section class="sky-where" aria-labelledby="where-t"><h2 id="where-t">איפה זה?</h2>`
      + `<p>שבתאי הוא כוכב לכת במערכת השמש שלנו, השישי במרחק מהשמש. בציור: המסלולים של כדור הארץ, מאדים, צדק ושבתאי סביב השמש, בקנה מידה אמיתי של המרחקים.</p>`
      + `<figure class="sky-map-fig">${solarMap({ label: 'שבתאי' })}<figcaption>המקום של כל כוכב לכת על המסלול שלו בציור הוא להמחשה בלבד. כוכבי הלכת עצמם קטנים מכדי להיראות בקנה המידה הזה.</figcaption></figure></section>`;
  }
  const skyPart = `<h2 id="where-t">איפה זה בשמיים?</h2>`
    + `<p><span dir="ltr">${name}</span> נמצא בקבוצת הכוכבים <strong>${esc(w.constellation)}</strong> (<span dir="ltr" lang="en">${esc(w.constellationEn)}</span>). ${israelLine(w.dec)}</p>`
    + `<figure class="sky-map-fig">${skyMap({ ra: w.ra, dec: w.dec, label: it.object })}`
    + `<figcaption>כל השמיים בצילום אחד, פרוסים כמו מפת עולם. הרצועה הבהירה היא שביל החלב — הדיסק של הגלקסיה שלנו, כשמסתכלים עליו מבפנים — ובאמצע התמונה מרכז הגלקסיה. העיגול הצהוב מסמן את <span dir="ltr">${name}</span>, ואת האזור המקווקו אף פעם לא רואים מישראל. `
    + `צילום: <a href="https://www.eso.org/public/images/eso0932a/" rel="noopener" target="_blank" dir="ltr">ESO/S. Brunier</a> (<a href="https://creativecommons.org/licenses/by/4.0/" rel="noopener" target="_blank" dir="ltr">CC BY 4.0</a>), עם סימונים שלנו.</figcaption></figure>`;
  let depth;
  if (w.home === 'milkyway') {
    depth = `<h2 id="depth-t">איפה זה בשביל החלב?</h2>`
      + `<p>שביל החלב הוא הגלקסיה שלנו: דיסק שטוח וענקי של כוכבים, גז ואבק, והשמש היא אחד מהכוכבים שבו. כך נראה המקום של <span dir="ltr">${name}</span> אם היינו מסתכלים על הגלקסיה מלמעלה.${lightAgo ? ` ${lightAgo}.` : ''}</p>`
      + `<figure class="sky-map-fig">${galaxyMap({ ra: w.ra, dec: w.dec, distanceLy: w.distanceLy, label: it.object })}<figcaption>איור של אמן: כך נראה שביל החלב מלמעלה, עם הזרועות הספירליות והמוט שבמרכז. מהשמש עד מרכז הגלקסיה יש כ-26,000 שנות אור. את השמש ואת <span dir="ltr">${name}</span> סימנו אנחנו, לפי הכיוון בשמיים והמרחק. איור: <a href="https://images.nasa.gov/details/PIA10748" rel="noopener" target="_blank" dir="ltr">NASA/JPL-Caltech/R. Hurt</a>.</figcaption></figure>`;
  } else {
    const where = w.home === 'lmc' ? 'בענן מגלן הגדול, גלקסיה קטנה שמקיפה את שביל החלב'
      : w.home === 'smc' ? 'בענן מגלן הקטן, גלקסיה קטנה שמקיפה את שביל החלב' : 'הרחק מחוץ לגלקסיה שלנו';
    depth = `<h2 id="depth-t">כמה זה רחוק?</h2>`
      + `<p><span dir="ltr">${name}</span> נמצא ${where}.${lightAgo ? ` ${lightAgo}.` : ''} בסרגל אפשר להשוות למרחקים מוכרים יותר.</p>`
      + `<figure class="sky-map-fig">${distanceScale({ distanceLy: w.distanceLy, label: it.object, home: w.home })}<figcaption>המרחקים בשנות אור מאיתנו. בסרגל הזה כל שנתה רחוקה פי 10 מהקודמת, אחרת המרחקים לא היו נכנסים בשורה אחת.</figcaption></figure>`;
  }
  return `<section class="sky-where" aria-labelledby="where-t">${skyPart}</section><section class="sky-where" aria-labelledby="depth-t">${depth}</section>`;
}

/** עמוד מלא לתמונה אחת. items ממוינים מהחדש לישן. */
export function skyObject(it, items) {
  const im = it.image;
  const i = items.indexOf(it);
  const newer = items[i - 1], older = items[i + 1];
  const facts = [...it.facts, ...(it.where?.constellation ? [['קבוצת כוכבים', it.where.constellation]] : [])];
  const sources = [
    { label: `Chandra: ${it.object}`, url: it.page },
    ...(it.moreSources ?? []),
    ...(it.where?.source && !(it.moreSources ?? []).some((s) => s.url === it.where.source.url) && it.where.source.url !== it.page ? [it.where.source] : []),
  ];
  const navLink = (o, rel, label) => (o ? `<a class="sky-pager-${rel}" href="./sky-${esc(o.id)}.html"><span class="muted">${label}</span>${esc(o.title)}</a>` : '<span></span>');
  return `<nav class="breadcrumb" aria-label="נתיב"><a href="./sky.html">רנטגן בחלל</a> / <a href="./sky.html#sky-archive-title">כל התמונות</a></nav>`
    + `<header class="sky-object-head"><p class="sky-date">טלסקופ החלל צ'נדרה · <time datetime="${esc(it.date)}">${skyDate(it.date)}</time></p>`
    + `<h1>${esc(it.title)}</h1><p class="sky-object" dir="ltr" lang="en">${esc(it.object)}</p></header>`
    + `<article class="sky-feature"><figure class="sky-figure"><img src="${img(esc(im.file))}" alt="${esc(im.alt)}" width="${im.width}" height="${im.height}" decoding="async">`
    + `<figcaption dir="ltr">X-ray: <a href="${esc(im.source.url)}" rel="noopener" target="_blank">${esc(im.source.author)}</a></figcaption></figure>`
    + `<div class="sky-body">${it.text.map((p) => `<p>${esc(p)}</p>`).join('')}`
    + `<dl class="sky-facts">${facts.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl></div></article>`
    + whereSection(it)
    + (it.more?.length ? `<section class="sky-more-text prose" aria-labelledby="more-t"><h2 id="more-t">עוד על ${it.where?.name ? esc(it.where.name) : `<span dir="ltr">${esc(it.object)}</span>`}</h2>${it.more.map((p) => `<p>${esc(p)}</p>`).join('')}</section>` : '')
    + `<section class="sky-sources" aria-labelledby="src-t"><h2 id="src-t">מקורות</h2><ul>${sources.map((s) => `<li><a href="${esc(s.url)}" rel="noopener" target="_blank">${esc(s.label)}</a></li>`).join('')}</ul>`
    + `<p class="muted">התמונה: שכבת הרנטגן מתוך הפרסום של צ'נדרה (נאס"א), בלי שכבות מטלסקופים אחרים. הצבעים נבחרו כדי להראות את הנתונים — העין לא רואה קרני X.</p></section>`
    + `<nav class="sky-pager" aria-label="תמונות נוספות">${navLink(newer, 'newer', 'החדשה יותר')}${navLink(older, 'older', 'הקודמת')}</nav>`;
}

export function sunSummary(sun) {
  return `<div class="sun-card"><p>המדידה האחרונה: <bdi>${esc(sun.latest.class)}</bdi> (<time datetime="${esc(sun.latest.t)}">${esc(sun.latest.t.slice(0, 10))}</time>). `
    + `<a href="https://sunspots.co.il/#xray-title" rel="noopener" target="_blank">לגרף החי באתר "השמש היום"</a></p></div>`;
}
