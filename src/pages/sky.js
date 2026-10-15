import sky from '../../content/sky.json';
import sun from '../../content/sun.json';
import { skyFeature, skyArchive, sunCard } from '../components/sky.js';

const items = [...sky.items].sort((a, b) => b.date.localeCompare(a.date));

// קישור ישן לתמונה (sky.html#kepler) → העמוד שלה
const linked = items.find((it) => it.id === decodeURIComponent(location.hash.slice(1)));
if (linked) location.replace(`./sky-${linked.id}.html`);

document.getElementById('sky-feature').replaceChildren(skyFeature(items[0]));
document.getElementById('sky-archive').replaceChildren(skyArchive(items));
document.getElementById('sun-root').replaceChildren(sunCard(sun));
