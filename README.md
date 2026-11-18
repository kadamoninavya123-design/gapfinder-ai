# GapFinder AI

**Find what the student doesn't know.** Most study tools wait for a question. GapFinder tests the student on their own material, finds the weak topics, and builds a revision plan that updates after every quiz.

**Live demo:** YOUR-LIVE-URL
**Demo login:** `demo@gapfinder.ai` / `demo1234`

## The core loop

Upload → Topic map → Quiz → Gap report → Revision plan → Re-test → Plan updates

## Try it in 2 minutes

1. Log in with the demo credentials.
2. On the **Material** tab, click **Use sample Biology material** (or upload your own PDF or text files).
3. **Topic map** tab → **Build topic map**.
4. **Quiz** tab → **Generate diagnostic quiz** and answer the questions. Answer some wrongly to create gaps.
5. **Gap report** → see weak, medium and strong topics with reasons and citations.
6. **Revision plan** → set days and hours per day.
7. Take a second quiz and watch the report, the plan and the **Progress** tab update.
8. **Explain** tab → ask about a topic. Ask something unrelated to see it refuse.

## Features

| Feature | Where |
|---|---|
| Material upload (PDF or text) with section-level citations | `app/api/upload`, `lib/chunk.ts` |
| Topic map from the syllabus; past-paper questions linked to topics | `app/api/topics` |
| Diagnostic quiz generated from the notes, with citations | `app/api/quiz` |
| Answer evaluation that explains why an answer is right or wrong | `app/api/evaluate` |
| Gap report (weak / medium / strong) with reasons | `lib/gaps.ts`, `app/api/gaps` |
| Revision plan fitted to the student's days and hours | `components/Plan.tsx` |
| Explain-this-topic assistant that answers only from the material | `app/api/chat` |
| Progress dashboard across attempts | `components/Progress.tsx` |
| Login with demo credentials | `app/api/login` |

## Where retrieval is used, where generation is used

The two are kept in separate code. Retrieval never calls a model, and the model only sees what retrieval hands it.

| Step | Retrieval (code, no AI) | Generation (Groq model) |
|---|---|---|
| Material upload | Text is split into sections by headings and pages; each keeps a citation label | none |
| Topic map | Each past-paper question is matched to a topic by searching the notes | Reads the syllabus text and lists topics |
| Quiz | Finds the 3 best note sections for each topic | Writes questions from those sections only |
| Answer evaluation | Reuses the section the question came from | Explains the answer using only that section |
| Gap report | Thresholds on quiz scores (under 40% weak, under 70% medium) | Summarises which questions were missed, using the quiz results only |
| Revision plan | Ordered by `(100 − score) × (1 + past-paper weight)`; finds the section to re-read | none |
| Explain chat | Finds the 4 best sections for the question | Answers only from those sections, with `[S1]` tags |

**How grounding is enforced**
- The model never receives the whole book, only the retrieved sections.
- Every prompt says to use only the provided sources.
- Each quiz question must include a quote from its source. The server checks that the quote really appears in that section, and only shows the quote if it does.
- In the chat, if retrieval finds nothing, the model is not called. The app replies that it can't find the answer in the material.

**Retrieval method.** BM25 keyword ranking, implemented in `lib/retrieve.ts`. It needs no embedding service, runs inside the serverless function, and works well for a student's notes. Embeddings would handle paraphrased questions better and are the first upgrade.

## Architecture

```
Browser (Next.js, React)
  ├─ localStorage: material, topic map, attempts
  └─ calls API routes with the data it needs
        │
Vercel serverless (Next.js App Router)
  ├─ /api/upload    PDF/text → sections        (unpdf)
  ├─ /api/topics    retrieval + generation
  ├─ /api/quiz      retrieval → generation
  ├─ /api/evaluate  generation from one section
  ├─ /api/gaps      generation from quiz results
  └─ /api/chat      retrieval → guard → streamed generation
        │
Groq API  (openai/gpt-oss-120b via the Vercel AI SDK)
```

## Tech stack

Next.js 16 (App Router), TypeScript, Tailwind CSS, Vercel AI SDK, Groq API, `unpdf` for PDF text, deployed on Vercel.

## Run locally

```bash
git clone https://github.com/kadamoninavya123-design/gapfinder-ai.git
cd gapfinder-ai
npm install
cp .env.example .env.local   # then fill in the values
npm run dev
```

| Variable | Meaning |
|---|---|
| `GROQ_API_KEY` | Free key from console.groq.com |
| `DEMO_EMAIL` | Demo login email (`demo@gapfinder.ai`) |
| `DEMO_PASSWORD` | Demo login password (`demo1234`) |

The model name is set in one place: `lib/llm.ts`.

## Project structure

```
app/
  login/  dashboard/        pages
  api/    upload topics quiz evaluate gaps chat login health
components/                 Upload, TopicMap, Quiz, GapReport, Plan, Progress, Chat, Shell
lib/                        chunk, retrieve (BM25), llm, gaps, store, types
```

## Known limitations

- **Student data is saved in the browser** (localStorage), not in a database. The live site works, but data stays on one device. A database (Supabase or Neon) is the next step.
- The login is one shared demo account with a cookie session, not full authentication.
- PDFs must contain real text. Scanned images need OCR, which is not included.
- Uploads are limited by Vercel's request size (about 4 MB per upload).
- BM25 matches keywords, so heavily paraphrased questions can be missed.
- The quiz is multiple choice; short-answer evaluation is not included.

## Future work

Embedding-based retrieval, database storage, class-level analytics for teachers, spaced-repetition reminders, and LMS integration.