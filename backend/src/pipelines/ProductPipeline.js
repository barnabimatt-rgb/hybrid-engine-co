// backend/src/pipelines/ProductPipeline.js
import productFallback from '../fallback/ProductFallback.js';
import uploadFallback from '../fallback/UploadFallback.js';

export const ProductPipeline = {
  name: 'product',
  priority: 2,
  steps: [
    { agentName: 'BrandBrainAgent' },
    { agentName: 'TrendIntelligenceAgent' },
    { agentName: 'FreeApiIntegrationAgent' },
    { agentName: 'MarketResearchAgent' },
    { agentName: 'ContentStrategyAgent' },
    { agentName: 'ProductGeneratorAgent', fallbackChain: productFallback },
    { agentName: 'IntellectualIntegrityAgent' },
    { agentName: 'QualityAssuranceAgent' },
    { agentName: 'CopywriterAgent' },
    { agentName: 'ProductPackagingAgent' },
    { agentName: 'ProductLandingPageAgent' },
    { agentName: 'ProductEmailSequenceAgent' },
    { agentName: 'ProductUpsellAgent' },
    { agentName: 'LegalAgent' },
    { agentName: 'LicensingAgent' },
    { agentName: 'MarketplaceListingAgent' },
    { agentName: 'AffiliateAssetAgent' },
    { agentName: 'UploadAgent', fallbackChain: uploadFallback },
    { agentName: 'DashboardAgent' },
  ],
};
