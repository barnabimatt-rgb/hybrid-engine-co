import BaseAgent from '../BaseAgent.js';
import Asset from '../../db/models/Asset.js';

export class UploadAgent extends BaseAgent {
  constructor() { super('UploadAgent', { category: 'distribution', requiresNetwork: true }); }
  async execute(context) {
    this.requireContext(context, ['title']);
    this.log.info({ title: context.title }, 'Uploading assets');
    const uploads = [];
    for (const exp of (context.exports || [])) {
      const asset = await Asset.create({ pipelineRunId: context.pipelineRunId, assetType: exp.format === 'mp4' ? 'video' : exp.format, title: context.title, platform: exp.platform, niche: context.niche });
      uploads.push(asset);
    }
    if (uploads.length === 0) {
      const asset = await Asset.create({ pipelineRunId: context.pipelineRunId, assetType: 'text', title: context.title, platform: 'local', niche: context.niche });
      uploads.push(asset);
    }
    return { uploads, uploadCount: uploads.length };
  }
}
export default UploadAgent;
