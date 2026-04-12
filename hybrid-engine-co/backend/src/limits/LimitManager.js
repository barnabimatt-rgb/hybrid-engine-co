// backend/src/limits/LimitManager.js — Central coordinator for all service limits
import elevenLabsLimiter, { LimitStatus } from './ElevenLabsLimiter.js';
import railwayLimiter from './RailwayLimiter.js';
import { createLogger } from '../utils/logger.js';

const log = createLogger('limits:manager');

class LimitManager {
  constructor() {
    this.elevenlabs = elevenLabsLimiter;
    this.railway = railwayLimiter;
  }

  check(service, estimatedCost) {
    if (service === 'elevenlabs') {
      const status = this.elevenlabs.canProceed(estimatedCost);
      if (status === LimitStatus.THROTTLE) return { status, recommendation: `Shorten script to ${this.elevenlabs.getRecommendedMaxChars()} chars` };
      if (status === LimitStatus.BLOCKED) return { status, recommendation: 'Use audio fallback — no quota remaining' };
      return { status, recommendation: 'Proceed normally' };
    }
    if (service === 'railway') {
      const status = this.railway.canProceed(estimatedCost);
      if (status === LimitStatus.THROTTLE) return { status, recommendation: 'Use lightweight processing' };
      if (status === LimitStatus.BLOCKED) return { status, recommendation: 'Defer heavy tasks' };
      return { status, recommendation: 'Proceed normally' };
    }
    return { status: LimitStatus.PROCEED, recommendation: 'Unknown service — proceeding' };
  }

  async recordUsage(service, amount) {
    if (service === 'elevenlabs') await this.elevenlabs.recordUsage(amount);
    else if (service === 'railway') await this.railway.recordUsage(amount);
  }

  canRunHeavyTask() {
    const rail = this.railway.canProceed(30);
    const el = this.elevenlabs.canProceed(3000);
    return rail !== LimitStatus.BLOCKED && el !== LimitStatus.BLOCKED;
  }

  getHeadroomScore() {
    const elPct = this.elevenlabs.pctUsed;
    const railPct = this.railway.getSnapshot().monthly.pctUsed;
    return Math.max(0, (100 - Math.max(elPct, railPct)) / 100);
  }

  getSnapshot() {
    return {
      elevenlabs: this.elevenlabs.getSnapshot(),
      railway: this.railway.getSnapshot(),
      headroom: this.getHeadroomScore(),
      canRunHeavy: this.canRunHeavyTask(),
    };
  }
}

const limitManager = new LimitManager();
export default limitManager;
