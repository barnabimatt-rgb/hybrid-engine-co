import BaseAgent from '../BaseAgent.js';
import contentTemplateEngine from '../../utils/ContentTemplateEngine.js';
import openaiClient from '../../utils/OpenAIClient.js';
import limitManager from '../../limits/LimitManager.js';

export class ProductEmailSequenceAgent extends BaseAgent {
  constructor() { super('ProductEmailSequenceAgent', { category: 'product' }); }
  async execute(context) {
    this.log.info('Generating email sequence');
    const productName = context.product?.name || context.topic || 'our product';
    const niche = context.niche || 'hybrid_fitness';

    const openaiCheck = limitManager.check('openai', 1500);
    if (openaiClient.isAvailable() && openaiCheck.status !== 'blocked') {
      const prompt = `Create a 5-email post-purchase sequence for "${productName}" in the ${niche} niche.
Target audience: ${context.targetAudience || 'data-driven fitness enthusiasts'}.

Return JSON:
{
  "emails": [
    { "day": 0, "subject": "subject line", "body": "150-300 word email body", "cta": "call to action text" }
  ]
}

Email sequence:
1. Day 0: Welcome + quick win from the product
2. Day 1: How to get the most value
3. Day 3: Success story/case study
4. Day 5: Advanced tip + upsell tease
5. Day 7: Community invite + review request

Tone: conversational, data-driven, no hype. Use {{firstName}} as personalization.`;

      const result = await openaiClient.generateJSON(prompt, { maxTokens: 1500, temperature: 0.7 });
      if (result?.emails && Array.isArray(result.emails)) {
        await limitManager.recordUsage('openai', 1500);
        return {
          emailSequence: {
            type: 'post_purchase',
            emails: result.emails,
            totalEmails: result.emails.length,
            spanDays: result.emails[result.emails.length - 1]?.day || 7,
            source: 'openai',
          },
        };
      }
      this.log.warn('OpenAI email sequence failed, falling back to template');
    }

    const emails = contentTemplateEngine.generateEmailSequence(context);
    return {
      emailSequence: {
        type: 'post_purchase',
        emails,
        totalEmails: emails.length,
        spanDays: emails[emails.length - 1]?.day || 7,
        source: 'template',
      },
    };
  }
}
export default ProductEmailSequenceAgent;
