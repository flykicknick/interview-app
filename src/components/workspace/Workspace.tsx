"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Circle, CheckCircle2, NotebookPen, Timer, Pause, Play } from "lucide-react";
import { useHydrated, useInterviewStore } from "@/store/interviewStore";
import { elapsedMs, overallStats, sectionCompletedAtMs, sectionStats } from "@/domain/progress";
import { Button } from "@/components/ui/button";
import { cn, formatElapsed } from "@/lib/utils";
import { useNow } from "@/lib/useNow";

export function Workspace({ id }: { id: string }) {
  const router = useRouter();
  const hydrated = useHydrated();
  const iv = useInterviewStore((s) => s.interviews[id]);
  const { toggleQuestion, setNote, setSectionComplete, finish, pause, resume } = useInterviewStore.getState();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [openNotes, setOpenNotes] = useState<Record<string, boolean>>({});
  const gridRef = useRef<HTMLDivElement>(null);

  const now = useNow(!iv?.finishedAt && !iv?.pausedAt);
  const sections = iv?.guide.sections ?? [];
  const active = sections.find((s) => s.id === activeId) ?? sections[0];

  // [ and ] switch sections (ignored while typing)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement;
      if (t.tagName === "TEXTAREA" || t.tagName === "INPUT") return;
      if (e.key !== "[" && e.key !== "]") return;
      const i = sections.findIndex((s) => s.id === active?.id);
      const n = sections[i + (e.key === "]" ? 1 : -1)];
      if (n) setActiveId(n.id);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sections, active?.id]);

  if (!hydrated) return <main className="p-6 text-slate-500">Loading…</main>;
  if (!iv || !active) return (
    <main className="p-6">Interview not found. <Link href="/" className="text-indigo-600 underline">Back to list</Link></main>
  );

  const st = overallStats(iv);
  const cur = sectionStats(iv, active.id);

  function complete(sectionId: string, completed: boolean) {
    setSectionComplete(id, sectionId, completed);
    if (completed) {
      const after = useInterviewStore.getState().interviews[id];
      if (after && overallStats(after).allSectionsComplete) {
        finish(id);
        router.push(`/interviews/${id}/summary`);
      }
    }
  }

  function onCardKey(e: React.KeyboardEvent<HTMLDivElement>, qid: string) {
    if (e.target !== e.currentTarget) return;
    const cards = Array.from(gridRef.current?.querySelectorAll<HTMLElement>("[data-card]") ?? []);
    const i = cards.indexOf(e.currentTarget);
    if (e.key === " " || e.key === "Enter") { e.preventDefault(); toggleQuestion(id, qid); }
    else if (e.key === "ArrowDown" || e.key === "ArrowRight") { e.preventDefault(); cards[i + 1]?.focus(); }
    else if (e.key === "ArrowUp" || e.key === "ArrowLeft") { e.preventDefault(); cards[i - 1]?.focus(); }
  }

  return (
    <div className="flex h-screen flex-col">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-3">
        <div>
          <Link href="/" className="text-xs text-indigo-600 hover:underline">← All interviews</Link>
          <h1 className="text-lg font-semibold">{iv.participant.name}
            <span className="ml-2 text-sm font-normal text-slate-500">{iv.participant.segment ?? ""} {iv.participant.date}</span>
          </h1>
        </div>
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2" title="Interview time">
            <Timer size={16} className={iv.pausedAt ? "text-amber-600" : "text-slate-500"} />
            <b className={cn("font-mono text-base tabular-nums", iv.pausedAt && "text-amber-600")} data-testid="timer">{formatElapsed(elapsedMs(iv, now))}</b>
            {iv.pausedAt && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800" data-testid="paused-badge">Paused</span>}
            <Button variant="outline" className="px-2.5 py-1 text-xs" data-testid="pause-toggle"
              onClick={() => (iv.pausedAt ? resume(id) : pause(id))}>
              {iv.pausedAt ? <><Play size={12} /> Resume</> : <><Pause size={12} /> Pause</>}
            </Button>
          </div>
          <div><span className="text-slate-500">Questions Asked</span> <b data-testid="q-progress">{st.askedQuestions} / {st.totalQuestions}</b> <span className="text-slate-400">({st.remainingQuestions} left)</span></div>
          <div><span className="text-slate-500">Sections Complete</span> <b data-testid="s-progress">{st.completedSections} / {st.totalSections}</b></div>
          <Button variant="outline" onClick={() => { finish(id); router.push(`/interviews/${id}/summary`); }}>Finish interview</Button>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded bg-slate-200">
          <div className="h-full bg-indigo-600 transition-all" style={{ width: `${st.totalQuestions ? (st.askedQuestions / st.totalQuestions) * 100 : 0}%` }} />
        </div>
      </header>
      <div className="flex min-h-0 flex-1">
        <nav aria-label="Sections" className="w-64 shrink-0 overflow-y-auto border-r border-slate-200 bg-white p-3">
          {sections.map((s) => {
            const ss = sectionStats(iv, s.id);
            return (
              <button key={s.id} onClick={() => setActiveId(s.id)} aria-current={s.id === active.id}
                className={cn("mb-1 flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-slate-100",
                  s.id === active.id && "bg-indigo-50 font-medium text-indigo-900",
                  ss.completed && "text-forest-700")}>
                {ss.completed ? <CheckCircle2 size={16} className="shrink-0 text-forest-600" /> : <Circle size={16} className="shrink-0 text-slate-400" />}
                <span className="flex-1 truncate">{s.name}</span>
                <span className="text-right text-xs text-slate-500">
                  {ss.asked}/{ss.total}
                  {ss.completed && sectionCompletedAtMs(iv, s.id) !== undefined && (
                    <span className="block font-mono text-forest-700">{formatElapsed(sectionCompletedAtMs(iv, s.id)!)}</span>
                  )}
                </span>
              </button>
            );
          })}
          <p className="mt-4 px-3 text-xs text-slate-400">Shortcuts: ↑/↓ move, Space tick, [ ] switch section</p>
        </nav>
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">{active.name}</h2>
              {active.objective && (
                <p className="mt-1 max-w-2xl text-sm text-slate-700" data-testid="section-objective">
                  <span className="font-medium">Objective:</span> {active.objective}
                </p>
              )}
              <p className="mt-1 text-sm text-slate-500">{cur.asked} of {cur.total} asked</p>
            </div>
            {cur.completed ? (
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1 font-medium text-forest-700" data-testid="section-complete-stamp">
                  <Check size={18} /> Section Complete
                  {sectionCompletedAtMs(iv, active.id) !== undefined && (
                    <span className="ml-1 font-mono text-sm font-normal">at {formatElapsed(sectionCompletedAtMs(iv, active.id)!)}</span>
                  )}
                </span>
                <Button variant="outline" onClick={() => complete(active.id, false)}>Reopen</Button>
              </div>
            ) : (
              <Button variant="success" onClick={() => complete(active.id, true)}>Complete Section</Button>
            )}
          </div>
          <div ref={gridRef} className="grid gap-3 md:grid-cols-2">
            {active.questions.map((q) => {
              const pq = iv.progress.questions[q.id];
              const asked = !!pq?.asked;
              return (
                <div key={q.id} className={cn("rounded-lg border bg-white p-4 shadow-sm transition-colors", asked ? "border-forest-300 bg-forest-50" : "border-slate-200")}>
                  <div data-card role="checkbox" aria-checked={asked} tabIndex={0}
                    onClick={() => toggleQuestion(id, q.id)} onKeyDown={(e) => onCardKey(e, q.id)}
                    className="flex cursor-pointer items-start gap-3 rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-600">
                    <span className={cn("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border", asked ? "border-forest-600 bg-forest-600 text-white" : "border-slate-400")}>
                      {asked && <Check size={14} />}
                    </span>
                    <span className={cn("flex-1", asked && "text-slate-600")}>{q.text}</span>
                  </div>
                  <div className="mt-3">
                    <button className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-indigo-600"
                      onClick={() => setOpenNotes((o) => ({ ...o, [q.id]: !o[q.id] }))}>
                      <NotebookPen size={12} /> {pq?.note ? "Note" : "Add note"}
                    </button>
                    {(openNotes[q.id] || pq?.note) && (
                      <textarea aria-label={`Note for: ${q.text}`} rows={2} value={pq?.note ?? ""}
                        onChange={(e) => setNote(id, q.id, e.target.value)}
                        className="mt-1 w-full rounded border border-slate-300 p-2 text-sm" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}
