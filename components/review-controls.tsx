"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Select, Textarea } from "@/components/ui/ui";
import { toast } from "@/components/ui/toaster";

export function ReviewControls({ id, status, notes, role }: { id: string; status: string; notes: string; role: string }) {
  const router = useRouter();
  const [s, setS] = React.useState(status === "DRAFT" ? "IN_PROGRESS" : status);
  const [n, setN] = React.useState(notes);
  const [busy, setBusy] = React.useState(false);
  async function save(next: string) {
    setBusy(true);
    try {
      const r = await fetch("/api/consultations/review", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ consultationId: id, status: next, clinicianNotes: n }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Failed");
      toast(`Saved as ${next.replace("_", " ")}.`);
      router.refresh();
    } catch (e) { toast(e instanceof Error ? e.message : "Failed"); }
    finally { setBusy(false); }
  }
  return (
    <Card className="p-5">
      <h2 className="font-semibold">Clinician review</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-[220px_1fr_auto]">
        <Select value={s} onChange={(e) => setS(e.target.value)} aria-label="Consultation status">
          <option value="IN_PROGRESS">In Progress</option>
          <option value="AWAITING_REVIEW">Awaiting Review</option>
          <option value="APPROVED">Approved</option>
          <option value="ARCHIVED">Archived</option>
        </Select>
        <Textarea value={n} onChange={(e) => setN(e.target.value)} rows={2} placeholder="Clinician notes (optional)…" aria-label="Clinician notes" />
        <Button onClick={() => save(s)} disabled={busy}>{busy ? "Saving…" : "Save review"}</Button>
      </div>
      {(s === "APPROVED" || s === "ARCHIVED") && role !== "DOCTOR" && role !== "ADMIN" && <p className="mt-2 text-xs text-amber-700">Only doctors/admins can approve or archive.</p>}
    </Card>
  );
}
