import { materials } from '../data/content.js';
import { createThicknessEquiv } from '../components/thickness-equiv.js';

const tool = createThicknessEquiv({ materials: materials.materials, references: materials.references });
document.getElementById('thickness-lab').append(tool.el);
