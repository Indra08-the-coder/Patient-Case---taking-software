"use client";
import * as React from "react";
import { Building2 } from "lucide-react";
import { Card, Select } from "./ui/ui";
import { toast } from "./ui/toaster";

type Hospital = { id: string; name: string; city: string; code: string };

export function HospitalSwitcher({ initialId }: { initialId?: string | null }) {
  const [hospitals, setHospitals] = React.useState<Hospital[]>([]);
  const [mine, setMine] = React.useState(initialId ?? "");
  const [busy, setBusy] = React.useState(false);
  React.useEffect(() => {
    fetch("/api/hospitals").then((r) => r.json()).then((j) => {
      if (j.hospitals) setHospitals(j.hospitals);
      if (j.mine) setMine(j.mine);
    }).catch(() => {});
  }, []);
  async function pick(id: string) {
    if (!id) return;
    setBusy(true);
    try {
      const r = await fetch("/api/hospitals", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hospitalId: id }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Switch failed");
      setMine(id);
      toast(`Working at ${j.hospital.name}. Dashboard rescoped.`);
      window.location.reload();
    } catch (e) { toast(e instanceof Error ? e.message : "Failed"); }
    finally { setBusy(false); }
  }
  if (hospitals.length === 0) return null;
  return (
    <Card className="flex flex-wrap items-center gap-3 p-4">
      <span className="flex items-center gap-2 text-sm font-semibold"><Building2 size={16} className="text-teal-700" /> Working hospital</span>
      <Select value={mine} onChange={(e) => pick(e.target.value)} disabled={busy} aria-label="Select working hospital" className="max-w-xs">
        <option value="">— Select hospital —</option>
        {hospitals.map((h) => (<option key={h.id} value={h.id}>{h.name} • {h.city}</option>))}
      </Select>
      {!mine && <span className="text-xs font-semibold text-amber-700">Pick a hospital to unlock your patient list.</span>}
    </Card>
  );
}