"use client";
import * as React from "react";
import Link from "next/link";
import { Fingerprint, Loader2 } from "lucide-react";
import { Button, Card, Input, Label } from "./ui/ui";
import { toast } from "./ui/toaster";

export function AbhaLookup({ defaultHospital }: { defaultHospital?: string | null }) {
  const [abha, setAbha] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState("");
  const [found, setFound] = React.useState<null | {
    id: string; name: string; age: number | null; sex: string; mrn: string; abhaId: string | null;
    consultations: { id: string; chiefComplaint: string; status: string }[];
    visits: { hospital: { name: string } }[];
  }>(null);
  async function lookup() {
    const v = abha.trim();
    if (v.length < 3) { toast("Enter the patient's ABHA ID."); return; }
    setBusy(true); setErr(""); setFound(null);
    try {
      const r = await fetch(`/api/patients/lookup?abha=${encodeURIComponent(v)}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Lookup failed");
      setFound(j.patient);
      toast(`Found ${j.patient.name} — ${j.patient.consultations.length} visit(s).`);
    } catch (e) { setErr(e instanceof Error ? e.message : "Lookup failed"); }
    finally { setBusy(false); }
  }
  return (
    <Card className="border-teal-700/30 p-5">
      <h2 className="flex items-center gap-2 font-semibold"><Fingerprint size={16} className="text-teal-700" /> Open patient file by ABHA ID</h2>
      <p className="mt-1 text-xs opacity-60">Only patients registered at {defaultHospital ? "your hospital" : "a hospital you work at"} open. Every lookup is audit-logged.</p>
      <div className="mt-3 flex gap-2">
        <Input value={abha} onChange={(e) => setAbha(e.target.value)} placeholder="e.g. lakshmi@abdm" aria-label="Patient ABHA ID"
          onKeyDown={(e) => { if (e.key === "Enter") lookup(); }} />
        <Button onClick={lookup} disabled={busy}>{busy ? <Loader2 size={15} className="animate-spin" /> : "Find"}</Button>
      </div>
      {err && <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-100">{err}</p>}
      {found && (
        <div className="mt-3 rounded-2xl border border-[hsl(var(--border))] p-4">
          <p className="font-semibold">{found.name} <span className="text-xs font-normal opacity-60">• {found.mrn} • {found.age ? `${found.age}y ` : ""}{found.sex}</span></p>
          <p className="mt-1 text-xs opacity-60">Registered at: {found.visits.map((v) => v.hospital.name).join(", ") || "—"} • {found.consultations.length} visit(s)</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href={`/patients/${found.id}`}><Button size="sm">Open full file</Button></Link>
            {found.consultations[0] && <Link href={`/consultations/${found.consultations[0].id}/record`}><Button size="sm" variant="outline">Latest record</Button></Link>}
          </div>
        </div>
      )}
    </Card>
  );
}