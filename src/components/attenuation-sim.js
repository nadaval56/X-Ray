// סימולטור בליעה: בוחרים חומר ועובי, ורואים כמה קרניים עוברות ואיזה גוון אפור יוצא בצילום.
//
// פיזיקה (לא מוצגת לתלמיד): I = I₀·e^(−μx).
//   μ = (μ/ρ)·ρ, מקדמים מ-NIST לאנרגיה אחת (60 keV) — ראו content/materials.json ו-content/sources.md.
//
// הערות לעורך על פישוטים:
//   1. קרן אמיתית היא ספקטרום של אנרגיות, לא אנרגיה אחת. הסדר בין החומרים נשמר, המספרים המדויקים לא.
//   2. הגוון בצילום מוצג כ"חלק הקרינה שנבלע" (1 − I/I₀): 0 = שחור, 1 = לבן.
//      תגובת גלאי/סרט אמיתית אינה ליניארית (בערך לוגריתמית), אבל הכיוון נכון:
//      יותר בליעה ← פחות קרינה מגיעה לגלאי ← בהיר יותר.
//   3. התרשים מצייר מספר קטן של "קרניים". כל קרן נעצרת בעומק שנגזר מאותה נוסחה,
//      כך שחלק הקרניים שעוברות קרוב לאחוז המחושב (ולא זהה לו בדיוק).

import { h, s } from '../lib/dom.js';

const THICKNESS_STOPS = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20]; // ס״מ
const RAYS = 36;

// גוון התצוגה של כל חומר בתרשים (לא הגוון בצילום — זה מחושב)
const MATERIAL_TINT = {
  air: 'rgba(160, 190, 210, 0.06)',
  fat: '#4d4533',
  water: '#2a4558',
  bone: '#7d786b',
  metal: '#9aa4ae',
};

export const formatThickness = (cm) =>
  cm < 1 ? `${Math.round(cm * 10)} מ״מ` : `${cm} ס״מ`;

export const muOf = (m) => m.muRho * m.density; // 1/ס״מ
export const transmitted = (m, cm) => Math.exp(-muOf(m) * cm);

// גוון הצילום: 0 = שחור, 1 = לבן
const toGray = (t) => {
  const v = Math.round(255 * (1 - t));
  return `rgb(${v}, ${v}, ${v})`;
};

function percentText(t) {
  const p = t * 100;
  if (p >= 99.5) return 'כמעט 100%';
  if (p < 1) return 'פחות מ-1%';
  return `${Math.round(p)}%`;
}

function explain(t) {
  if (t > 0.9) return 'כמעט כל הקרניים עברו. הגלאי קיבל הרבה קרינה — ולכן בצילום המקום הזה כהה מאוד, כמעט שחור.';
  if (t > 0.5) return 'רוב הקרניים עברו. הגלאי קיבל די הרבה קרינה — ולכן בצילום המקום הזה אפור כהה.';
  if (t > 0.15) return 'רק חלק מהקרניים עברו, והשאר נבלעו בדרך. לגלאי הגיע מעט — ולכן בצילום המקום הזה אפור בהיר.';
  return 'כמעט כל הקרניים נבלעו בחומר. לגלאי כמעט לא הגיעה קרינה — ולכן בצילום המקום הזה לבן.';
}

// ערכי u קבועים לכל קרן (חלוקה אחידה, בסדר מעורבב וקבוע) — כך התרשים יציב ולא "מרצד"
const RAY_U = (() => {
  const u = Array.from({ length: RAYS }, (_, i) => (i + 0.5) / RAYS);
  let seed = 7;
  for (let i = u.length - 1; i > 0; i--) {
    seed = (seed * 9301 + 49297) % 233280;
    const j = Math.floor((seed / 233280) * (i + 1));
    [u[i], u[j]] = [u[j], u[i]];
  }
  return u;
})();

/**
 * @param {object} opts
 * @param {Array<{id:string,label:string,muRho:number,density:number}>} opts.materials
 * @param {string} [opts.material='bone']
 * @param {number} [opts.thickness=2]  ס״מ, אחד מערכי THICKNESS_STOPS
 * @param {string} [opts.idPrefix='sim']
 */
