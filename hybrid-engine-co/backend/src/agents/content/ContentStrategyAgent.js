import BaseAgent from '../BaseAgent.js';
import { pickRandom } from '../../utils/helpers.js';

export class ContentStrategyAgent extends BaseAgent {
  constructor() { super('ContentStrategyAgent', { category: 'content' }); }
  async execute(context) {
    this.log.info('Generating content strategy');
    const trends = context.trendTopics || [];
    const avoidTopics = context.memory?.avoidTopics || [];
    const candidates = trends.filter((t) => !avoidTopics.some((a) => (a || '').toLowerCase().includes(t.keyword)));
    const selected = candidates[0] || trends[0] || { keyword: 'hybrid training fundamentals', niche: 'hybrid_fitness' };
    const formats = ['youtube_video', 'short_form', 'blog_post', 'carousel'];
    return {
      topic: selected.keyword,
      niche: selected.niche || context.selectedNiche,
      contentFormat: pickRandom(formats),
      targetAudience: 'hybrid athletes and data-driven fitness enthusiasts',
      angle: `How to leverage ${selected.keyword} for peak performance`,
    };
  }
}
export default ContentStrategyAgent;
