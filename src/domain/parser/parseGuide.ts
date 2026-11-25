import type { Guide } from "../types";

export interface ParseResult {
  guide: Guide;
  warnings: string[];
}

const HEADER = /^\[\s*(.+?)\s*\]$/;
// "Objective: ..." directly under a section header (before its first question)
const OBJECTIVE = /^objective\s*:\s*(.+)$/i;
const BULLET = /^(?:[-*•–]\s+|\d+[.)]\s+)/;

export function normalise(raw: string): string[] {
  return raw
    .replace(/^﻿/, "")
    .replace(/[ ​]/g, " ")
    .replace(/\r\n?/g, "\n")
    .replace(/［/g, "[")
    .replace(/］/g, "]")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

/** Parse "[Section]" / question-per-line text into a structured guide. */
export function parseGuide(raw: string, sourceFileName = "guide.txt"): ParseResult {
  const warnings: string[] = [];
  type Draft = { name: string; objective?: string; questions: string[] };
  const sections: Draft[] = [];
  let current: Draft | null = null;
  const seen = new Map<string, number>();

  for (const line of normalise(raw)) {
    const m = HEADER.exec(line);
    if (m) {
      let name = m[1];
      const count = (seen.get(name.toLowerCase()) ?? 0) + 1;
      seen.set(name.toLowerCase(), count);
      if (count > 1) {
        warnings.push(`Duplicate section "${name}" renamed to "${name} (${count})".`);
        name = `${name} (${count})`;
      }
      current = { name, questions: [] };
      sections.push(current);
      continue;
    }
    if (!current) {
      warnings.push("Questions found before the first [Section] header were placed in \"Untitled\".");
      current = { name: "Untitled", questions: [] };
      sections.push(current);
    }
    const obj = OBJECTIVE.exec(line);
    if (obj && current.questions.length === 0 && current.objective === undefined) {
      current.objective = obj[1].trim();
      continue;
    }
    const text = line.replace(BULLET, "").trim();
    if (text) current.questions.push(text);
  }

  const kept = sections.filter((s) => {
    if (s.questions.length === 0) {
      warnings.push(`Section "${s.name}" has no questions and was removed.`);
      return false;
    }
    return true;
  });

  return {
    warnings,
    guide: {
      sourceFileName,
      sections: kept.map((s, si) => ({
        id: `s${si + 1}`,
        name: s.name,
        ...(s.objective ? { objective: s.objective } : {}),
        questions: s.questions.map((text, qi) => ({ id: `s${si + 1}q${qi + 1}`, text })),
      })),
    },
  };
}
