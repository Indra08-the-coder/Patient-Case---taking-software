import bcrypt from "bcryptjs";
import { prisma } from "../lib/db";

async function main() {
  const pw = await bcrypt.hash("Demo@123", 10);

  // Hospitals — staff pick one at register/login; patients pick one at ABHA login.
  // Directory spans Bangalore, Hyderabad & Delhi (searchable typeahead at sign-up).
  const hospitals = [
    // Hyderabad
    { name: "CityCare General Hospital", city: "Hyderabad", code: "CCG-HYD" },
    { name: "Jubilee Gardens Hospital", city: "Hyderabad", code: "JGH-HYD" },
    { name: "Malhar Multispeciality Hospital", city: "Hyderabad", code: "MSH-HYD" },
    { name: "Sunrise Multispeciality Hospital", city: "Secunderabad", code: "SMH-SEC" },
    // Bangalore
    { name: "Lakeview Children & Women Hospital", city: "Bangalore", code: "LCW-BLR" },
    { name: "Sampurna General Hospital", city: "Bangalore", code: "SGH-BLR" },
    { name: "Sanjeevani Multispeciality Hospital", city: "Bangalore", code: "SSM-BLR" },
    { name: "Whitefield Surgical & General Hospital", city: "Bangalore", code: "WSG-BLR" },
    // Delhi
    { name: "Kailash Care Hospital", city: "Delhi", code: "KCH-DEL" },
    { name: "Nehru Place Medical Centre", city: "Delhi", code: "NPM-DEL" },
    { name: "Rajdhani Heart & General Hospital", city: "Delhi", code: "RHG-DEL" },
    { name: "Yamuna Valley Hospital", city: "Delhi", code: "YVH-DEL" },
    // Nearby
    { name: "Greenview Community Hospital", city: "Vijayawada", code: "GVH-VJA" },
  ];
  for (const h of hospitals) {
    await prisma.hospital.upsert({ where: { code: h.code }, update: { name: h.name, city: h.city }, create: h });
  }
  const cityCare = await prisma.hospital.findUniqueOrThrow({ where: { code: "CCG-HYD" } });
  const sunrise = await prisma.hospital.findUniqueOrThrow({ where: { code: "SMH-SEC" } });

  const users = [
    { name: "Dr. Ananya Rao", email: "doctor@cliniq.in", role: "DOCTOR" as const, hospitalId: cityCare.id },
    { name: "Dr. Vikram Singh", email: "doctor2@cliniq.in", role: "DOCTOR" as const, hospitalId: sunrise.id },
    { name: "Sister Meera Nair", email: "nurse@cliniq.in", role: "NURSE" as const, hospitalId: cityCare.id },
    { name: "Arjun Patel", email: "reception@cliniq.in", role: "RECEPTIONIST" as const, hospitalId: cityCare.id },
    { name: "Kavya Reddy", email: "admin@cliniq.in", role: "ADMIN" as const, hospitalId: null },
  ];
  for (const u of users) {
    await prisma.user.upsert({ where: { email: u.email }, update: { passwordHash: pw, name: u.name, role: u.role, hospitalId: u.hospitalId }, create: { ...u, passwordHash: pw } });
  }
  const doctor = await prisma.user.findUniqueOrThrow({ where: { email: "doctor@cliniq.in" } });

  // Demo ABHA-linked patient user: lakshmi@abdm / OTP 123456
  const lakshmi = await prisma.patient.upsert({
    where: { mrn: "MRN-DEMO-1002" },
    update: { abhaId: "lakshmi@abdm", abhaVerified: true },
    create: { name: "Lakshmi Devi", age: 47, sex: "FEMALE", mrn: "MRN-DEMO-1002", abhaId: "lakshmi@abdm", abhaVerified: true },
  });
  await prisma.patient.update({ where: { mrn: "MRN-DEMO-1001" }, data: { abhaId: "ramesh@abdm", abhaVerified: false } });
  await prisma.user.upsert({
    where: { abhaId: "lakshmi@abdm" },
    update: { name: "Lakshmi Devi", role: "PATIENT", abhaVerified: true, patientId: lakshmi.id },
    create: { name: "Lakshmi Devi", email: "lakshmi.abha@cliniq.local", passwordHash: "ABHA-OTP-ONLY-NO-PASSWORD", role: "PATIENT", abhaId: "lakshmi@abdm", abhaVerified: true, patientId: lakshmi.id },
  });

  const patients = [
    { name: "Ramesh Gupta", age: 54, sex: "MALE" as const, phone: "98110XXXX1", location: "Lajpat Nagar, Delhi", language: "hi", mrn: "MRN-DEMO-1001", abhaId: "ramesh@abdm", allergies: "Penicillin — rash", emergencyName: "Sunita Gupta", emergencyPhone: "98110XXXX2", consentGiven: true },
    { name: "Lakshmi Devi", age: 47, sex: "FEMALE" as const, phone: "99490XXXX3", location: "Kukatpally, Hyderabad", language: "te", mrn: "MRN-DEMO-1002", abhaId: "lakshmi@abdm", abhaVerified: true, allergies: "", emergencyName: "Venkatesh", emergencyPhone: "99490XXXX4", consentGiven: true },
    { name: "Joseph D'Souza", age: 62, sex: "MALE" as const, phone: "98300XXXX5", location: "Bandra, Mumbai", language: "en", mrn: "MRN-DEMO-1003", allergies: "Sulfa drugs", emergencyName: "Maria D'Souza", emergencyPhone: "98300XXXX6", consentGiven: true },
    { name: "Priya Sharma", age: 29, sex: "FEMALE" as const, phone: "98850XXXX7", location: "Hitech City, Hyderabad", language: "en", mrn: "MRN-DEMO-1004", allergies: "", emergencyName: "Rahul Sharma", emergencyPhone: "98850XXXX8", consentGiven: false },
    { name: "Abdul Khan", age: 38, sex: "MALE" as const, phone: "97000XXXX9", location: "Old City, Hyderabad", language: "hi", mrn: "MRN-DEMO-1005", allergies: "", emergencyName: "Fatima Khan", emergencyPhone: "97000XXX10", consentGiven: true },
  ];
  for (const p of patients) {
    await prisma.patient.upsert({ where: { mrn: p.mrn }, update: { ...p }, create: { ...p } });
  }

  const p1 = await prisma.patient.findUniqueOrThrow({ where: { mrn: "MRN-DEMO-1001" } });
  const p2 = await prisma.patient.findUniqueOrThrow({ where: { mrn: "MRN-DEMO-1002" } });
  // Link demo patients to CityCare so the CityCare doctor dashboard sees them.
  for (const p of [p1, p2]) {
    await prisma.patientHospitalVisit.upsert({
      where: { patientId_hospitalId: { patientId: p.id, hospitalId: cityCare.id } },
      update: {}, create: { patientId: p.id, hospitalId: cityCare.id, consent: true },
    });
  }
  // Joseph (Sunrise) proves scoping: visible to doctor2, hidden from CityCare doctor.
  const pj = await prisma.patient.findUnique({ where: { mrn: "MRN-DEMO-1003" } });
  if (pj) {
    await prisma.patientHospitalVisit.upsert({
      where: { patientId_hospitalId: { patientId: pj.id, hospitalId: sunrise.id } },
      update: {}, create: { patientId: pj.id, hospitalId: sunrise.id, consent: true },
    });
  }
  const c1 = await prisma.consultation.create({
    data: { patientId: p1.id, clinicianId: doctor.id, hospitalId: cityCare.id, chiefComplaint: "Fever with cough for 4 days", language: "hi", status: "AWAITING_REVIEW", progress: 78,
      aiSummary: "Fever x 4 days with evening rise to 102F and mild cough. Paracetamol x2. Allergies: penicillin rash.",
      messages: { create: [
        { role: "ASSISTANT", content: "बुखार कितने दिनों से है?", language: "hi" },
        { role: "USER", content: "4 दिनों से, शाम को 102°F तक बढ़ता है।", language: "hi" },
        { role: "ASSISTANT", content: "Any cough, breathlessness, or burning urination?", language: "en" },
        { role: "USER", content: "Slight cough, no breathlessness. Took paracetamol twice.", language: "en" },
      ]},
      responses: { create: [
        { section: "presentIllness", question: "Duration of fever?", answer: "4 days, evening rise to 102F", language: "hi" },
        { section: "medicationHistory", question: "Medicines taken?", answer: "Paracetamol twice", language: "en" },
      ]},
      summary: { create: { chiefComplaint: "Fever with cough for 4 days", presentIllness: "Intermittent fever x 4 days, Tmax 102F, mild cough, no dysuria/breathlessness.", pastMedicalHistory: "Hypertension on amlodipine 5mg OD.", medicationHistory: "Paracetamol 650mg BD x2 days; amlodipine 5mg OD.", allergies: "Penicillin — rash.", familyHistory: "Father: diabetes. Mother: hypertension.", socialHistory: "Non-smoker, occasional alcohol, shopkeeper.", reviewOfSystems: "No chest pain, no rash, appetite reduced.", missingInfo: "Allergy confirmation; exact paracetamol timings.", conciseSummary: "54M with 4-day intermittent fever (102F) + mild cough. Hypertensive. On amlodipine + paracetamol. Penicillin allergy. Awaiting clinician review." } },
    },
  });
  await prisma.redFlag.create({ data: { consultationId: c1.id, label: "High fever — watch for breathlessness", detail: "Monitor; escalate if SpO2 falls or breathing worsens.", severity: "MODERATE" } });
  const c2 = await prisma.consultation.create({
    data: { patientId: p2.id, clinicianId: doctor.id, hospitalId: cityCare.id, chiefComplaint: "Chest discomfort on exertion", language: "te", status: "IN_PROGRESS", progress: 34,
      aiSummary: "Chest discomfort on walking uphill for 1 week.",
      messages: { create: [
        { role: "ASSISTANT", content: "ఛాతీ నొప్పి ఎప్పుడు మొదలైంది?", language: "te" },
        { role: "USER", content: "One week, when walking uphill. Rests help. I have chest pressure and sweating.", language: "en" },
      ]},
    },
  });
  await prisma.redFlag.create({ data: { consultationId: c2.id, label: "Chest pain / pressure", detail: "Possible cardiac emergency — follow escalation SOP immediately.", severity: "URGENT" } });
  await prisma.hospitalSetting.upsert({ where: { id: "hospital-default" }, update: {}, create: { id: "hospital-default", hospitalName: "CityCare General Hospital", tagline: "Compassionate, structured, safe care", logoText: "ClinIQ", primaryLanguage: "en" } });
  await prisma.auditLog.create({ data: { action: "SEED", entity: "Database", actorId: doctor.id, metadata: "Fictional demo seed" } });
  const hospitalCount = await prisma.hospital.count();
  console.log(`Seed complete: 5 staff + 1 ABHA patient user, 5 patients, ${hospitalCount} hospitals, 2 consultations.`);
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
