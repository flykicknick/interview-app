import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "outline" | "ghost" | "success" | "danger";
const styles: Record<Variant, string> = {
  primary: "bg-indigo-600 text-white hover:bg-indigo-700",
  outline: "border border-slate-300 bg-white hover:bg-slate-100",
  ghost: "hover:bg-slate-100",
  success: "bg-emerald-600 text-white hover:bg-emerald-700",
  danger: "text-red-600 hover:bg-red-50",
};
export function Button({ variant = "primary", className, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      {...p}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50",
        styles[variant], className,
      )}
    />
  );
}
