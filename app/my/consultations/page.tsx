import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { Badge, Card } from "@/components/ui/ui";

async function myRecord(user: { patientId?: string | null; abhaId?: string | null }) {
  if (user.patientId) return prisma.patient.findUnique({ where: { id: user.patientId }, include: { consultations: { orderBy: { updatedAt: "desc" }, include: { redFlags: true } } } });
  return prisma.patient.findUnique({ where: { abhaId: user.abhaId ?? "__none__" }, include: { consultations: { orderBy: { updatedAt: "desc" }, include: { redFlags: true } } } });
}

export default async function MyVisits() {
  const user = await getSession();
  if (!user) redirect("/login?next=/my");
  if (user.role !== "PATIENT") redirect("/dashboard");
  const record = await myRecord(user);
  if (!record) redirect("/dashboard");
  return (
    <AppShell user={user}>
      <h1 className="font-display text-3xl font-bold">My visits</h1>
      <p className="text-sm opacity-60">{record.consultations.length} consultations • {record.mrn}</p>
      <div className="mt-4 space-y-2">
        {record.consultations.map((c) => (
          <Link key={c.id} href={`/my/consultations/${c.id}`}><Card className="flex items-center justify-between gap-2 p-4 hover:shadow-soft">
            <span><strong>{c.chiefComplaint || "Consultation"}</strong><span className="block text-xs opacity-60">{new Date(c.updatedAt).toLocaleString("en-IN")}</span></span>
            <span className="flex gap-1.5"><Badge>{c.status.replace("_", " ")}</Badge>{c.redFlags.length > 0 && <Badge tone="red">{c.redFlags.length}</Badge>}</span>
          </Card></Link>
        ))}
        {record.consultations.length === 0 && <Card className="p-10 text-center">No visits yet.</Card>}
      </div>
    </AppShell>
  );
}
