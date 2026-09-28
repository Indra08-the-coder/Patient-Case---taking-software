import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession, scopedHospitalId } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { Badge, Card } from "@/components/ui/ui";
import { PatientSearch } from "@/components/patient-search";
import { HospitalSwitcher } from "@/components/hospital-switcher";
import Link from "next/link";

export default async function PatientsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const user = await getSession();
  if (!user) redirect("/login");
  if (user.role === "PATIENT") redirect("/my");
  const q = (await searchParams).q ?? "";
  const hid = await scopedHospitalId(user);
  const needsHospital = hid === "__none__";
  const searchOr = q ? [{ name: { contains: q } }, { mrn: { contains: q } }, { phone: { contains: q } }, { abhaId: { contains: q } }] : undefined;
  const where = user.role === "ADMIN"
    ? (searchOr ? { OR: searchOr } : {})
    : needsHospital ? { id: "__none__" } : { visits: { some: { hospitalId: hid as string } }, ...(searchOr ? { OR: searchOr } : {}) };
  const patients = await prisma.patient.findMany({
    where, orderBy: { updatedAt: "desc" }, take: 60,
    include: { consultations: { orderBy: { updatedAt: "desc" }, take: 1 }, visits: { include: { hospital: true } } },
  });
  const hName = user.hospital?.name ?? ((hid && hid !== "__none__") ? (await prisma.hospital.findUnique({ where: { id: hid as string } }))?.name : null);
  return (
    <AppShell user={user}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="font-display text-3xl font-bold">Patients{hName ? ` — ${hName}` : ""}</h1><p className="opacity-60">{patients.length} shown • hospital-scoped • search name, MRN, phone, or ABHA ID</p></div>
        <Link href="/patients/new" className="rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white">+ New patient</Link>
      </div>
      <div className="mt-4"><HospitalSwitcher initialId={hid === "__none__" ? null : hid} /></div>
      <div className="mt-4"><PatientSearch /></div>
      {needsHospital && user.role !== "ADMIN" ? (
        <Card className="mt-4 p-10 text-center"><p className="font-semibold">Select your hospital first</p><p className="text-sm opacity-60">Your patient list is scoped to the hospital you work at.</p></Card>
      ) : (
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {patients.map((p) => (
          <Link key={p.id} href={`/patients/${p.id}`}><Card className="p-5 transition-all hover:-translate-y-0.5 hover:shadow-soft">
            <div className="flex justify-between"><p className="font-semibold">{p.name}</p><Badge>{p.mrn}</Badge></div>
            <p className="mt-1 text-xs opacity-60">{p.age ? `${p.age}y` : "—"} • {p.sex} • {p.location ?? "—"}</p>
            {p.abhaId && <p className="mt-1 text-xs font-semibold text-teal-700">ABHA: {p.abhaId}</p>}
            <p className="mt-1 text-xs opacity-60">{p.visits.map((v) => v.hospital.name).join(", ") || "No hospital link"}</p>
            <p className="mt-2 text-xs">Last: {p.consultations[0]?.chiefComplaint ?? "No consultations yet"}</p>
          </Card></Link>
        ))}
      </div>
      )}
      {patients.length === 0 && !needsHospital && <Card className="mt-4 p-10 text-center"><p className="font-semibold">No patients found</p><p className="text-sm opacity-60">Try another search, an ABHA ID lookup from the dashboard, or register a new patient.</p></Card>}
    </AppShell>
  );
}
