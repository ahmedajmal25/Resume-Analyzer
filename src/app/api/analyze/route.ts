import { NextRequest, NextResponse } from "next/server"
import { analyzeMatch } from "@/lib/analyze"

export const runtime = "nodejs"

async function extractPdfText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // Lazy import so the (fairly heavy) pdfjs-dist dependency is only
  // pulled in when someone actually submits a resume.
  const { PDFParse } = await import("pdf-parse")
  const parser = new PDFParse({ data: buffer })
  try {
    const result = await parser.getText()
    return result.text
  } finally {
    await parser.destroy()
  }
}

async function getAiSummary(resumeText: string, jobText: string): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: `You are a helpful, concise recruiter. In 2-3 sentences, tell the candidate how well their resume fits this job description and the single biggest thing they should improve. Resume:\n${resumeText.slice(0, 4000)}\n\nJob description:\n${jobText.slice(0, 2000)}`,
          },
        ],
        max_tokens: 200,
      }),
    })

    if (!res.ok) return null
    const json = await res.json()
    return json.choices?.[0]?.message?.content?.trim() ?? null
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const resumeFile = formData.get("resume")
    const jobDescription = formData.get("jobDescription")

    if (!(resumeFile instanceof File)) {
      return NextResponse.json({ error: "No resume file uploaded." }, { status: 400 })
    }
    if (typeof jobDescription !== "string" || !jobDescription.trim()) {
      return NextResponse.json({ error: "Job description is required." }, { status: 400 })
    }
    if (resumeFile.type !== "application/pdf") {
      return NextResponse.json({ error: "Resume must be a PDF file." }, { status: 400 })
    }

    const resumeText = await extractPdfText(resumeFile)
    if (!resumeText.trim()) {
      return NextResponse.json(
        { error: "Couldn't extract any text from that PDF. Is it a scanned image?" },
        { status: 400 }
      )
    }

    const result = analyzeMatch(resumeText, jobDescription)
    const aiSummary = await getAiSummary(resumeText, jobDescription)

    return NextResponse.json({ ...result, aiSummary })
  } catch (err) {
    console.error("Resume analysis failed:", err)
    return NextResponse.json(
      { error: "Something went wrong while analyzing the resume." },
      { status: 500 }
    )
  }
}
