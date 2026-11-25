"use client";
import { useState } from "react";
import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

const example = `[Introduction]
Objective: Build rapport and understand the participant's context.
Tell me about your role?
How long have you been using our product?

[Current Process]
Objective: Map today's workflow and where it breaks down.
Walk me through your current workflow.
What tools do you use today?
What frustrates you most?

[Future State]
What would an ideal solution look like?`;

export function GuideFormatHelp() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}><HelpCircle size={16} /> Guide format</Button>
      <Modal open={open} onClose={() => setOpen(false)} title="How to structure your interview guide">
        <div className="space-y-4 text-sm text-slate-700">
          <p>Upload a <b>.txt</b> or <b>.docx</b> file. The app turns it into sections and question cards.</p>
          <ol className="list-decimal space-y-1 pl-5">
            <li>Put each <b>section name in square brackets</b> on its own line, e.g. <code className="rounded bg-slate-100 px-1">[Introduction]</code>.</li>
            <li>Optionally, add a <b>section objective</b> on the line directly under the header, starting with <code className="rounded bg-slate-100 px-1">Objective:</code>. It is shown as static text above that section's questions.</li>
            <li>Write <b>one question per line</b> underneath (after the objective, if any).</li>
            <li>Questions stay in the order you wrote them; blank lines are ignored.</li>
          </ol>
          <div>
            <p className="mb-1 font-medium">Example</p>
            <pre className="overflow-x-auto rounded-md bg-slate-900 p-3 text-xs text-slate-100">{example}</pre>
          </div>
          <div>
            <p className="mb-1 font-medium">Tips for Word documents</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Use plain paragraphs. Tables, text boxes, headers and footers are not read.</li>
              <li>Bullets and numbering (<code className="rounded bg-slate-100 px-1">-</code>, <code className="rounded bg-slate-100 px-1">1.</code>) are stripped automatically.</li>
              <li>Keep the section name and brackets on a line with nothing else.</li>
              <li>A question that wraps onto a second line in Word is still one paragraph and works fine; pressing Enter mid-question creates two questions.</li>
            </ul>
          </div>
          <div>
            <p className="mb-1 font-medium">What happens with edge cases</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Questions before the first header go into a section called "Untitled".</li>
              <li>Duplicate section names get a number, e.g. "Intro (2)".</li>
              <li>Sections with no questions are removed (an objective alone doesn't count).</li>
              <li>"Objective:" is only recognised before a section's first question, and only once per section; anywhere else it is treated as a normal question.</li>
              <li>You see a preview and any warnings before the interview starts.</li>
            </ul>
          </div>
        </div>
      </Modal>
    </>
  );
}
