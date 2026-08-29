import type { Finding } from '../domain/types';

const ENGLISH_SIGNALS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'can', 'for', 'from', 'how', 'in', 'is', 'it', 'of', 'on', 'or', 'that', 'the', 'this', 'to', 'with', 'you',
  'analysis', 'approach', 'build', 'data', 'design', 'effect', 'evidence', 'examples', 'feedback', 'guide', 'guidance', 'health', 'improve', 'intervention', 'model', 'new', 'paper', 'practice', 'problem', 'report', 'research', 'results', 'study', 'support', 'system', 'task', 'training', 'using', 'validation', 'worked',
]);

const NON_ENGLISH_WORDS = new Set([
  'al', 'como', 'con', 'de', 'del', 'der', 'des', 'die', 'el', 'en', 'es', 'et', 'für', 'la', 'las', 'le', 'les', 'los', 'mit', 'para', 'por', 'que', 'sur', 'un', 'una', 'und', 'von',
]);

function wordsIn(value: string) {
  return value.toLowerCase().match(/[a-z]+(?:'[a-z]+)?/g) ?? [];
}

export function isLatinScriptText(value: string) {
  const letters = value.match(/\p{L}/gu) ?? [];
  return letters.length > 0 && letters.every((letter) => /\p{Script=Latin}/u.test(letter));
}

/** Reject non-English research before it can enter a LaunchPad report. */
export function isEnglishText(value: string) {
  const normalized = value.normalize('NFKC').replace(/\s+/g, ' ').trim();
  if (!normalized || !isLatinScriptText(normalized)) return false;

  const words = wordsIn(normalized);
  if (!words.length || words.some((word) => NON_ENGLISH_WORDS.has(word))) return false;
  return words.some((word) => ENGLISH_SIGNALS.has(word));
}

export function isEnglishFinding(finding: Finding) {
  return isEnglishText(finding.normalizedClaim)
    && isEnglishText(finding.citation.sourceTitle)
    && isEnglishText(finding.citation.exactExcerpt)
    && isLatinScriptText(finding.citation.authorOrPublisher);
}
