// WgerExerciseAgent — Open exercise database for workout generation
// API: https://wger.de/api/v2  |  Auth: NONE  |  Rate: 100/min  |  Format: JSON
import FreeApiBase from './FreeApiBase.js';

export class WgerExerciseAgent extends FreeApiBase {
  constructor() {
    super('WgerExerciseAgent', {
      baseUrl: 'https://wger.de',
      authMethod: 'none',
      rateLimit: 100,
      timeoutMs: 10000,
      category: 'fitness',
    });
  }

  healthEndpoint() { return '/api/v2/exercise/?format=json&limit=1'; }

  async execute(context) {
    this.log.info('Fetching exercises from wger database');
    const muscleGroup = context.muscleGroup || null;
    const category = context.exerciseCategory || null;

    return this.executeWithFallback(context, async () => {
      const params = { format: 'json', language: 2, limit: 20 };
      if (muscleGroup) params.muscles = muscleGroup;
      if (category) params.category = category;
      return this.apiFetch('/api/v2/exercise/', params);
    });
  }

  transform(raw) {
    const exercises = (raw.results || []).map((ex) => ({
      id: ex.id,
      name: ex.name || `Exercise ${ex.id}`,
      description: (ex.description || '').replace(/<[^>]*>/g, '').slice(0, 200),
      category: ex.category,
      muscles: ex.muscles || [],
      musclesSecondary: ex.muscles_secondary || [],
      equipment: ex.equipment || [],
    }));

    return {
      exercises,
      count: exercises.length,
      source: this.name,
      fetchedAt: new Date().toISOString(),
    };
  }

  getFallbackData() {
    return {
      exercises: [
        { id: 0, name: 'Push-ups', category: 'bodyweight', muscles: ['chest', 'triceps'] },
        { id: 1, name: 'Squats', category: 'bodyweight', muscles: ['quads', 'glutes'] },
        { id: 2, name: 'Pull-ups', category: 'bodyweight', muscles: ['back', 'biceps'] },
        { id: 3, name: 'Plank', category: 'core', muscles: ['abs', 'obliques'] },
        { id: 4, name: 'Burpees', category: 'cardio', muscles: ['full_body'] },
      ],
      count: 5, source: this.name, fallback: true, fetchedAt: new Date().toISOString(),
    };
  }
}
export default WgerExerciseAgent;
