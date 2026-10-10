import { materials } from '../data/content.js';
import { createAttenuationSim } from '../components/attenuation-sim.js';

const sim = createAttenuationSim({ materials: materials.materials, material: 'bone', thickness: 2, idPrefix: 'phys' });
document.getElementById('sim-physics').append(sim.el);
