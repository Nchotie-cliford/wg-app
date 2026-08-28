"use client";

import { useActionState } from "react";
import { login } from "@/actions/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, {});

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 p-6">
      <div className="animate-pop-in text-center">
        <div className="text-7xl">🏠</div>
        <h1 className="mt-2 text-4xl font-extrabold">WG App</h1>
        <p className="font-semibold text-ink/60">
          Cleaning, costs &amp; chaos, together!
        </p>
      </div>
      <Card className="w-full max-w-sm animate-pop-in p-6">
        <form action={formAction} className="flex flex-col gap-4">
          <label className="font-display text-lg font-bold" htmlFor="pin">
            Flat PIN 🔑
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
            {pending ? "Checking..." : "Let me in!"}
          </Button>
        </form>
      </Card>
    </main>
  );
}
