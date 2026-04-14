// backend/src/utils/FreeApiDataEnricher.js — Pull real data from free API agents for content
import freeApiRegistry from '../agents/free-api/FreeApiRegistry.js';
import { NICHES } from '../niche/NicheConfig.js';
import { createLogger } from './logger.js';

const log = createLogger('utils:enricher');

const FITNESS_NICHES = [NICHES.HYBRID_FITNESS, NICHES.DATA_DRIVEN_FITNESS, NICHES.TACTICAL_MINDSET];

export class FreeApiDataEnricher {
  async enrichForNiche(niche, topic) {
    const data = {};

    try {
      if (FITNESS_NICHES.includes(niche)) {
        data.exercises = await this._getExercises(topic);
        data.nutrition = await this._getNutrition(topic);
        data.weather = await this._getWeather();
      }
      data.quote = await this._getQuote();
      data.fact = await this._getFact();
    } catch (err) {
      log.warn({ error: err.message }, 'Enrichment partially failed — continuing');
    }

    return data;
  }

  async _getExercises(topic) {
    try {
      const agent = freeApiRegistry.get('WgerExerciseAgent');
      const result = await agent.execute({ muscleGroup: null });
      return result.exercises || result.data?.results || [];
    } catch {
      return [];
    }
  }

  async _getNutrition(topic) {
    try {
      const agent = freeApiRegistry.get('USDANutritionAgent');
      const query = topic || 'chicken breast';
      const result = await agent.execute({ query });
      return result.foods || result.data?.foods || [];
    } catch {
      return [];
    }
  }

  async _getWeather() {
    try {
      const agent = freeApiRegistry.get('OpenMeteoWeatherAgent');
      const result = await agent.execute({ latitude: 38.9, longitude: -77.0 });
      return result.weather || result.data || null;
    } catch {
      return null;
    }
  }

  async _getQuote() {
    try {
      const agent = freeApiRegistry.get('QuotableAgent');
      const result = await agent.execute({});
      return result.quote || result.data?.content || null;
    } catch {
      return null;
    }
  }

  async _getFact() {
    try {
      const agent = freeApiRegistry.get('NumbersApiAgent');
      const result = await agent.execute({});
      return result.fact || result.data?.text || null;
    } catch {
      return null;
    }
  }
}

const freeApiDataEnricher = new FreeApiDataEnricher();
export default freeApiDataEnricher;
