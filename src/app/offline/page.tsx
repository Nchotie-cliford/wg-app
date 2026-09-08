import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Offline · WG App",
};

export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <span className="text-6xl">📴</span>
      <h1 className="text-2xl font-extrabold">You&apos;re offline</h1>
      <p className="max-w-xs font-semibold text-ink/60">
        WG App needs a connection for this bit. Check your internet, this page
        loads again the moment you&apos;re back.
      </p>
      <Link
        href="/"
        className="rounded-full border-2 border-ink bg-coral px-5 py-2.5 font-display font-bold text-white shadow-sticker-sm transition-all hover:-translate-y-0.5 active:scale-95"
      >
        Try again
      </Link>
    </main>
  );
}
