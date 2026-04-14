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
  "title": "compelling title for the content piece (50-70 chars, optimized for YouTube/search)",
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
        // Ensure title is always set
        if (!result.title) result.title = `${result.angle || result.topic} | Hybrid Engine Co.`;
        return { ...result, source: 'openai' };
      }
      this.log.warn('OpenAI strategy generation failed, falling back to template');
    }

    const topic = selected.keyword;
    const angle = `How to leverage ${topic} for peak performance`;
    return {
      title: `${angle} | Hybrid Engine Co.`,
      topic,
      niche: selected.niche || context.selectedNiche,
      contentFormat: pickRandom(formats),
      targetAudience: 'hybrid athletes and data-driven fitness enthusiasts',
      angle,
      source: 'template',
    };
  }
}
export default ContentStrategyAgent;
