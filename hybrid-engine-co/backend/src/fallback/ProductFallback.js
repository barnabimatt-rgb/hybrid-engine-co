// backend/src/fallback/ProductFallback.js
import { FallbackChain } from './FallbackChain.js';

const strategies = [
  {
    name: 'regenerate_outline',
    async execute(ctx) {
      if (!ctx.topic) throw new Error('No topic');
      return { type: 'product', format: 'full', topic: ctx.topic, niche: ctx.niche, sections: ['intro', 'core_content', 'action_steps', 'resources'] };
    },
  },
  {
    name: 'shorter_product',
    async execute(ctx) {
      return { type: 'product', format: 'compact', topic: ctx.topic || 'Quick Guide', niche: ctx.niche, sections: ['core_content', 'action_steps'] };
    },
  },
  {
    name: 'one_page_template',
    async execute(ctx) {
      return { type: 'product', format: 'one_page', topic: ctx.topic || 'Cheat Sheet', niche: ctx.niche, content: `${ctx.topic || 'Quick Reference'} — One-Page Guide by Hybrid Engine Co.` };
    },
  },
];

const productFallback = new FallbackChain('product', strategies);
export default productFallback;
