import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { Badge, Card } from "@/components/ui/ui";
import { SettingsForm } from "@/components/settings-form";

export default async function SettingsPage() {
  const user = await getSession();
  if (!user) redirect("/login");
  const hospital = await prisma.hospitalSetting.findFirst();
  const hospitals = await prisma.hospital.findMany({ orderBy: { name: "asc" } });
  const myVisits = user.role === "PATIENT"
    ? await prisma.patientHospitalVisit.findMany({
        where: { patientId: user.patientId ?? (await prisma.patient.findUnique({ where: { abhaId: user.abhaId ?? "__none__" } }))?.id ?? "__none__" },
        include: { hospital: true },
      })
    : [];
  const aiOn = !!process.env.LLM_API_KEY;
  return (
    <AppShell user={user}>
      <h1 className="font-display text-3xl font-bold">Settings</h1>
      <p className="opacity-60">Profile, language, working hospital, branding, consent, and AI status (env-only).</p>
      <div className="mt-4"><Card className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm"><span><strong>AI provider:</strong> {aiOn ? `${process.env.LLM_MODEL} via server-side route` : "Built-in rule engine (no key configured)"}</span><Badge tone={aiOn ? "teal" : "amber"}>{aiOn ? "LLM active" : "Offline mode"}</Badge></Card></div>
      <div className="mt-4"><SettingsForm user={{ name: user.name, language: user.language }} hospital={hospital ? { hospitalName: hospital.hospitalName, tagline: hospital.tagline, consentText: hospital.consentText, escalationNote: hospital.escalationNote } : undefined} isAdmin={user.role === "ADMIN"} hospitals={hospitals} myHospitalId={user.hospitalId ?? null} myVisits={myVisits.map((v) => ({ id: v.hospital.id, name: v.hospital.name, city: v.hospital.city }))} isPatient={user.role === "PATIENT"} /></div>
    </AppShell>
  );
}
