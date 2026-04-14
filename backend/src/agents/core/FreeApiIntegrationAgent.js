import BaseAgent from '../BaseAgent.js';
import freeApiDataEnricher from '../../utils/FreeApiDataEnricher.js';

export class FreeApiIntegrationAgent extends BaseAgent {
  constructor() { super('FreeApiIntegrationAgent', { category: 'core', requiresNetwork: true }); }
  async execute(context) {
    const niche = context.selectedNiche || context.targetNiche || context.niche || 'hybrid_fitness';
    const topic = context.topic || context.trendTopics?.[0]?.keyword || 'training';
    this.log.info({ niche, topic }, 'Enriching pipeline with free API data');

    const freeApiData = await freeApiDataEnricher.enrichForNiche(niche, topic);
    const enrichedFields = Object.keys(freeApiData).filter((k) => freeApiData[k] != null);
    this.log.info({ enrichedFields }, 'Free API enrichment complete');

    return { freeApiData };
  }
}
export default FreeApiIntegrationAgent;
