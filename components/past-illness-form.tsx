"use client";
import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button, Card, Input, Label, Select, Textarea } from "./ui/ui";
import { toast } from "./ui/toaster";

export type Illness = { id: string; condition: string; diagnosedOn: string; status: string; notes: string; source: string };

const COMMON = ["Diabetes (sugar)", "Hypertension (BP)", "Asthma", "Tuberculosis (TB)", "Heart disease", "Thyroid disorder", "Kidney disease", "Liver disease", "Epilepsy / seizures", "Arthritis", "Cancer", "Mental health condition"];

export function PastIllnessForm({ patientId }: { patientId: string }) {
  const [items, setItems] = React.useState<Illness[]>([]);
  const [condition, setCondition] = React.useState("");
  const [when, setWhen] = React.useState("");
  const [status, setStatus] = React.useState("ongoing");
  const [notes, setNotes] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  async function load() {
    const r = await fetch(`/api/history?patientId=${patientId}`);
    const j = await r.json().catch(() => ({}));
    if (r.ok) setItems(j.items ?? []);
  }
  React.useEffect(() => { load(); }, [patientId]);

  async function add(preset?: string) {
    const c = (preset ?? condition).trim();
    if (c.length < 2) { toast("Type or pick a condition first."); return; }
    setBusy(true);
    try {
      const r = await fetch("/api/history", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ patientId, condition: c, diagnosedOn: when, status, notes }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Save failed");
      setItems((s) => [j.item, ...s]);
      setCondition(""); setWhen(""); setNotes("");
      toast("Past illness saved.");
    } catch (e) { toast(e instanceof Error ? e.message : "Failed"); }
    finally { setBusy(false); }
  }
  async function remove(id: string) {
    if (!confirm("Remove this past illness entry?")) return;
    const r = await fetch(`/api/history?id=${id}`, { method: "DELETE" });
    if (!r.ok) { toast("Delete failed"); return; }
    setItems((s) => s.filter((x) => x.id !== id));
    toast("Removed.");
  }

  return (
    <Card className="p-5">
      <h2 className="font-semibold">Past diseases & chronic conditions</h2>
      <p className="mt-1 text-xs opacity-60">Enter your own history — the doctor verifies it at your visit. Stored on your patient record.</p>
      <div className="mt-3 flex flex-wrap gap-2" aria-label="Common conditions">
        {COMMON.map((c) => (<button key={c} type="button" onClick={() => add(c)} className="rounded-full border border-[hsl(var(--border))] px-3 py-1.5 text-xs hover:border-teal-600 hover:text-teal-700">{c}</button>))}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div><Label htmlFor="pi-cond">Condition *</Label><Input id="pi-cond" value={condition} onChange={(e) => setCondition(e.target.value)} placeholder="e.g. Diabetes since 2019" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label htmlFor="pi-when">Diagnosed (year)</Label><Input id="pi-when" value={when} onChange={(e) => setWhen(e.target.value)} placeholder="2019" /></div>
          <div><Label htmlFor="pi-status">Status</Label><Select id="pi-status" value={status} onChange={(e) => setStatus(e.target.value)}><option value="ongoing">Ongoing</option><option value="under-treatment">Under treatment</option><option value="resolved">Resolved</option><option value="unknown">Not sure</option></Select></div>
        </div>
        <div className="sm:col-span-2"><Label htmlFor="pi-notes">Notes (medicines, doctor, hospital)</Label><Textarea id="pi-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Metformin 500mg, Dr. Rao, CityCare" /></div>
      </div>
      <Button className="mt-3" size="sm" disabled={busy} onClick={() => add()}><Plus size={14} /> Add condition</Button>
      <ul className="mt-4 space-y-2">
        {items.length === 0 && <li className="rounded-xl bg-[hsl(var(--muted))] p-4 text-sm opacity-70">No past illnesses recorded yet — add your first above.</li>}
        {items.map((i) => (
          <li key={i.id} className="flex items-start justify-between gap-2 rounded-xl border border-[hsl(var(--border))] px-4 py-3">
            <div><p className="text-sm font-semibold">{i.condition} <span className="ml-2 rounded-full bg-teal-100 px-2 py-0.5 text-[11px] text-teal-900">{i.status}</span></p>
              <p className="mt-0.5 text-xs opacity-60">{i.diagnosedOn ? `Since ${i.diagnosedOn} • ` : ""}{i.notes || "No notes"} • via {i.source}</p></div>
            <Button variant="ghost" size="icon" aria-label={`Remove ${i.condition}`} onClick={() => remove(i.id)}><Trash2 size={15} /></Button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
