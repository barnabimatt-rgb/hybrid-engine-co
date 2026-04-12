import BaseAgent from '../BaseAgent.js';

export class ProductUpsellAgent extends BaseAgent {
  constructor() { super('ProductUpsellAgent', { category: 'product' }); }
  async execute(context) {
    this.log.info('Creating upsell offers');
    const basePrice = context.product?.price || 997;
    return {
      upsells: [
        { name: 'Premium Bundle', priceMultiplier: 2.5, includes: ['video_walkthrough', 'community_access', 'templates'] },
        { name: 'Coaching Add-On', priceMultiplier: 5, includes: ['1on1_review', 'custom_plan'] },
      ],
      orderBump: { name: 'Quick-Start Checklist', price: Math.floor(basePrice * 0.5), description: 'Skip the learning curve.' },
    };
  }
}
export default ProductUpsellAgent;
