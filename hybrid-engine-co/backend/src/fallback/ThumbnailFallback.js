// backend/src/fallback/ThumbnailFallback.js
import { FallbackChain } from './FallbackChain.js';

const strategies = [
  {
    name: 'retry_generation',
    async execute(ctx) {
      if (!ctx.title) throw new Error('No title');
      return { type: 'thumbnail', title: ctx.title, style: 'primary', format: 'png' };
    },
  },
  {
    name: 'abstract_background',
    async execute(ctx) {
      return { type: 'thumbnail', title: ctx.title || 'Hybrid Engine Co.', style: 'abstract_gradient', colors: ['#0A0A0A', '#1A1A2E', '#16213E'], format: 'png' };
    },
  },
  {
    name: 'text_only_thumbnail',
    async execute(ctx) {
      return { type: 'thumbnail', title: ctx.title || 'Hybrid Engine Co.', style: 'text_only', bgColor: '#0A0A0A', textColor: '#FFFFFF', format: 'png' };
    },
  },
];

const thumbnailFallback = new FallbackChain('thumbnail', strategies);
export default thumbnailFallback;
