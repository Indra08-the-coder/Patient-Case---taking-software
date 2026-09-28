import { redirect } from "next/navigation";
import Link from "next/link";
import { FileText, Fingerprint } from "lucide-react";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { Badge, Card } from "@/components/ui/ui";
import { Disclaimer, RedFlagBanner } from "@/components/disclaimer";

export default async function MyHealth() {
  const user = await getSession();
  if (!user) redirect("/login?next=/my");
  if (user.role !== "PATIENT") redirect("/dashboard");

  const record = user.patientId
    ? await prisma.patient.findUnique({ where: { id: user.patientId }, include: { consultations: { orderBy: { updatedAt: "desc" }, include: { redFlags: true, summary: true } } } })
    : await prisma.patient.findUnique({ where: { abhaId: user.abhaId ?? "__none__" }, include: { consultations: { orderBy: { updatedAt: "desc" }, include: { redFlags: true, summary: true } } } });
  if (!record) redirect("/dashboard");

  const visits = record.consultations;
  const urgent = visits.flatMap((c) => c.redFlags.filter((f) => f.severity === "URGENT"));
  const meds = visits.map((c) => c.summary?.medicationHistory).filter(Boolean) as string[];
  return (
    <AppShell user={user}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Badge tone="teal"><span className="inline-flex items-center gap-1"><Fingerprint size={11} /> ABHA verified • {user.abhaId}</span></Badge>
          <h1 className="mt-2 font-display text-3xl font-bold">Namaste, {record.name.split(" ")[0]} — your health file</h1>
          <p className="text-sm opacity-60">{record.mrn} • {record.age ? `${record.age}y` : ""} {record.sex} • {record.location ?? ""}</p>
        </div>
        <Link href="/my/consultations" className="rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white">View all visits</Link>
      </div>

      <div className="mt-4"><RedFlagBanner count={urgent.length} /></div>

      <div className="mt-4 grid gap-4 sm:grid-cols-4">
        {[["Visits", String(visits.length)], ["Urgent alerts", String(urgent.length)], ["Allergies", record.allergies ? "On file" : "Confirm"], ["Consent", record.consentGiven ? "Given" : "Pending"]].map(([l, v]) => (
          <Card key={l} className="p-5"><p className="text-xs uppercase tracking-widest opacity-60">{l}</p><p className="mt-1 font-display text-2xl font-bold">{v}</p></Card>
        ))}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="flex items-center gap-2 font-semibold"><FileText size={16} /> Recent visits</h2>
          {visits.length === 0 ? <p className="mt-3 rounded-xl bg-[hsl(var(--muted))] p-4 text-sm">No visits yet. Ask reception to start your AI intake at your next OPD visit.</p> :
          <ul className="mt-3 space-y-2">{visits.slice(0, 5).map((c) => (
            <li key={c.id}><Link href={`/my/consultations/${c.id}`} className="flex items-center justify-between gap-2 rounded-xl border border-[hsl(var(--border))] px-4 py-3 hover:border-teal-600">
              <span><strong className="text-sm">{c.chiefComplaint || "Consultation"}</strong><span className="block text-xs opacity-60">{new Date(c.updatedAt).toLocaleString("en-IN")} • {c.status.replace("_", " ")}</span></span>
              <span className="flex gap-1.5"><Badge>{c.status.replace("_", " ")}</Badge>{c.redFlags.length > 0 && <Badge tone="red">{c.redFlags.length}</Badge>}</span>
            </Link></li>))}</ul>}
        </Card>
        <div className="space-y-5">
          <Card className="p-5"><h2 className="font-semibold">Allergies & medications</h2>
            <p className="mt-2 text-sm"><strong>Allergies:</strong> {record.allergies || "NKDA — please confirm with your doctor"}</p>
            <p className="mt-2 text-sm"><strong>Current medicines (from last summaries):</strong></p>
            {meds.length === 0 ? <p className="text-sm opacity-60">No medication summaries yet.</p> :
            <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">{meds.slice(0, 3).map((m, i) => (<li key={i}>{m.slice(0, 160)}</li>))}</ul>}
            <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs text-amber-900 dark:bg-amber-950/30 dark:text-amber-100">Medicines shown are documentation only — never start, stop, or change doses without your doctor.</p>
          </Card>
          <Card className="p-5"><h2 className="font-semibold">Your ABHA</h2>
            <p className="mt-2 text-sm">ID: <strong>{record.abhaId ?? user.abhaId}</strong> • {record.abhaVerified ? "Verified ✓" : "Unverified"}</p>
            <p className="mt-1 text-xs opacity-60">ABHA links your visits across ABDM-ready hospitals. Consent is captured before every AI intake.</p></Card>
        </div>
      </div>
      <div className="mt-5"><Disclaimer compact /></div>
    </AppShell>
  );
}
