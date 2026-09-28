import { cn } from "@/lib/utils";
import * as React from "react";
export const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default"|"outline"|"ghost"|"destructive"|"secondary"; size?: "sm"|"default"|"lg"|"icon" }>(
  ({ className, variant="default", size="default", ...p }, ref) => (
    <button ref={ref} className={cn("inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none active:scale-[.98]",
      size==="sm" && "h-8 px-3 text-xs", size==="default" && "h-10 px-5 text-sm", size==="lg" && "h-12 px-7 text-base", size==="icon" && "h-9 w-9",
      variant==="default" && "bg-teal-700 text-white hover:bg-teal-800 shadow-card",
      variant==="outline" && "border border-[hsl(var(--border))] bg-transparent hover:bg-[hsl(var(--muted))]",
      variant==="ghost" && "hover:bg-[hsl(var(--muted))]",
      variant==="secondary" && "bg-navy-900 text-white hover:bg-navy-800 dark:bg-white dark:text-navy-950",
      variant==="destructive" && "bg-red-600 text-white hover:bg-red-700", className)} {...p} />
  ));
Button.displayName = "Button";

export function Card({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-card", className)} {...p} />;
}
export function Badge({ className, tone="muted", ...p }: React.HTMLAttributes<HTMLSpanElement> & { tone?: "muted"|"teal"|"red"|"amber"|"navy" }) {
  const tones: Record<string,string> = { muted: "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]", teal: "bg-teal-100 text-teal-900 dark:bg-teal-900/40 dark:text-teal-200", red: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200", amber: "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200", navy: "bg-navy-900 text-white dark:bg-white dark:text-navy-950" };
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide", tones[tone], className)} {...p} />;
}
export function Input({ className, ...p }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("h-10 w-full rounded-xl border border-[hsl(var(--border))] bg-transparent px-3 text-sm placeholder:text-[hsl(var(--muted-foreground))] focus:border-teal-600", className)} {...p} />;
}
export function Textarea({ className, ...p }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn("w-full rounded-xl border border-[hsl(var(--border))] bg-transparent px-3 py-2 text-sm min-h-[90px] focus:border-teal-600", className)} {...p} />;
}
export function Label({ className, ...p }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]", className)} {...p} />;
}
export function Select({ className, ...p }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn("h-10 w-full rounded-xl border border-[hsl(var(--border))] bg-transparent px-3 text-sm", className)} {...p} />;
}
