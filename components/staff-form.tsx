"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label } from "@/components/ui/ui";
import { toast } from "@/components/ui/toaster";

export function StaffForm() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [pw, setPw] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  async function go() {
    setLoading(true);
    try {
      const r = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password: pw }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Login failed");
      toast("Welcome back!");
      router.push(j.user?.role === "PATIENT" ? "/my" : "/dashboard"); router.refresh();
    } catch (e) { toast(e instanceof Error ? e.message : "Failed"); }
    finally { setLoading(false); }
  }
  return (
    <div className="space-y-4">
      <div><Label htmlFor="s-email">Work email</Label><Input id="s-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="doctor@cliniq.in" /></div>
      <div><Label htmlFor="s-pw">Password</Label><Input id="s-pw" type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Demo@123" /></div>
      <Button className="w-full" onClick={go} disabled={loading}>{loading ? "Signing in…" : "Sign in as staff"}</Button>
    </div>
  );
}
