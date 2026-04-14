// backend/src/pipelines/ContentPipeline.js
import videoFallback from '../fallback/VideoFallback.js';
import audioFallback from '../fallback/AudioFallback.js';
import thumbnailFallback from '../fallback/ThumbnailFallback.js';
import uploadFallback from '../fallback/UploadFallback.js';

export const ContentPipeline = {
  name: 'content',
  priority: 1,
  steps: [
    { agentName: 'BrandBrainAgent' },
    { agentName: 'TrendIntelligenceAgent' },
    { agentName: 'FreeApiIntegrationAgent' },
    { agentName: 'KnowledgeMemoryAgent' },
    { agentName: 'ContentStrategyAgent' },
    { agentName: 'HookGeneratorAgent' },
    { agentName: 'ScriptWriterAgent' },
    { agentName: 'IntellectualIntegrityAgent' },
    { agentName: 'QualityAssuranceAgent' },
    { agentName: 'CopywriterAgent' },
    { agentName: 'LegalAgent' },
    { agentName: 'VoiceoverAgent', fallbackChain: audioFallback },
    { agentName: 'BrollGeneratorAgent' },
    { agentName: 'VideoAssemblyAgent', fallbackChain: videoFallback },
    { agentName: 'ThumbnailDesignerAgent', fallbackChain: thumbnailFallback },
    { agentName: 'MultiFormatExportAgent' },
    { agentName: 'MetadataAgent' },
    { agentName: 'SchedulerAgent' },
    { agentName: 'UploadAgent', fallbackChain: uploadFallback },
    { agentName: 'PlatformOptimizationAgent' },
    { agentName: 'DashboardAgent' },
  ],
};
