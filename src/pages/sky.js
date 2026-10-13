import sky from '../../content/sky.json';
import sun from '../../content/sun.json';
import { skyFeature, skyArchive, sunCard } from '../components/sky.js';

const items = [...sky.items].sort((a, b) => b.date.localeCompare(a.date));
const featureRoot = document.getElementById('sky-feature');
const featureTitle = document.getElementById('sky-feature-title');

// קישור ישיר לתמונה: sky.html#kepler
const fromHash = () => items.find((it) => it.id === decodeURIComponent(location.hash.slice(1)));

const archive = skyArchive(items, (it) => {
  show(it);
  history.replaceState(null, '', `#${it.id}`);
  featureTitle.scrollIntoView({ block: 'start', behavior: 'smooth' });
});

function show(it) {
  featureTitle.textContent = it === items[0] ? 'התמונה האחרונה' : 'תמונה מהארכיון';
  featureRoot.replaceChildren(skyFeature(it));
  archive.select(it.id);
}

const linked = fromHash();
show(linked ?? items[0]);
if (linked) requestAnimationFrame(() => featureTitle.scrollIntoView({ block: 'start' }));
window.addEventListener('hashchange', () => { const it = fromHash(); if (it) show(it); });
document.getElementById('sky-archive').replaceChildren(archive.el);
document.getElementById('sun-root').replaceChildren(sunCard(sun));
