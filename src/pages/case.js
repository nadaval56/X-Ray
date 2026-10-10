// עמוד מקרה: סיפור → השערה (סימון על הצילום) → חשיפה → עיקרון → סיום → קרדיט.
// השלבים שאחרי ההשערה מוסתרים עד שהתלמיד מוצא את הממצא או מבקש לראות את התשובה.
import { h, prefersReducedMotion } from '../lib/dom.js';
import { getCase, mainImage, imagesByRole, imageUrl, categories, principles } from '../data/content.js';
import { createHotspot } from '../components/hotspot.js';
import { createCompare } from '../components/compare.js';
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
      SITE.showDraftBadges && c.draft && h('span', { class: 'tag tag-draft', text: 'טיוטה לבדיקה' }),
    ),
    h('h1', { text: c.title }),
    SITE.showDraftBadges && c.editorNotes && h('details', { class: 'callout editor-notes' },
      h('summary', { text: 'הערות לעורך' }), h('p', { text: c.editorNotes })),
    h('section', { class: 'step', 'aria-labelledby': 'step-story' },
      stepLabel('1', 'הסיפור'),
      h('h2', { class: 'visually-hidden', id: 'step-story', text: 'הסיפור' }),
      h('p', { class: 'story', text: c.story }),
    ),
  );

  // ---------- 2. השערה ----------
  let misses = 0;
  const feedback = h('div', { class: 'feedback', role: 'status', 'aria-live': 'polite' });
  const checkBtn = h('button', { type: 'button', class: 'btn btn-primary', disabled: true, text: 'בדיקה' });
  const answerBtn = h('button', { type: 'button', class: 'btn btn-ghost', hidden: true, text: 'הצגת התשובה' });

  const hotspot = createHotspot({
    src: imageUrl(main.file),
    alt: main.alt,
    findings: main.findings,
    caption: main.placeholder ? 'איור סכמטי להמחשה — לא צילום אמיתי.' : main.caption,
    onCheck: handleResult,
  });
  hotspot.el.addEventListener('hotspot:mark', () => {
    checkBtn.disabled = false;
    if (feedback.classList.contains('is-miss')) setFeedback('', '');
  });
  checkBtn.addEventListener('click', () => hotspot.check());
  answerBtn.addEventListener('click', () => {
    setFeedback('is-near', 'הנה התשובה — הממצא מסומן על הצילום בעיגול ירוק.');
    finish();
  });

  const hypothesis = h('section', { class: 'step case-media', 'aria-labelledby': 'step-q' },
    stepLabel('2', 'ההשערה שלך'),
    h('h2', { id: 'step-q', text: c.question }),
    h('p', { class: 'muted', text: 'לחצו על הצילום במקום שבו לדעתכם נמצא הממצא, ואז על "בדיקה". אפשר לשנות את הסימון כמה שרוצים.' }),
    hotspot.el,
    h('div', { class: 'btn-row', style: 'margin-top: 1rem' }, checkBtn, answerBtn),
    feedback,
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
    setFeedback(status === 'hit' ? 'is-hit' : 'is-near',
      status === 'hit' ? `מצאתם! ${finding.label}.` : `קרוב מאוד — זה האזור: ${finding.label}.`);
    finish();
  }

  // ---------- 3–6: מוסתרים עד החשיפה ----------
  const revealSteps = [];
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

  step(4, 'למה זה נראה ככה?', principle.title,
    h('div', { class: 'callout' },
      h('p', { text: c.principle.text }),
      h('p', {}, h('a', { href: `./${principle.href}`, text: 'להסבר המלא ב"איך זה עובד"' })),
    ),
  );

  step(5, 'מה קרה בסוף', 'הסוף הטוב', h('p', { text: c.outcome }), ...extraFigures('outcome'));

  step(6, 'קרדיט', 'מקור התמונות',
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

  function finish() {
    hotspot.reveal();
    checkBtn.hidden = true;
    answerBtn.hidden = true;
    feedback.append(h('div', {}, continueBtn));
    for (const el of revealSteps) {
      el.hidden = false;
      el.classList.add('is-entering');
    }
  }

  root.replaceChildren(h('div', { class: 'case-layout' },
    head,
    hypothesis,
    h('div', { class: 'case-steps' }, revealSteps),
  ));
}
