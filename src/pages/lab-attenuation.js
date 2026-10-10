import { materials } from '../data/content.js';
import { createAttenuationSim } from '../components/attenuation-sim.js';

const sim = createAttenuationSim({ materials: materials.materials, material: 'water', thickness: 2, idPrefix: 'lab' });
document.getElementById('sim-lab').append(sim.el);
