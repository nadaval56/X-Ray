// HTML סטטי לעמודים שנבנים ב-JavaScript: רשימת המקרים, עמוד מקרה, ציר הזמן ו"השמיים ברנטגן".
// נכנס לקובצי ה-HTML בזמן ה-build (vite.config.js), כדי שמי שקורא את ה-HTML בלי להריץ JS —
// סורקים, תצוגות קישור, דפדפן בלי JS — יקבל את התוכן. כשה-JS רץ הוא מחליף את התוכן הזה בגרסה האינטראקטיבית,
// ולכן המבנה והמחלקות כאן תואמים לרכיבים ב-src/ (כדי שלא תהיה קפיצה בעמוד).
//
// בעמוד מקרה נכנסים רק הסיפור, השאלה והצילום — לא התשובה ("חקירה לפני הסבר").

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
  return `<p class="result-count">${cases.length} מקרים</p><div class="grid">${cards}</div>`;
}

export function caseBody(c, categories) {
  const main = c.images.find((im) => im.role === 'main');
  return `<div class="case-head"><nav class="breadcrumb" aria-label="נתיב"><a href="./cases.html">מקרים</a> / ${esc(categories[c.category])}</nav>`
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

// ---------- השמיים ברנטגן ----------

const dateFmt = new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });
const skyDate = (iso) => dateFmt.format(new Date(`${iso}T12:00:00Z`));
const newestFirst = (items) => [...items].sort((a, b) => b.date.localeCompare(a.date));

export function skyFeature(sky) {
  const it = newestFirst(sky.items)[0];
  const im = it.image;
  return `<article class="sky-feature" id="sky-${esc(it.id)}" aria-labelledby="sky-t-${esc(it.id)}">`
    + `<figure class="sky-figure"><img src="${img(esc(im.file))}" alt="${esc(im.alt)}" width="${im.width}" height="${im.height}" decoding="async">`
    + `<figcaption dir="ltr">X-ray: <a href="${esc(im.source.url)}" rel="noopener" target="_blank">${esc(im.source.author)}</a></figcaption></figure>`
    + `<div class="sky-body"><p class="sky-date">צ'נדרה · <time datetime="${esc(it.date)}">${skyDate(it.date)}</time></p>`
    + `<h3 id="sky-t-${esc(it.id)}">${esc(it.title)}</h3><p class="sky-object" dir="ltr" lang="en">${esc(it.object)}</p>`
    + it.text.map((p) => `<p>${esc(p)}</p>`).join('')
    + `<dl class="sky-facts">${it.facts.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>`
    + `<a class="sky-more" href="${esc(it.page)}" rel="noopener" target="_blank">לעמוד התמונה באתר צ'נדרה (באנגלית)</a></div></article>`;
}

// בלי JS הארכיון הוא רשימת קישורים למקור (הכפתורים שמחליפים תמונה דורשים JS)
export function skyArchive(sky) {
  return `<ul class="sky-archive">${newestFirst(sky.items).map((it) => `<li><a class="sky-tile" href="${esc(it.page)}" rel="noopener" target="_blank">`
    + `<img src="${img(esc(it.image.file))}" alt="" loading="lazy" decoding="async"><span class="sky-tile-title">${esc(it.title)}</span>`
    + `<span class="sky-tile-date">${skyDate(it.date)}</span></a></li>`).join('')}</ul>`;
}

export function sunSummary(sun) {
  return `<div class="sun-card"><p>המדידה האחרונה: <bdi>${esc(sun.latest.class)}</bdi> (<time datetime="${esc(sun.latest.t)}">${esc(sun.latest.t.slice(0, 10))}</time>). `
    + `<a href="https://sunspots.co.il/#xray-title" rel="noopener" target="_blank">לגרף החי באתר „השמש היום“</a></p></div>`;
}
