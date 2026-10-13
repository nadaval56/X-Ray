// עמוד הבית: "חדש מהשמיים" — התמונה האחרונה מצ'נדרה, ומצב קרני X של השמש.
import { h } from '../lib/dom.js';
import sky from '../../content/sky.json';
import sun from '../../content/sun.json';
import { skyDate, sunCard } from '../components/sky.js';

const latest = [...sky.items].sort((a, b) => b.date.localeCompare(a.date))[0];

document.getElementById('sky-home').append(
  h('article', { class: 'card sky-home-card' },
    h('div', { class: 'card-thumb' }, h('img', { src: `${import.meta.env.BASE_URL}images/${latest.image.file}`, alt: latest.image.alt, loading: 'lazy', decoding: 'async' })),
    h('div', { class: 'card-body' },
      h('p', { class: 'sky-date' }, "תמונה חדשה מטלסקופ הרנטגן צ'נדרה · ", h('time', { datetime: latest.date, text: skyDate(latest.date) })),
      h('h3', {}, h('a', { class: 'card-link', href: `./sky.html#${latest.id}`, text: latest.title })),
      h('p', { text: latest.text[0] }))),
  h('article', { class: 'card sky-home-card' },
    h('div', { class: 'card-body' },
      h('p', { class: 'sky-date', text: 'השמש ברנטגן' }),
      h('h3', {}, h('a', { class: 'card-link', href: './sky.html#sun-title', text: 'כמה קרני X השמש פולטת עכשיו?' })),
      sunCard(sun, { compact: true }),
      h('p', {}, 'מדידה של לוויין GOES, מתעדכנת פעם ביום. השמש שקטה כשהאות היא ', h('bdi', { text: 'A' }), ' או ', h('bdi', { text: 'B' }),
        ', ויש התפרצות כשהיא ', h('bdi', { text: 'M' }), ' או ', h('bdi', { text: 'X' }), '.'))),
);
