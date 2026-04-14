// backend/src/utils/OpenAIClient.js — OpenAI wrapper using native fetch
import config from '../config.js';
import { createLogger } from './logger.js';
import { sleep } from './helpers.js';
import { BRAND_TONE, CONTENT_BOUNDARIES } from '../niche/NicheConfig.js';

const log = createLogger('utils:openai');

class OpenAIClient {
  constructor() {
    this.totalTokensUsed = 0;
  }

  isAvailable() {
    return !!config.openai.apiKey;
  }

  _getModel() {
    return config.openai.model || 'gpt-4o-mini';
  }

  _getSystemPrompt() {
    return [
      'You are a content engine for Hybrid Engine Co., a brand focused on data-driven fitness, data science, and high-performance systems.',
      `Brand tone: ${BRAND_TONE.join(', ')}.`,
      `Forbidden content: ${CONTENT_BOUNDARIES.forbidden.join('; ')}.`,
      'Always be practical, data-driven, and actionable. No fluff. No hype. Back claims with reasoning.',
      'Output should be ready to publish — professional, clear, and aligned with the brand.',
    ].join(' ');
  }

  async generateText(prompt, options = {}) {
    if (!this.isAvailable()) return null;
    const maxTokens = options.maxTokens || 1500;
    const temperature = options.temperature ?? 0.7;

    const body = {
      model: this._getModel(),
      messages: [
        { role: 'system', content: this._getSystemPrompt() },
        { role: 'user', content: prompt },
      ],
      max_tokens: maxTokens,
      temperature,
    };

    const result = await this._callAPI(body);
    if (!result) return null;

    this.totalTokensUsed += result.usage?.total_tokens || 0;
    return result.choices?.[0]?.message?.content || null;
  }

  async generateJSON(prompt, options = {}) {
    if (!this.isAvailable()) return null;
    const maxTokens = options.maxTokens || 2000;

    const body = {
      model: this._getModel(),
      messages: [
        { role: 'system', content: this._getSystemPrompt() + ' Respond with valid JSON only.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: maxTokens,
      temperature: options.temperature ?? 0.7,
      response_format: { type: 'json_object' },
    };

    const result = await this._callAPI(body);
    if (!result) return null;

    this.totalTokensUsed += result.usage?.total_tokens || 0;
    const text = result.choices?.[0]?.message?.content || '';
    try {
      return JSON.parse(text);
    } catch {
      log.warn('Failed to parse JSON response from OpenAI');
      return null;
    }
  }

  async _callAPI(body, retries = 3) {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.openai.apiKey}`,
          },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(30000),
        });

        if (response.status === 429) {
          const delay = Math.pow(2, attempt) * 1000;
          log.warn({ attempt, delay }, 'Rate limited — retrying');
          await sleep(delay);
          continue;
        }

        if (!response.ok) {
          const errText = await response.text().catch(() => '');
          log.error({ status: response.status, body: errText.slice(0, 200) }, 'OpenAI API error');
          return null;
        }

        return await response.json();
      } catch (err) {
        if (attempt < retries - 1) {
          const delay = Math.pow(2, attempt) * 1000;
          log.warn({ attempt, error: err.message, delay }, 'OpenAI call failed — retrying');
          await sleep(delay);
        } else {
          log.error({ error: err.message }, 'OpenAI call failed — all retries exhausted');
          return null;
        }
      }
    }
    return null;
  }

  getUsage() {
    return { totalTokensUsed: this.totalTokensUsed };
  }
}

const openaiClient = new OpenAIClient();
export default openaiClient;
