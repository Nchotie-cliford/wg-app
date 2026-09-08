"use client";

import { useActionState } from "react";
import { changeMyPin } from "@/actions/members";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function PinForm() {
  const [state, formAction, pending] = useActionState(changeMyPin, {});

  return (
    <form action={formAction} className="flex w-full flex-col gap-3">
      <Input
        name="currentPin"
        type="password"
        inputMode="numeric"
        autoComplete="current-password"
        placeholder="Current PIN"
        required
      />
      <div className="flex items-center gap-3">
        <Input
          name="pin"
          type="password"
          inputMode="numeric"
          autoComplete="new-password"
          minLength={4}
          maxLength={8}
          placeholder="New PIN (4-8 digits)"
          required
        />
        <Button type="submit" variant="sunny" disabled={pending}>
          {pending ? "..." : "Change"}
        </Button>
      </div>
      {state.error && (
        <p className="animate-wiggle font-bold text-coral">{state.error}</p>
      )}
      {state.ok && (
        <p className="animate-pop-in font-bold text-mint-dark">
          PIN updated ✅ Other devices have been signed out.
        </p>
      )}
    </form>
  );
}
