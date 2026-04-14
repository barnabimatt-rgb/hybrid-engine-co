import BaseAgent from '../BaseAgent.js';
import limitManager from '../../limits/LimitManager.js';
import contentTemplateEngine from '../../utils/ContentTemplateEngine.js';
import openaiClient from '../../utils/OpenAIClient.js';

export class ScriptWriterAgent extends BaseAgent {
  constructor() { super('ScriptWriterAgent', { category: 'content', estimatedElevenLabsChars: 750 }); }
  async execute(context) {
    this.requireContext(context, ['topic', 'niche']);
    this.log.info({ topic: context.topic }, 'Writing script');

    // YouTube Shorts: max 60 seconds ≈ 750 chars at ~12.5 chars/sec speaking rate
    const limitCheck = limitManager.check('elevenlabs', 750);
    let maxChars = 750;
    if (limitCheck.status === 'throttle') maxChars = 500;
    if (limitCheck.status === 'blocked') maxChars = 300;

    const title = `${context.angle || context.topic} | Hybrid Engine Co.`;

    // Progressive enhancement: use OpenAI if available
    const openaiCheck = limitManager.check('openai', 500);
    if (openaiClient.isAvailable() && openaiCheck.status !== 'blocked') {
      const enrichment = context.freeApiData || {};
      const dataContext = enrichment.exercises ? `\nRelevant exercises: ${enrichment.exercises.slice(0, 3).map(e => e.name).join(', ')}` : '';
      const nutritionContext = enrichment.nutrition ? `\nNutrition data: ${JSON.stringify(enrichment.nutrition).slice(0, 200)}` : '';

      const prompt = `Write a YouTube Shorts script (under ${maxChars} characters, must be under 55 seconds when spoken) for the topic "${context.topic}" in the ${context.niche} niche.
Target audience: ${context.targetAudience || 'data-driven fitness enthusiasts'}.
Content angle: ${context.angle || context.topic}.${dataContext}${nutritionContext}

FORMAT: YouTube Short (vertical video, fast-paced, punchy).
Structure: Immediate attention-grabbing hook in the first sentence (no warmup), then 2-3 rapid-fire value points with specific data or actionable tips, end with a strong 1-sentence CTA.
Keep it high energy, conversational, and direct. Every sentence must earn its place. No filler.`;

      const aiScript = await openaiClient.generateText(prompt, { maxTokens: Math.ceil(maxChars / 3), temperature: 0.75 });
      if (aiScript) {
        await limitManager.recordUsage('openai', Math.ceil(aiScript.length / 4));
        let script = aiScript.length > maxChars ? aiScript.slice(0, maxChars) : aiScript;
        return {
          title,
          script,
          scriptCharCount: script.length,
          hook: script.split('.')[0] + '.',
          structureType: 'ai_generated',
          estimatedDuration: Math.ceil(script.length / 15),
          source: 'openai',
        };
      }
      this.log.warn('OpenAI script generation failed, falling back to template');
    }

    // Fallback: template engine
    const generated = contentTemplateEngine.generateScript(context);
    let script = generated.script;
    if (script.length > maxChars) script = script.slice(0, maxChars);

    return {
      title,
      script,
      scriptCharCount: script.length,
      hook: generated.hook,
      structureType: generated.structureType,
      estimatedDuration: Math.ceil(script.length / 15),
      source: 'template',
    };
  }
}
export default ScriptWriterAgent;
