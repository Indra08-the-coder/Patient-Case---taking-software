import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { Badge, Card } from "@/components/ui/ui";

export default async function AdminPage() {
  const user = await getSession();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/dashboard");
  const [users, audits, notes] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 60, include: { actor: true } }),
    prisma.consultation.groupBy({ by: ["status"], _count: true }),
  ]);
  return (
    <AppShell user={user}>
      <h1 className="font-display text-3xl font-bold">Admin console</h1>
      <div className="mt-4 flex flex-wrap gap-2">{notes.map((n) => (<Badge key={n.status} tone="navy">{n.status}: {n._count}</Badge>))}</div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card className="p-5"><h2 className="font-semibold">Users & roles</h2>
          <ul className="mt-3 space-y-2 text-sm">{users.map((u) => (<li key={u.id} className="flex items-center justify-between rounded-xl bg-[hsl(var(--muted))] px-3 py-2"><span>{u.name}<span className="block text-xs opacity-60">{u.email}</span></span><Badge tone="navy">{u.role}</Badge></li>))}</ul></Card>
        <Card className="p-5"><h2 className="font-semibold">Audit logs (latest 60)</h2>
          <ul className="mt-3 max-h-[60vh] space-y-1.5 overflow-auto text-xs">{audits.map((a) => (<li key={a.id} className="rounded-lg border border-[hsl(var(--border))] px-2.5 py-1.5"><strong>{a.action}</strong> {a.entity} • {a.actor?.name ?? "system"} • {new Date(a.createdAt).toLocaleString("en-IN")}</li>))}</ul></Card>
      </div>
    </AppShell>
  );
}
