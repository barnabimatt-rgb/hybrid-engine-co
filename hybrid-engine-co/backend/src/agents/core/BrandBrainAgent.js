import BaseAgent from '../BaseAgent.js';
import { BRAND_TONE, AUDIENCES, NICHE_LABELS, ALL_NICHES } from '../../niche/NicheConfig.js';

export class BrandBrainAgent extends BaseAgent {
  constructor() { super('BrandBrainAgent', { category: 'core' }); }
  async execute(context) {
    this.log.info('Injecting brand context');
    return {
      brand: {
        name: 'Hybrid Engine Co.',
        tone: BRAND_TONE,
        audiences: AUDIENCES,
        niches: ALL_NICHES.map((n) => NICHE_LABELS[n]),
        tagline: 'Data-driven fitness. Tactical systems. Engineered performance.',
      },
    };
  }
}
export default BrandBrainAgent;
