// backend/src/agents/AgentRegistry.js — Loads and indexes all 55 agents
import { BrandBrainAgent } from './core/BrandBrainAgent.js';
import { TrendIntelligenceAgent } from './core/TrendIntelligenceAgent.js';
import { MarketResearchAgent } from './core/MarketResearchAgent.js';
import { KnowledgeMemoryAgent } from './core/KnowledgeMemoryAgent.js';
import { SelfOptimizationAgent } from './core/SelfOptimizationAgent.js';
import { ContentStrategyAgent } from './content/ContentStrategyAgent.js';
import { ScriptWriterAgent } from './content/ScriptWriterAgent.js';
import { ThumbnailDesignerAgent } from './content/ThumbnailDesignerAgent.js';
import { BrollGeneratorAgent } from './content/BrollGeneratorAgent.js';
import { VoiceoverAgent } from './content/VoiceoverAgent.js';
import { VideoAssemblyAgent } from './content/VideoAssemblyAgent.js';
import { MultiFormatExportAgent } from './content/MultiFormatExportAgent.js';
import { UploadAgent } from './distribution/UploadAgent.js';
import { SchedulerAgent } from './distribution/SchedulerAgent.js';
import { MetadataAgent } from './distribution/MetadataAgent.js';
import { PlatformOptimizationAgent } from './distribution/PlatformOptimizationAgent.js';
import { ProductGeneratorAgent } from './product/ProductGeneratorAgent.js';
import { ProductPackagingAgent } from './product/ProductPackagingAgent.js';
import { ProductLandingPageAgent } from './product/ProductLandingPageAgent.js';
import { ProductEmailSequenceAgent } from './product/ProductEmailSequenceAgent.js';
import { ProductUpsellAgent } from './product/ProductUpsellAgent.js';
import { FunnelBuilderAgent } from './funnel/FunnelBuilderAgent.js';
import { LeadMagnetAgent } from './funnel/LeadMagnetAgent.js';
import { CheckoutFlowAgent } from './funnel/CheckoutFlowAgent.js';
import { RetargetingAgent } from './funnel/RetargetingAgent.js';
import { ABTestingAgent } from './funnel/ABTestingAgent.js';
import { AffiliateManagerAgent } from './affiliate/AffiliateManagerAgent.js';
import { AffiliateTrackingAgent } from './affiliate/AffiliateTrackingAgent.js';
import { AffiliatePayoutAgent } from './affiliate/AffiliatePayoutAgent.js';
import { AffiliateAssetAgent } from './affiliate/AffiliateAssetAgent.js';
import { AffiliateRecruitmentAgent } from './affiliate/AffiliateRecruitmentAgent.js';
import { AffiliateAnalyticsAgent } from './affiliate/AffiliateAnalyticsAgent.js';
import { MarketplaceListingAgent } from './marketplace/MarketplaceListingAgent.js';
import { MarketplaceAssetAgent } from './marketplace/MarketplaceAssetAgent.js';
import { MarketplaceOptimizationAgent } from './marketplace/MarketplaceOptimizationAgent.js';
import { LicensingAgent } from './licensing/LicensingAgent.js';
import { SubscriptionAgent } from './licensing/SubscriptionAgent.js';
import { CreatorAPIAgent } from './licensing/CreatorAPIAgent.js';
import { UsageTrackingAgent } from './licensing/UsageTrackingAgent.js';
import { QueueWorkerAgent } from './infra/QueueWorkerAgent.js';
import { ErrorMonitorAgent } from './infra/ErrorMonitorAgent.js';
import { RetryLogicAgent } from './infra/RetryLogicAgent.js';
import { DependencyUpdateAgent } from './infra/DependencyUpdateAgent.js';
import { SecurityAuditAgent } from './infra/SecurityAuditAgent.js';
import { DeploymentAgent } from './infra/DeploymentAgent.js';
import { HookGeneratorAgent } from './ai/HookGeneratorAgent.js';
import { ViralPredictionAgent } from './ai/ViralPredictionAgent.js';
import { AudiencePersonaAgent } from './ai/AudiencePersonaAgent.js';
import { CompetitorAnalysisAgent } from './ai/CompetitorAnalysisAgent.js';
import { MonetizationStrategyAgent } from './ai/MonetizationStrategyAgent.js';
import { QualityAssuranceAgent } from './quality/QualityAssuranceAgent.js';
import { IntellectualIntegrityAgent } from './quality/IntellectualIntegrityAgent.js';
import { CopywriterAgent } from './quality/CopywriterAgent.js';
import { LegalAgent } from './legal/LegalAgent.js';
import { DashboardAgent } from './dashboard/DashboardAgent.js';

class AgentRegistry {
  constructor() {
    this.agents = new Map();
    this._registerAll();
  }

  _registerAll() {
    const all = [
      new BrandBrainAgent(),
      new TrendIntelligenceAgent(),
      new MarketResearchAgent(),
      new KnowledgeMemoryAgent(),
      new SelfOptimizationAgent(),
      new ContentStrategyAgent(),
      new ScriptWriterAgent(),
      new ThumbnailDesignerAgent(),
      new BrollGeneratorAgent(),
      new VoiceoverAgent(),
      new VideoAssemblyAgent(),
      new MultiFormatExportAgent(),
      new UploadAgent(),
      new SchedulerAgent(),
      new MetadataAgent(),
      new PlatformOptimizationAgent(),
      new ProductGeneratorAgent(),
      new ProductPackagingAgent(),
      new ProductLandingPageAgent(),
      new ProductEmailSequenceAgent(),
      new ProductUpsellAgent(),
      new FunnelBuilderAgent(),
      new LeadMagnetAgent(),
      new CheckoutFlowAgent(),
      new RetargetingAgent(),
      new ABTestingAgent(),
      new AffiliateManagerAgent(),
      new AffiliateTrackingAgent(),
      new AffiliatePayoutAgent(),
      new AffiliateAssetAgent(),
      new AffiliateRecruitmentAgent(),
      new AffiliateAnalyticsAgent(),
      new MarketplaceListingAgent(),
      new MarketplaceAssetAgent(),
      new MarketplaceOptimizationAgent(),
      new LicensingAgent(),
      new SubscriptionAgent(),
      new CreatorAPIAgent(),
      new UsageTrackingAgent(),
      new QueueWorkerAgent(),
      new ErrorMonitorAgent(),
      new RetryLogicAgent(),
      new DependencyUpdateAgent(),
      new SecurityAuditAgent(),
      new DeploymentAgent(),
      new HookGeneratorAgent(),
      new ViralPredictionAgent(),
      new AudiencePersonaAgent(),
      new CompetitorAnalysisAgent(),
      new MonetizationStrategyAgent(),
      new QualityAssuranceAgent(),
      new IntellectualIntegrityAgent(),
      new CopywriterAgent(),
      new LegalAgent(),
      new DashboardAgent(),
    ];

    for (const agent of all) {
      this.agents.set(agent.name, agent);
    }
  }

  get(name) {
    const agent = this.agents.get(name);
    if (!agent) throw new Error(`Agent not found: ${name}`);
    return agent;
  }

  getAll() {
    return Array.from(this.agents.values());
  }

  getByCategory(category) {
    return this.getAll().filter((a) => a.category === category);
  }

  describe() {
    return this.getAll().map((a) => a.describe());
  }

  get count() {
    return this.agents.size;
  }
}

const agentRegistry = new AgentRegistry();
export default agentRegistry;
