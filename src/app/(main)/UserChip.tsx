import Link from "next/link";
import { requireMember } from "@/lib/session";
import { Avatar } from "@/components/ui/Avatar";

/**
 * Header identity chip. Isolated in its own async Server Component so the
 * layout's `cookies()` access sits behind a <Suspense> boundary and never
 * blocks the first streamed chunk (or `loading.tsx`) on navigation.
 */
export async function UserChip() {
  const me = await requireMember();

  return (
    <Link
      href="/settings"
      className="flex items-center gap-2 rounded-full border-2 border-ink bg-white py-1 pl-3 pr-1 shadow-sticker-sm transition-all hover:-translate-y-0.5 active:scale-95"
    >
      <span className="font-display text-sm font-bold">{me.name}</span>
      <Avatar member={me} size="sm" />
    </Link>
  );
}

export function UserChipFallback() {
  return (
    <span className="flex items-center gap-2 rounded-full border-2 border-ink/20 bg-white/60 py-1 pl-3 pr-1">
      <span className="h-3 w-12 rounded-full bg-ink/10" />
      <span className="size-8 rounded-full bg-ink/10" />
    </span>
  );
}
