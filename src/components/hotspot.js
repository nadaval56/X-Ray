// סימון על תמונה (hotspot): התלמיד מסמן איפה לדעתו הממצא, והרכיב בודק מרחק ונותן משוב.
//
// קואורדינטות יחסיות: x,y ∈ [0,1] ביחס לרוחב/גובה התמונה; r ביחס לרוחב התמונה.
// מרחק מחושב ביחידות רוחב, כך שעיגול נשאר עיגול גם בתמונה לא ריבועית.
//
// עובד בעכבר, במגע ובמקלדת (חיצים מזיזים את הסמן, Shift = צעד גדול, Enter = בדיקה).

import { h, s, imageAspect } from '../lib/dom.js';

const NEAR_FACTOR = 2.2; // עד פי כמה מהרדיוס נחשב "קרוב מאוד"
const STEP = 0.02;
const BIG_STEP = 0.08;

/**
 * @param {object} opts
 * @param {string} opts.src
 * @param {string} opts.alt
 * @param {Array<{x:number,y:number,r:number,label:string}>} opts.findings
 * @param {string} [opts.caption]
 * @param {(result: {status: 'hit'|'near'|'miss', distance: number, finding: object}) => void} [opts.onCheck]
 */
export function createHotspot({ src, alt, findings, caption, onCheck }) {
  let aspect = 1;
  let point = null;
  let locked = false;

  const img = h('img', { src, alt, draggable: 'false', decoding: 'async' });
  const overlay = s('svg', { class: 'hotspot-overlay', 'aria-hidden': 'true', preserveAspectRatio: 'none' });
  const labels = h('div', { class: 'hotspot-labels', 'aria-hidden': 'true' });
  const status = h('p', { class: 'visually-hidden', role: 'status', 'aria-live': 'polite' });

  const stage = h('div', {
    class: 'hotspot-stage',
    tabindex: '0',
    role: 'group',
    'aria-label': 'סימון על הצילום. לחצו על המקום שבו לדעתכם נמצא הממצא, או השתמשו בחיצים כדי להזיז סמן.',
  }, img, overlay, labels);

  const frame = h('div', { class: 'xray-frame' }, stage);
  const el = h('figure', { class: 'xray-figure' },
    frame,
    caption && h('figcaption', { text: caption }),
    status,
  );

  const marker = s('g', { class: 'hs-marker' });
  const findingLayer = s('g');
  overlay.append(findingLayer, marker);

  imageAspect(img).then((a) => {
    aspect = a;
    overlay.setAttribute('viewBox', `0 0 1 ${aspect}`);
    if (point) drawMarker(false);
  });
  overlay.setAttribute('viewBox', '0 0 1 1');

  function drawMarker(pulse = true) {
    marker.replaceChildren();
    if (!point) return;
    const cx = point.x;
    const cy = point.y * aspect;
    const r = 0.035;
    marker.append(
      s('circle', { class: 'ring', cx, cy, r, 'stroke-width': 0.004 }),
      s('path', {
        class: 'cross',
        d: `M${cx - r * 0.45} ${cy}H${cx + r * 0.45}M${cx} ${cy - r * 0.45}V${cy + r * 0.45}`,
        'stroke-width': 0.004,
        'stroke-linecap': 'round',
      }),
    );
    marker.classList.toggle('is-pulse', pulse);
    if (pulse) requestAnimationFrame(() => marker.getBoundingClientRect());
  }

  function setPoint(x, y, { announce = false } = {}) {
    if (locked) return;
    point = { x: clamp(x), y: clamp(y) };
    drawMarker();
    el.dispatchEvent(new CustomEvent('hotspot:mark', { detail: { ...point } }));
    if (announce) {
      status.textContent = `הסמן ב-${Math.round(point.x * 100)}% מהשמאל ו-${Math.round(point.y * 100)}% מלמעלה.`;
    }
  }

  stage.addEventListener('click', (e) => {
    const rect = img.getBoundingClientRect();
    setPoint((e.clientX - rect.left) / rect.width, (e.clientY - rect.top) / rect.height);
  });

  stage.addEventListener('keydown', (e) => {
    if (locked) return;
    const step = e.shiftKey ? BIG_STEP : STEP;
    const p = point ?? { x: 0.5, y: 0.5 };
    // הצילום עצמו לא מתהפך ב-RTL, לכן החיצים פועלים לפי כיוון התמונה
    const moves = {
      ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step],
    };
    if (moves[e.key]) {
      e.preventDefault();
      const [dx, dy] = point ? moves[e.key] : [0, 0];
      setPoint(p.x + dx, p.y + dy, { announce: true });
    } else if ((e.key === 'Enter' || e.key === ' ') && point) {
      e.preventDefault();
      check();
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setPoint(0.5, 0.5, { announce: true });
    }
  });

  function check() {
    if (!point || locked) return null;
    let best = null;
    for (const f of findings) {
      const d = Math.hypot(point.x - f.x, (point.y - f.y) * aspect);
      const ratio = d / f.r;
      if (!best || ratio < best.ratio) best = { finding: f, distance: d, ratio };
    }
    const status = best.ratio <= 1 ? 'hit' : best.ratio <= NEAR_FACTOR ? 'near' : 'miss';
    const result = { status, distance: best.distance, finding: best.finding };
    onCheck?.(result);
    return result;
  }

  function reveal() {
    locked = true;
    stage.classList.add('is-locked');
    stage.removeAttribute('tabindex');
    findingLayer.replaceChildren();
    labels.replaceChildren();
    for (const f of findings) {
      const g = s('g', { class: 'hs-finding is-entering' },
        s('circle', { class: 'area', cx: f.x, cy: f.y * aspect, r: f.r, 'stroke-width': 0.005 }),
      );
      findingLayer.append(g);
      // תווית: מעל העיגול, ממוקמת באחוזים כדי להישאר חדה בכל גודל
      const top = Math.max(4, (f.y - f.r / aspect) * 100 - 3);
      labels.append(h('span', {
        class: 'finding-label',
        style: `top:${top}%; right:${(1 - f.x) * 100}%;`,
        text: f.label,
      }));
    }
  }

  return {
    el,
    check,
    reveal,
    get point() { return point; },
    focus: () => stage.focus(),
  };
}

const clamp = (v) => Math.min(1, Math.max(0, v));
