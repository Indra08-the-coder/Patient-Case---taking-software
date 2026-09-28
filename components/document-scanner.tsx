"use client";
import * as React from "react";
import { FileUp, Loader2, ScanText, Trash2 } from "lucide-react";
import { Button, Card, Input, Label } from "./ui/ui";
import { toast } from "./ui/toaster";

export type Doc = { id: string; title: string; fileName: string; ocrText: string; ocrStatus: string; createdAt: string };

async function ocrImage(file: File): Promise<string> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng");
  try {
    const { data } = await worker.recognize(file);
    return data.text?.trim() ?? "";
  } finally {
    await worker.terminate().catch(() => {});
  }
}

export function DocumentScanner({ patientId }: { patientId: string }) {
  const [docs, setDocs] = React.useState<Doc[]>([]);
  const [title, setTitle] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  async function load() {
    const r = await fetch(`/api/documents?patientId=${patientId}`);
    const j = await r.json().catch(() => ({}));
    if (r.ok) setDocs(j.docs ?? []);
  }
  React.useEffect(() => { load(); }, [patientId]);
  React.useEffect(() => {
    if (!file) { setPreview(""); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  async function upload() {
    if (!file) { toast("Choose a photo or PDF first."); return; }
    if (!title.trim()) { toast("Give the document a title."); return; }
    setBusy(true);
    try {
      let ocrText = "";
      let ocrStatus = "pending";
      if (file.type.startsWith("image/")) {
        try { ocrText = await ocrImage(file); ocrStatus = ocrText ? "done" : "no-text"; }
        catch { ocrStatus = "failed"; }
      } else { ocrStatus = "pdf-manual"; ocrText = "PDF stored. Re-scan photo pages for OCR."; }
      const dataUrl: string = await new Promise((res, rej) => {
        const fr = new FileReader();
        fr.onload = () => res(String(fr.result));
        fr.onerror = rej;
        fr.readAsDataURL(file.slice(0, 3_000_000));
      });
      const r = await fetch("/api/documents", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId, title: title.trim(), fileName: file.name, mimeType: file.type, fileData: dataUrl, ocrText, ocrStatus }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Upload failed");
      setDocs((d) => [j.doc, ...d]);
      setTitle(""); setFile(null);
      toast(ocrText ? "Scanned + saved." : "Saved — no text found.");
    } catch (e) { toast(e instanceof Error ? e.message : "Failed"); }
    finally { setBusy(false); }
  }

  async function remove(id: string) {
    if (!confirm("Delete this document?")) return;
    const r = await fetch(`/api/documents?id=${id}`, { method: "DELETE" });
    if (!r.ok) { toast("Delete failed"); return; }
    setDocs((d) => d.filter((x) => x.id !== id));
  }

  return (
    <Card className="p-5">
      <h2 className="flex items-center gap-2 font-semibold"><ScanText size={16} /> Scan reports (OCR)</h2>
      <p className="mt-1 text-xs opacity-60">Text is extracted <strong>on your device</strong> — never sent to an OCR cloud.</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div><Label htmlFor="doc-title">Title *</Label><Input id="doc-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Blood test Jan 2026" /></div>
        <div><Label htmlFor="doc-file">Photo / PDF *</Label><Input id="doc-file" type="file" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></div>
      </div>
      {preview && file?.type.startsWith("image/") && <img src={preview} alt="Preview" className="mt-3 max-h-56 rounded-xl border object-contain" />}
      {busy && <p className="mt-2 flex items-center gap-1.5 text-xs opacity-70"><Loader2 size={12} className="animate-spin" /> Scanning on-device…</p>}
      <Button className="mt-3" size="sm" disabled={busy || !file} onClick={upload}><FileUp size={14} /> {busy ? "Scanning…" : "Scan & save"}</Button>
      <ul className="mt-4 space-y-3">
        {docs.length === 0 && <li className="rounded-xl bg-[hsl(var(--muted))] p-4 text-sm opacity-70">No documents yet.</li>}
        {docs.map((d) => (
          <li key={d.id} className="rounded-xl border border-[hsl(var(--border))] p-4">
            <div className="flex items-start justify-between gap-2">
              <div><p className="text-sm font-semibold">{d.title}</p><p className="text-xs opacity-60">{d.fileName} • OCR: {d.ocrStatus}</p></div>
              <Button variant="ghost" size="icon" aria-label={`Delete ${d.title}`} onClick={() => remove(d.id)}><Trash2 size={15} /></Button>
            </div>
            {d.ocrText ? <p className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap rounded-lg bg-[hsl(var(--muted))] p-3 text-xs">{d.ocrText}</p> : <p className="mt-2 text-xs opacity-60">No text extracted.</p>}
          </li>
        ))}
      </ul>
    </Card>
  );
}
