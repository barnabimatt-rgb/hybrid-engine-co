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

    // Each query is wrapped so a single DB failure (missing table, timeout)
    // never crashes the pipeline — the dashboard is non-critical.
    const safe = (fn, fallback) => fn().catch((err) => { this.log.warn({ error: err.message }, 'Dashboard query failed'); return fallback; });

    const [totalRevenue, revenueBySource, revenueByNiche, assetCounts, recentRuns, errorRate, limits] = await Promise.all([
      safe(() => Revenue.getTotalRevenue(), 0),
      safe(() => Revenue.getRevenueBySource(), {}),
      safe(() => Revenue.getRevenueByNiche(), {}),
      safe(() => Asset.countByType(), {}),
      safe(() => PipelineRun.getRecent(10), []),
      safe(() => AgentEvent.getErrorRate(60), 0),
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
