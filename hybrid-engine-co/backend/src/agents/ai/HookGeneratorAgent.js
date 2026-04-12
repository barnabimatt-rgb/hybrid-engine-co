import BaseAgent from '../BaseAgent.js';

export class HookGeneratorAgent extends BaseAgent {
  constructor() { super('HookGeneratorAgent', { category: 'ai' }); }
  async execute(context) {
    this.log.info('Generating hooks');
    const topic = context.topic || 'performance';
    return {
      hooks: [
        `Most people get ${topic} completely wrong. Here's why.`,
        `I tested ${topic} for 90 days. The data surprised me.`,
        `The #1 ${topic} mistake destroying your progress.`,
        `What ${topic} looks like when you use data instead of guesswork.`,
        `${topic}: the tactical approach nobody talks about.`,
      ],
    };
  }
}
export default HookGeneratorAgent;
