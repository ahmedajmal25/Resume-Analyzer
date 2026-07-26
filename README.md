# Resume Analyzer

Upload a resume (PDF) and paste a job description — get a match score, the
skills that overlap, and the skills the job asks for that your resume is
missing.

This is a rebuild of an earlier prototype of mine, moved onto the stack I
actually use day to day: **Next.js, TypeScript, Tailwind CSS, and a
shadcn/ui-style component set**, with a real Node.js API route doing the PDF
parsing and matching, unit tests, and an optional AI-generated summary.

## Live demo

_Add your deployed Vercel URL here once deployed._

## How it works

1. You upload a PDF resume and paste a job description.
2. The `/api/analyze` route extracts text from the PDF (via `pdf-parse` /
   `pdfjs-dist`) and runs both texts through a keyword-extraction pass that
   strips stopwords and normalizes tech tokens like `Node.js` or `C#`.
3. It computes a match score from the overlap, and ranks the job-description
   keywords your resume is missing by how often they appear in the posting.
4. If an `OPENAI_API_KEY` is set, it also asks OpenAI for a 2-3 sentence
   qualitative summary. Without a key, the app still works end to end using
   the local scoring engine — no AI dependency required.

## Tech stack

- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui-style components
- **Backend:** Next.js API route (Node.js runtime), `pdf-parse`
- **Testing:** Vitest, unit tests on the core matching logic
- **Optional:** OpenAI API for a qualitative summary

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

To enable the optional AI summary, copy `.env.example` to `.env.local` and
add your OpenAI API key:

```bash
cp .env.example .env.local
```

## Running tests

```bash
npm test
```

## Building for production

```bash
npm run build
npm start
```

## Deploying

The app deploys cleanly to [Vercel](https://vercel.com) — connect the repo
and it just works. If you enable the AI summary, add `OPENAI_API_KEY` as an
environment variable in your Vercel project settings.

## Project structure

```
src/
├── app/
│   ├── api/analyze/route.ts   # PDF parsing + matching API route
│   ├── page.tsx               # Upload UI + results view
│   └── layout.tsx
├── components/ui/             # Reusable UI primitives (Button, Card, Badge, ...)
└── lib/
    ├── analyze.ts             # Pure matching/scoring logic (unit tested)
    └── utils.ts
```
