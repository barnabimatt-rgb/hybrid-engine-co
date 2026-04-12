// BoredApiAgent — Activity suggestions for productivity/rest day content
// API: https://bored-api.appbrewery.com  |  Auth: NONE  |  Rate: unlimited  |  Format: JSON
import FreeApiBase from './FreeApiBase.js';

export class BoredApiAgent extends FreeApiBase {
  constructor() {
    super('BoredApiAgent', {
      baseUrl: 'https://bored-api.appbrewery.com',
      authMethod: 'none',
      rateLimit: 120,
      timeoutMs: 5000,
      category: 'productivity',
    });
  }

  healthEndpoint() { return '/api/activity'; }

  async execute(context) {
    this.log.info('Fetching activity suggestions');
    return this.executeWithFallback(context, async () => {
      const params = {};
      if (context.activityType) params.type = context.activityType;
      return this.apiFetch('/api/activity', params);
    });
  }

  transform(raw) {
    return {
      activity: { name: raw.activity, type: raw.type, participants: raw.participants, price: raw.price, accessibility: raw.accessibility, key: raw.key },
      source: this.name, fetchedAt: new Date().toISOString(),
    };
  }

  getFallbackData() {
    return { activity: { name: 'Go for a 30-minute run', type: 'exercise', participants: 1 }, source: this.name, fallback: true, fetchedAt: new Date().toISOString() };
  }
}
export default BoredApiAgent;
