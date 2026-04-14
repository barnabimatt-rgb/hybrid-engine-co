import BaseAgent from '../BaseAgent.js';
import contentTemplateEngine from '../../utils/ContentTemplateEngine.js';
import openaiClient from '../../utils/OpenAIClient.js';
import limitManager from '../../limits/LimitManager.js';

export class HookGeneratorAgent extends BaseAgent {
  constructor() { super('HookGeneratorAgent', { category: 'ai' }); }
  async execute(context) {
    this.log.info('Generating hooks');
    const topic = context.topic || 'performance';
    const niche = context.niche || context.selectedNiche || 'hybrid_fitness';

    const openaiCheck = limitManager.check('openai', 500);
    if (openaiClient.isAvailable() && openaiCheck.status !== 'blocked') {
      const prompt = `Generate 7 scroll-stopping hooks for a video/post about "${topic}" in the ${niche} niche.
Target audience: ${context.targetAudience || 'data-driven fitness enthusiasts'}.

Requirements:
- Each hook should be 1-2 sentences max
- Use curiosity gaps, contrarian takes, data-driven claims, or pattern interrupts
- No clickbait — every hook must be defensible with real content
- Vary the style (question, statistic, bold claim, story opener, myth-busting)

Return as JSON: { "hooks": ["hook1", "hook2", ...] }`;

      const result = await openaiClient.generateJSON(prompt, { maxTokens: 600, temperature: 0.8 });
      if (result?.hooks && Array.isArray(result.hooks)) {
        await limitManager.recordUsage('openai', 600);
        return { hooks: result.hooks, source: 'openai' };
      }
      this.log.warn('OpenAI hook generation failed, falling back to template');
    }

    const hooks = contentTemplateEngine.generateHooks(topic, niche, 7);
    return { hooks, source: 'template' };
  }
}
export default HookGeneratorAgent;
