import { z } from "zod";

export const questionSchema = z.object({ id: z.string(), text: z.string().min(1) });
export const sectionSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  objective: z.string().optional(),
  questions: z.array(questionSchema).min(1),
});
export const guideSchema = z.object({
  sourceFileName: z.string(),
  sections: z.array(sectionSchema).min(1),
});

export const interviewSchema = z.object({
  id: z.string(),
  schemaVersion: z.literal(1),
  createdAt: z.string(),
  startedAt: z.string().optional(),
  finishedAt: z.string().optional(),
  pausedAt: z.string().optional(),
  pausedMs: z.number().optional(),
  updatedAt: z.string(),
  status: z.enum(["in_progress", "finished"]),
  participant: z.object({
    name: z.string().min(1),
    segment: z.string().optional(),
    date: z.string(),
    notes: z.string().optional(),
  }),
  guide: guideSchema,
  progress: z.object({
    questions: z.record(
      z.string(),
      z.object({ asked: z.boolean(), askedAt: z.string().optional(), note: z.string().optional() }),
    ),
    sections: z.record(
      z.string(),
      z.object({ completed: z.boolean(), completedAt: z.string().optional(), elapsedMs: z.number().optional() }),
    ),
  }),
});

export type Question = z.infer<typeof questionSchema>;
export type Section = z.infer<typeof sectionSchema>;
export type Guide = z.infer<typeof guideSchema>;
export type Interview = z.infer<typeof interviewSchema>;
export type Participant = Interview["participant"];
