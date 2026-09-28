import type { Metadata } from "next";
export const metadata: Metadata = { title: "Not found — ClinIQ History" };
export default function NotFound() {
  return <main className="container py-24 text-center"><p className="font-display text-5xl font-bold">404</p><p className="mt-2 opacity-60">That page walked out of the OPD. Try the dashboard or patient list.</p><a href="/dashboard" className="mt-5 inline-block rounded-xl bg-teal-700 px-6 py-3 text-sm font-semibold text-white">Back to dashboard</a></main>;
}
