"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Textarea } from "@/components/ui/ui";
import { toast } from "@/components/ui/toaster";

export function RecordEditor({ id, summary, notes }: { id: string; summary: Record<string, string>; notes: string }) {
  const router = useRouter();
  const [f, setF] = React.useState(summary);
  const [n, setN] = React.useState(notes);
  const [busy, setBusy] = React.useState(false);
  const fields: [string, string][] = [["chiefComplaint", "Chief complaint"], ["presentIllness", "History of present illness"], ["pastMedicalHistory", "Past medical history"], ["medicationHistory", "Medication history"], ["allergies", "Allergies"], ["familyHistory", "Family history"], ["socialHistory", "Social history"], ["reviewOfSystems", "Review of systems"], ["redFlagSummary", "Red-flag summary"], ["missingInfo", "Missing information"], ["conciseSummary", "Concise clinical summary"]];
  async function save(status: string) {
    setBusy(true);
    try {
      const r = await fetch("/api/consultations/review", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ consultationId: id, status, clinicianNotes: n, summary: f }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Failed");
      toast(`Record ${status === "APPROVED" ? "approved" : "saved"}.`);
      router.refresh();
    } catch (e) { toast(e instanceof Error ? e.message : "Failed"); }
    finally { setBusy(false); }
  }
  return (
    <Card className="p-5">
      <div className="grid gap-4">
        {fields.map(([k, label]) => (
          <div key={k}><label htmlFor={`f-${k}`} className="text-xs font-bold uppercase tracking-widest opacity-60">{label}</label>
            <Textarea id={`f-${k}`} className="mt-1" value={f[k] ?? ""} onChange={(e) => setF({ ...f, [k]: e.target.value })} rows={k === "conciseSummary" || k === "presentIllness" ? 4 : 2} /></div>
        ))}
        <div><label htmlFor="notes" className="text-xs font-bold uppercase tracking-widest opacity-60">Clinician notes</label>
          <Textarea id="notes" className="mt-1" value={n} onChange={(e) => setN(e.target.value)} rows={3} placeholder="Examination pointers, plan for face-to-face review…" /></div>
      </div>
      <div className="no-print mt-4 flex flex-wrap gap-2">
        <Button variant="outline" disabled={busy} onClick={() => save("AWAITING_REVIEW")}>Save draft</Button>
        <Button disabled={busy} onClick={() => save("APPROVED")}>{busy ? "Saving…" : "Approve record"}</Button>
        <Button variant="ghost" onClick={() => window.print()}>Print / PDF</Button>
      </div>
    </Card>
  );
}
