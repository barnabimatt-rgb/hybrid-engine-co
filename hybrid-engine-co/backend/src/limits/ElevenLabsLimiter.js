// backend/src/limits/ElevenLabsLimiter.js — ElevenLabs character usage tracking
import config from '../config.js';
import { createLogger } from '../utils/logger.js';
import eventBus, { Events } from '../utils/eventBus.js';
import UsageMetric from '../db/models/UsageMetric.js';

const log = createLogger('limits:elevenlabs');

export const LimitStatus = Object.freeze({
  PROCEED: 'proceed',
  THROTTLE: 'throttle',
  BLOCKED: 'blocked',
});

class ElevenLabsLimiter {
  constructor() {
    this.monthlyLimit = config.elevenLabs.monthlyCharLimit;
    this.safetyBuffer = config.elevenLabs.safetyBuffer;
    this.usedThisMonth = 0;
    this.lastReset = this._getMonthStart();
  }

  _getMonthStart() {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
  }

  _checkMonthReset() {
    const current = this._getMonthStart();
    if (current !== this.lastReset) {
      log.info({ prev: this.usedThisMonth }, 'Monthly limit reset');
      this.usedThisMonth = 0;
      this.lastReset = current;
    }
  }

  get safeCeiling() {
    return Math.floor(this.monthlyLimit * (1 - this.safetyBuffer));
  }

  get remaining() {
    this._checkMonthReset();
    return Math.max(0, this.safeCeiling - this.usedThisMonth);
  }

  get pctUsed() {
    return Math.round((this.usedThisMonth / this.monthlyLimit) * 10000) / 100;
  }

  canProceed(estimatedChars) {
    this._checkMonthReset();
    const afterUse = this.usedThisMonth + estimatedChars;

    if (afterUse > this.monthlyLimit) {
      log.warn({ estimated: estimatedChars, used: this.usedThisMonth }, 'BLOCKED');
      eventBus.emit(Events.LIMIT_BLOCKED, { service: 'elevenlabs', estimated: estimatedChars });
      return LimitStatus.BLOCKED;
    }

    if (afterUse > this.safeCeiling) {
      log.warn({ estimated: estimatedChars, remaining: this.remaining }, 'THROTTLE');
      eventBus.emit(Events.LIMIT_THROTTLE, { service: 'elevenlabs', estimated: estimatedChars });
      return LimitStatus.THROTTLE;
    }

    return LimitStatus.PROCEED;
  }

  async recordUsage(chars) {
    this._checkMonthReset();
    this.usedThisMonth += chars;
    log.info({ chars, totalUsed: this.usedThisMonth, remaining: this.remaining }, 'Usage recorded');
    await UsageMetric.record({
      service: 'elevenlabs',
      metricType: 'characters_used',
      value: this.usedThisMonth,
      limitValue: this.monthlyLimit,
      remaining: this.remaining,
    });
  }

  getRecommendedMaxChars() {
    const rem = this.remaining;
    if (rem > 10000) return 5000;
    if (rem > 5000) return 2500;
    if (rem > 2000) return 1000;
    if (rem > 500) return 500;
    return 0;
  }

  getSnapshot() {
    this._checkMonthReset();
    return {
      service: 'elevenlabs',
      used: this.usedThisMonth,
      limit: this.monthlyLimit,
      safeCeiling: this.safeCeiling,
      remaining: this.remaining,
      pctUsed: this.pctUsed,
      recommendedMaxChars: this.getRecommendedMaxChars(),
    };
  }
}

const elevenLabsLimiter = new ElevenLabsLimiter();
export default elevenLabsLimiter;
