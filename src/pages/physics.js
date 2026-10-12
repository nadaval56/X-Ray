import { h } from '../lib/dom.js';
import { mediaById, mediaUrl } from '../data/content.js';

// תמונות מ-content/media.json: <figure data-media="id">
for (const fig of document.querySelectorAll('figure[data-media]')) {
  const m = mediaById(fig.dataset.media);
  if (!m) continue;
  fig.append(
    h('div', { class: 'xray-frame' }, h('img', { src: mediaUrl(m.file), alt: m.alt, loading: 'lazy', decoding: 'async' })),
    h('figcaption', {}, m.caption, ' ', h('a', { href: m.source.url, rel: 'noopener', target: '_blank', text: 'מקור' })),
  );
}

// תפריט הפרקים: מסמן את הפרק שבמסך, ובנייד גולל את פס השבבים אליו
const nav = document.querySelector('.lesson-nav');
const links = new Map([...nav.querySelectorAll('a')].map((a) => [a.hash.slice(1), a]));
const visible = new Set();
const io = new IntersectionObserver((entries) => {
  for (const e of entries) e.isIntersecting ? visible.add(e.target.id) : visible.delete(e.target.id);
  const current = [...links.keys()].find((id) => visible.has(id));
  if (!current) return;
  for (const [id, a] of links) {
    if (id === current) a.setAttribute('aria-current', 'true');
    else a.removeAttribute('aria-current');
  }
  const a = links.get(current);
  if (nav.scrollWidth > nav.clientWidth) {
    const r = a.getBoundingClientRect();
    const n = nav.getBoundingClientRect();
    if (r.left < n.left || r.right > n.right) nav.scrollBy({ left: r.left - n.left - (n.width - r.width) / 2 });
  }
}, { rootMargin: '-35% 0px -55% 0px' });
for (const id of links.keys()) io.observe(document.getElementById(id));
