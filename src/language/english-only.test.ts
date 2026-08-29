import { describe, expect, it } from 'vitest';
import { isEnglishText } from './english-only';

describe('English-only research gate', () => {
  it('keeps English research text', () => {
    expect(isEnglishText('Worked examples and immediate feedback improve task completion.')).toBe(true);
  });

  it('rejects non-English scripts and common Latin-script foreign text', () => {
    expect(isEnglishText('Η σύγχρονη εποχή χαρακτηρίζεται από την ανάπτυξη της αυτοματοποίησης.')).toBe(false);
    expect(isEnglishText('La investigación de sistemas autónomos mejora la eficiencia.')).toBe(false);
  });
});
