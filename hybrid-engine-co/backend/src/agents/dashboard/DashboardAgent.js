import BaseAgent from '../BaseAgent.js';
import Revenue from '../../db/models/Revenue.js';
import Asset from '../../db/models/Asset.js';
import AgentEvent from '../../db/models/AgentEvent.js';
import PipelineRun from '../../db/models/PipelineRun.js';
import limitManager from '../../limits/LimitManager.js';

export class DashboardAgent extends BaseAgent {
  constructor() { super('DashboardAgent', { category: 'dashboard' }); }
  async execute(context) {
    this.log.info('Aggregating dashboard data');
    const [totalRevenue, revenueBySource, revenueByNiche, assetCounts, recentRuns, errorRate, limits] = await Promise.all([
      Revenue.getTotalRevenue(),
      Revenue.getRevenueBySource(),
      Revenue.getRevenueByNiche(),
      Asset.countByType(),
      PipelineRun.getRecent(10),
      AgentEvent.getErrorRate(60),
      Promise.resolve(limitManager.getSnapshot()),
    ]);
    return {
      dashboardData: {
        revenue: { total: totalRevenue, bySource: revenueBySource, byNiche: revenueByNiche },
        output: assetCounts,
        pipelines: { recent: recentRuns },
        health: { errorRate, limits },
        generatedAt: new Date().toISOString(),
      },
    };
  }
}
export default DashboardAgent;
