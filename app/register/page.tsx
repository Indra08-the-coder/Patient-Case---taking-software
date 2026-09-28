"use client";
import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Button, Card, Input, Label, Select } from "@/components/ui/ui";
import { toast } from "@/components/ui/toaster";
import { HospitalSearch } from "@/components/hospital-search";
import { registerSchema } from "@/lib/validators";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [hospitals, setHospitals] = React.useState<{ id: string; name: string; city: string; code?: string }[]>([]);
  React.useEffect(() => {
    fetch("/api/hospitals-public").then((r) => r.json()).then((j) => { if (j.hospitals) setHospitals(j.hospitals); }).catch(() => {});
  }, []);
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({ resolver: zodResolver(registerSchema), defaultValues: { role: "DOCTOR" as const, hospitalId: "" } });
  const pw = watch("password", "");
  async function onSubmit(v: Record<string, string>) {
    setLoading(true);
    try {
      const r = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(v) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Registration failed");
      toast("Account created — welcome to ClinIQ!");
      router.push(j.next ?? "/dashboard"); router.refresh();
    } catch (e) { toast(e instanceof Error ? e.message : "Failed"); }
    finally { setLoading(false); }
  }
  const checks = [{ l: "8+ characters", ok: pw.length >= 8 }, { l: "Uppercase letter", ok: /[A-Z]/.test(pw) }, { l: "Number", ok: /[0-9]/.test(pw) }];
  return (
    <div className="min-h-screen"><Navbar />
      <main className="container max-w-xl py-12">
        <h1 className="font-display text-4xl font-bold">Try the demo.</h1>
        <p className="mt-2 text-[hsl(var(--muted-foreground))]">Role selection is enabled for demo purposes. Production uses admin-provisioned roles.</p>
        <Card className="mt-6 p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div><Label htmlFor="name">Full name</Label><Input id="name" {...register("name")} />{errors.name && <p className="mt-1 text-xs text-red-600">{String(errors.name.message)}</p>}</div>
            <div><Label htmlFor="email">Email</Label><Input id="email" type="email" {...register("email")} />{errors.email && <p className="mt-1 text-xs text-red-600">{String(errors.email.message)}</p>}</div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><Label htmlFor="password">Password</Label><Input id="password" type="password" {...register("password")} />{errors.password && <p className="mt-1 text-xs text-red-600">{String(errors.password.message)}</p>}
                <ul className="mt-2 space-y-1 text-xs">{checks.map((c) => (<li key={c.l} className={c.ok ? "text-teal-700" : "text-[hsl(var(--muted-foreground))]"}>{c.ok ? "✓" : "○"} {c.l}</li>))}</ul></div>
              <div><Label htmlFor="role">Demo role</Label><Select id="role" {...register("role")}><option value="DOCTOR">Doctor</option><option value="NURSE">Nurse</option><option value="RECEPTIONIST">Receptionist</option><option value="ADMIN">Admin</option></Select></div>
            </div>
            <div><Label htmlFor="hospitalId">Working hospital *</Label>
              <HospitalSearch id="hospitalId" hospitals={hospitals} value={watch("hospitalId") ?? ""}
                onChange={(hid) => setValue("hospitalId", hid, { shouldValidate: true, shouldDirty: true })}
                placeholder="Search hospital name or city — e.g. Bangalore, Delhi…" />
              {errors.hospitalId && <p className="mt-1 text-xs text-red-600">Pick your hospital — your dashboard is scoped to it.</p>}
              <p className="mt-1 text-xs opacity-60">Type to filter — matches pop up as you type ({hospitals.length} in directory: Bangalore • Hyderabad • Delhi). Doctors only see patients registered at this hospital.</p></div>
            <Button className="w-full" disabled={loading}>{loading ? "Creating…" : "Create account"}</Button>
            <p className="text-center text-sm text-[hsl(var(--muted-foreground))]">Have an account? <Link href="/login" className="font-semibold text-teal-700">Sign in</Link></p>
          </form>
        </Card>
      </main>
    </div>
  );
}
