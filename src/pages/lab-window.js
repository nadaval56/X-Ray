import { getCase, mainImage, imageUrl } from '../data/content.js';
import { createWindowLevel } from '../components/window-level.js';

// צילומים מהמקרים — אותו רישיון וקרדיט כמו בעמוד המקרה
const pick = (id, label, hint) => {
  const c = getCase(id);
  const im = c && mainImage(c);
  return im && { id, label, hint, src: imageUrl(im.file), alt: im.alt };
};
const images = [
  pick('aluminum-coin-01', 'המטבע השקוף', 'יש כאן מטבע אלומיניום חיוור בגובה הצוואר. נסו למצוא הגדרה שבה רואים אותו טוב יותר.'),
  pick('buckle-fracture-01', 'פרק כף היד', 'נסו להבליט את הקליפה החיצונית של העצם ואת המבנה שבתוכה.'),
  pick('knee-growth-01', 'ברך של ילדה', 'כמה קל לראות את לוחות הגדילה כשמשנים את הניגודיות?'),
].filter(Boolean);

document.getElementById('lab-root').append(createWindowLevel({ images }).el);
