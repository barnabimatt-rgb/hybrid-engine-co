import BaseAgent from '../BaseAgent.js';

export class RetargetingAgent extends BaseAgent {
  constructor() { super('RetargetingAgent', { category: 'funnel' }); }
  async execute(context) {
    this.log.info('Configuring retargeting');
    return {
      retargeting: {
        abandonedCart: { delay: '1h', emails: [
          { delay: '1h', subject: 'You left something behind...' },
          { delay: '24h', subject: `Still thinking about ${context.product?.title || 'this'}?` },
          { delay: '72h', subject: 'Last chance: Special offer inside' },
        ] },
        engagementPixels: ['facebook', 'google'],
        audienceSegments: ['visited_landing', 'started_checkout', 'viewed_product'],
      },
    };
  }
}
export default RetargetingAgent;
