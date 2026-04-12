// backend/src/fallback/AudioFallback.js
import { FallbackChain } from './FallbackChain.js';

const strategies = [
  {
    name: 'retry_alternate_voice',
    async execute(ctx) {
      if (!ctx.script) throw new Error('No script');
      return { type: 'audio', script: ctx.script, voiceId: 'alternate', format: 'mp3' };
    },
  },
  {
    name: 'shorter_script',
    async execute(ctx) {
      const short = (ctx.script || '').slice(0, 500);
      if (!short) throw new Error('No script to shorten');
      return { type: 'audio', script: short, shortened: true, format: 'mp3' };
    },
  },
  {
    name: 'music_only',
    async execute(ctx) {
      return { type: 'music_only', track: 'ambient_focus', duration: ctx.duration || 60, format: 'mp3' };
    },
  },
  {
    name: 'silent',
    async execute(ctx) {
      return { type: 'silent', duration: ctx.duration || 60, format: 'mp3' };
    },
  },
  {
    name: 'text_only',
    async execute(ctx) {
      return { type: 'text_only', content: ctx.script || 'Audio not available.', format: 'txt' };
    },
  },
];

const audioFallback = new FallbackChain('audio', strategies);
export default audioFallback;
