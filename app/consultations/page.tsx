import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession, scopedHospitalId } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { Badge, Card } from "@/components/ui/ui";
import { HospitalSwitcher } from "@/components/hospital-switcher";
import Link from "next/link";

export default async function ConsultationsIndex() {
  const user = await getSession();
  if (!user) redirect("/login");
  if (user.role === "PATIENT") redirect("/my");
  const hid = await scopedHospitalId(user);
  const needsHospital = hid === "__none__";
  const where = user.role === "ADMIN" ? {} : needsHospital ? { id: "__none__" } : { hospitalId: hid as string };
  const list = await prisma.consultation.findMany({ where, orderBy: { updatedAt: "desc" }, take: 60, include: { patient: true, redFlags: true } });
  return (
    <AppShell user={user}>
      <h1 className="font-display text-3xl font-bold">Consultations</h1>
      <p className="text-sm opacity-60">Scoped to your hospital.</p>
      <div className="mt-4"><HospitalSwitcher initialId={hid === "__none__" ? null : hid} /></div>
      <div className="mt-4 grid gap-3">
        {list.map((c) => (
          <Link key={c.id} href={`/consultations/${c.id}`}><Card className="flex flex-wrap items-center justify-between gap-2 p-4 hover:shadow-soft">
            <span><strong>{c.patient.name}</strong> <span className="text-sm opacity-60">• {c.chiefComplaint}</span></span>
            <span className="flex gap-2"><Badge>{c.status.replace("_", " ")}</Badge>{c.redFlags.length > 0 && <Badge tone="red">{c.redFlags.length}</Badge>}</span>
          </Card></Link>
        ))}
        {list.length === 0 && <Card className="p-10 text-center">No consultations yet.</Card>}
      </div>
    </AppShell>
  );
}
