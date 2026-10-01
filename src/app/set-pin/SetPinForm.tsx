"use client";

import { useActionState } from "react";
import { setNewPin } from "@/actions/members";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

export function SetPinForm() {
  const [state, formAction, pending] = useActionState(setNewPin, {});

  return (
    <Card className="w-full max-w-sm animate-pop-in p-6">
      <form action={formAction} className="flex flex-col gap-3">
        <Input
          name="pin"
          type="password"
          inputMode="numeric"
          autoComplete="new-password"
          minLength={4}
          maxLength={8}
          placeholder="New PIN (4-8 digits)"
          className="text-center text-xl tracking-[0.4em]"
          autoFocus
          required
        />
        <Input
          name="confirmPin"
          type="password"
          inputMode="numeric"
          autoComplete="new-password"
          minLength={4}
          maxLength={8}
          placeholder="Same PIN again"
          className="text-center text-xl tracking-[0.4em]"
          required
        />
        {state.error && (
          <p className="animate-wiggle text-center font-bold text-coral">
            {state.error}
          </p>
        )}
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Lock it in 🔒"}
        </Button>
      </form>
    </Card>
  );
}
