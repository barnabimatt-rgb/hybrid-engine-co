import BaseAgent from '../BaseAgent.js';
import { AUDIENCES } from '../../niche/NicheConfig.js';
import { pickRandom } from '../../utils/helpers.js';
import openaiClient from '../../utils/OpenAIClient.js';
import limitManager from '../../limits/LimitManager.js';

export class AudiencePersonaAgent extends BaseAgent {
  constructor() { super('AudiencePersonaAgent', { category: 'ai' }); }
  async execute(context) {
    this.log.info('Building audience persona');
    const topic = context.topic || 'hybrid fitness';
    const niche = context.niche || context.selectedNiche || 'hybrid_fitness';

    const openaiCheck = limitManager.check('openai', 800);
    if (openaiClient.isAvailable() && openaiCheck.status !== 'blocked') {
      const prompt = `Create a detailed audience persona for content about "${topic}" in the ${niche} niche.

Return JSON:
{
  "primary": "persona name/description",
  "demographics": { "age": "range", "gender": "target", "education": "level", "income": "range", "occupation": "typical jobs" },
  "psychographics": {
    "goals": ["goal1", "goal2", "goal3"],
    "painPoints": ["pain1", "pain2", "pain3"],
    "values": ["value1", "value2", "value3"],
    "beliefs": ["belief1", "belief2"]
  },
  "platforms": ["platform1", "platform2"],
  "contentPreferences": { "format": "preferred format", "length": "preferred length", "tone": "preferred tone" },
  "buyingBehavior": { "priceRange": "range", "triggers": ["trigger1"], "objections": ["objection1"] }
}`;

      const result = await openaiClient.generateJSON(prompt, { maxTokens: 600, temperature: 0.7 });
      if (result?.primary) {
        await limitManager.recordUsage('openai', 600);
        return { audiencePersona: { ...result, source: 'openai' } };
      }
      this.log.warn('OpenAI persona generation failed, falling back to static');
    }

    const primary = pickRandom(AUDIENCES);
    return {
      audiencePersona: {
        primary,
        demographics: { age: '25-40', gender: 'all', education: 'college+', income: 'middle-upper' },
        psychographics: {
          goals: ['improve performance', 'use data effectively', 'build systems'],
          painPoints: ['information overload', 'no clear framework', 'wasted effort'],
          values: ['efficiency', 'discipline', 'measurable results'],
        },
        platforms: ['youtube', 'twitter', 'reddit', 'linkedin'],
        source: 'static',
      },
    };
  }
}
export default AudiencePersonaAgent;
