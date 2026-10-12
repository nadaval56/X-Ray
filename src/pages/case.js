// עמוד מקרה: סיפור → אתגר → חשיפה → עיקרון → סיום → קרדיט.
// האתגר הוא אחד משניים, לפי מה שמעניין יותר במקרה:
//   - סימון על הצילום ("איפה?") — ברירת המחדל;
//   - שאלה אמריקאית ("מה רואים?") — כשיש challenge.identify. אז הצילום לא לסימון, והממצא מסומן בחשיפה.
// השלבים שאחרי האתגר מוסתרים עד שהתלמיד פותר אותו או מבקש לראות את התשובה.
import { h, prefersReducedMotion } from '../lib/dom.js';
import { getCase, mainImage, imagesByRole, imageUrl, categories, principles } from '../data/content.js';
import { createHotspot } from '../components/hotspot.js';
import { createCompare } from '../components/compare.js';
import { createQuiz } from '../components/quiz.js';
import { creditItem, creditsList } from '../components/credits.js';
import { difficultyBadge } from '../components/badges.js';
import { SITE } from '../config.js';

const MISSES_BEFORE_ANSWER = 2;

const root = document.getElementById('case-root');
const id = new URLSearchParams(location.search).get('id');
const c = id && getCase(id);

if (!c) {
  document.title = `המקרה לא נמצא · ${SITE.name}`;
  root.replaceChildren(h('div', { class: 'page-head' },
    h('h1', { text: 'המקרה לא נמצא' }),
    h('p', { class: 'lead' }, 'ייתכן שהקישור שגוי או שהמקרה הוסר. ', h('a', { href: './cases.html', text: 'לרשימת המקרים' })),
  ));
} else {
  renderCase(c);
}

function stepLabel(num, text) {
  return h('div', { class: 'step-label' }, h('span', { class: 'num', 'aria-hidden': 'true', text: num }), text);
}

