"use client";
import * as React from "react";
import { Mic, MicOff } from "lucide-react";
import { Button } from "./ui/ui";

export function VoiceInput({ onText, lang = "en" }: { onText: (t: string) => void; lang?: string }) {
  const [on, setOn] = React.useState(false);
  const [supported, setSupported] = React.useState(true);
  const rec = React.useRef<unknown>(null);
  React.useEffect(() => {
    const SR = (window as unknown as { webkitSpeechRecognition?: new () => any; SpeechRecognition?: new () => any }).webkitSpeechRecognition ?? (window as unknown as { SpeechRecognition?: new () => any }).SpeechRecognition;
    if (!SR) setSupported(false);
  }, []);
  const toggle = () => {
    const SR = (window as unknown as { webkitSpeechRecognition?: new () => any }).webkitSpeechRecognition ?? (window as unknown as { SpeechRecognition?: new () => any }).SpeechRecognition;
    if (!SR) { setSupported(false); return; }
    if (on) { (rec.current as { stop: () => void } | null)?.stop?.(); setOn(false); return; }
    const r = new SR();
    rec.current = r;
    r.lang = lang === "hi" ? "hi-IN" : lang === "te" ? "te-IN" : "en-IN";
    r.interimResults = false;
    r.onresult = (e: { results: { [k: number]: { [j: number]: { transcript: string } } } }) => {
      const t = e.results[0]?.[0]?.transcript;
      if (t) onText(t);
      setOn(false);
    };
    r.onend = () => setOn(false);
    r.onerror = () => setOn(false);
    r.start(); setOn(true);
  };
  if (!supported) return <p className="text-xs text-[hsl(var(--muted-foreground))]">Voice input not supported in this browser — please type.</p>;
  return (
    <Button type="button" variant={on ? "destructive" : "outline"} size="icon" onClick={toggle} aria-pressed={on} aria-label={on ? "Stop voice input" : "Start voice input"} title="Voice input">
      {on ? <MicOff size={16} /> : <Mic size={16} />}
    </Button>
  );
}
