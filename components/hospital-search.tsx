"use client";
import * as React from "react";
import { Input } from "@/components/ui/ui";
import { cn } from "@/lib/utils";

export type HospitalOption = { id: string; name: string; city?: string | null; code?: string | null };

/** Case-fold + aliases so "bengaluru" matches "Bangalore" and "new delhi" matches "Delhi". */
function norm(s: string) {
  return s.toLowerCase().replace(/bengaluru/g, "bangalore").replace(/new\s+delhi/g, "delhi");
}

/** -1 = no match; lower score is better (name prefix > name > city > code). */
function rank(h: HospitalOption, q: string) {
  const name = norm(h.name);
  const city = norm(h.city ?? "");
  const code = norm(h.code ?? "");
  if (name.startsWith(q)) return 0;
  if (name.includes(q)) return 1;
  if (city.startsWith(q)) return 2;
  if (city.includes(q) || code.includes(q)) return 3;
  return -1;
}

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const i = text.toLowerCase().indexOf(query);
  if (i < 0) return <>{text}</>;
  return (
    <>{text.slice(0, i)}<mark className="rounded-sm bg-teal-100 text-teal-900">{text.slice(i, i + query.length)}</mark>{text.slice(i + query.length)}</>
  );
}

type Props = {
  hospitals: HospitalOption[];
  value: string;
  onChange: (id: string) => void;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

/**
 * Searchable hospital combobox — matching hospitals pop up as you type the
 * name (or city / code). Keyboard: ↑/↓ move, Enter pick, Escape close.
 */
export function HospitalSearch({ hospitals, value, onChange, id, placeholder, disabled, className }: Props) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [active, setActive] = React.useState(0);
  const itemRefs = React.useRef<(HTMLLIElement | null)[]>([]);

  const q = React.useMemo(() => norm(query.trim()), [query]);
  const results = React.useMemo(() => {
    if (!q) return hospitals;
    return hospitals
      .map((h) => ({ h, r: rank(h, q) }))
      .filter((x) => x.r >= 0)
      .sort((a, b) => a.r - b.r || a.h.name.localeCompare(b.h.name))
      .map((x) => x.h);
  }, [hospitals, q]);
  const activeIdx = Math.min(active, Math.max(results.length - 1, 0));
  const activeItem = open ? results[activeIdx] : undefined;
  const nameOf = React.useCallback((hid: string) => hospitals.find((h) => h.id === hid)?.name ?? "", [hospitals]);

  // When closed, the input shows the selected hospital (or the placeholder).
  React.useEffect(() => {
    if (!open) setQuery(nameOf(value));
  }, [open, value, nameOf]);

  // Keep the highlighted option in view.
  React.useEffect(() => {
    if (open) itemRefs.current[activeIdx]?.scrollIntoView({ block: "nearest" });
  }, [open, activeIdx]);

  // Opening a *closed* list starts a fresh search (clears the selected name) so the
  // full directory pops up; re-opening while already open keeps the typed text.
  function openList() {
    const fresh = !open;
    setOpen(true);
    if (fresh) setQuery("");
    const list = fresh || !query.trim() ? hospitals : results;
    const i = list.findIndex((h) => h.id === value);
    setActive(i >= 0 ? i : 0);
  }
  function close() {
    setOpen(false);
    setActive(0);
    setQuery(nameOf(value));
  }
  function pick(h: HospitalOption | undefined) {
    if (!h) return;
    onChange(h.id);
    setQuery(h.name);
    setOpen(false);
    setActive(0);
  }
  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) { openList(); return; }
      if (!results.length) return;
      setActive(e.key === "ArrowDown" ? Math.min(activeIdx + 1, results.length - 1) : Math.max(activeIdx - 1, 0));
    } else if (e.key === "Enter") {
      if (open) { e.preventDefault(); pick(results[activeIdx]); }
    } else if (e.key === "Escape" && open) {
      e.preventDefault();
      close();
    }
  }

  return (
    <div className={cn("relative", className)}>
      <Input id={id} role="combobox" aria-expanded={open} aria-controls={id ? `${id}-listbox` : undefined}
        aria-autocomplete="list" aria-activedescendant={activeItem && id ? `${id}-opt-${activeItem.id}` : undefined}
        autoComplete="off" disabled={disabled} placeholder={placeholder ?? "Search hospitals…"}
        value={query} onChange={(e) => { setQuery(e.target.value); setOpen(true); setActive(0); }}
        onFocus={openList} onClick={openList} onBlur={close} onKeyDown={onKeyDown} />
      {open && (
        <ul id={id ? `${id}-listbox` : undefined} role="listbox"
          className="absolute left-0 right-0 top-full z-30 mt-1 max-h-60 overflow-auto rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] py-1 shadow-card">
          {results.length === 0 && (
            <li className="px-3 py-2 text-sm text-[hsl(var(--muted-foreground))]">
              {hospitals.length ? "No hospital matches that name." : "No hospitals loaded — refresh to retry."}
            </li>
          )}
          {results.map((h, i) => (
            <li key={h.id} id={id ? `${id}-opt-${h.id}` : undefined} role="option" aria-selected={h.id === value}
              ref={(el) => { itemRefs.current[i] = el; }}
              onMouseDown={(e) => e.preventDefault()} onClick={() => pick(h)} onMouseEnter={() => setActive(i)}
              className={cn("cursor-pointer px-3 py-2 text-sm", i === activeIdx && "bg-teal-50")}>
              <span className="flex items-baseline justify-between gap-3">
                <span className="min-w-0 font-medium"><Highlight text={h.name} query={query.trim().toLowerCase()} /></span>
                <span className="shrink-0 text-xs text-[hsl(var(--muted-foreground))]">{h.city}</span>
              </span>
              {h.code && <span className="mt-0.5 block text-[11px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">{h.code}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}