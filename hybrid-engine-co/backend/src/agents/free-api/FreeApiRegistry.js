// backend/src/agents/free-api/FreeApiRegistry.js — Registry for all free API agents
import { OpenMeteoWeatherAgent } from './OpenMeteoWeatherAgent.js';
import { OpenMeteoAirQualityAgent } from './OpenMeteoAirQualityAgent.js';
import { WgerExerciseAgent } from './WgerExerciseAgent.js';
import { USDANutritionAgent } from './USDANutritionAgent.js';
import { CoinGeckoAgent } from './CoinGeckoAgent.js';
import { NumbersApiAgent } from './NumbersApiAgent.js';
import { BoredApiAgent } from './BoredApiAgent.js';
import { IpApiGeoAgent } from './IpApiGeoAgent.js';
import { QuotableAgent } from './QuotableAgent.js';
import { SunriseSunsetAgent } from './SunriseSunsetAgent.js';
import { CountryInfoAgent } from './CountryInfoAgent.js';
import { OpenLibraryAgent } from './OpenLibraryAgent.js';
import { createLogger } from '../../utils/logger.js';

const log = createLogger('free-api:registry');

class FreeApiRegistry {
  constructor() {
    this.agents = new Map();
    this._registerAll();
  }

  _registerAll() {
    const all = [
      new OpenMeteoWeatherAgent(),
      new OpenMeteoAirQualityAgent(),
      new WgerExerciseAgent(),
      new USDANutritionAgent(),
      new CoinGeckoAgent(),
      new NumbersApiAgent(),
      new BoredApiAgent(),
      new IpApiGeoAgent(),
      new QuotableAgent(),
      new SunriseSunsetAgent(),
      new CountryInfoAgent(),
      new OpenLibraryAgent(),
    ];

    for (const agent of all) {
      this.agents.set(agent.name, agent);
    }

    log.info({ count: this.agents.size }, 'Free API agents registered');
  }

  get(name) {
    const agent = this.agents.get(name);
    if (!agent) throw new Error(`Free API agent not found: ${name}`);
    return agent;
  }

  getAll() {
    return Array.from(this.agents.values());
  }

  async healthCheckAll() {
    const results = {};
    for (const agent of this.getAll()) {
      results[agent.name] = await agent.checkHealth();
    }
    return results;
  }

  describe() {
    return this.getAll().map((a) => a.describe());
  }

  get count() {
    return this.agents.size;
  }

  /** Summary of all APIs for documentation */
  getApiSummary() {
    return this.getAll().map((a) => ({
      name: a.name,
      baseUrl: a.apiConfig.baseUrl,
      authMethod: a.apiConfig.authMethod,
      rateLimit: a.apiConfig.rateLimit,
      category: a.apiConfig.category,
      healthy: a.healthy,
      requestCount: a.requestCount,
    }));
  }
}

const freeApiRegistry = new FreeApiRegistry();
export default freeApiRegistry;
