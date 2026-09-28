import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { Badge, Card } from "@/components/ui/ui";
import { Disclaimer, RedFlagBanner } from "@/components/disclaimer";

export default async function MyVisitDetail({ params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) redirect("/login");
  if (user.role !== "PATIENT") redirect("/dashboard");
  const c = await prisma.consultation.findUnique({ where: { id: (await params).id }, include: { patient: true, summary: true, redFlags: true, messages: { orderBy: { createdAt: "asc" } } } });
  if (!c) notFound();
  // Ownership: must belong to this patient's record
  if (user.patientId !== c.patientId && user.abhaId !== c.patient.abhaId) redirect("/my");
  const s = c.summary;
  const rows: [string, string][] = [
    ["Chief complaint", s?.chiefComplaint ?? c.chiefComplaint],
    ["What happened (present illness)", s?.presentIllness ?? c.aiSummary],
    ["Past illnesses", s?.pastMedicalHistory ?? "—"],
    ["Medicines", s?.medicationHistory ?? "—"],
    ["Allergies", s?.allergies ?? c.patient.allergies ?? "—"],
    ["Family history", s?.familyHistory ?? "—"],
    ["Lifestyle (social)", s?.socialHistory ?? "—"],
    ["Other symptoms reviewed", s?.reviewOfSystems ?? "—"],
    ["Doctor's summary", s?.conciseSummary ?? c.aiSummary ?? "—"],
  ];
  return (
    <AppShell user={user}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div><h1 className="font-display text-2xl font-bold">{c.chiefComplaint || "Visit"}</h1><p className="text-sm opacity-60">{new Date(c.updatedAt).toLocaleString("en-IN")} • {c.status.replace("_", " ")}</p></div>
        <span className="flex gap-2"><Badge>{c.status.replace("_", " ")}</Badge><Link href="/my" className="text-sm font-semibold text-teal-700">← My health</Link></span>
      </div>
      <div className="mt-4 space-y-4">
        <RedFlagBanner count={c.redFlags.length} />
        <Card className="divide-y divide-[hsl(var(--border))]">
          {rows.map(([l, v]) => (<div key={l} className="p-4"><p className="text-[11px] font-bold uppercase tracking-widest opacity-60">{l}</p><p className="mt-1 text-sm leading-relaxed">{v || "—"}</p></div>))}
        </Card>
        {c.redFlags.length > 0 && <Card className="p-4"><h2 className="font-semibold">Alerts from this visit</h2><ul className="mt-2 space-y-2 text-sm">{c.redFlags.map((f) => (<li key={f.id} className="rounded-xl bg-red-50 p-3 dark:bg-red-950/40"><strong>{f.label}</strong><span className="block text-xs opacity-70">{f.detail} — please follow your doctor's advice.</span></li>))}</ul></Card>}
        <Disclaimer compact />
        <p className="text-xs opacity-60">Clinician notes are private to the care team and not shown here. For corrections, contact the hospital medical-records desk.</p>
      </div>
    </AppShell>
  );
}
