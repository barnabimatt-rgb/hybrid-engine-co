import BaseAgent from '../BaseAgent.js';
import contentTemplateEngine from '../../utils/ContentTemplateEngine.js';
import openaiClient from '../../utils/OpenAIClient.js';
import limitManager from '../../limits/LimitManager.js';

export class ProductLandingPageAgent extends BaseAgent {
  constructor() { super('ProductLandingPageAgent', { category: 'product' }); }
  async execute(context) {
    this.requireContext(context, ['product']);
    this.log.info('Building landing page');
    const product = context.product;

    const openaiCheck = limitManager.check('openai', 1500);
    if (openaiClient.isAvailable() && openaiCheck.status !== 'blocked') {
      const prompt = `Create landing page copy for "${product.name || context.topic}".
Product type: ${product.type || 'digital product'}
Price: $${product.price || 9.99}
Tagline: ${product.tagline || ''}
Niche: ${context.niche || 'hybrid_fitness'}

Return JSON:
{
  "hero": { "headline": "main headline", "subheadline": "supporting line", "ctaText": "button text" },
  "problem": { "headline": "problem section headline", "points": ["pain point 1", "pain point 2", "pain point 3"] },
  "solution": { "headline": "solution headline", "description": "how this product solves the problem" },
  "features": [{ "title": "feature", "description": "benefit-focused description" }],
  "socialProof": { "testimonialTemplate": "testimonial placeholder", "stats": ["stat1", "stat2"] },
  "faq": [{ "question": "q", "answer": "a" }],
  "finalCta": { "headline": "closing headline", "urgency": "urgency line", "ctaText": "button text" }
}

Write persuasive, data-driven copy. No hype — focus on outcomes and specifics.`;

      const result = await openaiClient.generateJSON(prompt, { maxTokens: 1500, temperature: 0.7 });
      if (result?.hero) {
        await limitManager.recordUsage('openai', 1500);
        return { landingPage: { ...result, source: 'openai' } };
      }
      this.log.warn('OpenAI landing page failed, falling back to template');
    }

    const landingPage = contentTemplateEngine.generateLandingPage(context);
    return { landingPage: { ...landingPage, source: 'template' } };
  }
}
export default ProductLandingPageAgent;
