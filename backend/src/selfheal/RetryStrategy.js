// backend/src/selfheal/RetryStrategy.js
import config from '../config.js';
import { sleep } from '../utils/helpers.js';
import { createLogger } from '../utils/logger.js';

const log = createLogger('selfheal:retry');

export class RetryStrategy {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries ?? config.orchestrator.maxRetriesPerAgent;
    this.baseMs = options.baseMs ?? config.orchestrator.retryBackoffBaseMs;
    this.maxDelayMs = options.maxDelayMs ?? 30000;
  }

  getDelay(attempt) {
    const exponential = this.baseMs * Math.pow(2, attempt);
    const capped = Math.min(exponential, this.maxDelayMs);
    return Math.floor(capped * (0.5 + Math.random() * 0.5));
  }

  async execute(fn, meta = {}) {
    let lastError;
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const delay = this.getDelay(attempt - 1);
          log.info({ ...meta, attempt, delay }, 'Retrying');
          await sleep(delay);
        }
        const result = await fn(attempt);
        return { result, attempts: attempt + 1 };
      } catch (err) {
        lastError = err;
        log.warn({ ...meta, attempt, error: err.message }, 'Attempt failed');
        if (this._isNonRetryable(err)) break;
      }
    }
    throw lastError;
  }

  _isNonRetryable(err) {
    const msg = (err.message || '').toLowerCase();
    return msg.includes('unauthorized') || msg.includes('forbidden') || msg.includes('invalid api key') || err.status === 401 || err.status === 403;
  }
}

export default RetryStrategy;
