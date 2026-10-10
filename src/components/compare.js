// השוואה תקין / לא תקין: שתי תמונות זו על זו, וקו גרירה שחושף את העליונה.
// שתי התמונות חייבות להיות באותו גודל ובאותו מנח.
//
// מגע: גרירה אופקית בכל מקום על התמונה (גלילה אנכית ממשיכה לעבוד — touch-action: pan-y).
// מקלדת: הידית היא role="slider" — חיצים, Home/End, PageUp/PageDown.

import { h, s } from '../lib/dom.js';

/**
 * @param {object} opts
 * @param {{src:string, alt:string, label:string}} opts.left   מוצגת בצד שמאל של הקו
 * @param {{src:string, alt:string, label:string}} opts.right  מוצגת בצד ימין של הקו
 * @param {string} [opts.caption]
 * @param {number} [opts.start=50]
 */
export function createCompare({ left, right, caption, start = 50 }) {
  let pos = start;

  const knob = h('span', { class: 'compare-knob' });
  knob.append(s('svg', { viewBox: '0 0 20 20', 'aria-hidden': 'true' },
    s('path', { d: 'M7 5l-4 5 4 5M13 5l4 5-4 5', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.8', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
  ));

  const handle = h('div', {
    class: 'compare-handle',
    role: 'slider',
    tabindex: '0',
    'aria-label': `השוואה: ${left.label} מול ${right.label}`,
    'aria-valuemin': '0',
    'aria-valuemax': '100',
    'aria-orientation': 'horizontal',
  }, knob);

  const container = h('div', { class: 'compare', dir: 'ltr' },
    h('img', { src: right.src, alt: right.alt, draggable: 'false' }),
    h('div', { class: 'compare-top' }, h('img', { src: left.src, alt: left.alt, draggable: 'false' })),
    h('span', { class: 'compare-label left', text: left.label, dir: 'rtl' }),
    h('span', { class: 'compare-label right', text: right.label, dir: 'rtl' }),
    handle,
  );

  const el = h('figure', { class: 'xray-figure' },
    h('div', { class: 'xray-frame' }, container),
    caption && h('figcaption', { text: caption }),
  );

  function set(value) {
    pos = Math.min(100, Math.max(0, value));
    container.style.setProperty('--pos', `${pos}%`);
    handle.setAttribute('aria-valuenow', String(Math.round(pos)));
    handle.setAttribute('aria-valuetext', `${Math.round(pos)}% ${left.label}`);
  }
  set(pos);

  let dragging = false;
  const fromEvent = (e) => {
    const rect = container.getBoundingClientRect();
    set(((e.clientX - rect.left) / rect.width) * 100);
  };
  container.addEventListener('pointerdown', (e) => {
    dragging = true;
    container.setPointerCapture(e.pointerId);
    fromEvent(e);
  });
  container.addEventListener('pointermove', (e) => { if (dragging) fromEvent(e); });
  const stop = () => { dragging = false; };
  container.addEventListener('pointerup', stop);
  container.addEventListener('pointercancel', stop);

  handle.addEventListener('keydown', (e) => {
    const keys = { ArrowLeft: -5, ArrowRight: 5, ArrowDown: -5, ArrowUp: 5, PageDown: -20, PageUp: 20 };
    if (e.key in keys) set(pos + keys[e.key]);
    else if (e.key === 'Home') set(0);
    else if (e.key === 'End') set(100);
    else return;
    e.preventDefault();
  });

  return { el, set };
}
