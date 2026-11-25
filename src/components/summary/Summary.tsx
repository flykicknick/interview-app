"use client";
import Link from "next/link";
import { Check, Square, Download } from "lucide-react";
import { useHydrated, useInterviewStore } from "@/store/interviewStore";
import { elapsedMs, overallStats, sectionCompletedAtMs } from "@/domain/progress";
import { buildReport } from "@/domain/export/report";
import { Button } from "@/components/ui/button";
import { clockTime, download, formatElapsed } from "@/lib/utils";

export function Summary({ id }: { id: string }) {
  const hydrated = useHydrated();
  const iv = useInterviewStore((s) => s.interviews[id]);
  const reopen = useInterviewStore((s) => s.reopen);
  if (!hydrated) return <main className="p-6 text-slate-500">Loading…</main>;
  if (!iv) return <main className="p-6">Interview not found. <Link href="/" className="text-indigo-600 underline">Back</Link></main>;

  const st = overallStats(iv);
  const base = `interview-${iv.participant.name.replace(/[^\w-]+/g, "_")}-${iv.participant.date}`;

  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Interview Summary</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => download(`${base}.md`, buildReport(iv, "markdown"), "text/markdown")}><Download size={16} /> Markdown</Button>
          <Button variant="outline" onClick={() => download(`${base}.txt`, buildReport(iv, "text"), "text/plain")}><Download size={16} /> Plain text</Button>
        </div>
      </div>
      <section className="mb-6 rounded-lg border border-slate-200 bg-white p-4">
        <dl className="grid grid-cols-3 gap-4 text-sm">
          <div><dt className="text-slate-500">Name</dt><dd className="font-medium">{iv.participant.name}</dd></div>
          <div><dt className="text-slate-500">Segment</dt><dd className="font-medium">{iv.participant.segment || "—"}</dd></div>
          <div><dt className="text-slate-500">Date</dt><dd className="font-medium">{iv.participant.date}</dd></div>
        </dl>
        <p className="mt-3 text-sm">Duration: <b className="font-mono">{formatElapsed(elapsedMs(iv, Date.now()))}</b> · Questions asked: <b>{st.askedQuestions} / {st.totalQuestions}</b> · Sections complete: <b>{st.completedSections} / {st.totalSections}</b></p>
      </section>
      {iv.guide.sections.map((s) => (
        <section key={s.id} className="mb-5">
          <h2 className="mb-2 font-semibold">{s.name}
            {sectionCompletedAtMs(iv, s.id) !== undefined && (
              <span className="ml-2 text-sm font-normal text-emerald-700">
                completed at <span className="font-mono">{formatElapsed(sectionCompletedAtMs(iv, s.id)!)}</span>
                {iv.progress.sections[s.id]?.completedAt && ` (${clockTime(iv.progress.sections[s.id].completedAt!)})`}
              </span>
            )}
          </h2>
          <ul className="space-y-1">
            {s.questions.map((q) => {
              const pq = iv.progress.questions[q.id];
              return (
                <li key={q.id} className="flex items-start gap-2 text-sm">
                  {pq?.asked ? <Check size={16} className="mt-0.5 text-emerald-600" aria-label="Asked" /> : <Square size={16} className="mt-0.5 text-red-500" aria-label="Not asked" />}
                  <span className={pq?.asked ? "" : "text-red-700"}>{q.text}
                    {pq?.note && <em className="block text-slate-500">Note: {pq.note}</em>}</span>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
      <div className="flex flex-wrap gap-2">
        <Link href="/"><Button>All interviews</Button></Link>
        <Link href="/interviews/new"><Button variant="success">Start new interview</Button></Link>
        <Link href={`/interviews/${id}`} onClick={() => reopen(id)}><Button variant="outline">Back to interview</Button></Link>
      </div>
    </main>
  );
}
