"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label } from "@/components/ui/ui";
import { toast } from "@/components/ui/toaster";
import { HospitalSearch } from "@/components/hospital-search";

type Hospital = { id: string; name: string; city: string; code: string };

export function AbhaForm() {
  const router = useRouter();
  const [abhaId, setAbhaId] = React.useState("");
  const [otp, setOtp] = React.useState("");
  const [step, setStep] = React.useState<1 | 2>(1);
  const [hint, setHint] = React.useState("");
  const [hospitals, setHospitals] = React.useState<Hospital[]>([]);
  const [hospitalId, setHospitalId] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  async function requestOtp() {
    if (abhaId.trim().length < 6) { toast("Enter a valid ABHA ID."); return; }
    setLoading(true);
    try {
      const r = await fetch("/api/auth/abha", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ abhaId: abhaId.trim() }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "ABHA lookup failed");
      setHint(`Demo OTP: ${j.demoOtp} (production sends SMS to linked mobile)`);
      setHospitals(j.hospitals ?? []);
      if (j.myHospitals?.[0]) setHospitalId(j.myHospitals[0].id);
      else if (j.hospitals?.[0]) setHospitalId(j.hospitals[0].id);
      setStep(2); toast(j.message ?? "OTP sent. Pick your hospital.");
    } catch (e) { toast(e instanceof Error ? e.message : "Failed"); }
    finally { setLoading(false); }
  }
  async function verify() {
    if (!/^[0-9]{6}$/.test(otp)) { toast("Enter the 6-digit OTP."); return; }
    if (!hospitalId) { toast("Select the hospital you are visiting."); return; }
    setLoading(true);
    try {
      const r = await fetch("/api/auth/abha", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ abhaId: abhaId.trim(), otp, hospitalId }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "OTP failed");
      toast(`ABHA verified${j.hospital ? ` — linked to ${j.hospital.name}` : ""}!`);
      router.push("/my"); router.refresh();
    } catch (e) { toast(e instanceof Error ? e.message : "Failed"); }
    finally { setLoading(false); }
  }
  if (step === 2) return (
    <div className="space-y-4">
      {hint && <p className="rounded-xl bg-teal-50 p-3 text-xs font-semibold text-teal-900">{hint}</p>}
      <div><Label htmlFor="abha-hosp">Hospital you are visiting *</Label>
        <HospitalSearch id="abha-hosp" hospitals={hospitals} value={hospitalId} onChange={setHospitalId}
          placeholder="Search hospital name or city — e.g. Bangalore, Delhi…" />
        <p className="mt-1 text-xs opacity-60">Type to filter — matching hospitals pop up as you type. This connects your file to that hospital&apos;s doctor dashboard (with your consent).</p></div>
      <div><Label htmlFor="otp">6-digit OTP for {abhaId}</Label><Input id="otp" inputMode="numeric" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="123456" /></div>
      <Button className="w-full" onClick={verify} disabled={loading}>{loading ? "Verifying…" : "Verify & open my file"}</Button>
      <button className="w-full text-center text-xs font-semibold text-teal-700" onClick={() => setStep(1)}>Change ABHA ID</button>
    </div>
  );
  return (
    <div className="space-y-4">
      <div><Label htmlFor="abhaId">ABHA ID / ABHA number</Label><Input id="abhaId" value={abhaId} onChange={(e) => setAbhaId(e.target.value)} placeholder="e.g. lakshmi@abdm" />
        <p className="mt-1 text-xs opacity-60">Demo: <button type="button" className="font-semibold text-teal-700" onClick={() => setAbhaId("lakshmi@abdm")}>lakshmi@abdm</button> then OTP 123456</p></div>
      <Button className="w-full" onClick={requestOtp} disabled={loading}>{loading ? "Sending OTP…" : "Send OTP"}</Button>
    </div>
  );
}
