// OpenMeteoWeatherAgent — Weather data for outdoor training optimization
// API: https://api.open-meteo.com  |  Auth: NONE  |  Rate: 10000/day  |  Format: JSON
import FreeApiBase from './FreeApiBase.js';

export class OpenMeteoWeatherAgent extends FreeApiBase {
  constructor() {
    super('OpenMeteoWeatherAgent', {
      baseUrl: 'https://api.open-meteo.com',
      authMethod: 'none',
      rateLimit: 600,
      timeoutMs: 8000,
      category: 'weather',
    });
  }

  healthEndpoint() { return '/v1/forecast?latitude=0&longitude=0&current=temperature_2m'; }

  async execute(context) {
    this.log.info('Fetching weather data for training optimization');
    const lat = context.latitude || 40.7128;
    const lon = context.longitude || -74.006;

    return this.executeWithFallback(context, async () => {
      return this.apiFetch('/v1/forecast', {
        latitude: lat,
        longitude: lon,
        current: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,uv_index',
        hourly: 'temperature_2m,precipitation_probability,uv_index',
        daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,uv_index_max,sunrise,sunset',
        timezone: 'auto',
        forecast_days: 7,
      });
    });
  }

  transform(raw) {
    const current = raw.current || {};
    const daily = raw.daily || {};
    let trainingCondition = 'good';
    const temp = current.temperature_2m || 20;
    const uv = current.uv_index || 0;
    const precip = current.precipitation || 0;
    if (temp > 35 || temp < -5 || precip > 5) trainingCondition = 'poor';
    else if (temp > 30 || temp < 0 || uv > 8) trainingCondition = 'moderate';

    return {
      weather: {
        current: {
          temperature: temp,
          feelsLike: current.apparent_temperature,
          humidity: current.relative_humidity_2m,
          precipitation: precip,
          windSpeed: current.wind_speed_10m,
          uvIndex: uv,
          weatherCode: current.weather_code,
        },
        forecast: {
          daily: {
            maxTemps: daily.temperature_2m_max || [],
            minTemps: daily.temperature_2m_min || [],
            precipSums: daily.precipitation_sum || [],
            uvMaxes: daily.uv_index_max || [],
          },
        },
        trainingCondition,
        recommendation: trainingCondition === 'good' ? 'Great conditions for outdoor training' : trainingCondition === 'moderate' ? 'Consider adjusting intensity or timing' : 'Indoor training recommended',
      },
      source: this.name,
      fetchedAt: new Date().toISOString(),
    };
  }

  getFallbackData(context) {
    return {
      weather: { current: { temperature: null, humidity: null }, trainingCondition: 'unknown', recommendation: 'Weather data unavailable — plan for indoor backup' },
      source: this.name, fallback: true, fetchedAt: new Date().toISOString(),
    };
  }
}
export default OpenMeteoWeatherAgent;
