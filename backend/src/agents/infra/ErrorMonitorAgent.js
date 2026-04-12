import BaseAgent from '../BaseAgent.js';
import AgentEvent from '../../db/models/AgentEvent.js';

export class ErrorMonitorAgent extends BaseAgent {
  constructor() { super('ErrorMonitorAgent', { category: 'infra' }); }
  async execute(context) {
    this.log.info('Monitoring errors');
    const errorRate = await AgentEvent.getErrorRate(60);
    return { errorMonitor: { errorRate, status: errorRate > 50 ? 'critical' : errorRate > 20 ? 'warning' : 'healthy', threshold: { warning: 20, critical: 50 }, timestamp: new Date().toISOString() } };
  }
}
export default ErrorMonitorAgent;
