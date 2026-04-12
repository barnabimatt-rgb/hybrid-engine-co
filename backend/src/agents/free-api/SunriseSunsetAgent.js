// SunriseSunsetAgent — Sunrise/sunset times for training schedule optimization
// API: https://api.sunrise-sunset.org  |  Auth: NONE  |  Rate: unlimited  |  Format: JSON
import FreeApiBase from './FreeApiBase.js';

export class SunriseSunsetAgent extends FreeApiBase {
  constructor() {
    super('SunriseSunsetAgent', {
      baseUrl: 'https://api.sunrise-sunset.org',
      authMethod: 'none',
      rateLimit: 120,
      timeoutMs: 5000,
      category: 'weather',
    });
  }

  healthEndpoint() { return '/json?lat=0&lng=0'; }

  async execute(context) {
    this.log.info('Fetching sunrise/sunset data for training windows');
    const lat = context.latitude || context.geo?.latitude || 40.7128;
    const lon = context.longitude || context.geo?.longitude || -74.006;

    return this.executeWithFallback(context, async () => {
      return this.apiFetch('/json', { lat, lng: lon, formatted: 0 });
    });
  }

  transform(raw) {
    const r = raw.results || {};
    return {
      daylight: {
        sunrise: r.sunrise, sunset: r.sunset,
        solarNoon: r.solar_noon, dayLength: r.day_length,
        civilTwilightBegin: r.civil_twilight_begin,
        civilTwilightEnd: r.civil_twilight_end,
        goldenHourMorning: r.civil_twilight_begin,
        goldenHourEvening: r.civil_twilight_end,
        recommendation: 'Optimal outdoor training windows: dawn and late afternoon',
      },
      source: this.name, fetchedAt: new Date().toISOString(),
    };
  }

  getFallbackData() {
    return { daylight: { sunrise: null, sunset: null, recommendation: 'Daylight data unavailable' }, source: this.name, fallback: true, fetchedAt: new Date().toISOString() };
  }
}
export default SunriseSunsetAgent;
