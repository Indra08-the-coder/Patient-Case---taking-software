"use client";
import { LANGUAGES } from "@/lib/i18n";
import { Select } from "./ui/ui";
export function LanguageSelect({ value, onChange, id = "lang" }: { value: string; onChange: (v: string) => void; id?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Language / भाषा / భాష</label>
      <Select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
        {LANGUAGES.map((l) => (<option key={l.code} value={l.code} disabled={(l as {comingSoon?:boolean}).comingSoon}>{l.native} — {l.label}{(l as {comingSoon?:boolean}).comingSoon ? " (soon)" : ""}</option>))}
      </Select>
    </div>
  );
}
