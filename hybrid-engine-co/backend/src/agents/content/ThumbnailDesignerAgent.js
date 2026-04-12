import BaseAgent from '../BaseAgent.js';

export class ThumbnailDesignerAgent extends BaseAgent {
  constructor() { super('ThumbnailDesignerAgent', { category: 'content' }); }
  async execute(context) {
    this.requireContext(context, ['title']);
    this.log.info({ title: context.title }, 'Designing thumbnail');
    return {
      thumbnail: {
        title: context.title.slice(0, 60), style: 'bold_dark', bgColor: '#0A0A0A',
        accentColor: '#00D4FF', textColor: '#FFFFFF', layout: 'text_left_graphic_right',
        dimensions: { width: 1280, height: 720 }, format: 'png',
      },
    };
  }
}
export default ThumbnailDesignerAgent;
