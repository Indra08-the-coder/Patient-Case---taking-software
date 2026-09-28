# ClinIQ History — AI-assisted clinical history-taking for Indian hospitals

Premium, calm, multilingual (EN/HI/TE) documentation platform. Doctors review structured drafts; the AI never diagnoses or prescribes.

## Quick start
```bash
npm install
cp .env.example .env   # set JWT_SECRET (32+ chars). LLM_* optional.
npx prisma db push
npm run db:seed
npm run dev            # http://localhost:3000
```

## Demo accounts
| Login | Credential | Role / hospital | Lands on |
|---|---|---|---|
| ABHA: `lakshmi@abdm` | OTP `123456` + pick hospital | Patient (ABHA-verified) | `/my` — My health dashboard |
| doctor@cliniq.in | Demo@123 | Doctor @ CityCare General Hospital | Hospital-scoped `/dashboard` |
| doctor2@cliniq.in | Demo@123 | Doctor @ Sunrise Multispeciality | Its own scoped `/dashboard` |
| nurse@cliniq.in | Demo@123 | Nurse @ CityCare | Intake queue |
| reception@cliniq.in | Demo@123 | Receptionist @ CityCare | Front desk |
| admin@cliniq.in | Demo@123 | Admin (all hospitals) | Admin console |

## Features
- Landing page: hero, bottleneck story, features, workflow, languages, privacy, FAQ, footer
- Role dashboards: doctor (charts via Recharts), nurse/reception (queue), admin (users/usage/audit)
- Patients: searchable list, create/edit (Zod + React Hook Form), detail with consultation timeline
- AI intake (`/consultations/[id]`): chat + voice input, progress bar, suggested questions (editable), live 9-section draft, red-flag banners, missing-info prompts, consent gate, statuses Draft → In Progress → Awaiting Review → Approved/Archived
- Record page (`/consultations/[id]/record`): editable summary, clinician notes, red flags, audit trail, print/PDF layout
- Settings: profile, language, hospital branding, consent text, AI status (env-only)

## AI setup (optional)
Without keys, the built-in clinical rule engine runs fully offline (complaint-aware questions, red-flag regex, summary builder). To enable LLM follow-ups:
```bash
LLM_API_KEY="sk-..."
LLM_BASE_URL="https://api.openai.com/v1"   # any OpenAI-compatible endpoint
LLM_MODEL="gpt-4o-mini"
```
All LLM calls run in `app/api/ai/chat/route.ts` (server-only). The model is instructed: one short question at a time, no diagnosis/prescription/triage, appends `[RED FLAG: label]` when urgent symptoms appear. Never put keys in `NEXT_PUBLIC_*`.

## Database
- SQLite via Prisma. Schema: User, Patient, Hospital, PatientHospitalVisit, Consultation, HistoryResponse, AIConversationMessage, ClinicalHistorySummary, RedFlag, ClinicianNote, AuditLog, HospitalSetting.
- Commands: `npx prisma db push` • `npm run db:seed` • `npx prisma studio` • `npm run typecheck`

## Safety & privacy
> This tool supports documentation and clinical workflow. It does not diagnose, prescribe, or replace professional medical judgment.
- Red flags are visual escalation prompts — clinicians must follow hospital SOP and inform the duty doctor.
- Role checks on pages + APIs; audit log for logins, patient CUD, AI turns, approvals, ABHA lookups and cross-hospital denials.
- All seed data is fictional (masked phones like 98110XXXX1). Never use real patient data in demos.

## ABHA / ABDM notes (demo)
- Demo flow: enter ABHA (e.g. `lakshmi@abdm`) → receive demo OTP `123456` → pick the hospital you are visiting → verify → PATIENT session → `/my` health dashboard (`/my/consultations`, `/my/consultations/[id]` read-only).
- Unlinked ABHA IDs auto-create a patient record + PATIENT user on first OTP verify (demo convenience). Audit events: `ABHA_OTP_REQUEST`, `ABHA_LOGIN`.
- Patients are middleware-routed to `/my` and blocked from staff areas; staff are blocked from `/my`. Patient detail pages enforce ownership (patientId/ABHA match).
- **My history & files** (`/my/history`): patient enters past diseases (quick-pick chips + custom), scans report photos with **on-device OCR (Tesseract.js, English)** — nothing sent to a cloud OCR — and records **voice notes** (MediaRecorder audio + live Web Speech transcript in EN/HI/TE) with playback. Clinicians see all three panels on the patient detail page (`/patients/[id]`).
- Production: swap `app/api/auth/abha/route.ts` internals for real ABDM Health-ID / OTP / auth-confirm + token APIs (server-side only), remove the demo OTP echo, and store ABDM tokens encrypted.

## Hospital scoping + doctor ABHA lookup
- 13 demo hospitals across **Bangalore, Hyderabad & Delhi** (plus Secunderabad and Vijayawada — full list in `prisma/seed.ts`). Both sign-up flows (staff `/register` and patient ABHA login) use a **searchable hospital typeahead** — matching hospitals pop up as you type the name or city (e.g. "Samp", "Delhi"; "bengaluru" also matches Bangalore). Staff pick a working hospital at register, on the dashboard switcher, or in Settings; patients pick the hospital they visit during ABHA OTP login (creates a consent `PatientHospitalVisit` link, also manageable in Settings → My hospitals).
- Doctor dashboard is fully hospital-scoped: working-hospital badge + switcher, **ABHA lookup card** (`/api/patients/lookup?abha=`), patient/queue/flag/trend counts, recent list — all filtered to that hospital. Patients, queue, consultations, intake, and records enforce the same scope server-side (403 + audit `ABHA_LOOKUP_DENIED` on cross-hospital access).
- Doctors open a patient file by ABHA ID even without knowing the name/MRN; unknown ABHAs return a clean not-found; unlinked patients show which hospitals they ARE at so reception can register/link them.
- Admins bypass scoping and see a hospital roster with staff/patient counts.
- Regression check: `npm run verify:hospitals` (needs `npm run build` + `npx next start` on the `BASE` URL, default `http://localhost:3103`) — asserts doctor scope, ABHA lookup + denial, patient↔hospital linking, and rendered dashboard HTML.
