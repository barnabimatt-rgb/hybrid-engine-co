import BaseAgent from '../BaseAgent.js';
import Asset from '../../db/models/Asset.js';
import config from '../../config.js';
import { sleep } from '../../utils/helpers.js';

export class UploadAgent extends BaseAgent {
  constructor() { super('UploadAgent', { category: 'distribution', requiresNetwork: true }); }

  async execute(context) {
    // Derive title from whatever's available in context
    const title = context.title
      || context.product?.name
      || (context.angle ? `${context.angle} | Hybrid Engine Co.` : null)
      || (context.topic ? `${context.topic} | Hybrid Engine Co.` : null)
      || 'Hybrid Engine Co. Content';
    context.title = title;

    this.log.info({ title }, 'Uploading assets');
    const uploads = [];

    // If YouTube credentials are configured, attempt upload
    // Uses real audio if available, otherwise generates silent fallback audio
    if (this._hasYouTubeCredentials()) {
      if (!context.audioBuffer) {
        this.log.info('No audioBuffer from VoiceoverAgent — generating silent fallback audio for YouTube upload');
        context.audioBuffer = this._generateSilentWav(30);
        context._silentFallbackAudio = true;
      }
      const ytResult = await this._uploadToYouTube(context);
      if (ytResult) {
        const asset = await Asset.create({
          pipelineRunId: context.pipelineRunId,
          assetType: 'video',
          title: context.title,
          platform: 'youtube',
          niche: context.niche,
          metadata: {
            youtubeId: ytResult.id,
            youtubeUrl: `https://youtube.com/watch?v=${ytResult.id}`,
            status: ytResult.status?.uploadStatus,
            silentFallback: !!context._silentFallbackAudio,
          },
        });
        uploads.push(asset);
      }
    } else {
      this.log.warn('YouTube credentials not configured — skipping YouTube upload');
    }

    // Create local asset records for all exports
    for (const exp of (context.exports || [])) {
      const asset = await Asset.create({
        pipelineRunId: context.pipelineRunId,
        assetType: exp.format === 'mp4' ? 'video' : exp.format,
        title: context.title,
        platform: exp.platform,
        niche: context.niche,
      });
      uploads.push(asset);
    }

    if (uploads.length === 0) {
      const asset = await Asset.create({
        pipelineRunId: context.pipelineRunId,
        assetType: 'text',
        title: context.title,
        platform: 'local',
        niche: context.niche,
      });
      uploads.push(asset);
    }

    return { uploads, uploadCount: uploads.length };
  }

  _hasYouTubeCredentials() {
    return !!(config.youtube.clientId && config.youtube.clientSecret && config.youtube.refreshToken);
  }

  async _refreshAccessToken() {
    try {
      const params = new URLSearchParams({
        client_id: config.youtube.clientId,
        client_secret: config.youtube.clientSecret,
        refresh_token: config.youtube.refreshToken,
        grant_type: 'refresh_token',
      });

      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        this.log.error({ status: response.status }, 'YouTube token refresh failed');
        return null;
      }

      const data = await response.json();
      return data.access_token;
    } catch (err) {
      this.log.error({ error: err.message }, 'YouTube token refresh error');
      return null;
    }
  }

  async _uploadToYouTube(context) {
    const accessToken = await this._refreshAccessToken();
    if (!accessToken) return null;

    try {
      const description = context.script?.slice(0, 500)
        || context.product?.description
        || context.product?.tagline
        || context.angle
        || context.topic
        || '';

      const metadata = {
        snippet: {
          title: context.title,
          description: `${description}\n\nBuilt by Hybrid Engine Co.`,
          tags: [context.niche, 'hybrid engine', 'data-driven', context.topic].filter(Boolean),
          categoryId: '22', // People & Blogs
        },
        status: {
          privacyStatus: 'private', // Start private, review before publishing
          selfDeclaredMadeForKids: false,
        },
      };

      // Step 1: Initialize resumable upload
      const initResponse = await fetch(
        'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(metadata),
          signal: AbortSignal.timeout(15000),
        }
      );

      if (!initResponse.ok) {
        const err = await initResponse.text().catch(() => '');
        this.log.error({ status: initResponse.status, body: err.slice(0, 200) }, 'YouTube upload init failed');
        return null;
      }

      const uploadUrl = initResponse.headers.get('location');
      if (!uploadUrl) {
        this.log.error('No upload URL returned from YouTube');
        return null;
      }

      // Step 2: Upload the actual content
      const contentType = context._silentFallbackAudio ? 'audio/wav' : 'audio/mpeg';
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': contentType,
        },
        body: context.audioBuffer,
        signal: AbortSignal.timeout(120000),
      });

      if (!uploadResponse.ok) {
        this.log.error({ status: uploadResponse.status }, 'YouTube upload failed');
        return null;
      }

      const result = await uploadResponse.json();
      this.log.info({ videoId: result.id }, 'YouTube upload successful');
      return result;
    } catch (err) {
      this.log.error({ error: err.message }, 'YouTube upload error');
      return null;
    }
  }
  /**
   * Generate a valid WAV file buffer with silence.
   * YouTube accepts audio files and creates a video from them.
   * This ensures content (title, description, tags) gets published even without ElevenLabs.
   */
  _generateSilentWav(durationSeconds = 30) {
    const sampleRate = 22050;
    const bitsPerSample = 16;
    const numChannels = 1;
    const bytesPerSample = bitsPerSample / 8;
    const numSamples = sampleRate * durationSeconds;
    const dataSize = numSamples * numChannels * bytesPerSample;
    const headerSize = 44;
    const buffer = Buffer.alloc(headerSize + dataSize); // Zeros = silence

    // RIFF header
    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(headerSize + dataSize - 8, 4);
    buffer.write('WAVE', 8);

    // fmt sub-chunk
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16);                              // Sub-chunk size
    buffer.writeUInt16LE(1, 20);                               // PCM format
    buffer.writeUInt16LE(numChannels, 22);                     // Mono
    buffer.writeUInt32LE(sampleRate, 24);                      // Sample rate
    buffer.writeUInt32LE(sampleRate * numChannels * bytesPerSample, 28); // Byte rate
    buffer.writeUInt16LE(numChannels * bytesPerSample, 32);    // Block align
    buffer.writeUInt16LE(bitsPerSample, 34);                   // Bits per sample

    // data sub-chunk
    buffer.write('data', 36);
    buffer.writeUInt32LE(dataSize, 40);
    // Audio data is already zeros (silence) from Buffer.alloc

    return buffer;
  }
}
export default UploadAgent;
