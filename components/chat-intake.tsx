"use client";
import * as React from "react";
import { Send } from "lucide-react";
import { Badge, Button, Card, Textarea } from "@/components/ui/ui";
import { VoiceInput } from "@/components/voice-input";
import { Disclaimer, RedFlagBanner } from "@/components/disclaimer";
import { toast } from "@/components/ui/toaster";

type Msg = { role: string; content: string; language: string };

export function ChatIntake({ consultationId, initialMessages, initialDraft, initialFlags, status }: { consultationId: string; initialMessages: Msg[]; initialDraft: Record<string, string>; initialFlags: { label: string; detail: string }[]; lang: string; status: string }) {
  const [msgs, setMsgs] = React.useState<Msg[]>(initialMessages);
  const [draft, setDraft] = React.useState(initialDraft);
  const [flags, setFlags] = React.useState(initialFlags);
  const [text, setText] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [suggested, setSuggested] = React.useState("How many days has this lasted, and what makes it better or worse?");
  const bottom = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, busy]);
  const progress = Math.min(95, 10 + msgs.filter((m) => m.role === "USER").length * 12);

  async function send(content: string) {
    const v = content.trim();
    if (!v || busy) return;
    setBusy(true);
    setMsgs((m) => [...m, { role: "USER", content: v, language: "en" }]);
    setText("");
    try {
      const r = await fetch("/api/ai/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ consultationId, content: v, language: "en" }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "AI failed");
      setMsgs((m) => [...m, { role: "ASSISTANT", content: j.reply, language: "en" }]);
      if (j.redFlags?.length) { setFlags((f) => [...f, ...j.redFlags]); toast("Red flag — escalate per SOP."); }
      const d = await fetch(`/api/consultations/${consultationId}/draft`).then((x) => x.json()).catch(() => null);
      if (d?.draft) setDraft(d.draft);
    } catch (e) { toast(e instanceof Error ? e.message : "Failed"); }
    finally { setBusy(false); }
  }
  const sections: [string, string][] = [["chiefComplaint", "Chief complaint"], ["presentIllness", "Present illness"], ["pastMedicalHistory", "Past history"], ["medicationHistory", "Medications"], ["allergies", "Allergies"], ["familyHistory", "Family"], ["socialHistory", "Social"], ["reviewOfSystems", "ROS"], ["missingInfo", "Missing info"], ["conciseSummary", "AI summary"]];
  return (
    <div className="grid gap-5 lg:grid-cols-5">
      <div className="lg:col-span-3">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between bg-navy-950 px-5 py-3 text-white">
            <span className="text-sm font-semibold">AI intake</span><Badge tone="teal">{Math.round(progress)}%</Badge>
          </div>
          <div className="h-2 bg-[hsl(var(--muted))]"><div className="h-full bg-teal-600 transition-all" style={{ width: `${progress}%` }} /></div>
          <div className="max-h-[46vh] space-y-3 overflow-y-auto p-5" aria-live="polite">
            {msgs.map((m, i) => (
              <div key={i} className={`max-w-[90%] rounded-2xl px-4 py-2.5 text-sm ${m.role === "USER" ? "ml-auto bg-teal-700 text-white" : "bg-[hsl(var(--muted))]"}`}>{m.content}</div>
            ))}
            {busy && <div className="shimmer h-12 max-w-[60%] rounded-2xl" />}
            <div ref={bottom} />
          </div>
          <div className="space-y-3 border-t border-[hsl(var(--border))] p-4">
            <div className="flex gap-2"><input className="h-10 w-full rounded-xl border border-[hsl(var(--border))] px-3 text-sm" value={suggested} onChange={(e) => setSuggested(e.target.value)} aria-label="Suggested question" /><Button variant="outline" size="sm" onClick={() => send(suggested)}>Ask</Button></div>
            <div className="flex gap-2">
              <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} placeholder="Type answer… (Enter to send)"
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(text); } }} aria-label="Patient answer" />
              <div className="flex flex-col gap-2"><VoiceInput onText={(t) => setText((s) => (s ? s + " " : "") + t)} /><Button size="icon" onClick={() => send(text)} disabled={busy || !text.trim()} aria-label="Send"><Send size={16} /></Button></div>
            </div>
            <Disclaimer compact />
          </div>
        </Card>
      </div>
      <div className="space-y-4 lg:col-span-2">
        <RedFlagBanner count={flags.length} />
        <Card className="p-5">
          <h2 className="font-semibold">Structured draft — live</h2>
          <div className="mt-3 space-y-2 text-[13px]">
            {sections.map(([k, label]) => (
              <div key={k} className="rounded-xl border border-[hsl(var(--border))] p-3">
                <p className="text-[11px] font-bold uppercase opacity-60">{label}</p>
                <p className="mt-1 whitespace-pre-wrap">{draft[k] || "— collecting —"}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
