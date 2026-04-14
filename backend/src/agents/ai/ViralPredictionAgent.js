import BaseAgent from '../BaseAgent.js';
import { NICHE_KEYWORDS, SIGNATURE_NICHE } from '../../niche/NicheConfig.js';
import openaiClient from '../../utils/OpenAIClient.js';
import limitManager from '../../limits/LimitManager.js';

export class ViralPredictionAgent extends BaseAgent {
  constructor() { super('ViralPredictionAgent', { category: 'ai' }); }
  async execute(context) {
    this.log.info('Predicting viral potential');
    const script = context.script || '';
    const title = context.title || '';
    const hooks = context.hooks || [];
    const niche = context.niche || context.selectedNiche || 'hybrid_fitness';

    // Try AI-enhanced analysis first
    const openaiCheck = limitManager.check('openai', 600);
    if (openaiClient.isAvailable() && openaiCheck.status !== 'blocked' && script.length > 50) {
      const prompt = `Analyze this content for viral potential. Score 0-100.

Title: "${title}"
Niche: ${niche}
Hook: "${hooks[0] || script.slice(0, 100)}"
Script excerpt: "${script.slice(0, 500)}"

Return JSON:
{
  "score": number,
  "confidence": number (0-1),
  "factors": {
    "hookStrength": number (0-1),
    "titleOptimization": number (0-1),
    "keywordDensity": number (0-1),
    "nicheAlignment": number (0-1),
    "ctaPresence": number (0-1),
    "contentLength": number (0-1),
    "emotionalResonance": number (0-1),
    "uniqueness": number (0-1)
  },
  "recommendation": "specific actionable recommendation",
  "suggestedImprovements": ["improvement1", "improvement2"]
}`;

      const result = await openaiClient.generateJSON(prompt, { maxTokens: 400, temperature: 0.5 });
      if (result?.score !== undefined) {
        await limitManager.recordUsage('openai', 400);
        return { viralPrediction: { ...result, source: 'openai' } };
      }
      this.log.warn('OpenAI viral prediction failed, falling back to algorithm');
    }

    // Algorithmic fallback
    const lower = script.toLowerCase();
    const hookScore = hooks.length > 0 ? Math.min(1, hooks.length / 5) : 0.3;
    const titleLen = title.length;
    const titleScore = titleLen >= 40 && titleLen <= 70 ? 1.0 : titleLen >= 30 && titleLen <= 80 ? 0.7 : 0.4;
    const keywords = NICHE_KEYWORDS[niche] || [];
    const keywordHits = keywords.filter((kw) => lower.includes(kw.toLowerCase()));
    const keywordScore = Math.min(1, keywordHits.length / Math.max(3, keywords.length * 0.3));
    const nicheScore = niche === SIGNATURE_NICHE ? 1.0 : 0.75;
    const ctaScore = (lower.includes('subscribe') || lower.includes('link')) ? 0.9 : 0.4;
    const lenScore = script.length >= 500 && script.length <= 2000 ? 1.0 : script.length >= 300 && script.length <= 3000 ? 0.7 : 0.4;

    const factors = { hookStrength: hookScore, titleOptimization: titleScore, keywordDensity: keywordScore, nicheAlignment: nicheScore, ctaPresence: ctaScore, contentLength: lenScore };
    const weights = { hookStrength: 0.25, titleOptimization: 0.15, keywordDensity: 0.2, nicheAlignment: 0.15, ctaPresence: 0.1, contentLength: 0.15 };
    const score = Math.round(Object.entries(factors).reduce((sum, [k, v]) => sum + v * (weights[k] || 0.1), 0) * 100);

    const recommendation = score > 75 ? 'Publish immediately — strong viral indicators'
      : score > 55 ? 'Good to publish — consider strengthening the hook'
      : 'Optimize hook and keyword density before publishing';

    return {
      viralPrediction: { score, confidence: 0.72, factors, keywordsFound: keywordHits, recommendation, source: 'algorithm' },
    };
  }
}
export default ViralPredictionAgent;
