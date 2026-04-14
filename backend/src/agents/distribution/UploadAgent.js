import BaseAgent from '../BaseAgent.js';
import Asset from '../../db/models/Asset.js';
import config from '../../config.js';
import { sleep } from '../../utils/helpers.js';

export class UploadAgent extends BaseAgent {
  constructor() { super('UploadAgent', { category: 'distribution', requiresNetwork: true }); }

  async execute(context) {
    this.requireContext(context, ['title']);
    this.log.info({ title: context.title }, 'Uploading assets');
    const uploads = [];

    // If YouTube credentials are configured, attempt real upload
    if (this._hasYouTubeCredentials() && context.audioBuffer) {
      const ytResult = await this._uploadToYouTube(context);
      if (ytResult) {
        const asset = await Asset.create({
          pipelineRunId: context.pipelineRunId,
          assetType: 'video',
          title: context.title,
          platform: 'youtube',
          niche: context.niche,
          metadata: { youtubeId: ytResult.id, youtubeUrl: `https://youtube.com/watch?v=${ytResult.id}`, status: ytResult.status?.uploadStatus },
        });
        uploads.push(asset);
      }
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
      const metadata = {
        snippet: {
          title: context.title,
          description: `${context.script?.slice(0, 500) || ''}\n\nBuilt by Hybrid Engine Co.`,
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
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'audio/mpeg',
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
}
export default UploadAgent;
