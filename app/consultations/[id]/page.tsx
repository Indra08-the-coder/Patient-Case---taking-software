import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { Badge, Button } from "@/components/ui/ui";
import { ChatIntake } from "@/components/chat-intake";
import { ReviewControls } from "@/components/review-controls";

export default async function IntakePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) redirect("/login");
  if (user.role === "PATIENT") redirect("/my");
  const c = await prisma.consultation.findUnique({ where: { id: (await params).id }, include: { patient: { include: { visits: true } }, messages: { orderBy: { createdAt: "asc" } }, summary: true, redFlags: true } });
  if (!c) notFound();
  if (user.role !== "ADMIN") {
    if (!user.hospitalId || (c.hospitalId && c.hospitalId !== user.hospitalId)) redirect("/dashboard?denied=1");
    if (!c.hospitalId && !c.patient.visits.some((v) => v.hospitalId === user.hospitalId)) redirect("/dashboard?denied=1");
  }
  const draft = c.summary ? { chiefComplaint: c.summary.chiefComplaint, presentIllness: c.summary.presentIllness, pastMedicalHistory: c.summary.pastMedicalHistory, medicationHistory: c.summary.medicationHistory, allergies: c.summary.allergies, familyHistory: c.summary.familyHistory, socialHistory: c.summary.socialHistory, reviewOfSystems: c.summary.reviewOfSystems, missingInfo: c.summary.missingInfo, conciseSummary: c.summary.conciseSummary } : { chiefComplaint: c.chiefComplaint };
  return (
    <AppShell user={user}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="font-display text-2xl font-bold">{c.patient.name} — {c.chiefComplaint}</h1><p className="text-sm opacity-60">{c.patient.mrn} • {c.language} • {c.status}</p></div>
        <div className="no-print flex gap-2"><Badge>{c.status.replace("_", " ")}</Badge><Link href={`/consultations/${c.id}/record`}><Button size="sm" variant="outline">Open record</Button></Link></div>
      </div>
      <div className="mt-5"><ChatIntake consultationId={c.id} initialMessages={c.messages.map((m) => ({ role: m.role, content: m.content, language: m.language }))} initialDraft={draft as Record<string, string>} initialFlags={c.redFlags.map((f) => ({ label: f.label, detail: f.detail }))} lang={c.language} status={c.status} /></div>
      <div className="no-print mt-5"><ReviewControls id={c.id} status={c.status} notes={c.clinicianNotes} role={user.role} /></div>
    </AppShell>
  );
}
