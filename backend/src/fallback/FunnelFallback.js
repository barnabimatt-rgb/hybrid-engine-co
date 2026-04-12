// backend/src/fallback/FunnelFallback.js
import { FallbackChain } from './FallbackChain.js';

const strategies = [
  {
    name: 'regenerate_funnel',
    async execute(ctx) {
      if (!ctx.product && !ctx.topic) throw new Error('No product/topic');
      return { type: 'funnel', format: 'full', pages: ['landing', 'checkout', 'upsell', 'thank_you'], product: ctx.product?.title || ctx.topic, niche: ctx.niche };
    },
  },
  {
    name: 'minimal_funnel',
    async execute(ctx) {
      return { type: 'funnel', format: 'minimal', pages: ['landing', 'checkout'], product: ctx.product?.title || ctx.topic || 'Digital Product', niche: ctx.niche };
    },
  },
  {
    name: 'text_landing_page',
    async execute(ctx) {
      return { type: 'funnel', format: 'text_only', pages: ['landing'], product: ctx.product?.title || 'Digital Product', niche: ctx.niche };
    },
  },
];

const funnelFallback = new FallbackChain('funnel', strategies);
export default funnelFallback;
