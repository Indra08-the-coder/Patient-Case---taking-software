"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "./ui/ui";
import { LanguageSelect } from "./language-select";
import { toast } from "./ui/toaster";

const SUGGESTED: Record<string, string[]> = {
  general: ["Fever for 3 days", "Cough with breathlessness", "Chest pain on exertion", "Stomach pain with vomiting", "High blood sugar follow-up", "Headache with vomiting"],
};

export function StartConsultation({ patientId, consent }: { patientId: string; consent: boolean }) {
  const router = useRouter();
  const [cc, setCc] = React.useState("");
  const [lang, setLang] = React.useState("en");
  const [ok, setOk] = React.useState(consent);
  const [loading, setLoading] = React.useState(false);
  async function start() {
    if (!ok) { toast("Please capture consent first."); return; }
    if (cc.trim().length < 2) { toast("Enter a chief complaint."); return; }
    setLoading(true);
    try {
      const r = await fetch("/api/consultations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ patientId, chiefComplaint: cc.trim(), language: lang }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Failed");
      toast("Consultation started.");
      router.push(`/consultations/${j.consultation.id}`);
    } catch (e) { toast(e instanceof Error ? e.message : "Failed"); }
    finally { setLoading(false); }
  }
  return (
    <div className="space-y-3 rounded-2xl border border-[hsl(var(--border))] p-4">
      <p className="text-sm font-semibold">Start new AI consultation</p>
      <label className="text-xs font-semibold uppercase tracking-wider opacity-60" htmlFor="cc">Chief complaint</label>
      <Input id="cc" value={cc} onChange={(e) => setCc(e.target.value)} placeholder="e.g. Fever with cough for 4 days" />
      <div className="flex flex-wrap gap-2">{SUGGESTED.general.map((s) => (<button key={s} type="button" onClick={() => setCc(s)} className="rounded-full border border-[hsl(var(--border))] px-3 py-1.5 text-xs hover:border-teal-600 hover:text-teal-700">{s}</button>))}</div>
      <LanguageSelect value={lang} onChange={setLang} />
      <label className="flex items-start gap-2 text-xs"><input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} className="mt-0.5" /> Patient consents to AI-assisted documentation. Tool does not diagnose or prescribe.</label>
      <Button className="w-full" onClick={start} disabled={loading}>{loading ? "Starting…" : "Start AI intake"}</Button>
    </div>
  );
}
