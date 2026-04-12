// backend/src/orchestrator/PipelineRegistry.js — Registers all pipeline definitions
import { ContentPipeline } from '../pipelines/ContentPipeline.js';
import { ProductPipeline } from '../pipelines/ProductPipeline.js';
import { FunnelPipeline } from '../pipelines/FunnelPipeline.js';
import { AffiliatePipeline } from '../pipelines/AffiliatePipeline.js';
import { MarketplacePipeline } from '../pipelines/MarketplacePipeline.js';
import { SelfOptimizationPipeline } from '../pipelines/SelfOptimizationPipeline.js';
import { createLogger } from '../utils/logger.js';

const log = createLogger('orchestrator:registry');

class PipelineRegistry {
  constructor() {
    this.pipelines = new Map();
    this._registerAll();
  }

  _registerAll() {
    const all = [
      ContentPipeline,
      ProductPipeline,
      FunnelPipeline,
      AffiliatePipeline,
      MarketplacePipeline,
      SelfOptimizationPipeline,
    ];

    for (const pipeline of all) {
      this.pipelines.set(pipeline.name, pipeline);
      log.info({ pipeline: pipeline.name, steps: pipeline.steps.length }, 'Pipeline registered');
    }
  }

  get(name) {
    const pipeline = this.pipelines.get(name);
    if (!pipeline) throw new Error(`Pipeline not found: ${name}`);
    return pipeline;
  }

  getAll() {
    return Array.from(this.pipelines.values());
  }

  getAllNames() {
    return Array.from(this.pipelines.keys());
  }

  describe() {
    return this.getAll().map((p) => ({
      name: p.name,
      priority: p.priority,
      steps: p.steps.map((s) => s.agentName),
    }));
  }
}

const pipelineRegistry = new PipelineRegistry();
export default pipelineRegistry;
