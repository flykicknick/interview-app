# Interview Moderation Console — Design

## Decisions (confirmed)
- Next.js (App Router) + TypeScript + shadcn/ui + Tailwind (replaces Gluestack: web-only, better a11y/keyboard)
- React Hook Form + Zod (setup form; Zod also validates parsed guide and persisted state)
- Local browser storage, multiple saved interviews, resumable
- Summary shown on auto-completion of all sections OR via manual "Finish interview"
- Export contains ALL questions with asked/missed status (Markdown + plain text)
- Design doc first, then MVP

## 1. Architecture
Client-side SPA-style app inside Next.js App Router. No backend for MVP; all state in the browser.
- Server components only for static shells; interview routes are client components.
- Persistence behind a `InterviewRepository` interface (localStorage/IndexedDB now, API later).
- Parsing runs in the browser (`mammoth` for .docx -> raw text, then shared text parser). Files never leave the device.
- Pure domain layer (parser, progress selectors, exporters) with no React imports: easily unit-tested and reusable server-side later.

## 2. Application structure (routes)
- `/` — Interview list (resume, new, delete)
- `/interviews/new` — Setup form + guide upload (one screen, not a wizard)
- `/interviews/[id]` — Workspace (console)
- `/interviews/[id]/summary` — Coverage summary + export

## 3. Data model
```ts
Interview {
  id: string; schemaVersion: 1
  createdAt, updatedAt: ISO string
  status: 'in_progress' | 'finished'
  participant: { name: string; segment?: string; date: string; notes?: string }
  guide: { sourceFileName: string; sections: Section[] }
  progress: {
    questions: Record<questionId, { asked: boolean; askedAt?: string; note?: string }>
    sections: Record<sectionId, { completed: boolean; completedAt?: string }>
  }
}
Section { id: string; name: string; questions: Question[] }
Question { id: string; text: string }
```
Guide (immutable content) is separated from progress (mutable state) so templates and transcript comparison can be added later. Stable ids are generated at parse time (`s1`, `s1q3`). `note` exists from day one for the stretch goal.

## 4. UI component hierarchy
```
WorkspacePage
├─ ProgressHeader (QuestionsAsked x/y, SectionsComplete x/y, Finish button)
├─ SectionNav (SectionNavItem: status icon, name, n/m)
└─ SectionPanel
   ├─ SectionHeader (name, section progress bar, CompleteSectionButton / Reopen)
   └─ QuestionGrid -> QuestionCard (checkbox, text, optional note)
SummaryPage: ParticipantCard, CoverageList (per section), ExportMenu
```

## 5. State management
Zustand store with `persist` middleware, scoped per interview id. Actions: `toggleQuestion`, `setNote`, `completeSection`, `reopenSection`, `finishInterview`. Derived values (counts, percentages, "all complete") are selectors, never stored. Keyboard shortcuts: ↑/↓ move between cards, Space toggles asked, [ / ] switch section, Cmd+Enter completes section.

## 6. File parsing strategy
1. `.txt` -> read as UTF-8 text. `.docx` -> `mammoth.extractRawText` (client-side).
2. Normalise: strip BOM, `\r\n` -> `\n`, trim lines, drop blanks.
3. Line is a section header if it matches `^\[(.+)\]$` (trimmed name).
4. Other lines become questions in the current section; order preserved.
5. Edge cases: questions before any header go to an "Untitled" section (with warning); duplicate section names get suffix; empty sections dropped with warning; bullets/numbering (`-`, `1.`) optionally stripped; Word smart brackets and non-breaking spaces normalised.
6. Result validated with Zod; returns `{ guide, warnings[] }` and the setup screen shows a preview before starting.

## 7. Folder structure
```
src/
  app/ (routes above)
  components/ {ui (shadcn), workspace, summary, setup}
  domain/ {types.ts, parser/, progress.ts, export/}
  store/ interviewStore.ts
  lib/ {repository.ts, storage.ts, utils.ts}
  tests/ parser + export + progress unit tests
```

## 8. MVP implementation plan
1. Scaffold Next.js + Tailwind + shadcn; types + Zod schemas
2. Parser + unit tests (txt, docx, edge cases)
3. Store + repository (localStorage) 
4. Interview list + setup form + upload preview
5. Workspace: nav, cards, progress, complete/reopen, keyboard
6. Summary + manual finish + Markdown/text export (with asked/missed)
7. Polish: a11y, empty/error states, responsive layout

## 9. Future scalability
- Swap repository for API + DB (Postgres) and add auth for team collaboration
- Notes UI (model ready); transcript upload with fuzzy/semantic matching against questions
- AI copilot for follow-ups (server route calling an LLM; consider data privacy review)
- Template library (guide is already decoupled from progress)
- Move to IndexedDB if storage size becomes a problem; schemaVersion enables migrations
- Participant names are personal data: before any shared/cloud storage, involve the Data Privacy Officer
