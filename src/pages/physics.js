import { h } from '../lib/dom.js';
import { materials, mediaById, mediaUrl } from '../data/content.js';
import { createAttenuationSim } from '../components/attenuation-sim.js';
import { createRadiationRuler } from '../components/radiation-ruler.js';
import doses from '../../content/doses.json';

const sim = createAttenuationSim({ materials: materials.materials, material: 'bone', thickness: 2, idPrefix: 'phys' });
document.getElementById('sim-physics').append(sim.el);

// תמונות מ-content/media.json: <figure data-media="id">
for (const fig of document.querySelectorAll('figure[data-media]')) {
  const m = mediaById(fig.dataset.media);
  if (!m) continue;
  fig.append(
    h('div', { class: 'xray-frame' }, h('img', { src: mediaUrl(m.file), alt: m.alt, loading: 'lazy', decoding: 'async' })),
    h('figcaption', {}, m.caption, ' ', h('a', { href: m.source.url, rel: 'noopener', target: '_blank', text: 'מקור' })),
  );
}

document.getElementById('dose-physics').append(createRadiationRuler(doses).el);
