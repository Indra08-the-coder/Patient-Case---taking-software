"use client";
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return <main className="container py-24 text-center"><p className="font-display text-3xl font-bold">Something hiccupped.</p><p className="mt-2 text-sm opacity-60">{error.message}</p><button onClick={reset} className="mt-5 rounded-xl bg-teal-700 px-6 py-3 text-sm font-semibold text-white">Try again</button></main>;
}
