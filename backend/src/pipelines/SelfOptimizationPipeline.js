// backend/src/pipelines/SelfOptimizationPipeline.js
export const SelfOptimizationPipeline = {
  name: 'self_optimization',
  priority: 10,
  steps: [
    { agentName: 'SelfOptimizationAgent' },
    { agentName: 'ErrorMonitorAgent' },
    { agentName: 'UsageTrackingAgent' },
    { agentName: 'CompetitorAnalysisAgent' },
    { agentName: 'AudiencePersonaAgent' },
    { agentName: 'MonetizationStrategyAgent' },
    { agentName: 'SecurityAuditAgent' },
    { agentName: 'DependencyUpdateAgent' },
    { agentName: 'DashboardAgent' },
  ],
};
