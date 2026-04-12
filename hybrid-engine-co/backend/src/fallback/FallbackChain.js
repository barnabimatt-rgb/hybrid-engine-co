// backend/src/fallback/FallbackChain.js — Generic fallback chain executor
import { createLogger } from '../utils/logger.js';
import eventBus, { Events } from '../utils/eventBus.js';

const log = createLogger('fallback:chain');

export class FallbackChain {
  constructor(name, strategies) {
    this.name = name;
    this.strategies = strategies;
  }

  async execute(context) {
    for (let i = 0; i < this.strategies.length; i++) {
      const strategy = this.strategies[i];
      try {
        log.info({ chain: this.name, strategy: strategy.name, level: i }, 'Attempting strategy');
        const result = await strategy.execute(context);
        if (i > 0) {
          eventBus.emit(Events.AGENT_FALLBACK, { chain: this.name, strategy: strategy.name, level: i });
        }
        return { result, fallbackLevel: i, strategyUsed: strategy.name };
      } catch (err) {
        log.warn({ chain: this.name, strategy: strategy.name, error: err.message }, 'Strategy failed');
      }
    }
    log.error({ chain: this.name }, 'ALL strategies failed — emergency fallback');
    return {
      result: { type: 'text_only', content: `[${this.name}] All strategies exhausted`, fallback: true },
      fallbackLevel: this.strategies.length,
      strategyUsed: 'emergency',
    };
  }
}

export default FallbackChain;
