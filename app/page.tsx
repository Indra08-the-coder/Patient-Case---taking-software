import Link from "next/link";
import { Activity, ArrowRight, Sparkles } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Badge, Button, Card } from "@/components/ui/ui";
import { getSession } from "@/lib/auth";
import { LandingSections } from "@/components/landing-sections";


export default async function Landing() {
  const user = await getSession();
  return (
    <div className="min-h-screen">
      <Navbar user={user} />
      <section className="relative overflow-hidden">
        <div className="hero-grid absolute inset-0" aria-hidden />
        <div className="absolute -top-32 left-1/2 h-96 w-[60rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-teal-400/25 via-sky-400/20 to-indigo-400/25 blur-3xl" aria-hidden />
        <div className="container relative grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <Badge tone="teal"><Sparkles size={12} /> AI-assisted history-taking for Indian hospitals</Badge>
            <h1 className="mt-5 font-display text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
              Cut history-taking burden.<br /><span className="bg-gradient-to-r from-teal-700 via-teal-600 to-navy-800 bg-clip-text text-transparent">Keep clinical control.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-600 dark:text-slate-300 sm:text-lg">
              Indian OPDs see 60+ patients per doctor daily, yet every safe consultation begins with a complete history.
              ClinIQ turns rushed, inconsistent interviews into calm, structured, multilingual drafts — in minutes.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/register"><Button size="lg">Try demo <ArrowRight size={17} /></Button></Link>
              <Link href="/login"><Button size="lg" variant="outline">Sign in</Button></Link>
            </div>
            <div className="mt-6 flex flex-wrap gap-2 text-xs">
              <Badge>Demo: doctor@cliniq.in / Demo@123</Badge>
              <Badge tone="navy">No real patient data</Badge>
            </div>
          </div>
          <div className="relative" aria-hidden>
            <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-teal-500/15 to-navy-900/10 blur-2xl" />
            <Card className="relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-[hsl(var(--border))] bg-navy-950 px-5 py-3.5 text-white">
                <span className="flex items-center gap-2 text-sm font-semibold"><Activity size={16} className="text-teal-300" /> Live intake — Fever</span>
                <Badge tone="teal">Draft building</Badge>
              </div>
              <div className="grid gap-0 md:grid-cols-5">
                <div className="space-y-3 p-5 md:col-span-3">
                  <div className="max-w-[92%] rounded-2xl bg-[hsl(var(--muted))] px-3.5 py-2.5 text-[13px]">AI: How many days of fever, highest temperature?</div>
                  <div className="ml-auto max-w-[92%] rounded-2xl bg-teal-700 px-3.5 py-2.5 text-[13px] text-white">4 days, evening rise to 102F. Slight cough.</div>
                  <div className="max-w-[92%] rounded-2xl bg-[hsl(var(--muted))] px-3.5 py-2.5 text-[13px]">AI: Any breathlessness, rash, burning urination?</div>
                  <div className="ml-auto max-w-[92%] rounded-2xl bg-teal-700 px-3.5 py-2.5 text-[13px] text-white">No. Took paracetamol twice.</div>
                </div>
                <div className="border-t border-[hsl(var(--border))] bg-[hsl(var(--muted))]/50 p-5 text-xs md:col-span-2 md:border-l md:border-t-0">
                  <p className="font-bold uppercase tracking-widest text-teal-800">Structured draft</p>
                  <ul className="mt-2 space-y-2 leading-relaxed">
                    <li><strong>CC:</strong> Fever x 4 days, 102F</li>
                    <li><strong>HPI:</strong> Intermittent, mild cough</li>
                    <li><strong>Meds:</strong> Paracetamol x2</li>
                    <li><strong>Allergies:</strong> NKDA (confirm)</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>
      <LandingSections />
      <Footer />
    </div>
  );
}
