"use client";
import { useEffect, useRef } from "react";
import { X } from "lucide-react";

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} onClose={onClose} aria-labelledby="modal-title"
      onClick={(e) => { if (e.target === ref.current) onClose(); }}
      className="m-auto w-full max-w-2xl rounded-xl p-0 shadow-xl backdrop:bg-slate-900/50">
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
        <h2 id="modal-title" className="text-lg font-semibold">{title}</h2>
        <button onClick={onClose} aria-label="Close" className="rounded p-1 hover:bg-slate-100"><X size={18} /></button>
      </div>
      <div className="max-h-[70vh] overflow-y-auto px-6 py-4">{children}</div>
    </dialog>
  );
}
