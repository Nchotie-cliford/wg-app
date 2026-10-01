import { redirect } from "next/navigation";
import { loadMember } from "@/lib/session";
import { SetPinForm } from "./SetPinForm";

// Deliberately outside the (main) route group: that layout calls requireMember(),
// which redirects here while mustChangePin is set, and would loop.
export default async function SetPinPage() {
  const me = await loadMember();
  if (!me.mustChangePin) redirect("/");

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 p-6">
      <div className="animate-pop-in text-center">
        <span
          className="mx-auto mb-3 flex size-20 items-center justify-center rounded-full border-2 border-ink text-4xl shadow-sticker"
          style={{ backgroundColor: me.colorHex }}
        >
          {me.emoji}
        </span>
        <h1 className="text-3xl font-extrabold">Pick a new PIN 🔑</h1>
        <p className="max-w-xs font-semibold text-ink/60">
          A flatmate reset your PIN, {me.name}. Choose one only you know — the
          temp PIN stops working right away.
        </p>
      </div>
      <SetPinForm />
    </main>
  );
}
