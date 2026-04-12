import BaseAgent from '../BaseAgent.js';
import { ALL_NICHES, NICHE_KEYWORDS } from '../../niche/NicheConfig.js';
import { pickRandom } from '../../utils/helpers.js';

export class TrendIntelligenceAgent extends BaseAgent {
  constructor() { super('TrendIntelligenceAgent', { category: 'core', requiresNetwork: true }); }
  async execute(context) {
    this.log.info('Analyzing trends');
    const niche = context.targetNiche || pickRandom(ALL_NICHES);
    const keywords = NICHE_KEYWORDS[niche] || [];
    const trendTopics = keywords.slice(0, 5).map((kw) => ({
      keyword: kw, niche, trendScore: Math.round(Math.random() * 50 + 50), source: 'internal_analysis',
    }));
    return { trendTopics, selectedNiche: niche };
  }
}
export default TrendIntelligenceAgent;
