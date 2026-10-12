import scanner from '../../content/scanner.json';
import { createBagScanner } from '../components/bag-scanner.js';

document.getElementById('lab-root').append(createBagScanner({ materials: scanner.materials, bags: scanner.bags }).el);
