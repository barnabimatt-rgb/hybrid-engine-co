import BaseAgent from '../BaseAgent.js';
import config from '../../config.js';
import limitManager from '../../limits/LimitManager.js';
import { LimitStatus } from '../../limits/ElevenLabsLimiter.js';
import { sleep } from '../../utils/helpers.js';

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

    // If ElevenLabs API key is configured, generate real audio
    if (config.elevenLabs.apiKey) {
      const audio = await this._generateElevenLabsAudio(context.script);
      if (audio) {
        await limitManager.recordUsage('elevenlabs', charCount);
        return {
          voiceover: {
            type: 'audio',
            format: 'mp3',
            duration: context.estimatedDuration || Math.ceil(charCount / 15),
            charCount,
            voiceId: config.elevenLabs.voiceId || 'default',
            audioSize: audio.byteLength,
            generated: true,
          },
          voiceoverGenerated: true,
          audioBuffer: audio,
        };
      }
      this.log.warn('ElevenLabs API call failed, using text-only fallback');
    }

    // Fallback: record usage but return text-only
    await limitManager.recordUsage('elevenlabs', charCount);
    return {
      voiceover: {
        type: 'text_only',
        format: 'text',
        duration: context.estimatedDuration || Math.ceil(charCount / 15),
        charCount,
        voiceId: 'none',
        reason: config.elevenLabs.apiKey ? 'api_error' : 'no_api_key',
      },
      voiceoverGenerated: false,
    };
  }

  async _generateElevenLabsAudio(text, retries = 2) {
    const voiceId = config.elevenLabs.voiceId || '21m00Tcm4TlvDq8ikWAM'; // Default: Rachel
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': config.elevenLabs.apiKey,
          },
          body: JSON.stringify({
            text,
            model_id: 'eleven_monolingual_v1',
            voice_settings: { stability: 0.5, similarity_boost: 0.75 },
          }),
          signal: AbortSignal.timeout(60000),
        });

        if (response.status === 429) {
          this.log.warn({ attempt }, 'ElevenLabs rate limited — retrying');
          if (attempt < retries) { await sleep(Math.pow(2, attempt) * 2000); continue; }
          return null;
        }

        if (!response.ok) {
          const err = await response.text().catch(() => '');
          this.log.error({ status: response.status, body: err.slice(0, 200) }, 'ElevenLabs API error');
          return null;
        }

        return Buffer.from(await response.arrayBuffer());
      } catch (err) {
        this.log.error({ error: err.message, attempt }, 'ElevenLabs call failed');
        if (attempt < retries) await sleep(Math.pow(2, attempt) * 1000);
      }
    }
    return null;
  }
}
export default VoiceoverAgent;
