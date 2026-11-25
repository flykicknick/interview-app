import type { Interview } from "./types";

export function sectionStats(iv: Interview, sectionId: string) {
  const s = iv.guide.sections.find((x) => x.id === sectionId);
  const total = s?.questions.length ?? 0;
  const asked = s?.questions.filter((q) => iv.progress.questions[q.id]?.asked).length ?? 0;
  return { total, asked, completed: !!iv.progress.sections[sectionId]?.completed };
}

export function overallStats(iv: Interview) {
  const totalQuestions = iv.guide.sections.reduce((n, s) => n + s.questions.length, 0);
  const askedQuestions = iv.guide.sections.reduce(
    (n, s) => n + s.questions.filter((q) => iv.progress.questions[q.id]?.asked).length,
    0,
  );
  const totalSections = iv.guide.sections.length;
  const completedSections = iv.guide.sections.filter((s) => iv.progress.sections[s.id]?.completed).length;
  return {
    totalQuestions,
    askedQuestions,
    remainingQuestions: totalQuestions - askedQuestions,
    totalSections,
    completedSections,
    remainingSections: totalSections - completedSections,
    allSectionsComplete: totalSections > 0 && completedSections === totalSections,
  };
}

const startOf = (iv: Interview) => Date.parse(iv.startedAt ?? iv.createdAt);

/** Interview time in ms, excluding paused time; frozen at finishedAt once finished. */
export function elapsedMs(iv: Interview, now: number) {
  const end = iv.finishedAt ? Date.parse(iv.finishedAt) : now;
  const currentPause = iv.pausedAt ? Math.max(0, end - Date.parse(iv.pausedAt)) : 0;
  return Math.max(0, end - startOf(iv) - (iv.pausedMs ?? 0) - currentPause);
}

/** Elapsed ms from interview start to the moment a section was completed (undefined if not complete). */
export function sectionCompletedAtMs(iv: Interview, sectionId: string) {
  const p = iv.progress.sections[sectionId];
  if (!p?.completed || !p.completedAt) return undefined;
  if (p.elapsedMs !== undefined) return p.elapsedMs; // pause-aware, captured at completion
  return Math.max(0, Date.parse(p.completedAt) - startOf(iv)); // older data
}
