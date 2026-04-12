// QuotableAgent — Motivational quotes for tactical mindset content
// API: https://api.quotable.kuroizu.com  |  Auth: NONE  |  Rate: unlimited  |  Format: JSON
import FreeApiBase from './FreeApiBase.js';

export class QuotableAgent extends FreeApiBase {
  constructor() {
    super('QuotableAgent', {
      baseUrl: 'https://api.quotable.kuroizu.com',
      authMethod: 'none',
      rateLimit: 120,
      timeoutMs: 5000,
      category: 'content',
    });
  }

  healthEndpoint() { return '/quotes?limit=1'; }

  async execute(context) {
    this.log.info('Fetching motivational quotes');
    return this.executeWithFallback(context, async () => {
      return this.apiFetch('/quotes', { limit: 5, tags: context.quoteTags || 'wisdom|motivational|inspirational' });
    });
  }

  transform(raw) {
    const quotes = (raw.results || []).map((q) => ({
      content: q.content, author: q.author, tags: q.tags, length: q.length,
    }));
    return { quotes, count: quotes.length, source: this.name, fetchedAt: new Date().toISOString() };
  }

  getFallbackData() {
    return {
      quotes: [
        { content: 'The only way to do great work is to love what you do.', author: 'Steve Jobs', tags: ['motivational'] },
        { content: 'Discipline is the bridge between goals and accomplishment.', author: 'Jim Rohn', tags: ['discipline'] },
      ],
      count: 2, source: this.name, fallback: true, fetchedAt: new Date().toISOString(),
    };
  }
}
export default QuotableAgent;
