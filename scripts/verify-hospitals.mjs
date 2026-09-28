// Verifies hospital-scoped dashboards + doctor ABHA lookup
const BASE = process.env.BASE ?? "http://localhost:3103";
// Verifies the rendered dashboard scopes too — set BASE to a running `next start`.
let cookie = "";
async function req(path, opts = {}) {
  const res = await fetch(BASE + path, { ...opts, headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}), ...(opts.headers || {}) } });
  const set = res.headers.get("set-cookie");
  if (set) cookie = set.split(";")[0];
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}
const assert = (c, m) => { if (!c) { console.error("FAIL:", m); process.exit(1); } console.log("PASS:", m); };

// 1. CityCare doctor sees only CityCare patients
let r = await req("/api/auth/login", { method: "POST", body: JSON.stringify({ email: "doctor@cliniq.in", password: "Demo@123" }) });
assert(r.status === 200, "citycare doctor login");
r = await req("/api/patients");
assert(r.status === 200 && r.body.patients.every((p) => (p.visits ?? []).some((v) => v.hospitalId === r.body.hospitalId)), `citycare doctor sees ${r.body.patients.length} scoped patient(s)`);
assert(r.body.patients.some((p) => p.abhaId === "lakshmi@abdm"), "lakshmi visible at CityCare");
// ABHA lookup works
r = await req("/api/patients/lookup?abha=lakshmi@abdm");
assert(r.status === 200 && r.body.found && r.body.patient.name === "Lakshmi Devi", "ABHA lookup opens Lakshmi file");
// Unknown ABHA -> 404
r = await req("/api/patients/lookup?abha=nobody@abdm");
assert(r.status === 404 && r.body.found === false, "unknown ABHA returns not-found");
// 2. Sunrise doctor must NOT see CityCare patients
cookie = "";
r = await req("/api/auth/login", { method: "POST", body: JSON.stringify({ email: "doctor2@cliniq.in", password: "Demo@123" }) });
assert(r.status === 200, "sunrise doctor login");
r = await req("/api/patients");
assert(r.status === 200 && !r.body.patients.some((p) => p.abhaId === "lakshmi@abdm"), `sunrise doctor blocked from CityCare patients (sees ${r.body.patients.length})`);
r = await req("/api/patients/lookup?abha=lakshmi@abdm");
assert(r.status === 403, "cross-hospital ABHA lookup denied + logged");
// 3. Patient picks hospital at ABHA login -> visit link created
cookie = "";
const hospitals = await (await fetch(BASE + "/api/hospitals-public")).json();
assert(hospitals.hospitals.length >= 3, `${hospitals.hospitals.length} hospitals in directory`);
const cities = new Set(hospitals.hospitals.map((h) => h.city));
assert(["Bangalore", "Hyderabad", "Delhi"].every((c) => cities.has(c)), "directory spans Bangalore, Hyderabad & Delhi");
const otp = await req("/api/auth/abha", { method: "POST", body: JSON.stringify({ abhaId: "lakshmi@abdm" }) });
assert(otp.status === 200 && (otp.body.hospitals ?? []).length >= 3, "ABHA OTP step returns hospital list");
const login = await req("/api/auth/abha", { method: "POST", body: JSON.stringify({ abhaId: "lakshmi@abdm", otp: "123456", hospitalId: hospitals.hospitals[0].id }) });
assert(login.status === 200 && login.body.hospital, `patient hospital link -> ${login.body.hospital?.name}`);
// 4. Rendered pages honour the scope (server-rendered HTML, not just APIs)
cookie = "";
await req("/api/auth/login", { method: "POST", body: JSON.stringify({ email: "doctor@cliniq.in", password: "Demo@123" }) });
let html = await (await fetch(BASE + "/dashboard", { headers: { Cookie: cookie } })).text();
assert(html.includes("CityCare General Hospital") && !html.includes("Sunrise Multispeciality"), "doctor dashboard renders only its hospital");
await req("/api/auth/login", { method: "POST", body: JSON.stringify({ email: "admin@cliniq.in", password: "Demo@123" }) });
html = await (await fetch(BASE + "/dashboard", { headers: { Cookie: cookie } })).text();
assert(html.includes("Sunrise Multispeciality") && html.includes("Greenview"), "admin dashboard shows all-hospital roster");
console.log("HOSPITAL-SCOPE CHECKS PASSED");
