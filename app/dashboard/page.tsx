import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession, scopedHospitalId } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { Badge, Card } from "@/components/ui/ui";
import { RedFlagBanner } from "@/components/disclaimer";
import { DoctorCharts } from "@/components/doctor-charts";
import { HospitalSwitcher } from "@/components/hospital-switcher";
import { AbhaLookup } from "@/components/abha-lookup";
import Link from "next/link";

export default async function Dashboard() {
  const user = await getSession();
  if (!user) redirect("/login");
  if (user.role === "ADMIN") {
    const [users, audits, u, p, c, r, hospitals] = await Promise.all([
      prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 20, include: { hospital: true } }),
      prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 20, include: { actor: true } }),
      prisma.user.count(), prisma.patient.count(), prisma.consultation.count(), prisma.redFlag.count(),
      prisma.hospital.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { staff: true, visits: true } } } }),
    ]);
    return (
      <AppShell user={user}>
        <h1 className="font-display text-3xl font-bold">Admin overview</h1>
        <div className="mt-5 grid gap-4 sm:grid-cols-4">
          {[["Users", u], ["Patients", p], ["Consultations", c], ["Red flags", r]].map(([l, v]) => (
            <Card key={String(l)} className="p-5"><p className="text-xs uppercase tracking-widest opacity-60">{l}</p><p className="font-display text-3xl font-bold">{v}</p></Card>
          ))}
        </div>
        <Card className="mt-5 p-5"><h2 className="font-semibold">Hospitals ({hospitals.length})</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">{hospitals.map((h) => (
            <li key={h.id} className="rounded-xl bg-[hsl(var(--muted))] px-4 py-3 text-sm"><strong>{h.name}</strong><span className="block text-xs opacity-60">{h.city} • {h._count.staff} staff • {h._count.visits} patients</span></li>))}</ul></Card>
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <Card className="p-5"><h2 className="font-semibold">Users</h2>
            <ul className="mt-3 space-y-2 text-sm">{users.map((x) => (<li key={x.id} className="flex justify-between rounded-lg bg-[hsl(var(--muted))] px-3 py-2"><span>{x.name}<span className="block text-xs opacity-60">{x.hospital?.name ?? "All"}</span></span><Badge tone="navy">{x.role}</Badge></li>))}</ul>
            <Link href="/admin" className="mt-3 inline-block text-sm font-semibold text-teal-700">Open admin console</Link></Card>
          <Card className="p-5"><h2 className="font-semibold">Audit log</h2>
            <ul className="mt-3 max-h-72 space-y-2 overflow-auto text-xs">{audits.map((a) => (<li key={a.id} className="rounded-lg border border-[hsl(var(--border))] px-3 py-2"><strong>{a.action}</strong> {a.entity} <span className="opacity-60">{a.actor?.name ?? "system"}</span></li>))}</ul></Card>
        </div>
      </AppShell>
    );
  }
  return <DoctorDash user={user} />;
}
async function DoctorDash({ user }: { user: { id: string; name: string; role: string; hospitalId?: string | null; hospital?: { id: string; name: string } | null } }) {
  const hid = await scopedHospitalId(user);
  const needsHospital = hid === "__none__";
  const cWhere = hid && hid !== "__none__" ? { hospitalId: hid } : {};
  const pWhere = hid && hid !== "__none__" ? { visits: { some: { hospitalId: hid } } } : {};
  const [active, pending, flags, recent, byStatus, week, myPatients] = needsHospital ? [0, 0, [], [], [], 0, 0] as const : await Promise.all([
    prisma.consultation.count({ where: { status: { in: ["DRAFT", "IN_PROGRESS"] }, ...cWhere } }),
    prisma.consultation.count({ where: { status: "AWAITING_REVIEW", ...cWhere } }),
    prisma.redFlag.findMany({
      where: hid && hid !== "__none__" ? { acknowledged: false, consultation: { hospitalId: hid } } : { acknowledged: false },
      orderBy: { createdAt: "desc" }, take: 6, include: { consultation: { include: { patient: true } } },
    }),
    prisma.consultation.findMany({ where: cWhere, orderBy: { updatedAt: "desc" }, take: 8, include: { patient: true, redFlags: true } }),
    prisma.consultation.groupBy({ by: ["status"], where: cWhere, _count: true }),
    prisma.consultation.count({ where: { createdAt: { gte: new Date(Date.now() - 7 * 864e5) }, ...cWhere } }),
    prisma.patient.count({ where: pWhere }),
  ]);
  const hName = user.hospital?.name ?? ((hid && hid !== "__none__") ? (await prisma.hospital.findUnique({ where: { id: hid as string } }))?.name ?? null : null);
  return (
    <AppShell user={user}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Namaste, {user.name.split(" ")[0]}.</h1>
          <p className="opacity-60">{hName ? <><strong>{hName}</strong> — hospital-scoped dashboard.</> : "Pick your working hospital."}</p>
        </div>
        {hName && <Badge tone="teal">{hName}</Badge>}
      </div>
      <div className="mt-4"><HospitalSwitcher initialId={hid === "__none__" ? null : hid} /></div>
      {needsHospital ? (
        <Card className="mt-5 p-10 text-center"><p className="font-semibold">No hospital selected</p><p className="mt-1 text-sm opacity-60">Select your working hospital above.</p></Card>
      ) : (
        <>
          <div className="mt-5"><AbhaLookup defaultHospital={hName} /></div>
          <div className="mt-3"><RedFlagBanner count={flags.filter((f) => f.severity === "URGENT").length} /></div>
          <div className="mt-5 grid gap-4 sm:grid-cols-5">
            {[["My patients", myPatients], ["Active", active], ["Pending review", pending], ["Urgent flags", flags.length], ["This week", week]].map(([l, v]) => (
              <Card key={String(l)} className="p-5"><p className="text-xs uppercase tracking-widest opacity-60">{l}</p><p className="font-display text-3xl font-bold">{v}</p></Card>
            ))}
          </div>
          <div className="mt-5 grid gap-5 lg:grid-cols-5">
            <Card className="p-5 lg:col-span-3"><h2 className="font-semibold">Trends — {hName}</h2><DoctorCharts byStatus={byStatus.map((b) => ({ name: b.status.replace("_", " "), value: b._count }))} /></Card>
            <Card className="border-red-500/30 p-5 lg:col-span-2"><h2 className="font-semibold text-red-700">Urgent flags</h2>
              <ul className="mt-3 space-y-2 text-sm">{flags.length === 0 ? <li>No unacknowledged flags.</li> : flags.map((f) => (<li key={f.id} className="rounded-xl bg-red-50 p-3 dark:bg-red-950/40"><Link href={`/consultations/${f.consultationId}/record`}><strong>{f.label}</strong> — {f.consultation.patient.name}</Link></li>))}</ul></Card>
          </div>
          <Card className="mt-5 p-5"><h2 className="font-semibold">Recent at {hName}</h2>
            <ul className="mt-3 divide-y divide-[hsl(var(--border))]">{recent.map((c) => (<li key={c.id} className="flex items-center justify-between py-2 text-sm"><Link href={`/consultations/${c.id}/record`}><strong>{c.patient.name}</strong> — {c.chiefComplaint}</Link><Badge>{c.status}</Badge></li>))}</ul></Card>
        </>
      )}
    </AppShell>
  );
}
