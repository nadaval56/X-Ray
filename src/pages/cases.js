// רשימת מקרים עם סינון לפי קטגוריה ורמת קושי. מצב הסינון נשמר בכתובת (אפשר לשתף קישור).
import { h } from '../lib/dom.js';
import { cases, categories, mainImage, imageUrl, caseUrl } from '../data/content.js';
import { SITE } from '../config.js';
import { difficultyBadge } from '../components/badges.js';

const root = document.getElementById('cases-root');
const params = new URLSearchParams(location.search);
const state = {
  category: categories[params.get('category')] ? params.get('category') : 'all',
  difficulty: ['1', '2', '3'].includes(params.get('difficulty')) ? params.get('difficulty') : 'all',
};

function chipGroup(legend, name, options) {
  return h('fieldset', {},
    h('legend', { text: legend }),
    h('div', { class: 'chip-row' },
      options.map(([value, label]) => h('button', {
        type: 'button',
        class: 'chip',
        'aria-pressed': String(state[name] === value),
        onclick: (e) => {
          state[name] = value;
          e.currentTarget.parentElement.querySelectorAll('.chip')
            .forEach((b) => b.setAttribute('aria-pressed', String(b === e.currentTarget)));
          render();
        },
      }, label)),
    ),
  );
}

function card(c) {
  const img = mainImage(c);
  return h('article', { class: 'card' },
    h('div', { class: 'card-thumb' },
      // תמונה ממוזערת דקורטיבית — הכותרת היא הקישור, ו-alt המלא נמצא בעמוד המקרה
      h('img', { src: imageUrl(img.file), alt: '', loading: 'lazy', decoding: 'async' }),
    ),
    h('div', { class: 'card-body' },
      h('h3', {}, h('a', { class: 'card-link', href: caseUrl(c.id), text: c.title })),
      h('p', { text: c.question }),
      h('div', { class: 'card-meta' },
        h('span', { class: 'tag', text: categories[c.category] }),
        difficultyBadge(c.difficulty),
        SITE.showDraftBadges && c.draft && h('span', { class: 'tag tag-draft', text: 'טיוטה' }),
      ),
    ),
  );
}

const filters = h('div', { class: 'filters' },
  chipGroup('נושא', 'category', [['all', 'הכול'], ...Object.entries(categories)]),
  chipGroup('רמת קושי', 'difficulty', [['all', 'הכול'], ['1', 'רמה 1'], ['2', 'רמה 2'], ['3', 'רמה 3']]),
);
const count = h('p', { class: 'result-count', role: 'status', 'aria-live': 'polite' });
const list = h('div', { class: 'grid' });
root.replaceChildren(filters, count, list);

function render() {
  const shown = cases.filter((c) =>
    (state.category === 'all' || c.category === state.category) &&
    (state.difficulty === 'all' || String(c.difficulty) === state.difficulty));

  count.textContent = shown.length === 1 ? 'מקרה אחד' : `${shown.length} מקרים`;
  list.replaceChildren(...(shown.length
    ? shown.map(card)
    : [h('p', { class: 'empty-state', style: 'grid-column: 1 / -1' }, 'עדיין אין מקרים שמתאימים לסינון הזה. מקרים חדשים יתווספו בקרוב.')]));

  const q = new URLSearchParams();
  if (state.category !== 'all') q.set('category', state.category);
  if (state.difficulty !== 'all') q.set('difficulty', state.difficulty);
  history.replaceState(null, '', q.size ? `?${q}` : location.pathname);
}

render();
