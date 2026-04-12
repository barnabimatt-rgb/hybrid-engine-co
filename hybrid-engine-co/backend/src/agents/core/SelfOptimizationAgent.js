import BaseAgent from '../BaseAgent.js';
import AgentEvent from '../../db/models/AgentEvent.js';

export class SelfOptimizationAgent extends BaseAgent {
  constructor() { super('SelfOptimizationAgent', { category: 'core' }); }
  async execute(context) {
    this.log.info('Analyzing system performance');
    const errorRate = await AgentEvent.getErrorRate(1440);
    const recommendations = [];
    if (errorRate > 20) recommendations.push('High error rate — simplify pipeline steps');
    if (errorRate > 50) recommendations.push('Critical — switch to fallback-only mode');
    if (context.memory?.totalAssetsProduced < 5) recommendations.push('Low output — increase frequency');
    return { optimization: { errorRate, recommendations, mode: errorRate > 50 ? 'conservative' : errorRate > 20 ? 'cautious' : 'aggressive' } };
  }
}
export default SelfOptimizationAgent;
