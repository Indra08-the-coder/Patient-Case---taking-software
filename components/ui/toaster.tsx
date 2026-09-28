"use client";
import * as React from "react";
export function Toaster() {
  const [items, setItems] = React.useState<{ id: number; msg: string }[]>([]);
  React.useEffect(() => {
    (window as unknown as { toast?: (m: string) => void }).toast = (msg: string) => {
      const id = Date.now() + Math.random();
      setItems((s) => [...s, { id, msg }]);
      setTimeout(() => setItems((s) => s.filter((x) => x.id !== id)), 3500);
    };
  }, []);
  return (
    <div className="no-print fixed bottom-5 right-5 z-[100] flex flex-col gap-2" role="status" aria-live="polite">
      {items.map((i) => (
        <div key={i.id} className="glass rounded-xl border border-teal-700/30 px-4 py-3 text-sm font-medium shadow-soft">{i.msg}</div>
      ))}
    </div>
  );
}
export function toast(msg: string) { (window as unknown as { toast?: (m: string) => void }).toast?.(msg); }
