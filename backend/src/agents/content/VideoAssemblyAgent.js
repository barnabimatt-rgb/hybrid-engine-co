import BaseAgent from '../BaseAgent.js';

export class VideoAssemblyAgent extends BaseAgent {
  constructor() { super('VideoAssemblyAgent', { category: 'content', estimatedRuntimeMinutes: 5 }); }
  async execute(context) {
    this.log.info('Assembling video');
    const hasAudio = context.voiceoverGenerated === true;
    const hasBroll = context.brollClips && context.brollClips.length > 0;
    let videoType = 'full';
    if (!hasAudio && !hasBroll) videoType = 'text_slides';
    else if (!hasAudio) videoType = 'broll_with_captions';
    else if (!hasBroll) videoType = 'audio_with_static';
    const duration = Math.min(context.estimatedDuration || 59, 59); // Cap at 59s for Shorts
    return {
      video: { type: videoType, title: context.title, duration, format: 'mp4', resolution: '1080x1920', aspect: '9:16', isShort: true, hasAudio, hasBroll, clipCount: (context.brollClips || []).length, url: `/videos/${Date.now()}_output.mp4` },
    };
  }
}
export default VideoAssemblyAgent;
