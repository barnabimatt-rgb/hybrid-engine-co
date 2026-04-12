import BaseAgent from '../BaseAgent.js';
import { NICHE_KEYWORDS } from '../../niche/NicheConfig.js';

export class MetadataAgent extends BaseAgent {
  constructor() { super('MetadataAgent', { category: 'distribution' }); }
  async execute(context) {
    this.requireContext(context, ['title', 'topic', 'niche']);
    this.log.info('Generating metadata');
    const nicheKws = NICHE_KEYWORDS[context.niche] || [];
    const tags = [...nicheKws.slice(0, 8), 'hybrid engine co', context.topic].map((t) => t.toLowerCase());
    const description = `${context.title}\n\n${context.hook || ''}\n\nBuilt by Hybrid Engine Co.\n\nTags: ${tags.join(', ')}`;
    return { metadata: { title: context.title, description: description.slice(0, 5000), tags, category: context.niche === 'data_science' ? 'Education' : 'Sports', language: 'en' } };
  }
}
export default MetadataAgent;
