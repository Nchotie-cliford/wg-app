"use client";

import { useActionState, useState } from "react";
import { addBlock } from "@/actions/blocks";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function AddBlockForm() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [state, formAction, pending] = useActionState(
    async (prev: { error?: string; ok?: boolean }, formData: FormData) => {
      const result = await addBlock(prev, formData);
      if (result.ok) {
        setStartDate("");
        setEndDate("");
        setReason("");
      }
      return result;
    },
    {}
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex gap-3">
        <Input
          name="startDate"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          aria-label="From"
          required
        />
        <Input
          name="endDate"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          aria-label="To"
          required
        />
      </div>
      <Input
        name="reason"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Reason (e.g. exams)"
      />
      {state.error && (
        <p className="animate-wiggle text-center font-bold text-coral">
          {state.error}
        </p>
      )}
      <Button type="submit" variant="sunny" className="self-end" disabled={pending}>
        {pending ? "..." : "Block this time 🚫"}
      </Button>
    </form>
  );
}
