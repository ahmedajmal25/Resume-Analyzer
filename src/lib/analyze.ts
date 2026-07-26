// Core resume <-> job description matching logic.
//
// Instead of comparing every non-stopword (which turns job-post boilerplate —
// legal disclaimers, "interview", "offer", "employee" — into fake "skills"),
// we match against a curated gazetteer of real technologies, tools and
// methodologies. Only recognized skills are extracted from each document, so
// the score reflects genuine skill overlap rather than word overlap.
//
// Kept dependency-free so it's easy to unit test and needs no API key.

type Category =
  | "language"
  | "framework"
  | "database"
  | "cloud"
  | "library"
  | "tool"
  | "testing"
  | "practice"
  | "concept"

interface Skill {
  /** Canonical, display-ready name. */
  name: string
  category: Category
  /** Extra spellings/abbreviations. The lowercased `name` is always included. */
  aliases?: string[]
}

// Hard technical skills carry more weight than soft/process skills, so the
// score isn't dominated by everyone matching on "Agile" and "Git".
const CATEGORY_WEIGHT: Record<Category, number> = {
  language: 3,
  framework: 3,
  database: 3,
  cloud: 3,
  library: 2,
  tool: 2,
  testing: 2,
  practice: 2,
  concept: 2,
}

// The gazetteer. Not exhaustive, but covers the common web / data / cloud /
// .NET stacks well. Add entries here to broaden recognition.
const SKILLS: Skill[] = [
  // Languages
  { name: "JavaScript", category: "language", aliases: ["js", "es6", "es6+", "ecmascript"] },
  { name: "TypeScript", category: "language", aliases: ["ts"] },
  { name: "Python", category: "language" },
  { name: "Java", category: "language" },
  { name: "C#", category: "language", aliases: ["c-sharp", "csharp"] },
  { name: "C++", category: "language", aliases: ["cpp"] },
  { name: "Go", category: "language", aliases: ["golang"] },
  { name: "Rust", category: "language" },
  { name: "Ruby", category: "language" },
  { name: "PHP", category: "language" },
  { name: "Swift", category: "language" },
  { name: "Kotlin", category: "language" },
  { name: "Scala", category: "language" },
  { name: "Objective-C", category: "language" },
  { name: "Dart", category: "language" },
  { name: "MATLAB", category: "language" },
  { name: "SQL", category: "language" },
  { name: "Bash", category: "language", aliases: ["shell scripting", "shell"] },
  { name: "PowerShell", category: "language" },

  // Frameworks
  { name: "React", category: "framework", aliases: ["react.js", "reactjs"] },
  { name: "Next.js", category: "framework", aliases: ["nextjs"] },
  { name: "Angular", category: "framework", aliases: ["angular.js", "angularjs"] },
  { name: "Vue", category: "framework", aliases: ["vue.js", "vuejs"] },
  { name: "Svelte", category: "framework" },
  { name: "Node.js", category: "framework", aliases: ["nodejs", "node"] },
  { name: "Express", category: "framework", aliases: ["express.js", "expressjs"] },
  { name: "Nest.js", category: "framework", aliases: ["nestjs"] },
  { name: "Django", category: "framework" },
  { name: "Flask", category: "framework" },
  { name: "FastAPI", category: "framework" },
  { name: "Spring", category: "framework", aliases: ["spring boot"] },
  { name: ".NET", category: "framework", aliases: ["dotnet", ".net core", ".net 6", ".net 7", ".net 8"] },
  { name: "ASP.NET Core", category: "framework", aliases: ["asp.net core"] },
  { name: "ASP.NET", category: "framework", aliases: ["aspnet"] },
  { name: "Entity Framework Core", category: "framework", aliases: ["entity framework", "ef core", "efcore"] },
  { name: "WPF", category: "framework", aliases: ["windows presentation foundation"] },
  { name: "WinForms", category: "framework", aliases: ["windows forms"] },
  { name: "Blazor", category: "framework" },
  { name: "Xamarin", category: "framework" },
  { name: "Ruby on Rails", category: "framework", aliases: ["rails"] },
  { name: "Laravel", category: "framework" },
  { name: "Flutter", category: "framework" },
  { name: "React Native", category: "framework" },
  { name: "Electron", category: "framework" },
  { name: "Redux", category: "library", aliases: ["redux toolkit"] },
  { name: "gRPC", category: "framework" },

  // Libraries / UI / data-science
  { name: "TailwindCSS", category: "library", aliases: ["tailwind", "tailwind css"] },
  { name: "Material UI", category: "library", aliases: ["mui", "material-ui"] },
  { name: "Bootstrap", category: "library" },
  { name: "jQuery", category: "library" },
  { name: "Three.js", category: "library", aliases: ["threejs"] },
  { name: "scikit-learn", category: "library", aliases: ["sklearn", "scikit learn"] },
  { name: "pandas", category: "library" },
  { name: "NumPy", category: "library", aliases: ["numpy"] },
  { name: "Matplotlib", category: "library", aliases: ["matplotlib"] },
  { name: "Seaborn", category: "library" },
  { name: "Plotly", category: "library" },
  { name: "TensorFlow", category: "library" },
  { name: "PyTorch", category: "library" },
  { name: "Keras", category: "library" },
  { name: "LangChain", category: "library" },

  // Databases
  { name: "PostgreSQL", category: "database", aliases: ["postgres"] },
  { name: "MySQL", category: "database" },
  { name: "SQL Server", category: "database", aliases: ["ms-sql server", "ms-sql", "mssql", "microsoft sql server"] },
  { name: "SQLite", category: "database" },
  { name: "MongoDB", category: "database", aliases: ["mongo"] },
  { name: "Redis", category: "database" },
  { name: "Cassandra", category: "database" },
  { name: "DynamoDB", category: "database" },
  { name: "Oracle", category: "database" },
  { name: "Elasticsearch", category: "database" },
  { name: "Firebase", category: "database", aliases: ["firestore"] },
  { name: "Snowflake", category: "database" },
  { name: "BigQuery", category: "database" },

  // Cloud / DevOps / infra
  { name: "AWS", category: "cloud", aliases: ["amazon web services"] },
  { name: "Azure", category: "cloud", aliases: ["microsoft azure"] },
  { name: "Google Cloud", category: "cloud", aliases: ["gcp"] },
  { name: "Docker", category: "cloud" },
  { name: "Kubernetes", category: "cloud", aliases: ["k8s"] },
  { name: "Terraform", category: "cloud" },
  { name: "Ansible", category: "cloud" },
  { name: "Jenkins", category: "cloud" },
  { name: "AWS Lambda", category: "cloud", aliases: ["lambda"] },
  { name: "Amazon S3", category: "cloud", aliases: ["s3"] },
  { name: "Kibana", category: "cloud" },
  { name: "Grafana", category: "cloud" },
  { name: "Prometheus", category: "cloud" },
  { name: "Nginx", category: "cloud" },
  { name: "Serverless", category: "cloud" },

  // Tools
  { name: "Git", category: "tool" },
  { name: "GitHub", category: "tool" },
  { name: "GitLab", category: "tool" },
  { name: "Jira", category: "tool" },
  { name: "Figma", category: "tool" },
  { name: "Webpack", category: "tool" },
  { name: "Vite", category: "tool" },
  { name: "Postman", category: "tool" },
  { name: "Linux", category: "tool" },
  { name: "Cursor", category: "tool" },

  // Testing
  { name: "Jest", category: "testing" },
  { name: "Playwright", category: "testing" },
  { name: "Cypress", category: "testing" },
  { name: "Vitest", category: "testing" },
  { name: "Mocha", category: "testing" },
  { name: "Selenium", category: "testing" },
  { name: "JUnit", category: "testing" },
  { name: "PyTest", category: "testing", aliases: ["pytest"] },
  { name: "GitHub Actions", category: "testing" },
  { name: "Unit Testing", category: "testing", aliases: ["unit tests", "unit test"] },
  { name: "End-to-End Testing", category: "testing", aliases: ["e2e", "end-to-end", "end to end"] },

  // Practices / methodologies
  { name: "Agile", category: "practice" },
  { name: "Scrum", category: "practice" },
  { name: "Kanban", category: "practice" },
  { name: "Scrum Master", category: "practice" },
  { name: "Product Owner", category: "practice" },
  { name: "CI/CD", category: "practice", aliases: ["cicd", "ci-cd", "continuous integration", "continuous deployment", "continuous delivery"] },
  { name: "Code Review", category: "practice", aliases: ["code reviews"] },
  { name: "DevOps", category: "practice" },
  { name: "TDD", category: "practice", aliases: ["test-driven development", "test driven development"] },
  { name: "Microservices", category: "practice", aliases: ["microservice"] },

  // Concepts
  { name: "REST API", category: "concept", aliases: ["rest", "rest apis", "restful", "restful api"] },
  { name: "GraphQL", category: "concept" },
  { name: "WebSockets", category: "concept", aliases: ["websocket"] },
  { name: "OAuth", category: "concept" },
  { name: "JWT", category: "concept" },
  { name: "Web3", category: "concept" },
  { name: "Machine Learning", category: "concept", aliases: ["ml"] },
  { name: "Deep Learning", category: "concept" },
  { name: "Artificial Intelligence", category: "concept", aliases: ["ai"] },
  { name: "LLM", category: "concept", aliases: ["llms", "large language model", "large language models"] },
  { name: "Prompt Engineering", category: "concept" },
  { name: "NLP", category: "concept", aliases: ["natural language processing"] },
  { name: "Data Science", category: "concept" },
  { name: "Accessibility", category: "concept", aliases: ["a11y", "wcag"] },
  { name: "SEO", category: "concept" },
  { name: "Responsive Design", category: "concept" },
  { name: "Core Web Vitals", category: "concept", aliases: ["web vitals"] },
  { name: "System Design", category: "concept" },
  { name: "Data Structures", category: "concept" },
  { name: "Algorithms", category: "concept" },
  { name: "Object-Oriented Programming", category: "concept", aliases: ["oop", "object oriented programming"] },
  { name: "Distributed Systems", category: "concept" },
  { name: "Computer Science", category: "concept" },
  { name: "Software Engineering", category: "concept", aliases: ["software development"] },
]

