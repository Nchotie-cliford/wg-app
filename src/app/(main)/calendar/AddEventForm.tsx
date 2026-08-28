"use client";

import { useActionState, useState } from "react";
import { addEvent } from "@/actions/events";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function AddEventForm() {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const [state, formAction, pending] = useActionState(
    async (prev: { error?: string; ok?: boolean }, formData: FormData) => {
      const result = await addEvent(prev, formData);
      if (result.ok) {
        setTitle("");
        setDate("");
        setNote("");
      }
      return result;
    },
    {}
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <Input
        name="title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="What's happening?"
        required
      />
      <div className="flex gap-3">
        <Input
          name="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
        <Input
          name="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note (optional)"
        />
      </div>
      {state.error && (
        <p className="animate-wiggle text-center font-bold text-coral">
          {state.error}
        </p>
      )}
      <Button
        type="submit"
        variant="sky"
        className="self-end"
        disabled={pending}
      >
        {pending ? "..." : "Pin it! 📌"}
      </Button>
    </form>
  );
}
