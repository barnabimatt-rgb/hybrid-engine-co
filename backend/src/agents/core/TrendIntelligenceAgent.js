import BaseAgent from '../BaseAgent.js';
import { ALL_NICHES, NICHE_KEYWORDS, SIGNATURE_NICHE } from '../../niche/NicheConfig.js';
import { pickRandom } from '../../utils/helpers.js';

export class TrendIntelligenceAgent extends BaseAgent {
  constructor() { super('TrendIntelligenceAgent', { category: 'core', requiresNetwork: true }); }
  async execute(context) {
    this.log.info('Analyzing trends');
    const niche = context.targetNiche || pickRandom(ALL_NICHES);
    const keywords = NICHE_KEYWORDS[niche] || [];
    const now = new Date();
    const dayOfWeek = now.getDay();
    const month = now.getMonth();
    const dayOfMonth = now.getDate();

    // Deterministic trend scoring based on time signals
    const trendTopics = keywords.map((kw, idx) => {
      let score = 50;

      // Fitness topics trend Mon-Wed, productivity Sun/Thu
      if (['hybrid_fitness', 'data_driven_fitness', 'tactical_mindset'].includes(niche)) {
        if (dayOfWeek >= 1 && dayOfWeek <= 3) score += 15;
      } else if (niche === 'productivity') {
        if (dayOfWeek === 0 || dayOfWeek === 4) score += 15;
      }

      // New Year fitness surge (Jan-Feb)
      if (month <= 1 && ['hybrid_fitness', 'data_driven_fitness'].includes(niche)) score += 20;
      // Back-to-school productivity (Aug-Sep)
      if ((month === 7 || month === 8) && niche === 'productivity') score += 20;

      // Signature niche always boosted
      if (niche === SIGNATURE_NICHE) score += 10;

      // Cycle through keywords by day to avoid repetition
      const keywordRotation = (dayOfMonth + idx) % keywords.length;
      if (keywordRotation < 3) score += 10;

      // Clamp to 0-100
      score = Math.min(100, Math.max(0, score));

      return { keyword: kw, niche, trendScore: score, source: 'temporal_analysis' };
    });

    // Sort by score descending, take top 5
    trendTopics.sort((a, b) => b.trendScore - a.trendScore);
    const topTrends = trendTopics.slice(0, 5);

    return { trendTopics: topTrends, selectedNiche: niche };
  }
}
export default TrendIntelligenceAgent;
