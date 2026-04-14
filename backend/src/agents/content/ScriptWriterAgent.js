import BaseAgent from '../BaseAgent.js';
import limitManager from '../../limits/LimitManager.js';
import contentTemplateEngine from '../../utils/ContentTemplateEngine.js';
import openaiClient from '../../utils/OpenAIClient.js';

export class ScriptWriterAgent extends BaseAgent {
  constructor() { super('ScriptWriterAgent', { category: 'content', estimatedElevenLabsChars: 3000 }); }
  async execute(context) {
    this.requireContext(context, ['topic', 'niche']);
    this.log.info({ topic: context.topic }, 'Writing script');

    const limitCheck = limitManager.check('elevenlabs', 3000);
    let maxChars = 3000;
    if (limitCheck.status === 'throttle') maxChars = 1500;
    if (limitCheck.status === 'blocked') maxChars = 500;

    const title = `${context.angle || context.topic} | Hybrid Engine Co.`;

    // Progressive enhancement: use OpenAI if available
    const openaiCheck = limitManager.check('openai', 1500);
    if (openaiClient.isAvailable() && openaiCheck.status !== 'blocked') {
      const enrichment = context.freeApiData || {};
      const dataContext = enrichment.exercises ? `\nRelevant exercises: ${enrichment.exercises.slice(0, 3).map(e => e.name).join(', ')}` : '';
      const nutritionContext = enrichment.nutrition ? `\nNutrition data: ${JSON.stringify(enrichment.nutrition).slice(0, 200)}` : '';

      const prompt = `Write a ${maxChars}-character max video script for the topic "${context.topic}" in the ${context.niche} niche.
Target audience: ${context.targetAudience || 'data-driven fitness enthusiasts'}.
Content angle: ${context.angle || context.topic}.${dataContext}${nutritionContext}

Structure: Start with a strong hook (first 2 sentences must grab attention), then deliver actionable value with specific data points or frameworks, end with a clear CTA.
Keep it conversational but authoritative. No fluff.`;

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
