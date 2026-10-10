import { materials } from '../data/content.js';
import { createDensitySort } from '../components/density-sort.js';

document.getElementById('lab-root').append(createDensitySort({ materials: materials.materials, thickness: 2 }).el);
