import { AlertTriangle, ShieldCheck } from "lucide-react";
export function Disclaimer({ compact = false }: { compact?: boolean }) {
  return (
    <div role="note" aria-label="Clinical safety disclaimer" className="flex gap-3 rounded-2xl border border-amber-500/30 bg-amber-50 p-4 text-sm text-amber-950 dark:bg-amber-950/30 dark:text-amber-100">
      <ShieldCheck size={18} className="mt-0.5 shrink-0" />
      <p className={compact ? "text-xs leading-relaxed" : "leading-relaxed"}><strong>Documentation aid only.</strong> This tool supports documentation and clinical workflow. It does not diagnose, prescribe, or replace professional medical judgment.</p>
    </div>
  );
}
export function RedFlagBanner({ count }: { count: number }) {
  if (!count) return null;
  return (
    <div role="alert" className="flex items-start gap-3 rounded-2xl border border-red-500/40 bg-red-50 p-4 text-sm text-red-950 dark:bg-red-950/40 dark:text-red-100">
      <AlertTriangle size={18} className="mt-0.5 shrink-0" />
      <div><strong>{count} red-flag answer{count > 1 ? "s" : ""} detected.</strong> Do not rely on AI triage — follow hospital escalation procedures and inform the duty doctor immediately.</div>
    </div>
  );
}
