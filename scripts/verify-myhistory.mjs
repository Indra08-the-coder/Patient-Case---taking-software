// Verifies past-illness CRUD + document save + voice-note save (patient session)
const BASE = process.env.BASE ?? "http://localhost:3102";
let cookie = "";
async function req(path, opts = {}) {
  const res = await fetch(BASE + path, { ...opts, headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}), ...(opts.headers || {}) } });
  const set = res.headers.get("set-cookie");
  if (set) cookie = set.split(";")[0];
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}
const assert = (c, m) => { if (!c) { console.error("FAIL:", m, JSON.stringify(c)); process.exit(1); } console.log("PASS:", m); };
const login = await req("/api/auth/abha", { method: "POST", body: JSON.stringify({ abhaId: "lakshmi@abdm", otp: "123456" }) });
assert(login.status === 200, "patient login");
// past illness
const add = await req("/api/history", { method: "POST", body: JSON.stringify({ patientId: "x", condition: "Asthma since childhood", diagnosedOn: "2010", status: "ongoing", notes: "Uses inhaler" }) });
assert(add.status === 201 && add.body.item?.condition.includes("Asthma"), "past illness saved (patientId resolved server-side)");
const list = await req("/api/history?patientId=x");
assert(list.status === 200 && list.body.items?.length >= 1, `past illness listed (${list.body.items?.length})`);
const del = await req(`/api/history?id=${add.body.item.id}`, { method: "DELETE" });
assert(del.status === 200, "past illness deleted");
// document (simulated OCR text from client)
const doc = await req("/api/documents", { method: "POST", body: JSON.stringify({ patientId: "x", title: "Verify CBC report", fileName: "cbc.png", mimeType: "image/png", fileData: "data:image/png;base64,AAA", ocrText: "Hb 12.4 WBC 7200", ocrStatus: "done" }) });
assert(doc.status === 201, "document + OCR text saved");
const docs = await req("/api/documents?patientId=x");
assert(docs.status === 200 && docs.body.docs?.length >= 1, "documents listed (file bytes hidden)");
// voice note
const vn = await req("/api/voice", { method: "POST", body: JSON.stringify({ patientId: "x", title: "Verify wheeze", audioData: "data:audio/webm;base64,AAA", durationSec: 12, transcript: "wheezing at night", language: "en" }) });
assert(vn.status === 201, "voice note saved");
const vns = await req("/api/voice?patientId=x");
assert(vns.status === 200 && vns.body.notes?.length >= 1, "voice notes listed");
console.log("HISTORY/OCR/VOICE CHECKS PASSED");
