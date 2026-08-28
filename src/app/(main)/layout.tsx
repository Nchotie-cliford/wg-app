import Link from "next/link";
import { requireMember } from "@/lib/session";
import { Avatar } from "@/components/ui/Avatar";
import { BottomNav } from "@/components/nav/BottomNav";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const me = await requireMember();

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
      <header className="flex items-center justify-between p-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🏠</span>
          <span className="font-display text-xl font-extrabold">WG App</span>
        </Link>
        <Link
          href="/settings"
          className="flex items-center gap-2 rounded-full border-2 border-ink bg-white py-1 pl-3 pr-1 shadow-sticker-sm transition-all hover:-translate-y-0.5 active:scale-95"
        >
          <span className="font-display text-sm font-bold">{me.name}</span>
          <Avatar member={me} size="sm" />
        </Link>
      </header>
      <main className="flex-1 px-4 pb-28">{children}</main>
      <BottomNav />
    </div>
  );
}
