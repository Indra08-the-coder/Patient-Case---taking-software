// Verifies ABHA OTP login + patient dashboard data isolation
const BASE = process.env.BASE ?? "http://localhost:3101";
let cookie = "";
async function req(path, opts = {}) {
  const res = await fetch(BASE + path, { ...opts, headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}), ...(opts.headers || {}) } });
  const set = res.headers.get("set-cookie");
  if (set) cookie = set.split(";")[0];
  const body = await res.text().then((t) => { try { return JSON.parse(t); } catch { return { _html: t.slice(0, 120) }; } });
  return { status: res.status, body };
}
const assert = (c, m) => { if (!c) { console.error("FAIL:", m); process.exit(1); } console.log("PASS:", m); };
const otpReq = await req("/api/auth/abha", { method: "POST", body: JSON.stringify({ abhaId: "lakshmi@abdm" }) });
assert(otpReq.status === 200 && otpReq.body.otpSent && otpReq.body.demoOtp === "123456", "ABHA OTP requested");
const bad = await req("/api/auth/abha", { method: "POST", body: JSON.stringify({ abhaId: "lakshmi@abdm", otp: "000000" }) });
assert(bad.status === 401, "wrong OTP rejected");
const login = await req("/api/auth/abha", { method: "POST", body: JSON.stringify({ abhaId: "lakshmi@abdm", otp: "123456" }) });
assert(login.status === 200 && login.body.user?.role === "PATIENT" && login.body.next === "/my", "ABHA login -> PATIENT");
const my = await req("/my");
assert(my.status === 200, "patient dashboard /my renders");
const visits = await req("/my/consultations");
assert(visits.status === 200, "patient visits list renders");
// Staff area must redirect patients away
const dash = await fetch(BASE + "/dashboard", { redirect: "manual", headers: { Cookie: cookie } });
assert(dash.status === 307 || dash.status === 308, "patient blocked from /dashboard");
console.log("ABHA CHECKS PASSED");
