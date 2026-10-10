// בהירות וניגודיות (window/level) על צילום אמיתי.
// level = מרכז החלון (0–255), window = רוחב החלון (8–255).
// כל פיקסל: out = (v − (level − window/2)) · 255 / window, חתוך ל-0..255.
// הצילומים כאן הם JPEG/WebP של 8 ביט, כך שזה רק המחשה: בצילום רפואי אמיתי יש הרבה יותר רמות אפור.

import { h } from '../lib/dom.js';

/**
 * @param {object} opts
 * @param {Array<{id:string,label:string,src:string,alt:string,hint?:string}>} opts.images
 * @param {string} [opts.idPrefix='wl']
 */
export function createWindowLevel({ images, idPrefix = 'wl' }) {
  let current = images[0];
  let pixels = null; // Uint8ClampedArray של המקור (אפור)
  let level = 128;
  let width = 255;

  const canvas = h('canvas', { class: 'wl-canvas', role: 'img' });
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const hint = h('p', { class: 'muted wl-hint' });

  const slider = (id, label, min, max, value, onInput) => {
    const out = h('output', { for: id, text: String(value) });
    const input = h('input', { id, class: 'range', type: 'range', min: String(min), max: String(max), step: '1', value: String(value), dir: 'ltr' });
    input.addEventListener('input', () => { onInput(Number(input.value)); out.textContent = input.value; draw(); });
    return { el: h('div', {}, h('label', { class: 'sim-label', for: id }, label, ': ', out), input), input, out };
  };
  const levelCtl = slider(`${idPrefix}-level`, 'בהירות', 0, 255, level, (v) => { level = 255 - v; });
  const widthCtl = slider(`${idPrefix}-width`, 'ניגודיות', 0, 247, 255 - width, (v) => { width = 255 - v; });
  levelCtl.input.value = String(255 - level);
  levelCtl.out.textContent = levelCtl.input.value;

  const picker = h('fieldset', {},
    h('legend', { text: 'צילום' }),
    h('div', { class: 'chip-row' }, images.map((im) => h('label', { class: 'chip' },
      h('input', { type: 'radio', name: `${idPrefix}-img`, value: im.id, checked: im === current, onchange: () => load(im) }),
      im.label,
    ))),
  );
  const reset = h('button', { type: 'button', class: 'btn btn-ghost', text: 'איפוס' });
  reset.addEventListener('click', () => {
    level = 128; width = 255;
    levelCtl.input.value = '127'; levelCtl.out.textContent = '127';
    widthCtl.input.value = '0'; widthCtl.out.textContent = '0';
    draw();
  });

  const el = h('div', { class: 'sim wl' },
    h('div', { class: 'sim-controls' }, picker, levelCtl.el, widthCtl.el, h('div', { class: 'btn-row' }, reset), hint),
    h('div', { class: 'sim-stage' }, h('div', { class: 'xray-frame' }, canvas)),
  );

  function load(im) {
    current = im;
    hint.textContent = im.hint ?? '';
    canvas.setAttribute('aria-label', im.alt);
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      pixels = new Uint8ClampedArray(canvas.width * canvas.height);
      for (let i = 0, p = 0; i < data.length; i += 4, p++) {
        pixels[p] = (data[i] * 299 + data[i + 1] * 587 + data[i + 2] * 114) / 1000;
      }
      draw();
    };
    img.src = im.src;
  }

  let frame = 0;
  function draw() {
    if (!pixels) return;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const out = ctx.createImageData(canvas.width, canvas.height);
      const lo = level - width / 2;
      const k = 255 / width;
      const lut = new Uint8ClampedArray(256);
      for (let v = 0; v < 256; v++) lut[v] = (v - lo) * k;
      for (let p = 0, i = 0; p < pixels.length; p++, i += 4) {
        const g = lut[pixels[p]];
        out.data[i] = g; out.data[i + 1] = g; out.data[i + 2] = g; out.data[i + 3] = 255;
      }
      ctx.putImageData(out, 0, 0);
    });
  }

  load(current);
  return { el };
}
