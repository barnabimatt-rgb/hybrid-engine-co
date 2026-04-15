import BaseAgent from '../BaseAgent.js';
import pexelsClient from '../../utils/PexelsClient.js';

const SEARCH_TERMS = {
  hybrid_fitness: ['fitness training gym', 'workout exercise'],
  data_science: ['coding programming laptop', 'data analytics screen'],
  data_driven_fitness: ['fitness smartwatch data', 'gym workout tracking'],
  tactical_mindset: ['morning routine discipline', 'meditation focus'],
  productivity: ['workspace planning desk', 'productivity organization'],
  digital_entrepreneurship: ['entrepreneur laptop work', 'startup business'],
  veteran_transition: ['professional career growth', 'interview preparation'],
};

export class BrollGeneratorAgent extends BaseAgent {
  constructor() { super('BrollGeneratorAgent', { category: 'content' }); }

  async execute(context) {
    this.log.info('Generating B-roll');
    const niche = context.niche || 'hybrid_fitness';
    const topic = context.topic || '';

    // Try Pexels for real stock video
    if (pexelsClient.isAvailable()) {
      const clip = await this._fetchPexelsClip(niche, topic);
      if (clip) return clip;
      this.log.warn('Pexels returned no usable clip — falling back to metadata-only');
    }

    // Fallback: metadata only (UploadAgent will use solid color background)
    const brollMap = {
      hybrid_fitness: ['gym_training', 'running_outdoor', 'kettlebell_swing', 'stretching'],
      data_science: ['code_screen', 'dashboard_view', 'data_viz', 'terminal_typing'],
      data_driven_fitness: ['smartwatch_data', 'gym_with_metrics', 'heart_rate_graph', 'training_log'],
      tactical_mindset: ['morning_routine', 'journaling', 'cold_exposure', 'meditation'],
      productivity: ['notion_workspace', 'calendar_planning', 'desk_setup', 'checklist'],
      digital_entrepreneurship: ['laptop_cafe', 'analytics_dashboard', 'email_marketing', 'product_launch'],
      veteran_transition: ['military_to_civilian', 'interview_prep', 'resume_writing', 'networking'],
    };
    return {
      brollClips: (brollMap[niche] || brollMap.hybrid_fitness).map((clip, i) => ({
        id: `broll_${i}`, name: clip, duration: 3, source: 'stock_library',
      })),
    };
  }

  async _fetchPexelsClip(niche, topic) {
    // Build search query: use topic if available, else niche-specific terms
    const nicheTerms = SEARCH_TERMS[niche] || SEARCH_TERMS.hybrid_fitness;
    const query = topic
      ? `${topic} ${nicheTerms[0].split(' ')[0]}`
      : nicheTerms[Math.floor(Math.random() * nicheTerms.length)];

    this.log.info({ query }, 'Searching Pexels for B-roll');
    const videos = await pexelsClient.searchVideos(query, { orientation: 'portrait', perPage: 5 });
    if (!videos || videos.length === 0) return null;

    // Pick a random video from results for variety
    const video = videos[Math.floor(Math.random() * videos.length)];
    const bestFile = pexelsClient.getBestFile(video.video_files);
    if (!bestFile || !bestFile.link) {
      this.log.warn('No suitable video file found in Pexels result');
      return null;
    }

    this.log.info({ videoId: video.id, quality: bestFile.quality, resolution: `${bestFile.width}x${bestFile.height}` }, 'Downloading Pexels clip');
    const buffer = await pexelsClient.downloadVideo(bestFile.link);
    if (!buffer) return null;

    return {
      brollVideoBuffer: buffer,
      brollSource: {
        id: video.id,
        photographer: video.user?.name || 'Unknown',
        pexelsUrl: video.url,
      },
      brollClips: [{ id: `pexels_${video.id}`, name: query, duration: video.duration, source: 'pexels' }],
    };
  }
}
export default BrollGeneratorAgent;
