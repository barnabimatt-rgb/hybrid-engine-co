import BaseAgent from '../BaseAgent.js';

export class ProductGeneratorAgent extends BaseAgent {
  constructor() { super('ProductGeneratorAgent', { category: 'product' }); }
  async execute(context) {
    this.requireContext(context, ['topic', 'niche']);
    this.log.info({ topic: context.topic }, 'Generating product');
    const types = ['ebook', 'template', 'worksheet', 'checklist', 'course_outline', 'notion_template'];
    const type = types[Math.floor(Math.random() * types.length)];
    return {
      product: { type, title: `The ${context.topic} Blueprint`, subtitle: 'A data-driven guide by Hybrid Engine Co.', niche: context.niche, sections: ['Introduction', 'Core Framework', 'Step-by-Step System', 'Templates & Tools', 'Action Plan'], estimatedPages: type === 'ebook' ? 25 : 5, price: context.marketInsights?.recommendedPrice || 997 },
    };
  }
}
export default ProductGeneratorAgent;
