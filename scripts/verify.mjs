// End-to-end API verification: login -> patients -> consultation -> chat -> review
const BASE = "http://localhost:3100";
let cookie = "";
async function req(path, opts = {}) {
  const res = await fetch(BASE + path, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}), ...(opts.headers || {}) },
  });
  const set = res.headers.get("set-cookie");
  if (set) cookie = set.split(";")[0];
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}
const assert = (c, m) => { if (!c) { console.error("FAIL:", m); process.exit(1); } console.log("PASS:", m); };
const login = await req("/api/auth/login", { method: "POST", body: JSON.stringify({ email: "doctor@cliniq.in", password: "Demo@123" }) });
assert(login.status === 200 && login.body.ok, "login doctor");
const list = await req("/api/patients?q=Ramesh");
assert(list.status === 200 && list.body.patients?.length >= 1, "search patients");
const pid = list.body.patients[0].id;
const created = await req("/api/consultations", { method: "POST", body: JSON.stringify({ patientId: pid, chiefComplaint: "Verify headache for 2 days", language: "en" }) });
assert(created.status === 201, "create consultation");
const cid = created.body.consultation.id;
const chat = await req("/api/ai/chat", { method: "POST", body: JSON.stringify({ consultationId: cid, content: "2 days, worse in evening, took paracetamol once", language: "en" }) });
assert(chat.status === 200 && chat.body.reply?.length > 5, "ai chat turn -> " + JSON.stringify(chat.body.reply).slice(0, 80));
const flagChat = await req("/api/ai/chat", { method: "POST", body: JSON.stringify({ consultationId: cid, content: "Also mild chest pressure when climbing stairs with sweating", language: "en" }) });
assert(flagChat.status === 200 && flagChat.body.redFlags?.length >= 1, "red-flag detected: " + JSON.stringify(flagChat.body.redFlags));
const draft = await req(`/api/consultations/${cid}/draft`);
assert(draft.status === 200 && draft.body.draft?.conciseSummary, "draft summary built");
const review = await req("/api/consultations/review", { method: "PATCH", body: JSON.stringify({ consultationId: cid, status: "AWAITING_REVIEW", clinicianNotes: "Verified by script." }) });
assert(review.status === 200, "review status update");
const approve = await req("/api/consultations/review", { method: "PATCH", body: JSON.stringify({ consultationId: cid, status: "APPROVED", clinicianNotes: "Approved in verification." }) });
assert(approve.status === 200, "approve consultation");
console.log("ALL CHECKS PASSED");