function renderCase(c) {
  document.title = `${c.title} · ${SITE.name}`;
  document.querySelector('meta[name="description"]')?.setAttribute('content', `${c.question} ${c.story}`.slice(0, 160));
  const main = mainImage(c);
  const normal = imagesByRole(c, 'normal')[0];
  const principle = principles[c.principle.id];

  // ---------- 1. סיפור ----------
  const head = h('div', { class: 'case-head' },
    h('nav', { class: 'breadcrumb', 'aria-label': 'נתיב' },
      h('a', { href: './cases.html', text: 'מקרים' }), ' / ', categories[c.category]),
    h('div', { class: 'case-tags' },
      h('span', { class: 'tag', text: categories[c.category] }),
      difficultyBadge(c.difficulty),
    ),
    h('h1', { text: c.title }),
    h('section', { class: 'step', 'aria-labelledby': 'step-story' },
      stepLabel('1', 'הסיפור'),
      h('h2', { class: 'visually-hidden', id: 'step-story', text: 'הסיפור' }),
      h('p', { class: 'story', text: c.story }),
    ),
  );

  // ---------- 2. האתגר: מה רואים? (שאלה אמריקאית) או איפה? (סימון) ----------
  const identify = c.challenge?.identify;
  const explain = c.challenge?.explain;
  const score = {};
  let misses = 0;
  const feedback = h('div', { class: 'feedback', role: 'status', 'aria-live': 'polite' });
  const checkBtn = h('button', { type: 'button', class: 'btn btn-primary', disabled: true, text: 'בדיקה' });
  const answerBtn = h('button', { type: 'button', class: 'btn btn-ghost', hidden: true, text: 'הצגת התשובה' });

  const caption = main.placeholder ? 'איור סכמטי להמחשה — לא צילום אמיתי.' : main.caption;
  // בשאלה אמריקאית הצילום רק להסתכלות: בלי סימון ובלי עיגולים בחשיפה
  const hotspot = !identify && createHotspot({
    src: imageUrl(main.file),
    alt: main.alt,
    findings: main.findings,
    caption,
    onCheck: handleResult,
  });
  const figure = hotspot ? hotspot.el : h('figure', { class: 'xray-figure' },
    h('div', { class: 'xray-frame' }, h('img', { src: imageUrl(main.file), alt: main.alt, decoding: 'async' })),
    caption && h('figcaption', { text: caption }),
  );
  hotspot && hotspot.el.addEventListener('hotspot:mark', () => {
    checkBtn.disabled = false;
    if (feedback.classList.contains('is-miss')) setFeedback('', '');
  });
  checkBtn.addEventListener('click', () => hotspot.check());
  answerBtn.addEventListener('click', () => {
    score.locate = { gaveUp: true, attempts: misses };
    setFeedback('is-near', 'הנה התשובה — הממצא מסומן על הצילום בעיגול ירוק.');
    finish();
  });

  const locate = !identify && h('div', { class: 'locate' },
    h('h3', { class: 'locate-q', id: 'step-q', text: c.question }),
    h('p', { class: 'muted', text: 'לחצו על הצילום במקום שבו לדעתכם נמצא הממצא, ואז על "בדיקה". אפשר לשנות את הסימון כמה שרוצים.' }),
    h('div', { class: 'btn-row' }, checkBtn, answerBtn),
    feedback,
  );

  const identifyQuiz = identify && createQuiz({
    ...identify,
    id: 'identify',
    onDone: (r) => {
      score.identify = r;
      finish();
    },
  });

  const hypothesis = h('section', { class: 'step case-media', 'aria-labelledby': identify ? 'step-id' : 'step-q' },
    stepLabel('2', identify ? 'מה רואים?' : 'איפה?'),
    identify && h('h2', { id: 'step-id', class: 'visually-hidden', text: identify.question }),
    figure,
    identifyQuiz && identifyQuiz.el,
    locate,
  );

  function setFeedback(kind, ...content) {
    feedback.className = `feedback ${kind}`;
    feedback.replaceChildren(...content);
  }

  function handleResult({ status, finding }) {
    if (status === 'miss') {
      misses++;
      setFeedback('is-miss', `לא כאן. ${c.hint ?? 'נסו להסתכל שוב על הצילום.'}`);
      if (misses >= MISSES_BEFORE_ANSWER) answerBtn.hidden = false;
      return;
    }
    score.locate = { gaveUp: false, attempts: misses + 1 };
    setFeedback(status === 'hit' ? 'is-hit' : 'is-near',
      status === 'hit' ? `מצאתם! ${finding.label}.` : `קרוב מאוד — זה האזור: ${finding.label}.`);
    finish();
  }

  // ---------- 3–6: מוסתרים עד החשיפה ----------
  const revealSteps = [];
  const afterExplain = [];
  const step = (num, label, title, ...body) => {
    const headingId = `step-${num}`;
    const el = h('section', { class: 'step', hidden: true, 'aria-labelledby': headingId },
      stepLabel(String(num), label),
      h('h2', { id: headingId, tabindex: '-1', text: title }),
      ...body,
    );
    revealSteps.push(el);
    return el;
  };

  // צילומים נוספים (מנח נוסף, מעקב): בשלב החשיפה, או בשלב הסיום אם showIn: "outcome"
  const extraFigures = (where) => imagesByRole(c, 'second-view')
    .filter((im) => (im.showIn ?? 'reveal') === where)
    .map((im) => h('figure', { class: 'xray-figure extra-figure' },
      h('div', { class: 'xray-frame' },
        h('img', { src: imageUrl(im.file), alt: im.alt, loading: 'lazy', decoding: 'async' })),
      im.caption && h('figcaption', { text: im.caption }),
    ));

  const revealStep = step(3, 'החשיפה', [...new Set(main.findings.map((f) => f.label))].join(', '),
    h('p', { text: c.reveal }),
    normal && createCompare({
      left: { src: imageUrl(normal.file), alt: normal.alt, label: 'צילום תקין' },
      right: { src: imageUrl(main.file), alt: main.alt, label: 'הצילום במקרה' },
      caption: 'גררו את הקו כדי להשוות לצילום תקין.',
    }).el,
    ...extraFigures('reveal'),
  );

  // "למה?" — אם יש שאלת הסבר, ההסבר והשלבים שאחריו נפתחים רק אחרי שעונים עליה
  const principleBox = h('div', { class: 'callout', hidden: Boolean(explain) },
    h('p', { text: c.principle.text }),
    h('p', {}, h('a', { href: `./${principle.href}`, text: 'להסבר המלא ב"איך זה עובד"' })),
  );
  const summary = h('ul', { class: 'score' });
  const explainQuiz = explain && createQuiz({
    ...explain,
    id: 'explain',
    onDone: (r) => {
      score.explain = r;
      principleBox.hidden = false;
      principleBox.classList.add('is-entering');
      for (const el of afterExplain) { el.hidden = false; el.classList.add('is-entering'); }
      renderSummary();
    },
  });
  step(4, 'למה זה נראה ככה?', explain ? explain.question : principle.title,
    explainQuiz && explainQuiz.el,
    principleBox,
  );
  if (explainQuiz) explainQuiz.el.querySelector('.quiz-question').classList.add('visually-hidden');

  const outcomeStep = step(5, 'מה קרה בסוף', 'הסוף הטוב', h('p', { text: c.outcome }), ...extraFigures('outcome'), summary);

  const creditStep = step(6, 'קרדיט', 'מקור התמונות',
    creditsList(c.images.map((im) => creditItem(im, {
      context: { main: 'הצילום במקרה', normal: 'צילום תקין להשוואה', 'second-view': 'מנח נוסף' }[im.role],
    }))),
  );

  const continueBtn = h('button', {
    type: 'button',
    class: 'btn',
    style: 'margin-top: 0.75rem',
    text: 'להסבר',
    onclick: () => {
      const heading = revealStep.querySelector('h2');
      heading.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
      heading.focus({ preventScroll: true });
    },
  });

  if (explain) afterExplain.push(outcomeStep, creditStep);

  function renderSummary() {
    const rows = [
      identify && ['זיהוי', score.identify],
      ['מיקום', score.locate],
      explain && ['הסבר', score.explain],
    ].filter(Boolean).filter(([, r]) => r);
    summary.replaceChildren(...rows.map(([label, r]) => h('li', { class: r.gaveUp ? 'is-gaveup' : 'is-ok' },
      h('span', { class: 'score-label', text: label }),
      r.gaveUp ? 'ראיתם את התשובה' : r.attempts === 1 ? 'בניסיון הראשון' : `אחרי ${r.attempts} ניסיונות`,
    )));
  }

  function finish() {
    hotspot && hotspot.reveal();
    checkBtn.hidden = true;
    answerBtn.hidden = true;
    (identifyQuiz ? identifyQuiz.el : feedback).append(h('div', {}, continueBtn));
    for (const el of revealSteps) {
      if (afterExplain.includes(el)) continue;
      el.hidden = false;
      el.classList.add('is-entering');
    }
    renderSummary();
  }

  root.replaceChildren(h('div', { class: 'case-layout' },
    head,
    hypothesis,
    h('div', { class: 'case-steps' }, revealSteps),
  ));
}
