"use client";

import { useActionState, useState } from "react";
import { pickMember, requestPinReset } from "@/actions/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import type { PickableMember } from "@/lib/characters";

/**
 * "I can't get in" — raises a request a logged-in flatmate approves in Settings.
 * Its own <form>, kept outside the login form: nesting forms is invalid HTML and
 * the browser would submit the outer one.
 */
function ForgotPinPanel({ member }: { member: PickableMember }) {
  const [state, formAction, pending] = useActionState(requestPinReset, {});

  if (state.ok) {
    return (
      <p className="mt-3 animate-pop-in rounded-blob border-2 border-ink bg-mint/50 p-3 text-center text-sm font-semibold">
        Asked! 📣 Any flatmate can now open <span className="font-bold">Settings</span>{" "}
        and reset your PIN — they&apos;ll read you a temp PIN to log in with.
      </p>
    );
  }

  return (
    <form
      action={formAction}
      className="mt-3 animate-pop-in rounded-blob border-2 border-ink bg-sunny/40 p-3 text-center"
    >
      <input type="hidden" name="memberId" value={member.id} />
      <p className="mb-3 text-sm font-semibold">
        PINs are stored scrambled, so nobody can look yours up — not even the
        app. A flatmate can reset it for you.
      </p>
      <Button
        type="submit"
        variant="white"
        className="px-4 py-2 text-sm"
        disabled={pending}
      >
        {pending ? "Asking..." : "Ask a flatmate to reset it"}
      </Button>
      {state.error && (
        <p className="mt-2 animate-wiggle font-bold text-coral">{state.error}</p>
      )}
    </form>
  );
}

export function MemberPicker({ members }: { members: PickableMember[] }) {
  const [selected, setSelected] = useState<PickableMember | null>(null);
  const [forgot, setForgot] = useState(false);
  const [state, formAction, pending] = useActionState(pickMember, {});

  if (selected) {
    return (
      <Card className="w-full max-w-sm animate-pop-in p-6">
        <div className="mb-4 flex flex-col items-center gap-1">
          <span
            className="flex size-20 items-center justify-center rounded-full border-2 border-ink text-4xl"
            style={{ backgroundColor: selected.colorHex }}
          >
            {selected.emoji}
          </span>
          <span className="font-display text-xl font-bold">
            {selected.name}
          </span>
        </div>
        <form action={formAction} className="flex flex-col gap-3">
          <input type="hidden" name="memberId" value={selected.id} />
          <label className="font-display font-bold" htmlFor="pin">
            Your personal PIN 🤫
          </label>
          <Input
            id="pin"
            name="pin"
            type="password"
            inputMode="numeric"
            placeholder="• • • •"
            className="text-center text-2xl tracking-[0.5em]"
            autoFocus
            required
          />
          {state.error && (
            <p className="animate-wiggle text-center font-bold text-coral">
              {state.error}
            </p>
          )}
          <Button type="submit" disabled={pending}>
            {pending ? "Checking..." : "That's me!"}
          </Button>
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="font-display text-sm font-bold text-ink/50 underline"
          >
            ← Not you? Pick someone else
          </button>
          <button
            type="button"
            onClick={() => setForgot((v) => !v)}
            className="font-display text-sm font-bold text-ink/50 underline"
          >
            Forgot your PIN? 🙈
          </button>
        </form>
        {forgot && (
          <ForgotPinPanel member={selected} />
        )}
      </Card>
    );
  }

  return (
    <div className="grid w-full max-w-md grid-cols-2 gap-4">
      {members.map((member, i) => (
        <button
          key={member.id}
          type="button"
          onClick={() => setSelected(member)}
          className="animate-pop-in flex w-full flex-col items-center gap-2 rounded-blob border-2 border-ink p-6 shadow-sticker transition-all hover:-translate-y-1 hover:shadow-sticker-lg active:translate-y-0 active:scale-95 active:shadow-none"
          style={{
            backgroundColor: member.colorHex,
            animationDelay: `${i * 80}ms`,
          }}
        >
          <span className="text-5xl">{member.emoji}</span>
          <span className="font-display text-lg font-bold text-white [text-shadow:1px_1px_0_rgba(0,0,0,0.3)]">
            {member.name}
          </span>
        </button>
      ))}
    </div>
  );
}
