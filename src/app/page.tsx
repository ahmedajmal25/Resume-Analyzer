"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { FileText, Upload, Sparkles, Loader2 } from "@/components/icons"

interface AnalysisResponse {
  matchScore: number
  matchedSkills: string[]
  missingSkills: string[]
  resumeKeywordCount: number
  jobKeywordCount: number
  aiSummary: string | null
  error?: string
}

export default function Home() {
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [jobDescription, setJobDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<AnalysisResponse | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const canSubmit = resumeFile && jobDescription.trim().length > 0 && !loading

  async function handleSubmit() {
    if (!resumeFile) return
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append("resume", resumeFile)
      formData.append("jobDescription", jobDescription)

      const res = await fetch("/api/analyze", { method: "POST", body: formData })
      const data: AnalysisResponse = await res.json()

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.")
      } else {
        setResult(data)
      }
    } catch {
      setError("Couldn't reach the server. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  function scoreColor(score: number) {
    if (score >= 70) return "text-emerald-600"
    if (score >= 40) return "text-amber-600"
    return "text-rose-600"
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Resume Analyzer
          </h1>
          <p className="mt-2 text-slate-500">
            Upload your resume and paste a job description to see how well they match.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>1. Upload your resume (PDF)</CardTitle>
            <CardDescription>We only read the text — nothing is stored.</CardDescription>
          </CardHeader>
          <CardContent>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center hover:border-slate-400 hover:bg-slate-100"
            >
              {resumeFile ? (
                <>
                  <FileText className="h-8 w-8 text-slate-500" />
                  <span className="text-sm font-medium text-slate-700">{resumeFile.name}</span>
                  <span className="text-xs text-slate-400">Click to choose a different file</span>
                </>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-slate-400" />
                  <span className="text-sm font-medium text-slate-600">Click to upload a PDF</span>
                </>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)}
            />
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>2. Paste the job description</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Paste the full job description here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={8}
            />
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-center">
          <Button size="lg" disabled={!canSubmit} onClick={handleSubmit}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> Analyze match
              </>
            )}
          </Button>
        </div>

        {error && (
          <p className="mt-4 text-center text-sm font-medium text-rose-600">{error}</p>
        )}

        {result && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="mb-2 flex items-baseline justify-between">
                  <span className="text-sm font-medium text-slate-600">Match score</span>
                  <span className={`text-2xl font-bold ${scoreColor(result.matchScore)}`}>
                    {result.matchScore}%
                  </span>
                </div>
                <Progress value={result.matchScore} />
              </div>

              {result.aiSummary && (
                <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
                  <p className="mb-1 flex items-center gap-1.5 font-medium text-slate-900">
                    <Sparkles className="h-3.5 w-3.5" /> AI summary
                  </p>
                  {result.aiSummary}
                </div>
              )}

              <div>
                <p className="mb-2 text-sm font-medium text-slate-600">
                  Matched skills ({result.matchedSkills.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {result.matchedSkills.length === 0 && (
                    <span className="text-sm text-slate-400">No overlapping keywords found.</span>
                  )}
                  {result.matchedSkills.map((skill) => (
                    <Badge key={skill} variant="success">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-slate-600">
                  Missing from your resume ({result.missingSkills.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {result.missingSkills.length === 0 && (
                    <span className="text-sm text-slate-400">Nothing obvious missing 🎉</span>
                  )}
                  {result.missingSkills.map((skill) => (
                    <Badge key={skill} variant="destructive">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  )
}
