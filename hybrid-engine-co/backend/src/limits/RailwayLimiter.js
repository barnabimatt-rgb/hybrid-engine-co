// backend/src/limits/RailwayLimiter.js — Railway Hobby runtime tracking
import config from '../config.js';
import { createLogger } from '../utils/logger.js';
import eventBus, { Events } from '../utils/eventBus.js';
import UsageMetric from '../db/models/UsageMetric.js';

const log = createLogger('limits:railway');

export const LimitStatus = Object.freeze({
  PROCEED: 'proceed',
  THROTTLE: 'throttle',
  BLOCKED: 'blocked',
});

class RailwayLimiter {
  constructor() {
    this.monthlyHoursLimit = config.railway.monthlyHoursLimit;
    this.dailyHoursLimit = config.railway.dailyHoursLimit;
    this.safetyBuffer = config.railway.safetyBuffer;
    this.processStartTime = Date.now();
    this.dailyMinutesUsed = 0;
    this.monthlyMinutesUsed = 0;
    this.lastDayReset = this._getDayStart();
    this.lastMonthReset = this._getMonthStart();
  }

  _getDayStart() {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
  }

  _getMonthStart() {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
  }

  _checkResets() {
    const today = this._getDayStart();
    if (today !== this.lastDayReset) { this.dailyMinutesUsed = 0; this.lastDayReset = today; }
    const monthStart = this._getMonthStart();
    if (monthStart !== this.lastMonthReset) { this.monthlyMinutesUsed = 0; this.lastMonthReset = monthStart; }
  }

  get uptimeMinutes() { return (Date.now() - this.processStartTime) / 60000; }
  get dailySafeCeiling() { return Math.floor(this.dailyHoursLimit * 60 * (1 - this.safetyBuffer)); }
  get monthlySafeCeiling() { return Math.floor(this.monthlyHoursLimit * 60 * (1 - this.safetyBuffer)); }

  get dailyRemaining() {
    this._checkResets();
    return Math.max(0, this.dailySafeCeiling - this.dailyMinutesUsed);
  }

  get monthlyRemaining() {
    this._checkResets();
    return Math.max(0, this.monthlySafeCeiling - this.monthlyMinutesUsed);
  }

  canProceed(estimatedMinutes) {
    this._checkResets();
    if (this.monthlyMinutesUsed + estimatedMinutes > this.monthlyHoursLimit * 60) {
      log.warn({ estimated: estimatedMinutes }, 'BLOCKED — monthly limit');
      eventBus.emit(Events.LIMIT_BLOCKED, { service: 'railway', scope: 'monthly' });
      return LimitStatus.BLOCKED;
    }
    if (this.dailyMinutesUsed + estimatedMinutes > this.dailyHoursLimit * 60) {
      log.warn({ estimated: estimatedMinutes }, 'BLOCKED — daily limit');
      eventBus.emit(Events.LIMIT_BLOCKED, { service: 'railway', scope: 'daily' });
      return LimitStatus.BLOCKED;
    }
    if (this.monthlyMinutesUsed + estimatedMinutes > this.monthlySafeCeiling) {
      eventBus.emit(Events.LIMIT_THROTTLE, { service: 'railway', scope: 'monthly' });
      return LimitStatus.THROTTLE;
    }
    if (this.dailyMinutesUsed + estimatedMinutes > this.dailySafeCeiling) {
      eventBus.emit(Events.LIMIT_THROTTLE, { service: 'railway', scope: 'daily' });
      return LimitStatus.THROTTLE;
    }
    return LimitStatus.PROCEED;
  }

  async recordUsage(minutes) {
    this._checkResets();
    this.dailyMinutesUsed += minutes;
    this.monthlyMinutesUsed += minutes;
    log.info({ minutes, dailyUsed: this.dailyMinutesUsed, monthlyUsed: this.monthlyMinutesUsed }, 'Runtime recorded');
    await UsageMetric.record({
      service: 'railway',
      metricType: 'runtime_minutes',
      value: this.monthlyMinutesUsed,
      limitValue: this.monthlyHoursLimit * 60,
      remaining: this.monthlyRemaining,
    });
  }

  getSystemMetrics() {
    const mem = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    return {
      memoryUsedMB: Math.round(mem.heapUsed / 1048576),
      memoryTotalMB: Math.round(mem.heapTotal / 1048576),
      memoryPct: Math.round((mem.heapUsed / mem.heapTotal) * 100),
      cpuUserMs: Math.round(cpuUsage.user / 1000),
      cpuSystemMs: Math.round(cpuUsage.system / 1000),
      uptimeMinutes: Math.round(this.uptimeMinutes),
    };
  }

  getSnapshot() {
    this._checkResets();
    const sys = this.getSystemMetrics();
    return {
      service: 'railway',
      daily: { used: Math.round(this.dailyMinutesUsed), limit: this.dailyHoursLimit * 60, remaining: this.dailyRemaining, pctUsed: Math.round((this.dailyMinutesUsed / (this.dailyHoursLimit * 60)) * 100) },
      monthly: { used: Math.round(this.monthlyMinutesUsed), limit: this.monthlyHoursLimit * 60, remaining: this.monthlyRemaining, pctUsed: Math.round((this.monthlyMinutesUsed / (this.monthlyHoursLimit * 60)) * 100) },
      system: sys,
    };
  }
}

const railwayLimiter = new RailwayLimiter();
export default railwayLimiter;
