// backend/src/limits/OpenAILimiter.js — OpenAI token usage tracking
import config from '../config.js';
import { createLogger } from '../utils/logger.js';
import eventBus, { Events } from '../utils/eventBus.js';

const log = createLogger('limits:openai');

export const LimitStatus = Object.freeze({
  PROCEED: 'proceed',
  THROTTLE: 'throttle',
  BLOCKED: 'blocked',
});

class OpenAILimiter {
  constructor() {
    this.monthlyLimit = config.openai.monthlyTokenLimit;
    this.safetyBuffer = 0.10;
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
      log.info({ prev: this.usedThisMonth }, 'Monthly token limit reset');
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

  canProceed(estimatedTokens) {
    this._checkMonthReset();
    const afterUse = this.usedThisMonth + estimatedTokens;
    if (afterUse > this.monthlyLimit) {
      log.warn({ estimated: estimatedTokens, used: this.usedThisMonth }, 'BLOCKED');
      eventBus.emit(Events.LIMIT_BLOCKED, { service: 'openai', estimated: estimatedTokens });
      return LimitStatus.BLOCKED;
    }
    if (afterUse > this.safeCeiling) {
      log.warn({ estimated: estimatedTokens, remaining: this.remaining }, 'THROTTLE');
      eventBus.emit(Events.LIMIT_THROTTLE, { service: 'openai', estimated: estimatedTokens });
      return LimitStatus.THROTTLE;
    }
    return LimitStatus.PROCEED;
  }

  recordUsage(tokens) {
    this._checkMonthReset();
    this.usedThisMonth += tokens;
    log.info({ tokens, totalUsed: this.usedThisMonth, remaining: this.remaining }, 'Token usage recorded');
  }

  getSnapshot() {
    this._checkMonthReset();
    return {
      service: 'openai',
      used: this.usedThisMonth,
      limit: this.monthlyLimit,
      safeCeiling: this.safeCeiling,
      remaining: this.remaining,
      pctUsed: this.pctUsed,
    };
  }
}

const openaiLimiter = new OpenAILimiter();
export default openaiLimiter;
