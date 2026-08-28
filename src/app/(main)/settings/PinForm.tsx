"use client";

import { useActionState } from "react";
import { changeMyPin } from "@/actions/members";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function PinForm() {
  const [state, formAction, pending] = useActionState(changeMyPin, {});

  return (
    <form action={formAction} className="flex w-full items-center gap-3">
      <Input
        name="pin"
        type="password"
        inputMode="numeric"
        placeholder="New PIN (4-8 digits)"
        required
      />
      <Button type="submit" variant="sunny" disabled={pending}>
        {pending ? "..." : "Change"}
      </Button>
      {state.error && (
        <p className="animate-wiggle font-bold text-coral">{state.error}</p>
      )}
      {state.ok && <p className="animate-pop-in text-xl">✅</p>}
    </form>
  );
}
