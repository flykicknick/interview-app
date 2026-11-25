import { parseGuide, type ParseResult } from "./parseGuide";

/** Browser-side: read a .txt or .docx file and parse it. */
export async function parseGuideFile(file: File): Promise<ParseResult> {
  const lower = file.name.toLowerCase();
  let text: string;
  if (lower.endsWith(".docx")) {
    const mammoth = await import("mammoth");
    const arrayBuffer = await file.arrayBuffer();
    text = (await mammoth.extractRawText({ arrayBuffer })).value;
  } else if (lower.endsWith(".txt")) {
    text = await file.text();
  } else {
    throw new Error("Unsupported file type. Please upload a .txt or .docx file.");
  }
  const result = parseGuide(text, file.name);
  if (result.guide.sections.length === 0) {
    throw new Error("No sections or questions found. Use [Section Name] headers followed by one question per line.");
  }
  return result;
}
