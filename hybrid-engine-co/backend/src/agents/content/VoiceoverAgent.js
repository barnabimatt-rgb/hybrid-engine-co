import BaseAgent from '../BaseAgent.js';
import limitManager from '../../limits/LimitManager.js';
import { LimitStatus } from '../../limits/ElevenLabsLimiter.js';

export class VoiceoverAgent extends BaseAgent {
  constructor() { super('VoiceoverAgent', { category: 'content', requiresNetwork: true, estimatedElevenLabsChars: 3000 }); }
  async execute(context) {
    this.requireContext(context, ['script']);
    const charCount = context.script.length;
    this.log.info({ charCount }, 'Generating voiceover');
    const check = limitManager.check('elevenlabs', charCount);
    if (check.status === LimitStatus.BLOCKED) {
      this.log.warn('ElevenLabs blocked — text-only fallback');
      return { voiceover: { type: 'text_only', script: context.script, reason: 'limit_blocked' }, voiceoverGenerated: false };
    }
    await limitManager.recordUsage('elevenlabs', charCount);
    return {
      voiceover: { type: 'audio', format: 'mp3', duration: context.estimatedDuration || Math.ceil(charCount / 15), charCount, voiceId: 'default', url: `/audio/${Date.now()}_voiceover.mp3` },
      voiceoverGenerated: true,
    };
  }
}
export default VoiceoverAgent;
