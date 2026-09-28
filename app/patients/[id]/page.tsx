import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { Badge, Button, Card } from "@/components/ui/ui";
import { StartConsultation } from "@/components/start-consultation";

export default async function PatientDetail({ params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) redirect("/login");
  if (user.role === "PATIENT") redirect("/my");
  const p = await prisma.patient.findUnique({ where: { id: (await params).id }, include: { visits: { include: { hospital: true } }, consultations: { orderBy: { updatedAt: "desc" }, include: { redFlags: true, _count: { select: { messages: true } } } }, pastIllnesses: { orderBy: { createdAt: "desc" } }, documents: { orderBy: { createdAt: "desc" } }, voiceNotes: { orderBy: { createdAt: "desc" } } } });
  if (!p) notFound();
  if (user.role !== "ADMIN") {
    if (!user.hospitalId) redirect("/dashboard?need=hospital");
    if (!p.visits.some((v) => v.hospitalId === user.hospitalId)) redirect("/dashboard?denied=1");
  }
  return (
    <AppShell user={user}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h1 className="font-display text-3xl font-bold">{p.name}</h1><p className="text-sm opacity-60">{p.mrn} • {p.age ? `${p.age}y` : "—"} • {p.sex} • {p.location ?? "—"} • {p.phone ?? "—"}</p>
          <p className="mt-1 text-xs">{p.abhaId ? <span className="font-semibold text-teal-700">ABHA: {p.abhaId}{p.abhaVerified ? " ✓" : ""}</span> : <span className="opacity-60">No ABHA linked</span>} • <span className="opacity-60">{p.visits.map((v) => v.hospital.name).join(", ")}</span></p></div>
        <div className="no-print flex gap-2"><Link href={`/patients/${p.id}/edit`}><Button variant="outline" size="sm">Edit profile</Button></Link></div>
      </div>
      {p.allergies && <p className="mt-3 rounded-xl border border-amber-500/30 bg-amber-50 p-3 text-sm dark:bg-amber-950/30"><strong>Allergies:</strong> {p.allergies}</p>}
      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Card className="p-5"><h2 className="font-semibold">Profile</h2>
          <dl className="mt-3 space-y-2 text-sm"><div className="flex justify-between"><dt className="opacity-60">Language</dt><dd className="font-medium">{p.language}</dd></div><div className="flex justify-between"><dt className="opacity-60">Emergency</dt><dd className="font-medium">{p.emergencyName ?? "—"} {p.emergencyPhone ?? ""}</dd></div><div className="flex justify-between"><dt className="opacity-60">Consent</dt><dd>{p.consentGiven ? <Badge tone="teal">Given</Badge> : <Badge tone="amber">Pending</Badge>}</dd></div></dl>
          <div className="no-print mt-4"><StartConsultation patientId={p.id} consent={p.consentGiven} /></div>
        </Card>
        <Card className="p-5 lg:col-span-2"><h2 className="font-semibold">Consultation timeline ({p.consultations.length})</h2>
          {p.consultations.length === 0 ? <p className="mt-3 rounded-xl bg-[hsl(var(--muted))] p-4 text-sm">No consultations yet — start the first AI intake.</p> :
          <ol className="mt-3 space-y-2">{p.consultations.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[hsl(var(--border))] px-4 py-3">
              <div><Link href={`/consultations/${c.id}`} className="font-medium hover:text-teal-700">{c.chiefComplaint || "Untitled consultation"}</Link><p className="text-xs opacity-60">{new Date(c.updatedAt).toLocaleString("en-IN")} • {c._count.messages} turns • {Math.round(c.progress)}%</p></div>
              <span className="flex gap-2"><Badge>{c.status.replace("_", " ")}</Badge>{c.redFlags.length > 0 && <Badge tone="red">{c.redFlags.length} flags</Badge>}<Link href={`/consultations/${c.id}/record`} className="text-xs font-semibold text-teal-700">Record →</Link></span>
            </li>))}</ol>}</Card>
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Card className="p-5"><h2 className="font-semibold">Past diseases (patient-entered)</h2>
          {p.pastIllnesses.length === 0 ? <p className="mt-2 text-sm opacity-60">None recorded.</p> :
          <ul className="mt-2 space-y-2 text-sm">{p.pastIllnesses.map((i) => (<li key={i.id} className="rounded-xl bg-[hsl(var(--muted))] px-3 py-2"><strong>{i.condition}</strong> <span className="text-xs opacity-60">• {i.status}{i.diagnosedOn ? ` since ${i.diagnosedOn}` : ""}</span>{i.notes && <span className="block text-xs opacity-70">{i.notes}</span>}</li>))}</ul>}
        </Card>
        <Card className="p-5"><h2 className="font-semibold">Scanned documents ({p.documents.length})</h2>
          {p.documents.length === 0 ? <p className="mt-2 text-sm opacity-60">No scans yet.</p> :
          <ul className="mt-2 space-y-2 text-sm">{p.documents.slice(0, 5).map((d) => (<li key={d.id} className="rounded-xl bg-[hsl(var(--muted))] px-3 py-2"><strong>{d.title}</strong><span className="block text-xs opacity-60">{d.fileName} • OCR: {d.ocrStatus}</span>{d.ocrText && <span className="mt-1 block max-h-20 overflow-auto whitespace-pre-wrap text-xs opacity-80">{d.ocrText.slice(0, 300)}</span>}</li>))}</ul>}
        </Card>
        <Card className="p-5"><h2 className="font-semibold">Voice notes ({p.voiceNotes.length})</h2>
          {p.voiceNotes.length === 0 ? <p className="mt-2 text-sm opacity-60">No voice notes yet.</p> :
          <ul className="mt-2 space-y-2 text-sm">{p.voiceNotes.slice(0, 5).map((v) => (<li key={v.id} className="rounded-xl bg-[hsl(var(--muted))] px-3 py-2"><strong>{v.title}</strong><span className="block text-xs opacity-60">{v.durationSec}s • {v.language}</span>{v.transcript && <span className="mt-1 block text-xs opacity-80">{v.transcript.slice(0, 200)}</span>}{v.audioData && <audio className="mt-2 w-full" controls src={v.audioData} />}</li>))}</ul>}
        </Card>
      </div>
    </AppShell>
  );
}
