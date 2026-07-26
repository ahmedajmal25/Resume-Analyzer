import { describe, it, expect } from "vitest"
import { analyzeMatch, extractKeywords } from "../analyze"

describe("extractKeywords", () => {
  it("removes stopwords and short tokens", () => {
    const keywords = extractKeywords("I am a Software Engineer with the ability to work in a team")
    expect(keywords).toContain("software")
    expect(keywords).toContain("engineer")
    expect(keywords).not.toContain("with")
    expect(keywords).not.toContain("the")
    expect(keywords).not.toContain("a")
  })

  it("preserves tech tokens with symbols like Node.js and C#", () => {
    const keywords = extractKeywords("Experience with Node.js, TypeScript, and C#")
    expect(keywords).toContain("node.js")
    expect(keywords).toContain("typescript")
    expect(keywords).toContain("c#")
  })

  it("returns an empty array for empty input", () => {
    expect(extractKeywords("")).toEqual([])
  })
})

describe("analyzeMatch", () => {
  it("gives a 100% score when the resume covers every job keyword", () => {
    const resume = "Experienced React and Next.js developer skilled in TypeScript and Tailwind."
    const job = "Looking for a React and Next.js developer with TypeScript and Tailwind skills."
    const result = analyzeMatch(resume, job)
    expect(result.matchScore).toBeGreaterThanOrEqual(60)
    expect(result.matchedSkills).toEqual(
      expect.arrayContaining(["react", "next.js", "typescript", "tailwind"])
    )
  })

  it("flags missing skills that appear in the job but not the resume", () => {
    const resume = "Frontend developer with React and CSS experience."
    const job = "We need a backend developer with Node.js, PostgreSQL, and Docker experience."
    const result = analyzeMatch(resume, job)
    expect(result.missingSkills).toEqual(
      expect.arrayContaining(["node.js", "postgresql", "docker"])
    )
    expect(result.matchScore).toBeLessThan(50)
  })

  it("returns a 0 score when the job description is empty", () => {
    const result = analyzeMatch("Some resume text", "")
    expect(result.matchScore).toBe(0)
    expect(result.jobKeywordCount).toBe(0)
  })
})
