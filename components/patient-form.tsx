"use client";
import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Button, Card, Input, Label, Select, Textarea } from "@/components/ui/ui";
import { LanguageSelect } from "@/components/language-select";
import { toast } from "@/components/ui/toaster";
import { patientSchema } from "@/lib/validators";
import { Disclaimer } from "@/components/disclaimer";

export function PatientForm({ initial, id, hospitals, defaultHospitalId }: { initial?: Record<string, unknown>; id?: string; hospitals?: { id: string; name: string; city: string }[]; defaultHospitalId?: string | null }) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [lang, setLang] = React.useState(String(initial?.language ?? "en"));
  const [hospitalId, setHospitalId] = React.useState(String((initial as { hospitalId?: string } | undefined)?.hospitalId ?? defaultHospitalId ?? ""));
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(patientSchema), defaultValues: { sex: "UNKNOWN" as const, language: "en", allergies: "", consentGiven: false, ...(initial as object ?? {}) } });
  async function onSubmit(v: Record<string, unknown>) {
    setLoading(true);
    try {
      const r = await fetch(id ? `/api/patients/${id}` : "/api/patients", { method: id ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...v, language: lang, hospitalId: hospitalId || undefined }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Save failed");
      toast(id ? "Patient updated." : "Patient registered at your hospital.");
      router.push(`/patients/${j.patient.id}`); router.refresh();
    } catch (e) { toast(e instanceof Error ? e.message : "Failed"); }
    finally { setLoading(false); }
  }
  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2" noValidate>
        <div><Label htmlFor="name">Full name *</Label><Input id="name" {...register("name")} />{errors.name && <p className="text-xs text-red-600">{String(errors.name.message)}</p>}</div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label htmlFor="age">Age</Label><Input id="age" type="number" {...register("age")} /></div>
          <div><Label htmlFor="sex">Sex</Label><Select id="sex" {...register("sex")}><option value="MALE">Male</option><option value="FEMALE">Female</option><option value="OTHER">Other</option><option value="UNKNOWN">Unknown</option></Select></div>
        </div>
        <div><Label htmlFor="phone">Phone</Label><Input id="phone" {...register("phone")} placeholder="10-digit mobile" /></div>
        <div><Label htmlFor="mrn">Medical record number</Label><Input id="mrn" {...register("mrn")} placeholder="Auto-generated if blank" /></div>
        <div><Label htmlFor="location">Location</Label><Input id="location" {...register("location")} placeholder="Area, City" /></div>
        <div><LanguageSelect value={lang} onChange={setLang} /></div>
        {!id && hospitals && hospitals.length > 0 && (
          <div><Label htmlFor="pf-hosp">Register at hospital *</Label>
            <Select id="pf-hosp" value={hospitalId} onChange={(e) => setHospitalId(e.target.value)}>
              <option value="">— Select —</option>
              {hospitals.map((h) => (<option key={h.id} value={h.id}>{h.name} • {h.city}</option>))}
            </Select></div>
        )}
        <div><Label htmlFor="abha">ABHA ID (optional — links patient file across hospitals)</Label><Input id="abha" {...register("abhaId")} placeholder="e.g. lakshmi@abdm" />{errors.abhaId && <p className="text-xs text-red-600">{String(errors.abhaId.message)}</p>}</div>
        <div className="sm:col-span-2"><Label htmlFor="allergies">Known allergies</Label><Textarea id="allergies" {...register("allergies")} placeholder="e.g. Penicillin — rash. Write NKDA if none known." /></div>
        <div><Label htmlFor="emergencyName">Emergency contact name</Label><Input id="emergencyName" {...register("emergencyName")} /></div>
        <div><Label htmlFor="emergencyPhone">Emergency contact phone</Label><Input id="emergencyPhone" {...register("emergencyPhone")} /></div>
        <label className="flex items-start gap-2 rounded-xl bg-[hsl(var(--muted))] p-3 text-sm sm:col-span-2"><input type="checkbox" className="mt-1" {...register("consentGiven")} /> Consent to AI-assisted history documentation (required before AI intake).</label>
        <div className="sm:col-span-2"><Disclaimer compact /></div>
        <div className="sm:col-span-2"><Button className="w-full sm:w-auto" disabled={loading}>{loading ? "Saving…" : id ? "Save changes" : "Register patient"}</Button></div>
      </form>
    </Card>
  );
}
