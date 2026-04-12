import BaseAgent from '../BaseAgent.js';

export class AffiliateAssetAgent extends BaseAgent {
  constructor() { super('AffiliateAssetAgent', { category: 'affiliate' }); }
  async execute(context) {
    this.log.info('Generating affiliate assets');
    const pt = context.product?.title || 'Hybrid Engine Product';
    return {
      affiliateAssets: {
        banners: [{ size: '728x90', text: `Get the ${pt} — 30% commission`, style: 'dark' }, { size: '300x250', text: pt, style: 'dark' }],
        swipeEmails: [{ subject: 'This changed how I train', type: 'testimonial' }, { subject: `${pt} — limited time`, type: 'urgency' }],
        socialPosts: [{ platform: 'twitter', text: `Just discovered ${pt} — game changer.` }, { platform: 'instagram', text: 'The system I use to optimize every workout.' }],
      },
    };
  }
}
export default AffiliateAssetAgent;
