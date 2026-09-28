import { Clock3, FileText, Lock, Mic, ShieldCheck, Stethoscope } from "lucide-react";
import { Badge, Card } from "./ui/ui";
import { Disclaimer } from "./disclaimer";

const feats = [
  { icon: Mic, t: "Guided multilingual intake", d: "One question at a time in English, Hindi, Telugu with voice input." },
  { icon: FileText, t: "Structured draft as you type", d: "CC, HPI, PMH, meds, allergies, family, social, ROS, red flags live." },
  { icon: ShieldCheck, t: "Red-flag safety net", d: "Urgent answers flagged with escalation SOP. Never a diagnosis." },
  { icon: Stethoscope, t: "Clinician review", d: "Edit, note, approve, archive — full audit trail." },
  { icon: Clock3, t: "Built for OPD rush", d: "Queue intake for nurses; pending + urgent views for doctors." },
  { icon: Lock, t: "Private by design", d: "Server-side AI, roles, consent, audit logs. No browser keys." },
];

export function LandingSections() {
  return (
    <>
      <section className="border-y border-[hsl(var(--border))] bg-navy-950 py-16 text-slate-200">
        <div className="container grid gap-10 lg:grid-cols-2">
          <div>
            <Badge tone="teal">The bottleneck is history, not diagnosis</Badge>
            <h2 className="mt-4 font-display text-3xl font-bold text-white">Overcrowded OPDs. Incomplete histories. Risk hides in gaps.</h2>
            <p className="mt-4 text-slate-300">60+ patients per doctor, 8–12 min per case. Allergies, doses, family history get missed. Paper slips lost; handovers break.</p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {[["60+ / doctor", "Checklists skipped."], ["3+ languages", "Hindi, Telugu, English."], ["Lost slips", "No audit trail."], ["Inconsistent Qs", "ROS forgotten."]].map(([t, d]) => (
              <li key={t} className="rounded-2xl bg-white/5 p-5"><p className="font-semibold text-white">{t}</p><p className="mt-1 text-sm text-slate-300">{d}</p></li>
            ))}
          </ul>
        </div>
      </section>
      <section id="features" className="container py-16">
        <Badge tone="teal">Features</Badge>
        <h2 className="mt-3 font-display text-3xl font-bold">Everything a busy Indian OPD needs.</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {feats.map((f) => (<Card key={f.t} className="p-6"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-teal-700/10 text-teal-700"><f.icon size={20} /></span><h3 className="mt-4 font-semibold">{f.t}</h3><p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">{f.d}</p></Card>))}
        </div>
      </section>
      <section id="workflow" className="border-y border-[hsl(var(--border))] bg-[hsl(var(--muted))]/40 py-16">
        <div className="container">
          <Badge tone="navy">Workflow</Badge>
          <h2 className="mt-3 font-display text-3xl font-bold">Queue to approved note in 4 steps</h2>
          <ol className="mt-8 grid gap-4 md:grid-cols-4">
            {[["01", "Register & consent", "Patient + language + consent."], ["02", "AI intake", "One Q at a time, text/voice."], ["03", "Live draft", "9 sections + flags + gaps."], ["04", "Review", "Edit, approve, print."]].map(([n, t, d]) => (
              <li key={n} className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6"><p className="font-display text-3xl font-bold text-teal-700">{n}</p><p className="mt-2 font-semibold">{t}</p><p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{d}</p></li>
            ))}
          </ol>
          <div className="mt-6"><Disclaimer /></div>
        </div>
      </section>
    </>
  );
}
