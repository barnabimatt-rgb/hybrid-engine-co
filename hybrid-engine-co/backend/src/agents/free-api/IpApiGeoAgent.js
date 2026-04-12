// IpApiGeoAgent — Geolocation for location-aware content
// API: http://ip-api.com  |  Auth: NONE  |  Rate: 45/min  |  Format: JSON
import FreeApiBase from './FreeApiBase.js';

export class IpApiGeoAgent extends FreeApiBase {
  constructor() {
    super('IpApiGeoAgent', {
      baseUrl: 'http://ip-api.com',
      authMethod: 'none',
      rateLimit: 40,
      timeoutMs: 5000,
      category: 'geocoding',
    });
  }

  healthEndpoint() { return '/json/'; }

  async execute(context) {
    this.log.info('Fetching geolocation data');
    const ip = context.userIp || '';
    return this.executeWithFallback(context, async () => {
      const endpoint = ip ? `/json/${ip}` : '/json/';
      return this.apiFetch(endpoint, { fields: 'status,message,country,regionName,city,lat,lon,timezone,isp' });
    });
  }

  transform(raw) {
    if (raw.status === 'fail') return this.getFallbackData();
    return {
      geo: { country: raw.country, region: raw.regionName, city: raw.city, latitude: raw.lat, longitude: raw.lon, timezone: raw.timezone, isp: raw.isp },
      source: this.name, fetchedAt: new Date().toISOString(),
    };
  }

  getFallbackData() {
    return { geo: { country: 'US', city: 'New York', latitude: 40.7128, longitude: -74.006, timezone: 'America/New_York' }, source: this.name, fallback: true, fetchedAt: new Date().toISOString() };
  }
}
export default IpApiGeoAgent;
