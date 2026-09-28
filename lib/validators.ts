import { z } from "zod";
export const abhaLoginSchema = z.object({
  abhaId: z.string().min(6).max(30).regex(/^[A-Za-z0-9@._-]+$/, "Enter a valid ABHA ID / number"),
  otp: z.string().length(6).regex(/^[0-9]{6}$/, "Enter the 6-digit OTP").optional(),
});
export const abhaRegisterSchema = z.object({
  name: z.string().min(2), abhaId: z.string().min(6).max(30),
  phone: z.string().min(10).max(15),
});
export const loginSchema = z.object({ email: z.string().email(), password: z.string().min(6) });
export const registerSchema = z.object({
  name: z.string().min(2), email: z.string().email(),
  password: z.string().min(8).regex(/[A-Z]/, "Need uppercase").regex(/[0-9]/, "Need number"),
  role: z.enum(["ADMIN", "DOCTOR", "NURSE", "RECEPTIONIST", "PATIENT"]),
  hospitalId: z.string().min(1).optional(),
});
export const patientSchema = z.object({
  name: z.string().min(2), age: z.coerce.number().int().min(0).max(130).optional().nullable(),
  sex: z.enum(["MALE", "FEMALE", "OTHER", "UNKNOWN"]).default("UNKNOWN"),
  phone: z.string().max(15).optional().nullable(),
  location: z.string().max(120).optional().nullable(),
  language: z.string().default("en"),
  mrn: z.string().min(3), allergies: z.string().default(""),
  abhaId: z.string().max(40).optional().nullable(),
  hospitalId: z.string().min(1).optional(),
  emergencyName: z.string().optional().nullable(),
  emergencyPhone: z.string().optional().nullable(),
  consentGiven: z.boolean().default(false),
});
export const pastIllnessSchema = z.object({
  patientId: z.string().min(1),
  condition: z.string().min(2).max(200),
  diagnosedOn: z.string().max(40).optional().default(""),
  status: z.enum(["ongoing", "resolved", "under-treatment", "unknown"]).default("ongoing"),
  notes: z.string().max(2000).optional().default(""),
  source: z.string().max(40).optional().default("self"),
});
export const documentSchema = z.object({
  patientId: z.string().min(1),
  title: z.string().min(2).max(160),
  fileName: z.string().max(200).optional().default(""),
  mimeType: z.string().max(80).optional().default(""),
  fileData: z.string().max(8_000_000).optional().default(""),
  ocrText: z.string().max(20000).optional().default(""),
  ocrStatus: z.string().max(30).optional().default("pending"),
});
export const voiceNoteSchema = z.object({
  patientId: z.string().min(1),
  title: z.string().max(160).optional().default("Voice note"),
  audioData: z.string().max(12_000_000).optional().default(""),
  mimeType: z.string().max(80).optional().default("audio/webm"),
  durationSec: z.coerce.number().int().min(0).max(3600).optional().default(0),
  transcript: z.string().max(20000).optional().default(""),
  language: z.string().max(8).optional().default("en"),
});
export const consultationSchema = z.object({
  patientId: z.string().min(1), chiefComplaint: z.string().min(2), language: z.string().default("en"),
});
export const chatSchema = z.object({
  consultationId: z.string(), content: z.string().min(1).max(2000), language: z.string().default("en"),
});
export const reviewSchema = z.object({
  consultationId: z.string(), status: z.enum(["IN_PROGRESS", "AWAITING_REVIEW", "APPROVED", "ARCHIVED"]),
  clinicianNotes: z.string().max(5000).optional().default(""),
  summary: z.record(z.string()).optional(),
});
