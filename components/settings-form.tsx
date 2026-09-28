"use client";
import * as React from "react";
import { Button, Card, Input, Label, Select, Textarea } from "@/components/ui/ui";
import { LanguageSelect } from "@/components/language-select";
import { toast } from "@/components/ui/toaster";

type Hosp = { id: string; name: string; city: string };

export function SettingsForm({ user, hospital, isAdmin, hospitals, myHospitalId, myVisits, isPatient }: {
  user: { name: string; language: string };
  hospital?: { hospitalName: string; tagline: string; consentText: string; escalationNote: string };
  isAdmin: boolean; hospitals: Hosp[]; myHospitalId?: string | null;
  myVisits?: Hosp[]; isPatient?: boolean;
}) {
  const [name, setName] = React.useState(user.name);
  const [lang, setLang] = React.useState(user.language);
  const [workHosp, setWorkHosp] = React.useState(myHospitalId ?? "");
  const [h, setH] = React.useState({ hospitalName: hospital?.hospitalName ?? "CityCare General Hospital", tagline: hospital?.tagline ?? "", consentText: hospital?.consentText ?? "", escalationNote: hospital?.escalationNote ?? "" });
  const [busy, setBusy] = React.useState(false);
  async function save() {
    setBusy(true);
    try {
      const r = await fetch("/api/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, language: lang, hospitalId: isPatient ? undefined : workHosp || undefined, hospital: h }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Failed");
      toast("Settings saved — dashboard rescoped.");
      window.location.reload();
    } catch (e) { toast(e instanceof Error ? e.message : "Failed"); }
    finally { setBusy(false); }
  }
  async function linkHospital(id: string) {
    if (!id) return;
    const r = await fetch("/api/hospitals", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hospitalId: id }) });
    const j = await r.json();
    if (!r.ok) { toast(j.error ?? "Failed"); return; }
    toast(`Linked to ${j.hospital.name}. Their doctors can now see your file.`);
    window.location.reload();
  }
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="space-y-3 p-5"><h2 className="font-semibold">Profile & language</h2>
        <div><Label htmlFor="s-name">Display name</Label><Input id="s-name" value={name} onChange={(e) => setName(e.target.value)} /></div>
        <LanguageSelect value={lang} onChange={setLang} id="s-lang" />
        {!isPatient && (
          <div><Label htmlFor="s-work">Working hospital</Label>
            <Select id="s-work" value={workHosp} onChange={(e) => setWorkHosp(e.target.value)}>
              <option value="">— Select —</option>
              {hospitals.map((x) => (<option key={x.id} value={x.id}>{x.name} • {x.city}</option>))}
            </Select>
            <p className="mt-1 text-xs opacity-60">Your dashboard, patients, queue and flags follow this hospital.</p></div>
        )}
        {isPatient && (
          <div><p className="text-xs font-bold uppercase tracking-widest opacity-60">My hospitals (consent links)</p>
            <ul className="mt-1 space-y-1 text-sm">{(myVisits ?? []).map((v) => (<li key={v.id} className="rounded-lg bg-[hsl(var(--muted))] px-3 py-2">{v.name} • {v.city}</li>))}
              {(myVisits ?? []).length === 0 && <li className="opacity-60">No hospital linked yet.</li>}</ul>
            <div className="mt-2 flex gap-2">
              <Select id="s-link" defaultValue="" onChange={(e) => linkHospital(e.target.value)} aria-label="Link another hospital">
                <option value="">+ Link another hospital…</option>
                {hospitals.filter((x) => !(myVisits ?? []).some((v) => v.id === x.id)).map((x) => (<option key={x.id} value={x.id}>{x.name} • {x.city}</option>))}
              </Select></div></div>
        )}
        <p className="text-xs opacity-60">AI keys are managed only via environment variables — never in this UI.</p>
      </Card>
      <Card className="space-y-3 p-5"><h2 className="font-semibold">Hospital branding & consent {isAdmin ? "" : "(admin only)"}</h2>
        <div><Label htmlFor="s-h">Hospital name</Label><Input id="s-h" disabled={!isAdmin} value={h.hospitalName} onChange={(e) => setH({ ...h, hospitalName: e.target.value })} /></div>
        <div><Label htmlFor="s-t">Tagline</Label><Input id="s-t" disabled={!isAdmin} value={h.tagline} onChange={(e) => setH({ ...h, tagline: e.target.value })} /></div>
        <div><Label htmlFor="s-c">Consent text</Label><Textarea id="s-c" disabled={!isAdmin} value={h.consentText} onChange={(e) => setH({ ...h, consentText: e.target.value })} /></div>
        <div><Label htmlFor="s-e">Escalation note</Label><Textarea id="s-e" disabled={!isAdmin} value={h.escalationNote} onChange={(e) => setH({ ...h, escalationNote: e.target.value })} /></div>
      </Card>
      <div><Button onClick={save} disabled={busy}>{busy ? "Saving…" : "Save settings"}</Button></div>
    </div>
  );
}
