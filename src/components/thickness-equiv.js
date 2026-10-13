// "כמה עובי צריך?": בוחרים לוחית (פלדה, נחושת, עופרת…) ועובי, ורואים כמה עבה צריכה להיות
// שכבה מכל חומר אחר כדי לעצור בדיוק אותה כמות של קרינה — ולכן להיראות באותו גוון בצילום.
//
// פיזיקה (לא מוצגת לתלמיד): שתי שכבות עוצרות אותה כמות קרינה כש-μ₁·x₁ = μ₂·x₂,
// ולכן x₂ = x₁·μ₁/μ₂. μ = (μ/ρ)·ρ מ-NIST באנרגיה אחת (60 keV) — content/materials.json.
// פישוט: קרן אמיתית היא תערובת של אנרגיות, ולכן היחסים במכשיר אמיתי שונים מעט; הסדר בין החומרים נשמר.

import { h } from '../lib/dom.js';

const mu = (m) => m.muRho * m.density; // 1/ס״מ

const num = (v, digits) => {
  const s = v.toFixed(digits);
  return s.includes('.') ? s.replace(/\.?0+$/, '') : s;
};
// עובי בס״מ → טקסט: מ״מ / ס״מ / מטר
export function formatLength(cm) {
  if (cm < 1) return `${num(cm * 10, cm * 10 < 1 ? 2 : 1)} מ״מ`;
  if (cm < 100) return `${num(cm, cm < 10 ? 1 : 0)} ס״מ`;
  if (cm < 100000) return `${num(cm / 100, cm < 1000 ? 1 : 0)} מטר`;
  return `${num(cm / 100000, 1)} ק״מ`;
}

/**
 * @param {object} opts
 * @param {Array<{id:string,label:string,muRho:number,density:number}>} opts.materials
 * @param {Array<{id:string,label:string,min:number,max:number,step:number,value:number}>} opts.references  עובי במ״מ
 */
export function createThicknessEquiv({ materials, references }) {
  const byId = Object.fromEntries(materials.map((m) => [m.id, m]));
  let ref = references[0];
  let mm = ref.value;

  const headline = h('p', { class: 'te-headline', 'aria-live': 'polite' });
  const refChips = h('div', { class: 'chip-row', role: 'radiogroup', 'aria-label': 'מה בודקים' },
    references.map((r) => h('label', { class: 'chip' },
      h('input', { type: 'radio', name: 'te-ref', value: r.id, checked: r === ref, onchange: () => { ref = r; mm = r.value; syncSlider(); render(); } }),
      r.label)));
  const out = h('output', { for: 'te-thick' });
  const slider = h('input', { id: 'te-thick', class: 'range', type: 'range', dir: 'ltr' });
  slider.addEventListener('input', () => { mm = Number(slider.value); render(); });
  function syncSlider() {
    Object.assign(slider, { min: ref.min, max: ref.max, step: ref.step, value: mm });
  }

  const rows = h('ol', { class: 'te-rows' });
  const tileNote = h('p', { class: 'te-tile-note muted' });

  const el = h('div', { class: 'te' },
    h('div', { class: 'te-controls' },
      h('fieldset', {}, h('legend', { text: 'מה בודקים?' }), refChips),
      h('div', {}, h('label', { class: 'sim-label', for: 'te-thick' }, 'עובי: ', out), slider)),
    headline,
    h('div', { class: 'te-chart' },
      h('div', { class: 'te-chart-head', 'aria-hidden': 'true' },
        h('span', { text: 'כמה עובי צריך מכל חומר כדי לעצור אותה כמות קרינה' }),
        h('span', { text: 'בצילום' })),
      rows),
    tileNote,
  );

  function render() {
    const refMat = byId[ref.id];
    const blocking = mu(refMat) * (mm / 10); // μ·x
    const T = Math.exp(-blocking);
    const shade = Math.round(255 * (1 - T)); // כמו בצילום בבית חולים: מה שבולע יותר — בהיר יותר
    out.textContent = formatLength(mm / 10);
    slider.setAttribute('aria-valuetext', formatLength(mm / 10));

    const eq = materials.map((m) => ({ m, cm: blocking / mu(m) }));
    const muscle = eq.find((e) => e.m.id === 'muscle');
    headline.replaceChildren(
      h('strong', { text: `${formatLength(mm / 10)} של ${refMat.label}` }), ' עוצרים קרינה כמו ',
      h('strong', { text: `${formatLength(muscle.cm)} של ${muscle.m.label}` }), '.');

    // סקאלה ליניארית: עד החומר הכי עבה שאינו אוויר. ארוך מזה — נחתך עם סימן שבירה.
    const maxCm = Math.max(...eq.filter((e) => e.m.id !== 'air').map((e) => e.cm));
    rows.replaceChildren(...eq.map(({ m, cm }) => {
      const broken = cm > maxCm * 1.01;
      const pct = broken ? 100 : Math.max(0.6, (cm / maxCm) * 100);
      return h('li', { class: `te-row${m.id === ref.id ? ' is-ref' : ''}${broken ? ' is-broken' : ''}` },
        h('span', { class: 'te-name', text: m.label }),
        h('span', { class: 'te-track' },
          h('span', { class: `te-bar te-${m.id}`, style: `width:${pct}%` }),
          broken && h('span', { class: 'te-break', 'aria-hidden': 'true' })),
        h('span', { class: 'te-val', text: formatLength(cm) }),
        h('span', { class: 'te-tile', style: `background: rgb(${shade}, ${shade}, ${shade})`, 'aria-hidden': 'true' }));
    }));
    const pass = T < 0.01 ? 'פחות מ-1%' : `רק ${Math.round(T * 100)}%`;
    tileNote.textContent = `כל השכבות ברשימה נותנות בצילום בדיוק אותו גוון, כי כל אחת מהן עוצרת אותה כמות של קרינה: ${pass} מהקרינה עוברת דרכן.`;
  }

  syncSlider();
  render();
  return { el };
}
