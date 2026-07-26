import { describe, it, expect } from "vitest"
import { analyzeMatch, extractSkills } from "../analyze"

describe("extractSkills", () => {
  it("recognizes real technologies and ignores boilerplate words", () => {
    const names = extractSkills(
      "Frontend engineer with React, Next.js and TypeScript. We take your privacy seriously."
    ).map((s) => s.name)
    expect(names).toContain("React")
    expect(names).toContain("Next.js")
    expect(names).toContain("TypeScript")
    // Generic prose words never become skills.
    expect(names).not.toContain("privacy")
    expect(names).not.toContain("seriously")
  })

  it("handles tech tokens with symbols like .NET, C# and ASP.NET Core", () => {
    const names = extractSkills(
      "Our stack is .NET (C#, WPF, gRPC, ASP.NET Core, Entity Framework Core and MS-SQL Server)."
    ).map((s) => s.name)
    expect(names).toEqual(
      expect.arrayContaining([
        ".NET",
        "C#",
        "WPF",
        "gRPC",
        "ASP.NET Core",
        "Entity Framework Core",
        "SQL Server",
      ])
    )
  })

  it("does not fire .NET inside asp.net, and matches Node.js separately", () => {
    // "asp.net" alone should not be counted as bare .NET here.
    const names = extractSkills("We use Node.js on the backend.").map((s) => s.name)
    expect(names).toContain("Node.js")
    expect(names).not.toContain(".NET")
  })

  it("returns an empty array for empty input", () => {
    expect(extractSkills("")).toEqual([])
  })
})

describe("analyzeMatch", () => {
  it("gives a high score when the resume covers the required stack", () => {
    const resume = "Experienced React and Next.js developer skilled in TypeScript and Tailwind."
    const job = "Looking for a React and Next.js developer with TypeScript and Tailwind skills."
    const result = analyzeMatch(resume, job)
    expect(result.matchScore).toBeGreaterThanOrEqual(90)
    expect(result.matchedSkills).toEqual(
      expect.arrayContaining(["React", "Next.js", "TypeScript", "TailwindCSS"])
    )
  })

  it("flags the real missing skills, not filler words", () => {
    const resume = "Frontend developer with React experience."
    const job = "We need a backend developer with Node.js, PostgreSQL, and Docker experience."
    const result = analyzeMatch(resume, job)
    expect(result.missingSkills).toEqual(
      expect.arrayContaining(["Node.js", "PostgreSQL", "Docker"])
    )
    expect(result.matchScore).toBeLessThan(50)
  })

  it("ignores legal/anti-fraud boilerplate in the job description", () => {
    const resume = "React and Next.js engineer."
    const job = `We build software with React.
      Be aware of fraudulent job postings. KLA never asks for any financial
      compensation to be considered for an interview or to become an employee.
      If you are concerned an offer is not legitimate, email talent acquisition.`
    const result = analyzeMatch(resume, job)
    // The only recognized skill in the job is React, which the resume has.
    expect(result.matchedSkills).toContain("React")
    expect(result.missingSkills).not.toContain("interview")
    expect(result.missingSkills).not.toContain("employee")
    expect(result.missingSkills).not.toContain("offer")
    expect(result.matchScore).toBe(100)
  })

  it("scores a .NET job against a React resume as a partial match on shared skills", () => {
    const resume =
      "Frontend engineer: React, Next.js, TypeScript, Node.js, Agile/Scrum, Jest, computer science degree."
    const job =
      "Software Engineer on an agile Scrum team. Stack: .NET, C#, WPF, gRPC, ASP.NET Core, Entity Framework Core, MS-SQL Server, opening up to React. Degree in Software Engineering or Computer Science."
    const result = analyzeMatch(resume, job)
    // Shares the collaboration/frontend side...
    expect(result.matchedSkills).toEqual(
      expect.arrayContaining(["React", "Agile", "Scrum", "Computer Science"])
    )
    // ...but misses the core backend stack.
    expect(result.missingSkills).toEqual(
      expect.arrayContaining([".NET", "C#", "WPF", "gRPC", "ASP.NET Core", "SQL Server"])
    )
    // Partial, not near-zero and not high.
    expect(result.matchScore).toBeGreaterThan(20)
    expect(result.matchScore).toBeLessThan(60)
  })

  it("returns a 0 score when the job has no recognizable skills", () => {
    const result = analyzeMatch("React developer", "We are a friendly team that values passion.")
    expect(result.matchScore).toBe(0)
    expect(result.jobSkillCount).toBe(0)
  })
})
