"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Activity, FileText, LayoutDashboard, LogOut, Settings, Users } from "lucide-react";
import { Button } from "./ui/ui";
import { toast } from "./ui/toaster";

export function AppShell({ user, children }: { user: { name: string; role: string }; children: React.ReactNode }) {
  const router = useRouter();
  const links: Record<string, { href: string; label: string; icon: typeof Users }[]> = {
    DOCTOR: [{ href: "/dashboard", label: "Overview", icon: LayoutDashboard }, { href: "/patients", label: "Patients", icon: Users }, { href: "/consultations", label: "Consultations", icon: FileText }, { href: "/settings", label: "Settings", icon: Settings }],
    NURSE: [{ href: "/dashboard", label: "Intake queue", icon: LayoutDashboard }, { href: "/patients", label: "Patients", icon: Users }, { href: "/settings", label: "Settings", icon: Settings }],
    RECEPTIONIST: [{ href: "/dashboard", label: "Front desk", icon: LayoutDashboard }, { href: "/patients", label: "Patients", icon: Users }, { href: "/settings", label: "Settings", icon: Settings }],
    ADMIN: [{ href: "/dashboard", label: "Overview", icon: LayoutDashboard }, { href: "/admin", label: "Admin", icon: Users }, { href: "/patients", label: "Patients", icon: Users }, { href: "/settings", label: "Settings", icon: Settings }],
    PATIENT: [{ href: "/my", label: "My health", icon: LayoutDashboard }, { href: "/my/consultations", label: "My visits", icon: FileText }, { href: "/my/history", label: "My history & files", icon: Users }, { href: "/settings", label: "Settings", icon: Settings }],
  };
  const nav = links[user.role] ?? links.DOCTOR;
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    toast("Signed out.");
    router.push("/"); router.refresh();
  }
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="no-print border-b border-[hsl(var(--border))] bg-navy-950 text-slate-200 lg:min-h-screen lg:border-b-0">
        <div className="flex items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-lg bg-teal-600 text-white"><Activity size={16} /></span><span className="font-display font-bold text-white">ClinIQ</span></Link>
          <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold uppercase">{user.role}</span>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-4 pb-3 lg:flex-col" aria-label="App">
          {nav.map((l) => (<Link key={l.href + l.label} href={l.href} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-white/10"><l.icon size={16} />{l.label}</Link>))}
        </nav>
        <div className="hidden px-4 pb-5 lg:block">
          <div className="rounded-2xl bg-white/5 p-4 text-xs"><p className="font-semibold text-white">{user.name}</p><p className="mt-3 rounded-lg bg-amber-400/10 p-2 leading-relaxed text-amber-100">Documentation aid only — no diagnosis or prescription.</p>
          <Button variant="ghost" size="sm" className="mt-2 text-slate-200 hover:bg-white/10" onClick={logout}><LogOut size={14} /> Sign out</Button></div>
        </div>
      </aside>
      <div>
        <div className="no-print flex items-center justify-between border-b border-[hsl(var(--border))] px-5 py-3 lg:hidden">
          <span className="text-sm font-semibold">{user.name}</span>
          <Button variant="ghost" size="sm" onClick={logout}><LogOut size={14} /> Out</Button>
        </div>
        <main className="mx-auto w-full max-w-6xl px-5 py-6">{children}</main>
      </div>
    </div>
  );
}
