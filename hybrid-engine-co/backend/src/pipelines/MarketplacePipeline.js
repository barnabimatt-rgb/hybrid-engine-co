// backend/src/pipelines/MarketplacePipeline.js
import uploadFallback from '../fallback/UploadFallback.js';

export const MarketplacePipeline = {
  name: 'marketplace',
  priority: 5,
  steps: [
    { agentName: 'BrandBrainAgent' },
    { agentName: 'TrendIntelligenceAgent' },
    { agentName: 'ContentStrategyAgent' },
    { agentName: 'ProductGeneratorAgent' },
    { agentName: 'MarketplaceListingAgent' },
    { agentName: 'MarketplaceAssetAgent' },
    { agentName: 'IntellectualIntegrityAgent' },
    { agentName: 'QualityAssuranceAgent' },
    { agentName: 'CopywriterAgent' },
    { agentName: 'LegalAgent' },
    { agentName: 'MarketplaceOptimizationAgent' },
    { agentName: 'UploadAgent', fallbackChain: uploadFallback },
    { agentName: 'DashboardAgent' },
  ],
};
