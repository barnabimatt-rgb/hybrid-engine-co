// OpenMeteoAirQualityAgent — Air quality data for outdoor exercise safety
// API: https://air-quality-api.open-meteo.com  |  Auth: NONE  |  Rate: 10000/day
import FreeApiBase from './FreeApiBase.js';

export class OpenMeteoAirQualityAgent extends FreeApiBase {
  constructor() {
    super('OpenMeteoAirQualityAgent', {
      baseUrl: 'https://air-quality-api.open-meteo.com',
      authMethod: 'none',
      rateLimit: 600,
      timeoutMs: 8000,
      category: 'environment',
    });
  }

  healthEndpoint() { return '/v1/air-quality?latitude=0&longitude=0&current=us_aqi'; }

  async execute(context) {
    this.log.info('Fetching air quality for exercise safety');
    const lat = context.latitude || 40.7128;
    const lon = context.longitude || -74.006;

    return this.executeWithFallback(context, async () => {
      return this.apiFetch('/v1/air-quality', {
        latitude: lat, longitude: lon,
        current: 'us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,ozone',
        hourly: 'us_aqi,pm2_5',
        timezone: 'auto',
        forecast_days: 3,
      });
    });
  }

  transform(raw) {
    const current = raw.current || {};
    const aqi = current.us_aqi || 0;
    let exerciseSafety = 'safe';
    if (aqi > 150) exerciseSafety = 'unsafe';
    else if (aqi > 100) exerciseSafety = 'moderate';
    else if (aqi > 50) exerciseSafety = 'acceptable';

    return {
      airQuality: {
        aqi, pm25: current.pm2_5, pm10: current.pm10, ozone: current.ozone,
        co: current.carbon_monoxide, no2: current.nitrogen_dioxide,
        exerciseSafety,
        recommendation: exerciseSafety === 'safe' ? 'Air quality is good — outdoor training is safe'
          : exerciseSafety === 'unsafe' ? 'Poor air quality — train indoors'
          : 'Moderate air quality — reduce outdoor intensity',
      },
      source: this.name, fetchedAt: new Date().toISOString(),
    };
  }

  getFallbackData() {
    return { airQuality: { aqi: null, exerciseSafety: 'unknown', recommendation: 'Air quality data unavailable' }, source: this.name, fallback: true, fetchedAt: new Date().toISOString() };
  }
}
export default OpenMeteoAirQualityAgent;
