import BaseAgent from '../BaseAgent.js';
import contentTemplateEngine from '../../utils/ContentTemplateEngine.js';
import openaiClient from '../../utils/OpenAIClient.js';
import limitManager from '../../limits/LimitManager.js';

export class ProductGeneratorAgent extends BaseAgent {
  constructor() { super('ProductGeneratorAgent', { category: 'product' }); }
  async execute(context) {
    this.requireContext(context, ['topic', 'niche']);
    this.log.info({ topic: context.topic }, 'Generating product');

    const openaiCheck = limitManager.check('openai', 2000);
    if (openaiClient.isAvailable() && openaiCheck.status !== 'blocked') {
      const productTypes = ['ebook', 'checklist', 'template', 'worksheet', 'course_outline', 'notion_template'];
      const prompt = `Create a digital product about "${context.topic}" in the ${context.niche} niche.
Target audience: ${context.targetAudience || 'data-driven fitness enthusiasts'}.

Return JSON:
{
  "name": "product name",
  "type": "${productTypes.join('|')}",
  "tagline": "one-line value proposition",
  "price": number (4.99-29.99),
  "description": "2-3 sentence product description",
  "sections": [
    { "title": "section title", "content": "200-word section content" }
  ],
  "bonuses": ["bonus1", "bonus2"],
  "targetOutcome": "what the buyer will achieve"
}

Create 5-8 substantive sections with real, actionable content. No placeholder text.`;

      const result = await openaiClient.generateJSON(prompt, { maxTokens: 2000, temperature: 0.7 });
      if (result?.name && result?.sections) {
        await limitManager.recordUsage('openai', 2000);
        return { product: { ...result, source: 'openai' } };
      }
      this.log.warn('OpenAI product generation failed, falling back to template');
    }

    const product = contentTemplateEngine.generateProduct(context);
    return { product: { ...product, source: 'template' } };
  }
}
export default ProductGeneratorAgent;
