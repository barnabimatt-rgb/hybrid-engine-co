import BaseAgent from '../BaseAgent.js';
import { NICHES, NICHE_LABELS } from '../../niche/NicheConfig.js';

const MARKET_DATA = {
  [NICHES.HYBRID_FITNESS]: {
    competitorCount: 15, avgPrice: 2497, audienceSize: 'large',
    contentGaps: ['advanced periodization analytics', 'hybrid athlete recovery data', 'concurrent training optimization'],
    topCompetitors: ['Hybrid Calisthenics', 'Fergus Crawley', 'Nick Bare'],
    recommendedPrice: 1997,
  },
  [NICHES.DATA_SCIENCE]: {
    competitorCount: 50, avgPrice: 4997, audienceSize: 'very_large',
    contentGaps: ['Python for fitness data', 'wearable data pipelines', 'real-world ML project walkthroughs'],
    topCompetitors: ['DataCamp', 'Kaggle Learn', 'StatQuest'],
    recommendedPrice: 2997,
  },
  [NICHES.DATA_DRIVEN_FITNESS]: {
    competitorCount: 5, avgPrice: 1997, audienceSize: 'small_growing',
    contentGaps: ['Garmin/Whoop data analysis tutorials', 'training load optimization with Python', 'HRV-guided programming'],
    topCompetitors: ['Niche is underserved — major opportunity'],
    recommendedPrice: 1497,
  },
  [NICHES.TACTICAL_MINDSET]: {
    competitorCount: 20, avgPrice: 1497, audienceSize: 'medium',
    contentGaps: ['data-backed discipline frameworks', 'military-to-civilian mindset systems', 'tactical athlete mental performance'],
    topCompetitors: ['Jocko Willink', 'David Goggins', 'Andy Stumpf'],
    recommendedPrice: 997,
  },
  [NICHES.PRODUCTIVITY]: {
    competitorCount: 40, avgPrice: 2997, audienceSize: 'large',
    contentGaps: ['Notion templates for athletes', 'productivity systems for data professionals', 'tactical time management'],
    topCompetitors: ['Thomas Frank', 'Ali Abdaal', 'August Bradley'],
    recommendedPrice: 1997,
  },
  [NICHES.DIGITAL_ENTREPRENEURSHIP]: {
    competitorCount: 100, avgPrice: 4997, audienceSize: 'very_large',
    contentGaps: ['data-driven digital products', 'fitness creator monetization', 'automated content systems'],
    topCompetitors: ['Pat Flynn', 'Justin Welsh', 'Dan Koe'],
    recommendedPrice: 2997,
  },
  [NICHES.VETERAN_TRANSITION]: {
    competitorCount: 8, avgPrice: 997, audienceSize: 'small_growing',
    contentGaps: ['tech career transition for veterans', 'data science for service members', 'GI Bill optimization guides'],
    topCompetitors: ['VetTechTrek', 'Shift.org'],
    recommendedPrice: 997,
  },
};

const DEFAULT_MARKET = {
  competitorCount: 10, avgPrice: 1997, audienceSize: 'medium',
  contentGaps: ['advanced training analytics', 'Python for fitness data', 'tactical periodization'],
  topCompetitors: ['General market'],
  recommendedPrice: 1997,
};

export class MarketResearchAgent extends BaseAgent {
  constructor() { super('MarketResearchAgent', { category: 'core', requiresNetwork: true }); }
  async execute(context) {
    const niche = context.selectedNiche || context.niche || NICHES.HYBRID_FITNESS;
    this.log.info({ niche }, 'Market research');
    const data = MARKET_DATA[niche] || DEFAULT_MARKET;
    return {
      marketInsights: {
        niche,
        nicheLabel: NICHE_LABELS[niche] || niche,
        ...data,
      },
    };
  }
}
export default MarketResearchAgent;
