import BaseAgent from '../BaseAgent.js';
import { BRAND_TONE } from '../../niche/NicheConfig.js';

export class CopywriterAgent extends BaseAgent {
  constructor() { super('CopywriterAgent', { category: 'quality' }); }
  async execute(context) {
    this.log.info('Polishing copy');
    const script = context.script || '';

    // Simple readability analysis
    const sentences = script.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const words = script.split(/\s+/).filter((w) => w.length > 0);
    const avgWordsPerSentence = sentences.length > 0 ? Math.round(words.length / sentences.length) : 0;
    const longSentences = sentences.filter((s) => s.split(/\s+/).length > 25);

    // Syllable estimation (simple: count vowel groups)
    const syllableCount = words.reduce((sum, w) => {
      const matches = w.toLowerCase().match(/[aeiouy]+/g);
      return sum + (matches ? Math.max(1, matches.length) : 1);
    }, 0);
    const avgSyllablesPerWord = words.length > 0 ? syllableCount / words.length : 0;

    // Flesch-Kincaid readability (higher = easier to read, target 60-80)
    const readabilityScore = words.length > 0
      ? Math.round(206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord)
      : 0;

    // Generate suggested edits
    const suggestedEdits = [];
    if (avgWordsPerSentence > 20) suggestedEdits.push('Some sentences are long — consider breaking them up for clarity.');
    if (longSentences.length > 3) suggestedEdits.push(`${longSentences.length} sentences exceed 25 words. Shorten for better engagement.`);
    if (readabilityScore < 50) suggestedEdits.push('Readability is low. Use simpler words and shorter sentences.');
    if (!script.includes('?')) suggestedEdits.push('Consider adding a question to increase engagement.');

    // Tone alignment check
    const lower = script.toLowerCase();
    const toneCheck = BRAND_TONE.slice(0, 5).map((t) => ({
      tone: t,
      aligned: lower.includes(t) || lower.includes('data') || lower.includes('system') || lower.includes('track'),
    }));

    const ctaStrength = (lower.includes('subscribe') || lower.includes('link')) && (lower.includes('like') || lower.includes('comment'))
      ? 'strong'
      : lower.includes('subscribe') || lower.includes('link')
        ? 'moderate'
        : 'needs_improvement';

    return {
      copywriterReview: {
        toneAlignment: toneCheck,
        readabilityScore: Math.max(0, Math.min(100, readabilityScore)),
        avgWordsPerSentence,
        sentenceCount: sentences.length,
        wordCount: words.length,
        suggestedEdits,
        ctaStrength,
        disclaimersAppended: context.integrityCheck?.disclaimersNeeded || [],
        polished: true,
      },
    };
  }
}
export default CopywriterAgent;
