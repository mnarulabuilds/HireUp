const STOP_WORDS = new Set([
  'and',
  'the',
  'for',
  'with',
  'you',
  'your',
  'our',
  'will',
  'are',
  'this',
  'that',
  'from',
  'have',
  'has',
  'been',
  'into',
  'about',
  'their',
  'they',
  'what',
  'who',
  'how',
  'all',
  'any',
  'can',
  'may',
  'must',
  'should',
  'would',
  'could',
  'role',
  'team',
  'work',
  'years',
  'year',
  'experience',
  'required',
  'preferred',
  'including',
  'ability',
  'strong',
  'using',
  'use',
  'via',
]);

export function tokenizeJobText(text: string): string[] {
  const raw = text.toLowerCase().split(/[^a-z0-9+#.]/i);
  const tokens: string[] = [];
  for (const part of raw) {
    const t = part.trim();
    if (t.length <= 2 || STOP_WORDS.has(t)) continue;
    tokens.push(t);
  }
  return Array.from(new Set(tokens));
}

/** Keywords from the JD that do not appear in resume text (longer tokens first). */
export function missingJobKeywords(
  jobDescription: string,
  resumeText: string,
  limit: number,
  extraContext = '',
): string[] {
  const haystack = `${resumeText} ${extraContext}`.toLowerCase();
  return tokenizeJobText(`${jobDescription} ${extraContext}`)
    .filter((token) => token.length > 3 && !haystack.includes(token))
    .sort((a, b) => b.length - a.length)
    .slice(0, limit);
}

export function keywordOverlapRatio(keywords: string[], corpus: string): number {
  if (keywords.length === 0) return 0;
  const lower = corpus.toLowerCase();
  const hits = keywords.filter((k) => lower.includes(k)).length;
  return hits / keywords.length;
}
