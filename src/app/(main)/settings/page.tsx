import Link from "next/link";
import { requireMember } from "@/lib/session";
import { logout } from "@/actions/auth";
import { toggleAway } from "@/actions/members";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MemberEditor } from "./MemberEditor";
import { PinForm } from "./PinForm";

export default async function SettingsPage() {
  const me = await requireMember();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-extrabold">Settings ⚙️</h1>
        <p className="font-semibold text-ink/60">
          Your name, character &amp; color, this is you only
        </p>
      </div>

      <MemberEditor member={me} />

      <Card className="flex flex-col items-start gap-3 p-4">
        <h2 className="font-display text-lg font-bold">
          Your personal PIN 🤫 ({me.name})
        </h2>
        <PinForm />
      </Card>

      <Card className="flex items-center gap-3 p-4">
        <span className="flex-1">
          <span className="block font-display text-lg font-bold">
            You&apos;re away 🌴
          </span>
          <span className="text-sm font-semibold text-ink/60">
            {me.isAway
              ? "Cleaning skips you, one-off costs default to excluding you"
              : "Flip this on before a trip so chores and one-off costs adjust"}
          </span>
        </span>
        <form action={toggleAway}>
          <button
            type="submit"
            className={`rounded-full border-2 border-ink px-4 py-2 font-display text-sm font-bold shadow-sticker-sm transition-all hover:-translate-y-0.5 active:scale-95 active:shadow-none ${
              me.isAway ? "bg-mint" : "bg-white"
            }`}
          >
            {me.isAway ? "I'm back!" : "I'm away"}
          </button>
        </form>
      </Card>

      <Card className="flex flex-col items-start gap-3 p-4">
        <h2 className="font-display text-lg font-bold">You</h2>
        <div className="flex gap-3">
          <Link
            href="/stats"
            className="rounded-full border-2 border-ink bg-sunny px-4 py-2 font-display text-sm font-bold shadow-sticker-sm transition-all hover:-translate-y-0.5 active:scale-95"
          >
            Stats 📊
          </Link>
          <form action={logout}>
            <Button type="submit" variant="white" className="px-4 py-2 text-sm">
              Log out 👋
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
