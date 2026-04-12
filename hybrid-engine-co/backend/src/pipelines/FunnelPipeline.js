// backend/src/pipelines/FunnelPipeline.js
import funnelFallback from '../fallback/FunnelFallback.js';

export const FunnelPipeline = {
  name: 'funnel',
  priority: 3,
  steps: [
    { agentName: 'BrandBrainAgent' },
    { agentName: 'ContentStrategyAgent' },
    { agentName: 'LeadMagnetAgent' },
    { agentName: 'FunnelBuilderAgent', fallbackChain: funnelFallback },
    { agentName: 'IntellectualIntegrityAgent' },
    { agentName: 'QualityAssuranceAgent' },
    { agentName: 'CopywriterAgent' },
    { agentName: 'CheckoutFlowAgent' },
    { agentName: 'ProductUpsellAgent' },
    { agentName: 'ProductEmailSequenceAgent' },
    { agentName: 'RetargetingAgent' },
    { agentName: 'ABTestingAgent' },
    { agentName: 'LegalAgent' },
    { agentName: 'DashboardAgent' },
  ],
};
