// backend/src/pipelines/AffiliatePipeline.js
export const AffiliatePipeline = {
  name: 'affiliate',
  priority: 4,
  steps: [
    { agentName: 'BrandBrainAgent' },
    { agentName: 'AffiliateManagerAgent' },
    { agentName: 'AffiliateAssetAgent' },
    { agentName: 'IntellectualIntegrityAgent' },
    { agentName: 'QualityAssuranceAgent' },
    { agentName: 'CopywriterAgent' },
    { agentName: 'AffiliateTrackingAgent' },
    { agentName: 'AffiliatePayoutAgent' },
    { agentName: 'AffiliateRecruitmentAgent' },
    { agentName: 'AffiliateAnalyticsAgent' },
    { agentName: 'DashboardAgent' },
  ],
};
