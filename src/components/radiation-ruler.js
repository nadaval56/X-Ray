// סרגל קרינה: מנות של בדיקות מוכרות, על סקאלה לוגריתמית (כל קו = פי 10),
// עם ההשוואה של המקור לימים של קרינת רקע טבעית. סדרה אחת → צבע אחד, בלי מקרא; הערכים כתובים כטקסט.

import { h } from '../lib/dom.js';

const MIN = 0.0005;
const MAX = 10;
const pos = (v) => (Math.log10(v) - Math.log10(MIN)) / (Math.log10(MAX) - Math.log10(MIN));
const fmt = (v) => (v < 0.01 ? v.toFixed(3) : v < 1 ? String(v) : v.toLocaleString('he-IL'));

export function createRadiationRuler({ items, source }) {
  const ticks = [0.001, 0.01, 0.1, 1, 10];
  const tip = h('div', { class: 'rr-tip', role: 'tooltip', hidden: true });

  const rows = items.map((it) => {
    const bar = h('span', { class: `rr-bar${it.isBackground ? ' is-ref' : ''}`, style: `inline-size:${(pos(it.mSv) * 100).toFixed(1)}%` });
    const valueText = `${it.lessThan ? 'פחות מ-' : ''}${fmt(it.mSv)} מיליסיוורט`;
    const row = h('li', { class: 'rr-row', tabindex: '0' },
      h('span', { class: 'rr-label' }, it.label, it.note && h('small', { text: ` (${it.note})` })),
      h('span', { class: 'rr-track', dir: 'ltr' }, bar),
      h('span', { class: 'rr-value' }, h('strong', { text: it.background }), ' של קרינת רקע'),
    );
    const show = () => {
      tip.textContent = `${it.label}: ${valueText} — כמו ${it.background} של קרינת רקע טבעית`;
      tip.hidden = false;
      const r = row.getBoundingClientRect(); const pr = row.parentElement.getBoundingClientRect();
      tip.style.top = `${r.top - pr.top - 8}px`;
    };
    const hide = () => { tip.hidden = true; };
    row.addEventListener('pointerenter', show); row.addEventListener('pointerleave', hide);
    row.addEventListener('focus', show); row.addEventListener('blur', hide);
    row.setAttribute('aria-label', `${it.label}: ${valueText}, כמו ${it.background} של קרינת רקע`);
    return row;
  });

  const axis = h('div', { class: 'rr-axis', dir: 'ltr', 'aria-hidden': 'true' },
    ticks.map((t) => h('span', { style: `inset-inline-start:${(pos(t) * 100).toFixed(1)}%`, text: String(t) })));

  const el = h('figure', { class: 'rr' },
    h('div', { class: 'rr-plot' }, h('ol', { class: 'rr-list' }, rows), tip),
    h('div', { class: 'rr-axis-row' }, h('span'), axis, h('span', { class: 'rr-unit', text: 'מיליסיוורט (mSv)' })),
    h('figcaption', {},
      'הסרגל לוגריתמי: כל קו אנכי גדול פי 10 מהקודם. ',
      h('a', { href: source.url, rel: 'noopener', target: '_blank' }, 'מקור: ', source.label)),
  );
  return { el };
}
