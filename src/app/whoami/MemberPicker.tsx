"use client";

import { useActionState, useState } from "react";
import { pickMember } from "@/actions/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import type { PickableMember } from "@/lib/characters";

export function MemberPicker({ members }: { members: PickableMember[] }) {
  const [selected, setSelected] = useState<PickableMember | null>(null);
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
        </form>
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
