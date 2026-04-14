import BaseAgent from '../BaseAgent.js';
import openaiClient from '../../utils/OpenAIClient.js';
import limitManager from '../../limits/LimitManager.js';

export class CompetitorAnalysisAgent extends BaseAgent {
  constructor() { super('CompetitorAnalysisAgent', { category: 'ai' }); }
  async execute(context) {
    this.log.info('Analyzing competitors');
    const topic = context.topic || 'hybrid fitness';
    const niche = context.niche || context.selectedNiche || 'hybrid_fitness';

    const openaiCheck = limitManager.check('openai', 800);
    if (openaiClient.isAvailable() && openaiCheck.status !== 'blocked') {
      const prompt = `Analyze the competitive landscape for "${topic}" in the ${niche} niche.
Brand: Hybrid Engine Co. — combines data science, fitness, and systematic approaches.

Return JSON:
{
  "competitors": [{ "name": "type of competitor", "strength": "what they do well", "weakness": "where they fall short" }],
  "gaps": ["market gap 1", "market gap 2", "market gap 3"],
  "opportunities": ["opportunity 1", "opportunity 2", "opportunity 3"],
  "differentiator": "our unique positioning",
  "contentAngle": "recommended angle to stand out",
  "pricingInsight": "how to price competitively"
}

Be specific about real market dynamics. 3-5 competitor types, 3+ gaps and opportunities.`;

      const result = await openaiClient.generateJSON(prompt, { maxTokens: 800, temperature: 0.6 });
      if (result?.gaps) {
        await limitManager.recordUsage('openai', 800);
        return { competitorAnalysis: { ...result, source: 'openai' } };
      }
      this.log.warn('OpenAI competitor analysis failed, falling back to static');
    }

    return {
      competitorAnalysis: {
        competitors: [],
        gaps: ['data-driven fitness content is underserved', 'few creators combine data science + fitness', 'veteran fitness niche is sparse'],
        opportunities: ['Cross-niche content linking data science to fitness', 'Notion templates for workout tracking', 'Python scripts for fitness data analysis'],
        differentiator: 'Only brand combining hybrid fitness + data science + tactical systems',
        source: 'static',
      },
    };
  }
}
export default CompetitorAnalysisAgent;