export function createAttenuationSim({ materials, material = 'bone', thickness = 2, idPrefix = 'sim' }) {
  let current = materials.find((m) => m.id === material) ?? materials[0];
  let stop = Math.max(0, THICKNESS_STOPS.indexOf(thickness));

  // ---- בקרות ----
  const materialSet = h('fieldset', {},
    h('legend', { text: 'חומר' }),
    h('div', { class: 'chip-row' },
      materials.map((m) => h('label', { class: 'chip' },
        h('input', {
          type: 'radio',
          name: `${idPrefix}-material`,
          value: m.id,
          checked: m.id === current.id,
          onchange: () => { current = m; update(); },
        }),
        m.label,
      )),
    ),
  );

  const rangeId = `${idPrefix}-thickness`;
  const thicknessOut = h('output', { for: rangeId });
  const range = h('input', {
    id: rangeId,
    class: 'range',
    type: 'range',
    min: '0',
    max: String(THICKNESS_STOPS.length - 1),
    step: '1',
    value: String(stop),
    oninput: (e) => { stop = Number(e.target.value); update(); },
  });
  const thicknessField = h('div', {},
    h('label', { class: 'sim-label', for: rangeId }, 'עובי: ', thicknessOut),
    range,
    h('div', { class: 'range-scale', 'aria-hidden': 'true' },
      h('span', { text: formatThickness(THICKNESS_STOPS[0]) }),
      h('span', { text: formatThickness(THICKNESS_STOPS.at(-1)) }),
    ),
  );

  // ---- תרשים ----
  const W = 320, H = 300;
  const X0 = 40, X1 = 280, BLOCK_TOP = 96, DETECTOR_Y = 262;
  const diagram = s('svg', { class: 'sim-diagram', viewBox: `0 0 ${W} ${H}`, role: 'img' });
  const raysAbove = s('g', { stroke: 'rgba(124, 199, 220, 0.55)', 'stroke-width': '1.2' });
  const raysBelow = s('g', { stroke: 'rgba(124, 199, 220, 0.55)', 'stroke-width': '1.2' });
  const stops = s('g', { fill: 'rgba(231, 192, 122, 0.9)' });
  const block = s('rect', { x: X0 - 8, width: X1 - X0 + 16, rx: 4, stroke: 'rgba(255,255,255,0.18)', 'stroke-width': '1' });
  const blockLabel = s('text', { x: W / 2, 'text-anchor': 'middle', fill: '#e8ecf1', 'font-size': '13', 'font-weight': '500', direction: 'rtl' });
  const detector = s('rect', { x: X0 - 8, y: DETECTOR_Y, width: X1 - X0 + 16, height: 22, rx: 3, stroke: 'rgba(255,255,255,0.25)', 'stroke-width': '1' });

  const label = (y, text, fill = '#8a95a3') =>
    s('text', { x: W / 2, y, 'text-anchor': 'middle', fill, 'font-size': '11.5', direction: 'rtl' }, document.createTextNode(text));

  diagram.append(
    s('rect', { x: W / 2 - 34, y: 18, width: 68, height: 18, rx: 4, fill: '#1c222b', stroke: '#36404d' }),
    label(13, 'מקור קרינה'),
    raysAbove, block, blockLabel, stops, raysBelow, detector,
    label(DETECTOR_Y + 34, 'הגוון בצילום'),
  );

  // ---- תוצאה ----
  const pct = h('div', { class: 'sim-stat-value' });
  const swatch = h('div', { class: 'sim-swatch', role: 'img' });
  const explainEl = h('p', { class: 'sim-explain' });
  const live = h('div', { 'aria-live': 'polite', class: 'sim-readout' },
    h('div', {}, pct, h('div', { class: 'sim-stat-label', text: 'מהקרניים עברו דרך החומר' })),
    swatch,
  );

  const strip = h('ol');
  const stripTitle = h('p', { class: 'sim-strip-title' });

  const el = h('div', { class: 'sim' },
    h('div', { class: 'sim-controls' }, materialSet, thicknessField, live, explainEl),
    h('div', { class: 'sim-stage' }, diagram, h('div', { class: 'sim-strip' }, stripTitle, strip)),
  );

  function update() {
    const cm = THICKNESS_STOPS[stop];
    const t = transmitted(current, cm);
    const mu = muOf(current);
    const blockH = 14 + stop * 15;
    const blockBottom = BLOCK_TOP + blockH;

    thicknessOut.textContent = formatThickness(cm);
    range.setAttribute('aria-valuetext', formatThickness(cm));

    block.setAttribute('y', BLOCK_TOP);
    block.setAttribute('height', blockH);
    block.setAttribute('fill', MATERIAL_TINT[current.id] ?? '#555');
    block.setAttribute('stroke-dasharray', current.id === 'air' ? '4 3' : 'none');
    blockLabel.setAttribute('y', BLOCK_TOP + blockH / 2 + 4.5);
    blockLabel.textContent = `${current.label} · ${formatThickness(cm)}`;
    blockLabel.setAttribute('opacity', blockH < 30 ? '0' : '1');

    raysAbove.replaceChildren();
    raysBelow.replaceChildren();
    stops.replaceChildren();
    for (let i = 0; i < RAYS; i++) {
      const x = X0 + ((X1 - X0) * (i + 0.5)) / RAYS;
      raysAbove.append(s('line', { x1: x, y1: 38, x2: x, y2: BLOCK_TOP }));
      // עומק העצירה של קרן זו (ס״מ), לפי אותה התפלגות מעריכית
      const depth = -Math.log(RAY_U[i]) / mu;
      if (depth >= cm) {
        raysBelow.append(s('line', { x1: x, y1: blockBottom, x2: x, y2: DETECTOR_Y }));
      } else {
        stops.append(s('circle', { cx: x, cy: BLOCK_TOP + (depth / cm) * blockH, r: 1.8 }));
      }
    }

    detector.setAttribute('fill', toGray(t));
    swatch.style.background = toGray(t);
    swatch.setAttribute('aria-label', `גוון בצילום: ${Math.round((1 - t) * 100)}% לבן`);
    pct.textContent = percentText(t);
    explainEl.textContent = explain(t);
    diagram.setAttribute('aria-label',
      `תרשים: קרני רנטגן עוברות דרך ${current.label} בעובי ${formatThickness(cm)}. ${percentText(t)} מהקרניים מגיעות לגלאי.`);

    stripTitle.textContent = `כל החומרים באותו עובי (${formatThickness(cm)}):`;
    strip.replaceChildren(...materials.map((m) => {
      const tm = transmitted(m, cm);
      return h('li', { class: m.id === current.id ? 'is-current' : '' },
        h('span', { class: 'sw', style: `background:${toGray(tm)}`, 'aria-hidden': 'true' }),
        h('span', {}, m.label.replace(/\s*\(.*\)/, '')),
        h('span', { class: 'visually-hidden', text: `: ${percentText(tm)} עוברות` }),
      );
    }));
  }

  update();
  return { el };
}
