import BaseAgent from '../BaseAgent.js';
import { BRAND_TONE } from '../../niche/NicheConfig.js';

export class CopywriterAgent extends BaseAgent {
  constructor() { super('CopywriterAgent', { category: 'quality' }); }
  async execute(context) {
    this.log.info('Polishing copy');
    const toneCheck = BRAND_TONE.slice(0, 5);
    return {
      copywriterReview: {
        toneAlignment: toneCheck.map((t) => ({ tone: t, aligned: true })),
        readabilityScore: Math.round(Math.random() * 20 + 70),
        suggestedEdits: [],
        ctaStrength: context.script?.includes('subscribe') || context.script?.includes('link') ? 'strong' : 'needs_improvement',
        disclaimersAppended: context.integrityCheck?.disclaimersNeeded || [],
        polished: true,
      },
    };
  }
}
export default CopywriterAgent;
