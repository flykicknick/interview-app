import type { Interview } from "../types";
import { elapsedMs, overallStats, sectionCompletedAtMs } from "../progress";

function fmt(ms: number) {
  const t = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = String(t % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
}

export type ReportFormat = "markdown" | "text";

export function buildReport(iv: Interview, format: ReportFormat): string {
  const md = format === "markdown";
  const st = overallStats(iv);
  const p = iv.participant;
  const lines: string[] = [];
  lines.push(md ? "# Interview Report" : "INTERVIEW REPORT", "");
  lines.push(md ? `- **Participant:** ${p.name}` : `Participant: ${p.name}`);
  lines.push(md ? `- **Segment:** ${p.segment || "—"}` : `Segment: ${p.segment || "-"}`);
  lines.push(md ? `- **Date:** ${p.date}` : `Date: ${p.date}`);
  lines.push(md ? `- **Questions asked:** ${st.askedQuestions} / ${st.totalQuestions}` : `Questions asked: ${st.askedQuestions} / ${st.totalQuestions}`);
  const dur = fmt(elapsedMs(iv, Date.now()));
  lines.push(md ? `- **Duration:** ${dur}` : `Duration: ${dur}`);
  if (p.notes) lines.push(md ? `- **Notes:** ${p.notes}` : `Notes: ${p.notes}`);
  lines.push("");
  for (const s of iv.guide.sections) {
    const at = sectionCompletedAtMs(iv, s.id);
    const tag = at !== undefined ? ` (complete at ${fmt(at)})` : iv.progress.sections[s.id]?.completed ? " (complete)" : "";
    lines.push(md ? `## ${s.name}${tag}` : `${s.name.toUpperCase()}${tag}`);
    if (s.objective) lines.push(md ? `_Objective: ${s.objective}_` : `Objective: ${s.objective}`);
    for (const q of s.questions) {
      const pq = iv.progress.questions[q.id];
      const mark = pq?.asked ? "[x]" : "[ ]";
      lines.push(md ? `- ${mark} ${q.text}` : `${mark} ${q.text}`);
      if (pq?.note) lines.push(md ? `  - Note: ${pq.note}` : `    Note: ${pq.note}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}
