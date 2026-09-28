import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/app-shell";
import { PatientForm } from "@/components/patient-form";

export default async function NewPatient() {
  const user = await getSession();
  if (!user) redirect("/login");
  if (user.role === "PATIENT") redirect("/my");
  const hospitals = user.role === "ADMIN"
    ? await prisma.hospital.findMany({ orderBy: { name: "asc" } })
    : user.hospitalId
      ? await prisma.hospital.findMany({ where: { id: user.hospitalId } })
      : await prisma.hospital.findMany({ orderBy: { name: "asc" } });
  return (
    <AppShell user={user}>
      <h1 className="font-display text-3xl font-bold">Register patient</h1>
      <p className="opacity-60">Registers at your hospital • optional ABHA ID links their file • fictional demo data only.</p>
      <div className="mt-5"><PatientForm hospitals={hospitals} defaultHospitalId={user.hospitalId ?? hospitals[0]?.id} /></div>
    </AppShell>
  );
}
