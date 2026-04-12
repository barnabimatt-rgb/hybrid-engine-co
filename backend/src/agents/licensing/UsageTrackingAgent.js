import BaseAgent from '../BaseAgent.js';
import limitManager from '../../limits/LimitManager.js';

export class UsageTrackingAgent extends BaseAgent {
  constructor() { super('UsageTrackingAgent', { category: 'licensing' }); }
  async execute(context) {
    this.log.info('Tracking usage');
    const snapshot = limitManager.getSnapshot();
    return { usageReport: { elevenlabs: snapshot.elevenlabs, railway: snapshot.railway, headroom: snapshot.headroom, canRunHeavy: snapshot.canRunHeavy, timestamp: new Date().toISOString() } };
  }
}
export default UsageTrackingAgent;
