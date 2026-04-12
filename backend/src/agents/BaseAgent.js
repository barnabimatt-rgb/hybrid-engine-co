// backend/src/agents/BaseAgent.js
import { createLogger } from '../utils/logger.js';
import { generateId, now } from '../utils/helpers.js';

export class BaseAgent {
  constructor(name, options = {}) {
    this.name = name;
    this.id = generateId();
    this.log = createLogger(`agent:${name}`);
    this.category = options.category || 'general';
    this.requiresNetwork = options.requiresNetwork ?? false;
    this.estimatedRuntimeMinutes = options.estimatedRuntimeMinutes ?? 1;
    this.estimatedElevenLabsChars = options.estimatedElevenLabsChars ?? 0;
  }

  async execute(context, meta = {}) {
    throw new Error(`${this.name}.execute() not implemented`);
  }

  requireContext(context, requiredFields) {
    const missing = requiredFields.filter((f) => context[f] === undefined || context[f] === null);
    if (missing.length > 0) throw new Error(`${this.name} missing context: ${missing.join(', ')}`);
  }

  mergeResult(context, result) {
    return { ...context, ...result, [`_${this.name}_completedAt`]: now() };
  }

  describe() {
    return { name: this.name, category: this.category, requiresNetwork: this.requiresNetwork, estimatedRuntimeMinutes: this.estimatedRuntimeMinutes, estimatedElevenLabsChars: this.estimatedElevenLabsChars };
  }
}

export default BaseAgent;
