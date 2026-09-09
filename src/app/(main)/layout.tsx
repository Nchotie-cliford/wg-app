import Link from "next/link";
import { Suspense } from "react";
import { BottomNav } from "@/components/nav/BottomNav";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { UserChip, UserChipFallback } from "./UserChip";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
      <header className="flex items-center justify-between p-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🏠</span>
          <span className="font-display text-xl font-extrabold">WG App</span>
        </Link>
        <Suspense fallback={<UserChipFallback />}>
          <UserChip />
        </Suspense>
      </header>
      <main className="flex-1 px-4 pb-28">
        <InstallPrompt variant="banner" />
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
