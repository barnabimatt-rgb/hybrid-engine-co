import BaseAgent from '../BaseAgent.js';
import Asset from '../../db/models/Asset.js';

export class KnowledgeMemoryAgent extends BaseAgent {
  constructor() { super('KnowledgeMemoryAgent', { category: 'core' }); }
  async execute(context) {
    this.log.info('Loading knowledge memory');
    const recentAssets = await Asset.getRecent(50);
    const recentTitles = recentAssets.map((a) => a.title).filter(Boolean);
    return { memory: { recentTitles, totalAssetsProduced: recentAssets.length, avoidTopics: recentTitles.slice(0, 10) } };
  }
}
export default KnowledgeMemoryAgent;
