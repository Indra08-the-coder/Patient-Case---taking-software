import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession, scopedHospitalId } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { Badge, Card } from "@/components/ui/ui";
import { HospitalSwitcher } from "@/components/hospital-switcher";
import Link from "next/link";

export default async function QueuePage() {
  const user = await getSession();
  if (!user) redirect("/login");
  if (user.role === "PATIENT") redirect("/my");
  const hid = await scopedHospitalId(user);
  const needsHospital = hid === "__none__";
  const scope = user.role === "ADMIN" ? {} : needsHospital ? { id: "__none__" } : { hospitalId: hid as string };
  const pScope = user.role === "ADMIN" ? {} : needsHospital ? { id: "__none__" } : { visits: { some: { hospitalId: hid as string } } };
  const [queue, patients] = await Promise.all([
    prisma.consultation.findMany({ where: { status: { in: ["DRAFT", "IN_PROGRESS"] }, ...scope }, orderBy: { updatedAt: "desc" }, take: 20, include: { patient: true, redFlags: true } }),
    prisma.patient.findMany({ where: pScope, orderBy: { updatedAt: "desc" }, take: 8 }),
  ]);
  return (
    <AppShell user={user}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="font-display text-3xl font-bold">Intake queue</h1><p className="opacity-60">Continue AI intake or register a new patient.</p></div>
        <Link href="/patients/new" className="rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white">+ New patient</Link>
      </div>
      <div className="mt-4"><HospitalSwitcher initialId={hid === "__none__" ? null : hid} /></div>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card className="p-5"><h2 className="font-semibold">Active ({queue.length})</h2>
          {queue.length === 0 ? <p className="mt-3 rounded-xl bg-[hsl(var(--muted))] p-4 text-sm">Queue clear.</p> :
          <ul className="mt-3 space-y-2">{queue.map((c) => (<li key={c.id}><Link href={`/consultations/${c.id}`} className="flex items-center justify-between rounded-xl border border-[hsl(var(--border))] px-4 py-3"><span><strong>{c.patient.name}</strong> <span className="text-xs opacity-60">{c.chiefComplaint}</span>{c.redFlags.length > 0 && <Badge tone="red" className="ml-2">{c.redFlags.length}</Badge>}</span><Badge>{c.status}</Badge></Link></li>))}</ul>}</Card>
        <Card className="p-5"><h2 className="font-semibold">Recently registered</h2>
          <ul className="mt-3 space-y-2 text-sm">{patients.map((p) => (<li key={p.id}><Link href={`/patients/${p.id}`} className="flex justify-between rounded-lg bg-[hsl(var(--muted))] px-3 py-2"><span>{p.name}</span><span className="opacity-60">{p.mrn}</span></Link></li>))}</ul></Card>
      </div>
    </AppShell>
  );
}
