// NumbersApiAgent — Math/science/trivia facts for data-driven content
// API: http://numbersapi.com  |  Auth: NONE  |  Rate: unlimited  |  Format: JSON
import FreeApiBase from './FreeApiBase.js';

export class NumbersApiAgent extends FreeApiBase {
  constructor() {
    super('NumbersApiAgent', {
      baseUrl: 'http://numbersapi.com',
      authMethod: 'none',
      rateLimit: 120,
      timeoutMs: 5000,
      category: 'science',
    });
  }

  healthEndpoint() { return '/42?json'; }

  async execute(context) {
    this.log.info('Fetching number facts for content hooks');
    const number = context.number || Math.floor(Math.random() * 1000);
    const type = context.numberType || 'trivia';

    return this.executeWithFallback(context, async () => {
      return this.apiFetch(`/${number}/${type}`, { json: true });
    });
  }

  transform(raw) {
    return {
      numberFact: { text: raw.text, number: raw.number, type: raw.type, found: raw.found },
      source: this.name, fetchedAt: new Date().toISOString(),
    };
  }

  getFallbackData() {
    return { numberFact: { text: 'Data is the new oil — and Hybrid Engine Co. refines it.', number: 0, type: 'fallback' }, source: this.name, fallback: true, fetchedAt: new Date().toISOString() };
  }
}
export default NumbersApiAgent;
