import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { PastIllnessForm } from "@/components/past-illness-form";
import { DocumentScanner } from "@/components/document-scanner";
import { VoiceRecorder } from "@/components/voice-recorder";
import { Disclaimer } from "@/components/disclaimer";

export default async function MyHistory() {
  const user = await getSession();
  if (!user) redirect("/login?next=/my/history");
  if (user.role !== "PATIENT") redirect("/dashboard");
  const record = user.patientId
    ? await prisma.patient.findUnique({ where: { id: user.patientId } })
    : await prisma.patient.findUnique({ where: { abhaId: user.abhaId ?? "__none__" } });
  if (!record) redirect("/dashboard");
  return (
    <AppShell user={user}>
      <h1 className="font-display text-3xl font-bold">My history & files</h1>
      <p className="text-sm opacity-60">Add past diseases, scan reports with OCR, and record voice notes. Your doctor sees all of this at your visit.</p>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <PastIllnessForm patientId={record.id} />
        <VoiceRecorder patientId={record.id} />
      </div>
      <div className="mt-5"><DocumentScanner patientId={record.id} /></div>
      <div className="mt-5"><Disclaimer compact /></div>
    </AppShell>
  );
}
