"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "./ui/ui";
export function PatientSearch() {
  const router = useRouter();
  const sp = useSearchParams();
  return (
    <form role="search" onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); router.push("/patients?q=" + encodeURIComponent(String(f.get("q") ?? ""))); }}>
      <Input name="q" defaultValue={sp.get("q") ?? ""} placeholder="Search name, MRN, or phone…" aria-label="Search patients" />
    </form>
  );
}
