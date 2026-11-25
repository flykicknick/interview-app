"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useEffect, useState } from "react";
import type { Guide, Interview, Participant } from "@/domain/types";
import { elapsedMs } from "@/domain/progress";

interface State {
  interviews: Record<string, Interview>;
  create: (participant: Participant, guide: Guide) => string;
  remove: (id: string) => void;
  toggleQuestion: (id: string, qid: string) => void;
  setNote: (id: string, qid: string, note: string) => void;
  setSectionComplete: (id: string, sid: string, completed: boolean) => void;
  pause: (id: string) => void;
  resume: (id: string) => void;
  finish: (id: string) => void;
  reopen: (id: string) => void;
}

const now = () => new Date().toISOString();

function patch(s: State, id: string, fn: (iv: Interview) => Interview) {
  const iv = s.interviews[id];
  if (!iv) return s;
  return { interviews: { ...s.interviews, [id]: { ...fn(iv), updatedAt: now() } } };
}

export const useInterviewStore = create<State>()(
  persist(
    (set) => ({
      interviews: {},
      create: (participant, guide) => {
        const id = crypto.randomUUID();
        const iv: Interview = {
          id, schemaVersion: 1, createdAt: now(), startedAt: now(), updatedAt: now(), status: "in_progress",
          participant, guide, progress: { questions: {}, sections: {} },
        };
        set((s) => ({ interviews: { ...s.interviews, [id]: iv } }));
        return id;
      },
      remove: (id) => set((s) => {
        const { [id]: _, ...rest } = s.interviews;
        return { interviews: rest };
      }),
      toggleQuestion: (id, qid) => set((s) => patch(s, id, (iv) => {
        const cur = iv.progress.questions[qid];
        const asked = !cur?.asked;
        return { ...iv, progress: { ...iv.progress, questions: {
          ...iv.progress.questions,
          [qid]: { ...cur, asked, askedAt: asked ? now() : undefined },
        } } };
      })),
      setNote: (id, qid, note) => set((s) => patch(s, id, (iv) => ({
        ...iv, progress: { ...iv.progress, questions: {
          ...iv.progress.questions,
          [qid]: { ...iv.progress.questions[qid], asked: iv.progress.questions[qid]?.asked ?? false, note },
        } },
      }))),
      setSectionComplete: (id, sid, completed) => set((s) => patch(s, id, (iv) => ({
        ...iv, progress: { ...iv.progress, sections: {
          ...iv.progress.sections,
          [sid]: completed
            ? { completed, completedAt: now(), elapsedMs: elapsedMs(iv, Date.now()) }
            : { completed },
        } },
      }))),
      pause: (id) => set((s) => patch(s, id, (iv) =>
        iv.pausedAt || iv.finishedAt ? iv : { ...iv, pausedAt: now() })),
      resume: (id) => set((s) => patch(s, id, (iv) =>
        iv.pausedAt
          ? { ...iv, pausedAt: undefined, pausedMs: (iv.pausedMs ?? 0) + (Date.now() - Date.parse(iv.pausedAt)) }
          : iv)),
      finish: (id) => set((s) => patch(s, id, (iv) => {
        if (iv.finishedAt) return { ...iv, status: "finished" };
        const t = Date.now();
        // Close any open pause so the frozen duration excludes it.
        const pausedMs = (iv.pausedMs ?? 0) + (iv.pausedAt ? t - Date.parse(iv.pausedAt) : 0);
        return { ...iv, status: "finished", finishedAt: new Date(t).toISOString(), pausedAt: undefined, pausedMs };
      })),
      reopen: (id) => set((s) => patch(s, id, (iv) => ({
        ...iv, status: "in_progress", finishedAt: undefined,
        // Time spent on the summary screen doesn't count toward the interview.
        pausedMs: (iv.pausedMs ?? 0) + (iv.finishedAt ? Date.now() - Date.parse(iv.finishedAt) : 0),
      }))),
    }),
    { name: "interview-console-v1", version: 1 },
  ),
);

/** True once client-side persisted state has loaded (avoids SSR mismatch). */
export function useHydrated() {
  const [h, setH] = useState(false);
  useEffect(() => {
    const unsub = useInterviewStore.persist.onFinishHydration(() => setH(true));
    if (useInterviewStore.persist.hasHydrated()) setH(true);
    return unsub;
  }, []);
  return h;
}
