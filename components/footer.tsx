import Link from "next/link";
export function Footer() {
  return (
    <footer className="border-t border-[hsl(var(--border))] bg-navy-950 text-slate-200">
      <div className="container grid gap-10 py-14 md:grid-cols-4">
        <div><p className="font-display text-xl font-bold text-white">ClinIQ History</p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-slate-300">Structured, multilingual clinical histories for Indian hospitals — calmer OPDs, safer handovers, complete documentation.</p>
          <p className="mt-4 rounded-xl bg-white/5 p-3 text-xs leading-relaxed text-slate-300">This tool supports documentation and clinical workflow. It does not diagnose, prescribe, or replace professional medical judgment.</p></div>
        <div><p className="text-xs font-bold uppercase tracking-widest text-teal-300">Product</p>
          <ul className="mt-3 space-y-2 text-sm"><li><Link href="/#features">Features</Link></li><li><Link href="/#workflow">Workflow</Link></li><li><Link href="/dashboard">Dashboards</Link></li><li><Link href="/patients">Patients</Link></li></ul></div>
        <div><p className="text-xs font-bold uppercase tracking-widest text-teal-300">Safety</p>
          <ul className="mt-3 space-y-2 text-sm"><li><Link href="/#security">Privacy & security</Link></li><li><Link href="/settings">Consent & hospital settings</Link></li><li><Link href="/login">Sign in</Link></li><li><Link href="/register">Try demo</Link></li></ul></div>
        <div><p className="text-xs font-bold uppercase tracking-widest text-teal-300">Hospital</p>
          <p className="mt-3 text-sm text-slate-300">CityCare General Hospital<br />OPD • Emergency • Wards<br />English • हिन्दी • తెలుగు</p></div>
      </div>
      <div className="border-t border-white/10"><div className="container flex flex-col justify-between gap-2 py-5 text-xs text-slate-400 sm:flex-row"><span>© 2026 ClinIQ History • Demo build with fictional data only.</span><span>ABDM-ready design • Audit-logged • Role-based access</span></div></div>
    </footer>
  );
}
