import doses from '../../content/doses.json';
import { createRadiationRuler } from '../components/radiation-ruler.js';

document.getElementById('lab-root').append(createRadiationRuler(doses).el);
