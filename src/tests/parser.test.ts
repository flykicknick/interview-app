import { describe, it, expect } from "vitest";
import { parseGuide } from "@/domain/parser/parseGuide";
import { buildReport } from "@/domain/export/report";
import { overallStats } from "@/domain/progress";
import type { Interview } from "@/domain/types";

describe("parseGuide", () => {
  it("parses sections and questions in order, ignoring blanks", () => {
    const { guide, warnings } = parseGuide("[Intro]\nA?\n\nB?\r\n[Next]\nC?");
    expect(warnings).toEqual([]);
    expect(guide.sections.map((s) => s.name)).toEqual(["Intro", "Next"]);
    expect(guide.sections[0].questions.map((q) => q.text)).toEqual(["A?", "B?"]);
    expect(guide.sections[1].questions[0].id).toBe("s2q1");
  });
  it("handles BOM, bullets, duplicates, orphan and empty sections", () => {
    const { guide, warnings } = parseGuide("﻿Orphan?\n[A]\n- one\n2. two\n[A]\nx\n[Empty]");
    expect(guide.sections.map((s) => s.name)).toEqual(["Untitled", "A", "A (2)"]);
    expect(guide.sections[1].questions.map((q) => q.text)).toEqual(["one", "two"]);
    expect(warnings.length).toBe(3);
  });
});

describe("report", () => {
  const { guide } = parseGuide("[S]\nQ1\nQ2");
  const iv: Interview = {
    id: "1", schemaVersion: 1, createdAt: "", updatedAt: "", status: "in_progress",
    participant: { name: "Pat", date: "2026-11-04" }, guide,
    progress: { questions: { s1q1: { asked: true } }, sections: {} },
  };
  it("marks asked and missed", () => {
    const md = buildReport(iv, "markdown");
    expect(md).toContain("- [x] Q1");
    expect(md).toContain("- [ ] Q2");
    expect(overallStats(iv).remainingQuestions).toBe(1);
  });
});

describe("objective", () => {
  it("captures an optional objective directly under the header", () => {
    const { guide } = parseGuide("[A]\nObjective: Learn stuff\nQ1\n[B]\nQ2\nObjective: not an objective");
    expect(guide.sections[0].objective).toBe("Learn stuff");
    expect(guide.sections[0].questions.map((q) => q.text)).toEqual(["Q1"]);
    expect(guide.sections[1].objective).toBeUndefined();
    expect(guide.sections[1].questions.map((q) => q.text)).toEqual(["Q2", "Objective: not an objective"]);
  });
  it("drops sections that only have an objective", () => {
    const { guide, warnings } = parseGuide("[A]\nObjective: x\n[B]\nQ");
    expect(guide.sections.map((s) => s.name)).toEqual(["B"]);
    expect(warnings.length).toBe(1);
  });
});

describe("timer", () => {
  const { guide } = parseGuide("[S]\nQ1");
  const base: Interview = {
    id: "1", schemaVersion: 1, createdAt: "2026-01-01T10:00:00.000Z", startedAt: "2026-01-01T10:00:00.000Z",
    updatedAt: "", status: "in_progress", participant: { name: "Pat", date: "2026-01-01" }, guide,
    progress: { questions: {}, sections: { s1: { completed: true, completedAt: "2026-01-01T10:12:34.000Z" } } },
  };
  it("computes elapsed and section stamps, freezing at finish", async () => {
    const { elapsedMs, sectionCompletedAtMs } = await import("@/domain/progress");
    const now = Date.parse("2026-01-01T10:30:00.000Z");
    expect(elapsedMs(base, now)).toBe(30 * 60_000);
    expect(sectionCompletedAtMs(base, "s1")).toBe((12 * 60 + 34) * 1000);
    expect(elapsedMs({ ...base, finishedAt: "2026-01-01T10:20:00.000Z" }, now)).toBe(20 * 60_000);
    expect(buildReport(base, "markdown")).toContain("## S (complete at 12:34)");
  });
});

describe("pause", () => {
  const { guide } = parseGuide("[S]\nQ1");
  const iv: Interview = {
    id: "1", schemaVersion: 1, createdAt: "2026-01-01T10:00:00.000Z", startedAt: "2026-01-01T10:00:00.000Z",
    updatedAt: "", status: "in_progress", participant: { name: "Pat", date: "2026-01-01" }, guide,
    progress: { questions: {}, sections: {} },
  };
  it("excludes paused time from elapsed", async () => {
    const { elapsedMs } = await import("@/domain/progress");
    const now = Date.parse("2026-01-01T10:30:00.000Z");
    // 5 min previously paused, currently paused since 10:20 -> 30 - 5 - 10 = 15 min
    expect(elapsedMs({ ...iv, pausedMs: 5 * 60_000, pausedAt: "2026-01-01T10:20:00.000Z" }, now)).toBe(15 * 60_000);
    expect(elapsedMs({ ...iv, pausedMs: 5 * 60_000 }, now)).toBe(25 * 60_000);
  });
});
