// Core resume <-> job description matching logic.
// Kept as a pure, dependency-free function so it's easy to unit test
// and doesn't require an OpenAI key to produce a useful result.

const STOPWORDS = new Set([
  "a","about","above","after","again","against","all","am","an","and","any",
  "are","aren't","as","at","be","because","been","before","being","below",
  "between","both","but","by","can","cannot","could","did","do","does",
  "doing","down","during","each","few","for","from","further","had","has",
  "have","having","he","her","here","hers","herself","him","himself","his",
  "how","i","if","in","into","is","it","its","itself","let's","me","more",
  "most","my","myself","nor","of","on","once","only","or","other","ought",
  "our","ours","ourselves","out","over","own","same","she","should","so",
  "some","such","than","that","the","their","theirs","them","themselves",
  "then","there","these","they","this","those","through","to","too","under",
  "until","up","very","was","we","were","what","when","where","which",
  "while","who","whom","why","with","would","you","your","yours","yourself",
  "yourselves","will","also","across","using","use","used","within","per",
  "etc","including","include","includes","strong","excellent","good",
  "years","year","experience","working","work","role","team","ability",
])

export interface AnalysisResult {
  matchScore: number
  matchedSkills: string[]
  missingSkills: string[]
  resumeKeywordCount: number
  jobKeywordCount: number
}

/** Extracts normalized, deduplicated keyword tokens from free text. */
export function extractKeywords(text: string): string[] {
  if (!text) return []

  const tokens = text
    .toLowerCase()
    // Keep letters, digits, and characters common in tech terms (Node.js, C++, C#)
    .match(/[a-z0-9]+(?:[+#.\-][a-z0-9]+)*[+#]*/g) ?? []

  const seen = new Set<string>()
  for (const token of tokens) {
    const cleaned = token.replace(/^[.\-]+|[.\-]+$/g, "")
    if (cleaned.length < 2) continue
    if (STOPWORDS.has(cleaned)) continue
    if (/^\d+$/.test(cleaned)) continue
    seen.add(cleaned)
  }
  return Array.from(seen)
}

/** Ranks job-description keywords by frequency so we can surface the most relevant missing ones. */
function rankByFrequency(text: string, keywords: string[]): string[] {
  const lower = text.toLowerCase()
  return [...keywords].sort((a, b) => {
    const countA = lower.split(a).length - 1
    const countB = lower.split(b).length - 1
    return countB - countA
  })
}

export function analyzeMatch(resumeText: string, jobText: string): AnalysisResult {
  const resumeKeywords = new Set(extractKeywords(resumeText))
  const jobKeywords = extractKeywords(jobText)

  const matched = jobKeywords.filter((kw) => resumeKeywords.has(kw))
  const missing = jobKeywords.filter((kw) => !resumeKeywords.has(kw))

  const rankedMissing = rankByFrequency(jobText, missing).slice(0, 15)
  const rankedMatched = rankByFrequency(jobText, matched)

  const matchScore = jobKeywords.length
    ? Math.round((matched.length / jobKeywords.length) * 100)
    : 0

  return {
    matchScore,
    matchedSkills: rankedMatched,
    missingSkills: rankedMissing,
    resumeKeywordCount: resumeKeywords.size,
    jobKeywordCount: jobKeywords.length,
  }
}