export interface MatchedSkill {
  name: string
  category: Category
}

export interface AnalysisResult {
  matchScore: number
  matchedSkills: string[]
  missingSkills: string[]
  /** Number of distinct skills recognized in the resume. */
  resumeSkillCount: number
  /** Number of distinct skills required by the job description. */
  jobSkillCount: number
}

// Escape a literal string for use inside a RegExp.
function escapeRegExp(literal: string): string {
  return literal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

// Boundaries that treat `+ #` as part of a token (so `c#`, `c++` match cleanly)
// and are dot-aware: a trailing sentence period is fine (`React.`), but a dot
// that continues a token is not — so bare `react` won't fire inside `react.js`
// and bare `.net` won't fire inside `asp.net` (those have dedicated aliases).
const LEAD = "(?<![a-z0-9+#])(?<![a-z0-9]\\.)"
const TRAIL = "(?![a-z0-9+#])(?!\\.[a-z0-9])"

const regexCache = new Map<string, RegExp>()
function aliasRegex(alias: string): RegExp {
  let re = regexCache.get(alias)
  if (!re) {
    re = new RegExp(`${LEAD}${escapeRegExp(alias)}${TRAIL}`, "g")
    regexCache.set(alias, re)
  }
  re.lastIndex = 0
  return re
}

function normalize(text: string): string {
  // Lowercase and collapse all whitespace so multi-word skills match across
  // line breaks (common in PDF-extracted text).
  return text.toLowerCase().replace(/\s+/g, " ")
}

// How many times any alias of `skill` occurs in the normalized text.
function countOccurrences(normalizedText: string, skill: Skill): number {
  const aliases = [skill.name.toLowerCase(), ...(skill.aliases ?? [])]
  let total = 0
  for (const alias of aliases) {
    const matches = normalizedText.match(aliasRegex(alias))
    if (matches) total += matches.length
  }
  return total
}

/** Extracts the set of recognized skills present in free text. */
export function extractSkills(text: string): MatchedSkill[] {
  if (!text) return []
  const normalized = normalize(text)
  const found: MatchedSkill[] = []
  for (const skill of SKILLS) {
    if (countOccurrences(normalized, skill) > 0) {
      found.push({ name: skill.name, category: skill.category })
    }
  }
  return found
}

export function analyzeMatch(resumeText: string, jobText: string): AnalysisResult {
  const normalizedJob = normalize(jobText)

  const resumeSkillNames = new Set(extractSkills(resumeText).map((s) => s.name))

  // Skills the job actually asks for, with a frequency count for ranking.
  const required = SKILLS
    .map((skill) => ({ skill, count: countOccurrences(normalizedJob, skill) }))
    .filter((entry) => entry.count > 0)

  const matched = required.filter((entry) => resumeSkillNames.has(entry.skill.name))
  const missing = required.filter((entry) => !resumeSkillNames.has(entry.skill.name))

  // Rank by importance (category weight), then by how often the job mentions it.
  const byImportance = (
    a: { skill: Skill; count: number },
    b: { skill: Skill; count: number }
  ) => {
    const wa = CATEGORY_WEIGHT[a.skill.category]
    const wb = CATEGORY_WEIGHT[b.skill.category]
    if (wb !== wa) return wb - wa
    if (b.count !== a.count) return b.count - a.count
    return a.skill.name.localeCompare(b.skill.name)
  }
  matched.sort(byImportance)
  missing.sort(byImportance)

  // Weighted coverage: a candidate missing the core stack scores low even if
  // they match lots of minor skills, and vice-versa.
  const requiredWeight = required.reduce((sum, e) => sum + CATEGORY_WEIGHT[e.skill.category], 0)
  const matchedWeight = matched.reduce((sum, e) => sum + CATEGORY_WEIGHT[e.skill.category], 0)
  const matchScore = requiredWeight ? Math.round((matchedWeight / requiredWeight) * 100) : 0

  return {
    matchScore,
    matchedSkills: matched.map((e) => e.skill.name),
    missingSkills: missing.map((e) => e.skill.name).slice(0, 15),
    resumeSkillCount: resumeSkillNames.size,
    jobSkillCount: required.length,
  }
}
