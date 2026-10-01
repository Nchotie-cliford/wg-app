"use client";

import { useActionState, useState } from "react";
import { resetFlatmatePin, dismissPinResetRequest } from "@/actions/members";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { PickableMember } from "@/lib/characters";

export type PendingReset = PickableMember & { requestedAt: Date };

function timeAgo(when: Date): string {
  const mins = Math.max(0, Math.round((Date.now() - when.getTime()) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function FlatmatePinReset({
  others,
  pending: requests,
}: {
  others: PickableMember[];
  pending: PendingReset[];
}) {
  // Which flatmate is awaiting confirmation. The reset is destructive (it signs
  // them out everywhere), so it never fires straight off the first tap.
  const [confirming, setConfirming] = useState<PickableMember | null>(null);
  const [state, formAction, submitting] = useActionState(resetFlatmatePin, {});

  if (others.length === 0) return null;

  // The temp PIN is shown once and cannot be recovered — nothing stores it in
  // readable form — so this panel stays until it is explicitly dismissed.
  if (state.tempPin) {
    return (
      <Card className="flex flex-col items-start gap-3 p-4">
        <h2 className="font-display text-lg font-bold">
          {state.name}&apos;s temp PIN 🔑
        </h2>
        <p className="font-mono text-4xl font-bold tracking-[0.3em] text-ink">
          {state.tempPin}
        </p>
        <p className="text-sm font-semibold text-ink/60">
          Read this out to {state.name} now — it&apos;s shown once and can&apos;t
          be looked up again. They log in with it, then pick their own PIN. All
          their other devices have been signed out.
        </p>
        <Button
          type="button"
          variant="white"
          className="px-4 py-2 text-sm"
          onClick={() => window.location.reload()}
        >
          Done 👍
        </Button>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col items-start gap-3 p-4">
      <div>
        <h2 className="font-display text-lg font-bold">
          Flatmate forgot their PIN? 🤔
        </h2>
        <p className="text-sm font-semibold text-ink/60">
          Nobody can look up a forgotten PIN — not even the app. Reset it and
          they get a one-time temp PIN to log in with.
        </p>
      </div>

      {requests.length > 0 && !confirming && (
        <div className="flex w-full flex-col gap-2">
          {requests.map((r) => (
            <div
              key={r.id}
              className="flex flex-wrap items-center gap-2 rounded-blob border-2 border-ink bg-sunny/50 p-3"
            >
              <span
                className="flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-ink text-lg"
                style={{ backgroundColor: r.colorHex }}
              >
                {r.emoji}
              </span>
              <span className="flex-1 font-semibold">
                <span className="font-bold">{r.name}</span> asked for a PIN reset
                <span className="block text-xs text-ink/60">
                  {timeAgo(r.requestedAt)}
                </span>
              </span>
              <Button
                type="button"
                variant="mint"
                className="px-4 py-2 text-sm"
                onClick={() => setConfirming(r)}
              >
                Approve
              </Button>
              <form action={dismissPinResetRequest}>
                <input type="hidden" name="memberId" value={r.id} />
                <Button
                  type="submit"
                  variant="white"
                  className="px-4 py-2 text-sm"
                >
                  Dismiss
                </Button>
              </form>
            </div>
          ))}
        </div>
      )}

      {confirming ? (
        <form action={formAction} className="flex w-full flex-col gap-3">
          <input type="hidden" name="memberId" value={confirming.id} />
          <p className="font-semibold">
            Reset <span className="font-bold">{confirming.name}</span>&apos;s
            PIN? They&apos;ll be signed out of all their devices.
          </p>
          <div className="flex gap-3">
            <Button type="submit" variant="coral" disabled={submitting}>
              {submitting ? "Resetting..." : "Yes, reset it"}
            </Button>
            <Button
              type="button"
              variant="white"
              onClick={() => setConfirming(null)}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex w-full flex-wrap gap-2">
          {others.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setConfirming(m)}
              className="flex items-center gap-2 rounded-full border-2 border-ink bg-white py-1.5 pl-1.5 pr-4 font-display text-sm font-bold shadow-sticker-sm transition-all hover:-translate-y-0.5 active:scale-95 active:shadow-none"
            >
              <span
                className="flex size-8 items-center justify-center rounded-full border-2 border-ink text-base"
                style={{ backgroundColor: m.colorHex }}
              >
                {m.emoji}
              </span>
              Reset {m.name}
            </button>
          ))}
        </div>
      )}

      {state.error && (
        <p className="animate-wiggle font-bold text-coral">{state.error}</p>
      )}
    </Card>
  );
}
