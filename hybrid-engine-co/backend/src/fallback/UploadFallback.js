// backend/src/fallback/UploadFallback.js
import { FallbackChain } from './FallbackChain.js';

const strategies = [
  {
    name: 'retry_upload',
    async execute(ctx) {
      if (!ctx.asset) throw new Error('No asset');
      return { type: 'upload', asset: ctx.asset, platform: ctx.platform, status: 'retry' };
    },
  },
  {
    name: 'retry_reduced_metadata',
    async execute(ctx) {
      return { type: 'upload', asset: ctx.asset, platform: ctx.platform, metadata: { title: ctx.title || 'Untitled' }, status: 'reduced' };
    },
  },
  {
    name: 'alternate_platform',
    async execute(ctx) {
      const alt = ctx.platform === 'youtube' ? 'gumroad' : 'local';
      return { type: 'upload', asset: ctx.asset, platform: alt, status: 'alternate' };
    },
  },
  {
    name: 'save_locally',
    async execute(ctx) {
      return { type: 'local_save', asset: ctx.asset, path: `/data/pending/${Date.now()}`, status: 'queued_for_retry' };
    },
  },
];

const uploadFallback = new FallbackChain('upload', strategies);
export default uploadFallback;
