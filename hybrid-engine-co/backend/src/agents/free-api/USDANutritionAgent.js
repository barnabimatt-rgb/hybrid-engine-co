// USDANutritionAgent — USDA FoodData Central for nutrition information
// API: https://api.nal.usda.gov/fdc/v1  |  Auth: query_key (DEMO_KEY free)  |  Rate: 1000/hr
import FreeApiBase from './FreeApiBase.js';

export class USDANutritionAgent extends FreeApiBase {
  constructor() {
    super('USDANutritionAgent', {
      baseUrl: 'https://api.nal.usda.gov',
      authMethod: 'query_key',
      authKeyEnv: 'USDA_API_KEY',
      rateLimit: 60,
      timeoutMs: 10000,
      category: 'nutrition',
    });
  }

  healthEndpoint() { return '/fdc/v1/foods/search?query=apple&pageSize=1&api_key=DEMO_KEY'; }

  async execute(context) {
    this.log.info('Fetching nutrition data from USDA');
    const query = context.foodQuery || context.topic || 'chicken breast';

    return this.executeWithFallback(context, async () => {
      const key = process.env.USDA_API_KEY || 'DEMO_KEY';
      const url = `/fdc/v1/foods/search?query=${encodeURIComponent(query)}&pageSize=5&api_key=${key}`;
      return this.apiFetch(url);
    });
  }

  transform(raw) {
    const foods = (raw.foods || []).map((f) => {
      const nutrients = {};
      for (const n of (f.foodNutrients || [])) {
        if (n.nutrientName === 'Energy') nutrients.calories = n.value;
        if (n.nutrientName === 'Protein') nutrients.protein = n.value;
        if (n.nutrientName === 'Total lipid (fat)') nutrients.fat = n.value;
        if (n.nutrientName === 'Carbohydrate, by difference') nutrients.carbs = n.value;
        if (n.nutrientName === 'Fiber, total dietary') nutrients.fiber = n.value;
      }
      return { fdcId: f.fdcId, name: f.description, brand: f.brandName || null, nutrients, dataType: f.dataType };
    });

    return { nutrition: { foods, query: raw.foodSearchCriteria?.query, totalHits: raw.totalHits }, source: this.name, fetchedAt: new Date().toISOString() };
  }

  getFallbackData(context) {
    return { nutrition: { foods: [], query: context.foodQuery || '', totalHits: 0 }, source: this.name, fallback: true, fetchedAt: new Date().toISOString() };
  }
}
export default USDANutritionAgent;
