import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { Badge, Button, Card } from "@/components/ui/ui";
import { Disclaimer, RedFlagBanner } from "@/components/disclaimer";
import { RecordEditor } from "@/components/record-editor";

export default async function RecordPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) redirect("/login");
  if (user.role === "PATIENT") redirect("/my");
  const c = await prisma.consultation.findUnique({ where: { id: (await params).id }, include: { patient: { include: { visits: true } }, summary: true, redFlags: true, notes: true, auditLogs: { orderBy: { createdAt: "desc" }, take: 20 } } });
  if (!c) notFound();
  if (user.role !== "ADMIN") {
    if (!user.hospitalId || (c.hospitalId && c.hospitalId !== user.hospitalId)) redirect("/dashboard?denied=1");
    if (!c.hospitalId && !c.patient.visits.some((v) => v.hospitalId === user.hospitalId)) redirect("/dashboard?denied=1");
  }
  const s = c.summary;
  const summary = { chiefComplaint: s?.chiefComplaint ?? c.chiefComplaint, presentIllness: s?.presentIllness ?? "", pastMedicalHistory: s?.pastMedicalHistory ?? "", medicationHistory: s?.medicationHistory ?? "", allergies: s?.allergies ?? c.patient.allergies, familyHistory: s?.familyHistory ?? "", socialHistory: s?.socialHistory ?? "", reviewOfSystems: s?.reviewOfSystems ?? "", redFlagSummary: s?.redFlagSummary ?? c.redFlags.map((f) => f.label).join("; "), missingInfo: s?.missingInfo ?? "", conciseSummary: s?.conciseSummary ?? c.aiSummary };
  return (
    <AppShell user={user}>
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="font-display text-2xl font-bold">Consultation record</h1><p className="text-sm opacity-60">{c.patient.name} • {c.patient.mrn} • {new Date(c.createdAt).toLocaleString("en-IN")}</p></div>
        <div className="flex gap-2"><Badge tone={c.status === "APPROVED" ? "teal" : "navy"}>{c.status.replace("_", " ")}</Badge><Link href={`/consultations/${c.id}`}><Button size="sm" variant="outline">Continue intake</Button></Link></div>
      </div>
      <div className="print-only mt-4"><h1 style={{ fontSize: 22, fontWeight: 800 }}>ClinIQ History — Consultation Record</h1><p>{c.patient.name} • {c.patient.mrn} • {new Date(c.createdAt).toLocaleString("en-IN")} • Status: {c.status}</p><hr /></div>
      <div className="mt-4 space-y-4">
        <RedFlagBanner count={c.redFlags.length} />
        <Disclaimer compact />
        <RecordEditor id={c.id} summary={summary} notes={c.clinicianNotes} />
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="p-5"><h2 className="font-semibold">Red flags ({c.redFlags.length})</h2>
            {c.redFlags.length === 0 ? <p className="mt-2 text-sm opacity-60">None flagged.</p> :
            <ul className="mt-2 space-y-2 text-sm">{c.redFlags.map((f) => (<li key={f.id} className="rounded-xl bg-red-50 p-3 dark:bg-red-950/40"><strong>{f.label}</strong><span className="block text-xs opacity-70">{f.detail} • {f.severity}</span></li>))}</ul>}</Card>
          <Card className="p-5"><h2 className="font-semibold">Audit trail</h2>
            <ul className="mt-2 max-h-64 space-y-1.5 overflow-auto text-xs">{c.auditLogs.map((a) => (<li key={a.id} className="rounded-lg border border-[hsl(var(--border))] px-2.5 py-1.5"><strong>{a.action}</strong> • {new Date(a.createdAt).toLocaleString("en-IN")}</li>))}</ul></Card>
        </div>
      </div>
    </AppShell>
  );
}
