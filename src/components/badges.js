import { h } from '../lib/dom.js';

const DIFFICULTY_LABELS = { 1: 'מתחילים', 2: 'בינוני', 3: 'מאתגר' };

export function difficultyBadge(level) {
  return h('span', { class: 'difficulty' },
    h('span', { class: 'difficulty-dots', 'aria-hidden': 'true' },
      [1, 2, 3].map((i) => h('i', { class: i <= level ? 'on' : '' })),
    ),
    `רמה ${level} · ${DIFFICULTY_LABELS[level]}`,
  );
}
