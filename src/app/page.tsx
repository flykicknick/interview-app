"use client";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { useHydrated, useInterviewStore } from "@/store/interviewStore";
import { overallStats } from "@/domain/progress";
import { Button } from "@/components/ui/button";
import { GuideFormatHelp } from "@/components/GuideFormatHelp";

export default function Home() {
  const hydrated = useHydrated();
  const interviews = useInterviewStore((s) => s.interviews);
  const remove = useInterviewStore((s) => s.remove);
  const list = Object.values(interviews).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return (
    <main className="mx-auto max-w-3xl p-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Interview Console</h1>
        <div className="flex gap-2">
          <GuideFormatHelp />
          <Link href="/interviews/new"><Button><Plus size={16} /> New interview</Button></Link>
        </div>
      </header>
      {hydrated && list.length === 0 && (
        <p className="rounded-lg border border-dashed border-slate-300 p-10 text-center text-slate-500">
          No interviews yet. Create one and upload your interview guide.
        </p>
      )}
      <ul className="space-y-3">
        {hydrated && list.map((iv) => {
          const st = overallStats(iv);
          return (
            <li key={iv.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4">
              <Link href={iv.status === "finished" ? `/interviews/${iv.id}/summary` : `/interviews/${iv.id}`} className="flex-1">
                <div className="font-medium">{iv.participant.name}</div>
                <div className="text-sm text-slate-500">
                  {iv.participant.date}{iv.participant.segment ? ` · ${iv.participant.segment}` : ""} · {st.askedQuestions}/{st.totalQuestions} asked · {iv.status === "finished" ? "Finished" : "In progress"}
                </div>
              </Link>
              <Button variant="danger" aria-label={`Delete ${iv.participant.name}`}
                onClick={() => { if (confirm("Delete this interview? This cannot be undone.")) remove(iv.id); }}>
                <Trash2 size={16} />
              </Button>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
