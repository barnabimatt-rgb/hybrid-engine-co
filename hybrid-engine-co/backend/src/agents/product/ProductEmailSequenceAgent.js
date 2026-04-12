import BaseAgent from '../BaseAgent.js';

export class ProductEmailSequenceAgent extends BaseAgent {
  constructor() { super('ProductEmailSequenceAgent', { category: 'product' }); }
  async execute(context) {
    this.log.info('Generating email sequence');
    const pt = context.product?.title || 'Digital Product';
    return {
      emailSequence: { type: 'post_purchase', emails: [
        { day: 0, subject: `Your ${pt} is ready`, type: 'delivery' },
        { day: 1, subject: 'Quick start: Get results in 24 hours', type: 'onboarding' },
        { day: 3, subject: `The #1 mistake people make with ${context.topic || 'this'}`, type: 'value' },
        { day: 5, subject: 'Your progress check-in', type: 'engagement' },
        { day: 7, subject: 'Level up: Advanced strategies inside', type: 'upsell' },
      ] },
    };
  }
}
export default ProductEmailSequenceAgent;
