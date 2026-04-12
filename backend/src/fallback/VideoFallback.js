// backend/src/fallback/VideoFallback.js
import { FallbackChain } from './FallbackChain.js';

const strategies = [
  {
    name: 'retry_simplified_script',
    async execute(ctx) {
      const simplified = (ctx.script || '').slice(0, Math.floor((ctx.script || '').length * 0.6));
      if (!simplified) throw new Error('No script to simplify');
      return { type: 'video', script: simplified, simplified: true, format: 'mp4' };
    },
  },
  {
    name: 'slideshow_images',
    async execute(ctx) {
      const images = ctx.images || ctx.thumbnails || [];
      if (images.length === 0) throw new Error('No images for slideshow');
      return { type: 'slideshow', images, format: 'mp4', duration: images.length * 5 };
    },
  },
  {
    name: 'static_image_overlay',
    async execute(ctx) {
      return { type: 'static_image', title: ctx.title || 'Hybrid Engine Co.', subtitle: ctx.topic || '', format: 'png' };
    },
  },
  {
    name: 'text_only',
    async execute(ctx) {
      return { type: 'text_only', title: ctx.title || 'Hybrid Engine Co.', content: ctx.script || ctx.outline || 'Content coming soon.', format: 'md' };
    },
  },
];

const videoFallback = new FallbackChain('video', strategies);
export default videoFallback;
