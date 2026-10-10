import timeline from '../../content/timeline.json';
import { createTimeline } from '../components/timeline.js';

document.getElementById('timeline-root').append(createTimeline(timeline).el);
