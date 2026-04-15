import BaseAgent from '../BaseAgent.js';
import Asset from '../../db/models/Asset.js';
import config from '../../config.js';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { writeFile, readFile, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

const execFileAsync = promisify(execFile);

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

    // If YouTube credentials are configured, convert audio to MP4 and upload
    if (this._hasYouTubeCredentials()) {
      let videoBuffer = null;

      const brollBuffer = context.brollVideoBuffer || null;

      if (context.audioBuffer) {
        this.log.info({ hasBroll: !!brollBuffer }, 'Converting audio to MP4 video for YouTube');
        videoBuffer = await this._audioToMp4(context.audioBuffer, brollBuffer);
      } else {
        this.log.info({ hasBroll: !!brollBuffer }, 'No audio — generating silent MP4 for YouTube');
        videoBuffer = await this._generateSilentMp4(30, brollBuffer);
        context._silentFallbackVideo = true;
      }

      if (videoBuffer) {
        const ytResult = await this._uploadToYouTube(context, videoBuffer);
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
              silentFallback: !!context._silentFallbackVideo,
            },
          });
          uploads.push(asset);
        }
      } else {
        this.log.error('Failed to generate MP4 video — skipping YouTube upload');
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

  /**
   * Convert an audio buffer (MP3 from ElevenLabs) into a vertical MP4 video (YouTube Shorts format).
   * 1080x1920 (9:16 vertical), capped at 60 seconds for Shorts.
   * If brollBuffer is provided, uses it as the video background instead of a solid color.
   */
  async _audioToMp4(audioBuffer, brollBuffer = null) {
    const id = randomUUID();
    const audioPath = join(tmpdir(), `hec_audio_${id}.mp3`);
    const brollPath = brollBuffer ? join(tmpdir(), `hec_broll_${id}.mp4`) : null;
    const outputPath = join(tmpdir(), `hec_video_${id}.mp4`);

    try {
      await writeFile(audioPath, audioBuffer);
      if (brollBuffer && brollPath) await writeFile(brollPath, brollBuffer);

      let args;
      if (brollPath) {
        // Use Pexels stock video as background — loop if shorter than audio
        this.log.info('Using Pexels B-roll as video background');
        args = [
          '-y',
          '-stream_loop', '-1', '-i', brollPath,
          '-i', audioPath,
          '-vf', 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1',
          '-c:v', 'libx264', '-preset', 'fast',
          '-profile:v', 'high', '-level', '4.2',
          '-b:v', '4M', '-maxrate', '5M', '-bufsize', '10M',
          '-g', '60', '-keyint_min', '30', '-bf', '2',
          '-c:a', 'aac', '-b:a', '128k', '-ar', '44100',
          '-shortest', '-t', '59',
          '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
          outputPath,
        ];
      } else {
        // Fallback: solid dark background
        args = [
          '-y',
          '-f', 'lavfi', '-i', 'color=c=0x0f0f23:s=1080x1920:r=30',
          '-i', audioPath,
          '-c:v', 'libx264', '-preset', 'fast',
          '-profile:v', 'high', '-level', '4.2',
          '-b:v', '2M', '-maxrate', '3M', '-bufsize', '6M',
          '-g', '60', '-keyint_min', '30', '-bf', '2',
          '-c:a', 'aac', '-b:a', '128k', '-ar', '44100',
          '-shortest', '-t', '59',
          '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
          outputPath,
        ];
      }

      await execFileAsync('ffmpeg', args, { timeout: 120000 });

      const videoBuffer = await readFile(outputPath);
      this.log.info({ inputSize: audioBuffer.byteLength, outputSize: videoBuffer.byteLength, hasBroll: !!brollPath }, 'Audio converted to MP4');
      return videoBuffer;
    } catch (err) {
      this.log.error({ error: err.message }, 'ffmpeg audio-to-MP4 conversion failed');
      return null;
    } finally {
      await unlink(audioPath).catch(() => {});
      if (brollPath) await unlink(brollPath).catch(() => {});
      await unlink(outputPath).catch(() => {});
    }
  }

  /**
   * Generate a silent MP4 in YouTube Shorts format (vertical 1080x1920, max 60s).
   * Used when ElevenLabs is not configured — still publishes metadata to YouTube.
   */
  async _generateSilentMp4(durationSeconds = 30, brollBuffer = null) {
    const capped = Math.min(durationSeconds, 59); // Shorts must be ≤60s
    const id = randomUUID();
    const brollPath = brollBuffer ? join(tmpdir(), `hec_broll_${id}.mp4`) : null;
    const outputPath = join(tmpdir(), `hec_silent_${id}.mp4`);

    try {
      if (brollBuffer && brollPath) await writeFile(brollPath, brollBuffer);

      let args;
      if (brollPath) {
        this.log.info('Using Pexels B-roll for silent video');
        args = [
          '-y',
          '-stream_loop', '-1', '-i', brollPath,
          '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo',
          '-vf', 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1',
          '-c:v', 'libx264', '-preset', 'fast',
          '-profile:v', 'high', '-level', '4.2',
          '-b:v', '4M', '-maxrate', '5M', '-bufsize', '10M',
          '-g', '60', '-keyint_min', '30', '-bf', '2',
          '-c:a', 'aac', '-b:a', '128k', '-ar', '44100',
          '-t', String(capped),
          '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
          outputPath,
        ];
      } else {
        args = [
          '-y',
          '-f', 'lavfi', '-i', `color=c=0x0f0f23:s=1080x1920:r=30:d=${capped}`,
          '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo',
          '-c:v', 'libx264', '-preset', 'fast',
          '-profile:v', 'high', '-level', '4.2',
          '-b:v', '2M', '-maxrate', '3M', '-bufsize', '6M',
          '-g', '60', '-keyint_min', '30', '-bf', '2',
          '-c:a', 'aac', '-b:a', '128k', '-ar', '44100',
          '-t', String(capped),
          '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
          outputPath,
        ];
      }

      await execFileAsync('ffmpeg', args, { timeout: 60000 });

      const videoBuffer = await readFile(outputPath);
      this.log.info({ outputSize: videoBuffer.byteLength, durationSeconds, hasBroll: !!brollPath }, 'Silent MP4 generated');
      return videoBuffer;
    } catch (err) {
      this.log.error({ error: err.message }, 'ffmpeg silent MP4 generation failed');
      return null;
    } finally {
      if (brollPath) await unlink(brollPath).catch(() => {});
      await unlink(outputPath).catch(() => {});
    }
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

  async _uploadToYouTube(context, videoBuffer) {
    const accessToken = await this._refreshAccessToken();
    if (!accessToken) return null;

    try {
      // YouTube rejects descriptions with < > characters and other HTML-like content.
      // Sanitize the script and cap at 4500 chars (YouTube max is 5000, leave room for tags).
      const rawDesc = context.script?.slice(0, 4500)
        || context.product?.description
        || context.product?.tagline
        || context.angle
        || context.topic
        || '';
      const description = rawDesc.replace(/[<>]/g, '').replace(/\s+/g, ' ').trim();

      // Truncate title to 100 chars (YouTube limit)
      const title = (context.title || 'Hybrid Engine Co. Content').slice(0, 100);

      const metadata = {
        snippet: {
          title,
          description: `${description}\n\n#Shorts #HybridEngine\n\nBuilt by Hybrid Engine Co.`,
          tags: [context.niche, 'hybrid engine', 'data-driven', context.topic, 'Shorts'].filter(Boolean),
          categoryId: '22', // People & Blogs
        },
        status: {
          privacyStatus: 'private', // Start private, review before publishing
          selfDeclaredMadeForKids: false,
        },
      };

      const bufferSize = videoBuffer.byteLength;

      // Step 1: Initialize resumable upload
      const initResponse = await fetch(
        'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json; charset=UTF-8',
            'X-Upload-Content-Type': 'video/mp4',
            'X-Upload-Content-Length': String(bufferSize),
          },
          body: JSON.stringify(metadata),
          signal: AbortSignal.timeout(15000),
        }
      );

      if (!initResponse.ok) {
        const err = await initResponse.text().catch(() => '');
        this.log.error({ status: initResponse.status, body: err.slice(0, 300) }, 'YouTube upload init failed');
        return null;
      }

      const uploadUrl = initResponse.headers.get('location');
      if (!uploadUrl) {
        this.log.error('No upload URL returned from YouTube');
        return null;
      }

      this.log.info({ bufferSize, title }, 'Uploading MP4 to YouTube');

      // Step 2: Upload the MP4 video
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'video/mp4',
          'Content-Length': String(bufferSize),
        },
        body: videoBuffer,
        signal: AbortSignal.timeout(300000), // 5 min for video upload
      });

      if (!uploadResponse.ok) {
        const errBody = await uploadResponse.text().catch(() => '');
        this.log.error({ status: uploadResponse.status, body: errBody.slice(0, 300) }, 'YouTube upload failed');
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
}
export default UploadAgent;
