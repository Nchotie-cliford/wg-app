"use client";

import { useState } from "react";
import { updateMember } from "@/actions/members";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import {
  EMOJI_OPTIONS,
  COLOR_OPTIONS,
  type PickableMember,
} from "@/lib/characters";

export function MemberEditor({ member }: { member: PickableMember }) {
  const [open, setOpen] = useState(false);
  const [emoji, setEmoji] = useState(member.emoji);
  const [color, setColor] = useState(member.colorHex);

  return (
    <Card className="p-4">
      <form action={updateMember} className="flex flex-col gap-3">
        <input type="hidden" name="id" value={member.id} />
        <input type="hidden" name="emoji" value={emoji} />
        <input type="hidden" name="colorHex" value={color} />
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="flex size-11 shrink-0 items-center justify-center rounded-full border-2 border-ink text-xl shadow-sticker-sm transition-all hover:-translate-y-0.5 active:scale-95"
            style={{ backgroundColor: color }}
            aria-label="Change character"
          >
            {emoji}
          </button>
          <Input name="name" defaultValue={member.name} aria-label="Name" />
          <Button type="submit" variant="mint" className="px-4 py-2">
            Save
          </Button>
        </div>

        {open && (
          <div className="animate-pop-in flex flex-col gap-3 rounded-blob border-2 border-ink bg-cream p-3">
            <div className="grid grid-cols-8 gap-1.5">
              {EMOJI_OPTIONS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={`flex aspect-square items-center justify-center rounded-xl border-2 text-xl transition-all active:scale-90 ${
                    emoji === e
                      ? "border-ink bg-sunny shadow-sticker-sm"
                      : "border-transparent hover:border-ink/30"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`size-8 rounded-full border-2 transition-all active:scale-90 ${
                    color === c
                      ? "border-ink shadow-sticker-sm scale-110"
                      : "border-ink/30"
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
          </div>
        )}
      </form>
    </Card>
  );
}
