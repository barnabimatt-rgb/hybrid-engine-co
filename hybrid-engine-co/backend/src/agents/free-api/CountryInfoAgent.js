// CountryInfoAgent — Country data for localized content and audience targeting
// API: https://restcountries.com  |  Auth: NONE  |  Rate: unlimited  |  Format: JSON
import FreeApiBase from './FreeApiBase.js';

export class CountryInfoAgent extends FreeApiBase {
  constructor() {
    super('CountryInfoAgent', {
      baseUrl: 'https://restcountries.com',
      authMethod: 'none',
      rateLimit: 120,
      timeoutMs: 8000,
      category: 'geocoding',
    });
  }

  healthEndpoint() { return '/v3.1/name/usa?fields=name'; }

  async execute(context) {
    this.log.info('Fetching country information');
    const country = context.country || context.geo?.country || 'United States';

    return this.executeWithFallback(context, async () => {
      return this.apiFetch(`/v3.1/name/${encodeURIComponent(country)}`, { fields: 'name,capital,population,region,subregion,languages,currencies,timezones,flags' });
    });
  }

  transform(raw) {
    const c = Array.isArray(raw) ? raw[0] : raw;
    return {
      countryInfo: {
        name: c?.name?.common, capital: c?.capital?.[0],
        population: c?.population, region: c?.region, subregion: c?.subregion,
        languages: c?.languages ? Object.values(c.languages) : [],
        currencies: c?.currencies ? Object.keys(c.currencies) : [],
        timezones: c?.timezones || [],
        flag: c?.flags?.png,
      },
      source: this.name, fetchedAt: new Date().toISOString(),
    };
  }

  getFallbackData() {
    return { countryInfo: { name: 'United States', capital: 'Washington, D.C.', region: 'Americas' }, source: this.name, fallback: true, fetchedAt: new Date().toISOString() };
  }
}
export default CountryInfoAgent;
