import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { PatientForm } from "@/components/patient-form";

export default async function EditPatient({ params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) redirect("/login");
  const p = await prisma.patient.findUnique({ where: { id: (await params).id } });
  if (!p) notFound();
  return (
    <AppShell user={user}>
      <h1 className="font-display text-3xl font-bold">Edit {p.name}</h1>
      <div className="mt-5"><PatientForm id={p.id} initial={{ name: p.name, age: p.age, sex: p.sex, phone: p.phone ?? "", location: p.location ?? "", language: p.language, mrn: p.mrn, allergies: p.allergies, emergencyName: p.emergencyName ?? "", emergencyPhone: p.emergencyPhone ?? "", consentGiven: p.consentGiven }} /></div>
    </AppShell>
  );
}
