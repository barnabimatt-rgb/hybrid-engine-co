import BaseAgent from '../BaseAgent.js';
import { pickRandom } from '../../utils/helpers.js';
import openaiClient from '../../utils/OpenAIClient.js';
import limitManager from '../../limits/LimitManager.js';

export class ContentStrategyAgent extends BaseAgent {
  constructor() { super('ContentStrategyAgent', { category: 'content' }); }
  async execute(context) {
    this.log.info('Generating content strategy');
    const trends = context.trendTopics || [];
    const avoidTopics = context.memory?.avoidTopics || [];
    const candidates = trends.filter((t) => !avoidTopics.some((a) => (a || '').toLowerCase().includes(t.keyword)));
    const selected = candidates[0] || trends[0] || { keyword: 'hybrid training fundamentals', niche: 'hybrid_fitness' };
    const formats = ['youtube_video', 'short_form', 'blog_post', 'carousel'];

    const openaiCheck = limitManager.check('openai', 800);
    if (openaiClient.isAvailable() && openaiCheck.status !== 'blocked') {
      const trendList = candidates.slice(0, 5).map(t => t.keyword).join(', ') || selected.keyword;
      const prompt = `You are a content strategist for Hybrid Engine Co. Given these trending topics: ${trendList}
Niche: ${selected.niche || 'hybrid_fitness'}

Choose the best topic and create a content strategy. Return JSON:
{
  "topic": "chosen topic",
  "niche": "niche category",
  "contentFormat": "youtube_video|short_form|blog_post|carousel",
  "targetAudience": "specific audience description",
  "angle": "unique angle or perspective",
  "contentPillars": ["pillar1", "pillar2", "pillar3"],
  "keyMessages": ["msg1", "msg2"],
  "distributionStrategy": "how to distribute this content"
}`;

      const result = await openaiClient.generateJSON(prompt, { maxTokens: 600, temperature: 0.7 });
      if (result?.topic) {
        await limitManager.recordUsage('openai', 600);
        return { ...result, source: 'openai' };
      }
      this.log.warn('OpenAI strategy generation failed, falling back to template');
    }

    return {
      topic: selected.keyword,
      niche: selected.niche || context.selectedNiche,
      contentFormat: pickRandom(formats),
      targetAudience: 'hybrid athletes and data-driven fitness enthusiasts',
      angle: `How to leverage ${selected.keyword} for peak performance`,
      source: 'template',
    };
  }
}
export default ContentStrategyAgent;
