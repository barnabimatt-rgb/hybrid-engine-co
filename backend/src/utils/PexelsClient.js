// backend/src/utils/PexelsClient.js — Pexels video API wrapper using native fetch
import config from '../config.js';
import { createLogger } from './logger.js';

const log = createLogger('utils:pexels');

class PexelsClient {
  isAvailable() {
    return !!config.pexels.apiKey;
  }

  /**
   * Search for videos on Pexels.
   * @param {string} query - Search terms (e.g. "fitness gym training")
   * @param {object} opts
   * @param {string} opts.orientation - "portrait" | "landscape" | "square"
   * @param {number} opts.perPage - Results per page (1-80)
   * @returns {Array|null} Array of video objects or null on failure
   */
  async searchVideos(query, { orientation = 'portrait', perPage = 5 } = {}) {
    if (!this.isAvailable()) return null;

    const params = new URLSearchParams({ query, orientation, per_page: String(perPage) });
    const url = `https://api.pexels.com/videos/search?${params}`;

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await fetch(url, {
          headers: { 'Authorization': config.pexels.apiKey },
          signal: AbortSignal.timeout(10000),
        });

        if (response.status === 429) {
          log.warn('Pexels rate limit hit — retrying');
          await new Promise((r) => setTimeout(r, 2000));
          continue;
        }

        if (!response.ok) {
          log.error({ status: response.status }, 'Pexels search failed');
          return null;
        }

        const data = await response.json();
        log.info({ query, results: data.videos?.length || 0 }, 'Pexels search complete');
        return data.videos || [];
      } catch (err) {
        log.warn({ error: err.message, attempt }, 'Pexels search error');
        if (attempt === 0) await new Promise((r) => setTimeout(r, 1000));
      }
    }
    return null;
  }

  /**
   * Download a video file from a URL and return it as a Buffer.
   * @param {string} url - Direct video file URL from Pexels
   * @returns {Buffer|null}
   */
  async downloadVideo(url) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(60000) });
      if (!response.ok) {
        log.error({ status: response.status, url: url.slice(0, 100) }, 'Pexels video download failed');
        return null;
      }
      const buffer = Buffer.from(await response.arrayBuffer());
      log.info({ size: buffer.byteLength }, 'Pexels video downloaded');
      return buffer;
    } catch (err) {
      log.error({ error: err.message }, 'Pexels video download error');
      return null;
    }
  }

  /**
   * Pick the best video file from a Pexels video's `video_files` array.
   * Prefers HD mp4 files closest to the target height (1920 for Shorts).
   * @param {Array} videoFiles - Array of { id, quality, file_type, width, height, link }
   * @param {number} targetHeight - Desired height in pixels
   * @returns {object|null} The best matching video file object
   */
  getBestFile(videoFiles, targetHeight = 1920) {
    if (!videoFiles || videoFiles.length === 0) return null;

    // Filter to mp4 files only
    const mp4s = videoFiles.filter((f) => f.file_type === 'video/mp4');
    const candidates = mp4s.length > 0 ? mp4s : videoFiles;

    // Sort by: HD quality first, then closest to target height
    candidates.sort((a, b) => {
      const aHD = a.quality === 'hd' ? 0 : 1;
      const bHD = b.quality === 'hd' ? 0 : 1;
      if (aHD !== bHD) return aHD - bHD;
      return Math.abs((a.height || 0) - targetHeight) - Math.abs((b.height || 0) - targetHeight);
    });

    return candidates[0] || null;
  }
}

const pexelsClient = new PexelsClient();
export default pexelsClient;
