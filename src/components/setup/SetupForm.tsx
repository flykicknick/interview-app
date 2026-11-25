"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { parseGuideFile } from "@/domain/parser/readFile";
import type { Guide } from "@/domain/types";
import { useInterviewStore } from "@/store/interviewStore";
import { today } from "@/lib/utils";

const schema = z.object({
  name: z.string().trim().min(1, "Participant name is required"),
  segment: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  notes: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

const input = "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-2 focus:outline-indigo-600";

export function SetupForm() {
  const router = useRouter();
  const create = useInterviewStore((s) => s.create);
  const [guide, setGuide] = useState<Guide | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", segment: "", date: today(), notes: "" },
  });

  async function onFile(file?: File) {
    if (!file) return;
    setFileError(null); setGuide(null); setWarnings([]);
    try {
      const r = await parseGuideFile(file);
      setGuide(r.guide); setWarnings(r.warnings);
    } catch (e) {
      setFileError(e instanceof Error ? e.message : "Could not read file.");
    }
  }

  function onSubmit(v: FormValues) {
    if (!guide) { setFileError("Please upload an interview guide."); return; }
    const id = create({ name: v.name, segment: v.segment || undefined, date: v.date, notes: v.notes || undefined }, guide);
    router.push(`/interviews/${id}`);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="name">Participant name</label>
        <input id="name" className={input} {...register("name")} />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="segment">Segment (optional)</label>
          <input id="segment" className={input} {...register("segment")} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="date">Interview date</label>
          <input id="date" type="date" className={input} {...register("date")} />
          {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>}
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="notes">Notes (optional)</label>
        <textarea id="notes" rows={3} className={input} {...register("notes")} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="guide">Interview guide (.txt or .docx)</label>
        <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-slate-400 bg-white p-4 text-sm text-slate-600 hover:bg-slate-50">
          <Upload size={16} /> {guide ? "Replace file" : "Choose a file"}
          <input id="guide" type="file" accept=".txt,.docx" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
        </label>
        {fileError && <p className="mt-1 text-sm text-red-600">{fileError}</p>}
        {warnings.length > 0 && (
          <ul className="mt-2 list-disc rounded-md bg-amber-50 p-3 pl-7 text-sm text-amber-800">
            {warnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        )}
        {guide && (
          <div className="mt-3 rounded-md border border-slate-200 bg-white p-3 text-sm" data-testid="guide-preview">
            <p className="mb-1 font-medium">{guide.sourceFileName}: {guide.sections.length} sections, {guide.sections.reduce((n, s) => n + s.questions.length, 0)} questions</p>
            <ul className="text-slate-600">
              {guide.sections.map((s) => <li key={s.id}>{s.name} ({s.questions.length})</li>)}
            </ul>
          </div>
        )}
      </div>
      <Button type="submit">Start interview</Button>
    </form>
  );
}
