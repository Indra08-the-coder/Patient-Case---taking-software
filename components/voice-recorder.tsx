"use client";
import * as React from "react";
import { Mic, Pause, Play, Square, Trash2 } from "lucide-react";
import { Button, Card, Input, Label } from "./ui/ui";
import { LanguageSelect } from "./language-select";
import { toast } from "./ui/toaster";

export type VNote = { id: string; title: string; audioData: string; durationSec: number; transcript: string; language: string; createdAt: string };

export function VoiceRecorder({ patientId }: { patientId: string }) {
  const [notes, setNotes] = React.useState<VNote[]>([]);
  const [lang, setLang] = React.useState("en");
  const [title, setTitle] = React.useState("");
  const [rec, setRec] = React.useState(false);
  const [live, setLive] = React.useState("");
  const [playing, setPlaying] = React.useState<string | null>(null);
  const mr = React.useRef<MediaRecorder | null>(null);
  const chunks = React.useRef<Blob[]>([]);
  const recog = React.useRef<{ stop: () => void } | null>(null);
  const audioEl = React.useRef<HTMLAudioElement | null>(null);
  const t0 = React.useRef(0);
  const liveRef = React.useRef("");
  React.useEffect(() => {
    fetch(`/api/voice?patientId=${patientId}`).then((r) => r.json()).then((j) => { if (j.notes) setNotes(j.notes); }).catch(() => {});
  }, [patientId]);
  function startSR() {
    const SR = (window as unknown as { webkitSpeechRecognition?: new () => unknown }).webkitSpeechRecognition ?? (window as unknown as { SpeechRecognition?: new () => unknown }).SpeechRecognition;
    if (!SR) return;
    try {
      const r = new SR() as { lang: string; continuous: boolean; interimResults: boolean; onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null; start: () => void; stop: () => void };
      r.lang = lang === "hi" ? "hi-IN" : lang === "te" ? "te-IN" : "en-IN";
      r.continuous = true; r.interimResults = true;
      r.onresult = (e) => {
        const last = e.results[e.results.length - 1]?.[0]?.transcript ?? "";
        if (last) { liveRef.current = (liveRef.current + " " + last).trim(); setLive(liveRef.current.slice(0, 8000)); }
      };
      r.start(); recog.current = r;
    } catch { /* optional */ }
  }

  async function toggle() {
    if (rec) { mr.current?.stop(); try { recog.current?.stop(); } catch {} setRec(false); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const m = new MediaRecorder(stream);
      chunks.current = [];
      m.ondataavailable = (e) => { if (e.data.size) chunks.current.push(e.data); };
      m.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks.current, { type: m.mimeType || "audio/webm" });
        const secs = Math.round((Date.now() - t0.current) / 1000);
        const dataUrl: string = await new Promise((res) => { const fr = new FileReader(); fr.onload = () => res(String(fr.result)); fr.readAsDataURL(blob); });
        const r = await fetch("/api/voice", { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ patientId, title: title.trim() || "Voice note", audioData: dataUrl, mimeType: blob.type, durationSec: secs, transcript: liveRef.current, language: lang }) });
        const j = await r.json().catch(() => ({}));
        if (r.ok) { setNotes((n) => [j.note, ...n]); liveRef.current = ""; setLive(""); setTitle(""); toast("Voice note saved."); }
        else toast(j.error ?? "Save failed");
      };
      t0.current = Date.now(); liveRef.current = "";
      m.start(); mr.current = m;
      setLive(""); startSR(); setRec(true);
    } catch { toast("Microphone blocked — allow access and retry."); }
  }
  function play(n: VNote) {
    if (playing === n.id) { audioEl.current?.pause(); setPlaying(null); return; }
    if (!audioEl.current) audioEl.current = new Audio();
    audioEl.current.src = n.audioData;
    audioEl.current.onended = () => setPlaying(null);
    audioEl.current.play().catch(() => toast("Playback failed"));
    setPlaying(n.id);
  }
  async function remove(id: string) {
    if (!confirm("Delete this voice note?")) return;
    const r = await fetch(`/api/voice?id=${id}`, { method: "DELETE" });
    if (!r.ok) { toast("Delete failed"); return; }
    setNotes((n) => n.filter((x) => x.id !== id));
  }
  return (
    <Card className="p-5">
      <h2 className="flex items-center gap-2 font-semibold"><Mic size={16} /> Voice notes — record symptoms</h2>
      <p className="mt-1 text-xs opacity-60">Describe the problem in your language. Audio + live transcript are saved.</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div><Label htmlFor="vn-title">Title</Label><Input id="vn-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Morning breathlessness" /></div>
        <LanguageSelect value={lang} onChange={setLang} id="vn-lang" />
      </div>
      <div className="mt-3 flex items-center gap-3">
        <Button onClick={toggle} variant={rec ? "destructive" : "default"} size="lg">{rec ? <><Square size={16} /> Stop and save</> : <><Mic size={16} /> Record</>}</Button>
        {rec && <span className="flex items-center gap-2 text-sm font-semibold text-red-600"><span className="h-2.5 w-2.5 animate-ping rounded-full bg-red-500" /> Recording…</span>}
      </div>
      {(rec || live) && <p className="mt-3 min-h-10 rounded-xl bg-[hsl(var(--muted))] p-3 text-sm" aria-live="polite">{live || "Listening…"}</p>}
      <ul className="mt-4 space-y-3">
        {notes.length === 0 && <li className="rounded-xl bg-[hsl(var(--muted))] p-4 text-sm opacity-70">No voice notes yet.</li>}
        {notes.map((n) => (
          <li key={n.id} className="rounded-xl border border-[hsl(var(--border))] p-4">
            <div className="flex items-start justify-between gap-2">
              <div><p className="text-sm font-semibold">{n.title}</p><p className="text-xs opacity-60">{n.durationSec}s • {n.language} • {new Date(n.createdAt).toLocaleString("en-IN")}</p></div>
              <div className="flex gap-1">
                {n.audioData && <Button variant="outline" size="icon" aria-label="Play recording" onClick={() => play(n)}>{playing === n.id ? <Pause size={15} /> : <Play size={15} />}</Button>}
                <Button variant="ghost" size="icon" aria-label="Delete recording" onClick={() => remove(n.id)}><Trash2 size={15} /></Button>
              </div>
            </div>
            {n.transcript ? <p className="mt-2 whitespace-pre-wrap rounded-lg bg-[hsl(var(--muted))] p-3 text-xs">{n.transcript}</p> : <p className="mt-2 text-xs opacity-60">No transcript captured.</p>}
          </li>
        ))}
      </ul>
    </Card>
  );
}