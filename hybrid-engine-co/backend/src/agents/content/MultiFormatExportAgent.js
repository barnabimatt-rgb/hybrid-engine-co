import BaseAgent from '../BaseAgent.js';

export class MultiFormatExportAgent extends BaseAgent {
  constructor() { super('MultiFormatExportAgent', { category: 'content' }); }
  async execute(context) {
    this.log.info('Exporting to multiple formats');
    const exports = [];
    if (context.video) {
      exports.push({ format: 'mp4', platform: 'youtube', asset: context.video });
      exports.push({ format: 'mp4_vertical', platform: 'shorts', asset: { ...context.video, resolution: '1080x1920' } });
    }
    if (context.script) exports.push({ format: 'md', platform: 'blog', content: context.script });
    if (context.thumbnail) exports.push({ format: 'png', platform: 'youtube', asset: context.thumbnail });
    return { exports, exportCount: exports.length };
  }
}
export default MultiFormatExportAgent;
