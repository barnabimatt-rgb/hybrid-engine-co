import BaseAgent from '../BaseAgent.js';
import limitManager from '../../limits/LimitManager.js';

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
    const hook = `What if I told you ${context.topic} could transform your performance? Let's break it down.`;
    const body = `Today we're diving deep into ${context.topic}. Whether you're a hybrid athlete, a data scientist, or both — this is for you. Here's the framework that changes everything.`;
    const cta = `If this hit, drop a like and subscribe. Link in the description for the full guide.`;
    let script = `${hook}\n\n${body}\n\n${cta}`;
    if (script.length > maxChars) script = script.slice(0, maxChars);
    return { title, script, scriptCharCount: script.length, hook, estimatedDuration: Math.ceil(script.length / 15) };
  }
}
export default ScriptWriterAgent;
