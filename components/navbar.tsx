"use client";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Activity, Moon, Sun } from "lucide-react";
import { Button } from "./ui/ui";

export function Navbar({ user }: { user?: { name: string; role: string } | null }) {
  const { theme, setTheme } = useTheme();
  return (
    <header className="sticky top-0 z-50 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-navy-900 to-teal-700 text-white shadow-card"><Activity size={18} /></span>
          <span className="leading-none"><span className="block font-display text-lg font-bold">ClinIQ History</span>
          <span className="block text-[11px] font-medium text-teal-700 dark:text-teal-300">AI-assisted clinical history • India</span></span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium md:flex" aria-label="Primary">
          <Link href="/#features" className="opacity-80 hover:opacity-100">Features</Link>
          <Link href="/#workflow" className="opacity-80 hover:opacity-100">Workflow</Link>
          <Link href="/#languages" className="opacity-80 hover:opacity-100">Languages</Link>
          <Link href="/#security" className="opacity-80 hover:opacity-100">Privacy</Link>
          <Link href="/#faq" className="opacity-80 hover:opacity-100">FAQ</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" aria-label="Toggle theme" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}><Sun className="hidden dark:block" size={17} /><Moon className="dark:hidden" size={17} /></Button>
          {user ? (<Link href="/dashboard"><Button size="sm">Open dashboard</Button></Link>)
          : (<><Link href="/login" className="hidden sm:block"><Button variant="ghost" size="sm">Sign in</Button></Link><Link href="/register"><Button size="sm">Try demo</Button></Link></>)}
        </div>
      </div>
    </header>
  );
}
