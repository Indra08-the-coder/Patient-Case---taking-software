"use client";
import * as React from "react";
import Link from "next/link";
import { Fingerprint, Mail } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Card } from "@/components/ui/ui";
import { AbhaForm } from "@/components/abha-form";
import { StaffForm } from "@/components/staff-form";

export default function LoginPage() {
  const [tab, setTab] = React.useState<"abha" | "staff">("abha");
  return (
    <div className="min-h-screen"><Navbar />
      <main className="container grid max-w-5xl gap-8 py-12 lg:grid-cols-2">
        <div>
          <h1 className="font-display text-4xl font-bold">Welcome back.</h1>
          <p className="mt-3 opacity-60">Patients sign in with ABHA + OTP. Staff use work email.</p>
          <Card className="mt-6 space-y-2 p-5 text-sm">
            <p className="font-bold">Try instantly</p>
            <div className="flex justify-between rounded-lg bg-[hsl(var(--muted))] px-3 py-2"><span>lakshmi@abdm + OTP 123456</span><span className="font-semibold">Patient</span></div>
            <div className="flex justify-between rounded-lg bg-[hsl(var(--muted))] px-3 py-2"><span>doctor@cliniq.in / Demo@123</span><span className="font-semibold">Doctor</span></div>
          </Card>
        </div>
        <Card className="h-fit p-6">
          <div className="mb-5 grid grid-cols-2 gap-2 rounded-2xl bg-[hsl(var(--muted))] p-1.5" role="tablist" aria-label="Login method">
            <button role="tab" aria-selected={tab === "abha"} onClick={() => setTab("abha")} className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold ${tab === "abha" ? "bg-[hsl(var(--card))] shadow-card" : "opacity-60"}`}><Fingerprint size={15} /> Patient • ABHA</button>
            <button role="tab" aria-selected={tab === "staff"} onClick={() => setTab("staff")} className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold ${tab === "staff" ? "bg-[hsl(var(--card))] shadow-card" : "opacity-60"}`}><Mail size={15} /> Staff • Email</button>
          </div>
          {tab === "abha" ? <AbhaForm /> : <StaffForm />}
          <p className="mt-4 text-center text-xs opacity-60">ABHA = Ayushman Bharat Health Account (ABDM). Demo OTP flow; production uses ABDM APIs server-side.</p>
          <p className="mt-2 text-center text-sm opacity-60">Staff need an account? <Link href="/register" className="font-semibold text-teal-700">Create demo account</Link></p>
        </Card>
      </main>
    </div>
  );
}
