// backend/src/agents/free-api/FreeApiBase.js — Shared base for all free-API agents
import BaseAgent from '../BaseAgent.js';
import { createLogger } from '../../utils/logger.js';
import { sleep } from '../../utils/helpers.js';

export class FreeApiBase extends BaseAgent {
  /**
   * @param {string} name
   * @param {object} apiConfig
   * @param {string} apiConfig.baseUrl
   * @param {string} apiConfig.authMethod — 'none' | 'query_key' | 'header_key'
   * @param {string} [apiConfig.authKeyEnv] — env var name for API key
   * @param {number} [apiConfig.rateLimit] — max requests per minute
   * @param {number} [apiConfig.timeoutMs] — request timeout
   * @param {string} apiConfig.category
   */
  constructor(name, apiConfig) {
    super(name, { category: 'free-api', requiresNetwork: true });
    this.apiConfig = {
      baseUrl: '',
      authMethod: 'none',
      authKeyEnv: '',
      rateLimit: 60,
      timeoutMs: 10000,
      category: 'general',
      ...apiConfig,
    };
    this.requestCount = 0;
    this.lastRequestTime = 0;
    this.lastHealthCheck = null;
    this.healthy = true;
    this.consecutiveFailures = 0;
  }

  // ── Fetcher ──
  async apiFetch(endpoint, params = {}) {
    await this._rateLimit();

    const url = new URL(endpoint, this.apiConfig.baseUrl);

    // Attach query params
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }

    // Auth
    if (this.apiConfig.authMethod === 'query_key' && this.apiConfig.authKeyEnv) {
      const key = process.env[this.apiConfig.authKeyEnv];
      if (key) url.searchParams.set('api_key', key);
    }

    const headers = { 'Accept': 'application/json', 'User-Agent': 'HybridEngineCo/1.0' };
    if (this.apiConfig.authMethod === 'header_key' && this.apiConfig.authKeyEnv) {
      const key = process.env[this.apiConfig.authKeyEnv];
      if (key) headers['X-Api-Key'] = key;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.apiConfig.timeoutMs);

    try {
      this.requestCount++;
      this.lastRequestTime = Date.now();

      const response = await fetch(url.toString(), { headers, signal: controller.signal });

      if (!response.ok) {
        throw new Error(`API ${response.status}: ${response.statusText} from ${url.pathname}`);
      }

      const data = await response.json();
      this.consecutiveFailures = 0;
      this.healthy = true;
      return data;
    } catch (err) {
      this.consecutiveFailures++;
      if (this.consecutiveFailures >= 3) this.healthy = false;
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }

  // ── Rate limiter ──
  async _rateLimit() {
    const minInterval = 60000 / this.apiConfig.rateLimit;
    const elapsed = Date.now() - this.lastRequestTime;
    if (elapsed < minInterval) {
      await sleep(minInterval - elapsed);
    }
  }

  // ── Validator ──
  validateResponse(data, requiredFields = []) {
    if (data === null || data === undefined) {
      return { valid: false, error: 'Response is null' };
    }
    if (typeof data !== 'object') {
      return { valid: false, error: `Expected object, got ${typeof data}` };
    }
    const missing = requiredFields.filter((f) => {
      const val = f.split('.').reduce((o, k) => o?.[k], data);
      return val === undefined || val === null;
    });
    if (missing.length > 0) {
      return { valid: false, error: `Missing fields: ${missing.join(', ')}` };
    }
    return { valid: true, error: null };
  }

  // ── Transformer ──
  transform(raw) {
    return {
      data: raw,
      source: this.name,
      fetchedAt: new Date().toISOString(),
      apiBase: this.apiConfig.baseUrl,
    };
  }

  // ── Fallback ──
  getFallbackData(context) {
    return {
      type: 'fallback',
      agent: this.name,
      message: `${this.name} data unavailable — using cached or default data`,
      fallback: true,
      timestamp: new Date().toISOString(),
    };
  }

  // ── Health check ──
  async checkHealth() {
    const start = Date.now();
    try {
      // Subclasses should override healthEndpoint()
      const endpoint = this.healthEndpoint();
      await this.apiFetch(endpoint);
      const latencyMs = Date.now() - start;
      this.lastHealthCheck = {
        status: 'healthy',
        latencyMs,
        checkedAt: new Date().toISOString(),
        consecutiveFailures: this.consecutiveFailures,
      };
      return this.lastHealthCheck;
    } catch (err) {
      this.lastHealthCheck = {
        status: 'unhealthy',
        error: err.message,
        checkedAt: new Date().toISOString(),
        consecutiveFailures: this.consecutiveFailures,
      };
      return this.lastHealthCheck;
    }
  }

  healthEndpoint() {
    return '/';
  }

  // ── Execute wrapper with fallback ──
  async executeWithFallback(context, fetchFn) {
    try {
      const raw = await fetchFn(context);
      const validation = this.validateResponse(raw);
      if (!validation.valid) {
        this.log.warn({ error: validation.error }, 'Validation failed — using fallback');
        return this.getFallbackData(context);
      }
      return this.transform(raw);
    } catch (err) {
      this.log.warn({ error: err.message }, 'API fetch failed — using fallback');
      return this.getFallbackData(context);
    }
  }

  describe() {
    return {
      ...super.describe(),
      apiConfig: {
        baseUrl: this.apiConfig.baseUrl,
        authMethod: this.apiConfig.authMethod,
        rateLimit: this.apiConfig.rateLimit,
        category: this.apiConfig.category,
      },
      health: this.lastHealthCheck,
      requestCount: this.requestCount,
      healthy: this.healthy,
    };
  }
}

export default FreeApiBase;
