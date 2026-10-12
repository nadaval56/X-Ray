import scanner from '../../content/scanner.json';
import { h } from '../lib/dom.js';
import { mediaById, mediaUrl } from '../data/content.js';
import { createBagScanner } from '../components/bag-scanner.js';

document.getElementById('lab-root').append(createBagScanner({ materials: scanner.materials, bags: scanner.bags }).el);

// תמונות מ-content/media.json: <figure data-media="id">
for (const fig of document.querySelectorAll('figure[data-media]')) {
  const m = mediaById(fig.dataset.media);
  if (!m) continue;
  fig.append(
    h('div', { class: 'xray-frame' }, h('img', { src: mediaUrl(m.file), alt: m.alt, loading: 'lazy', decoding: 'async' })),
    h('figcaption', {}, m.caption, ' ', h('a', { href: m.source.url, rel: 'noopener', target: '_blank', text: 'לכתבה' })),
  );
}
