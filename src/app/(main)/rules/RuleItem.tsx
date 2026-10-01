"use client";

import { useState } from "react";
import { updateRule, deleteRule } from "@/actions/rules";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { ConfirmDeleteButton } from "@/components/ui/ConfirmDeleteButton";
import type { PickableMember } from "@/lib/characters";

type Rule = {
  id: number;
  text: string;
  createdBy: PickableMember;
  updatedBy: PickableMember | null;
};

export function RuleItem({ rule, number }: { rule: Rule; number: number }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <li className="rounded-blob border-2 border-ink bg-white p-3 shadow-sticker-sm">
        <form
          action={async (formData) => {
            await updateRule(formData);
            setEditing(false);
          }}
          className="flex flex-col gap-2"
        >
          <input type="hidden" name="id" value={rule.id} />
          <textarea
            name="text"
            defaultValue={rule.text}
            rows={3}
            maxLength={500}
            required
            autoFocus
            className="w-full resize-none rounded-blob border-2 border-ink bg-white px-4 py-2.5 font-semibold outline-none focus:shadow-sticker-sm"
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="white"
              className="px-4 py-2 text-sm"
              onClick={() => setEditing(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="mint" className="px-4 py-2 text-sm">
              Save
            </Button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="animate-pop-in flex items-start gap-3 rounded-blob border-2 border-ink bg-white p-3 shadow-sticker-sm">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-sunny font-display text-sm font-bold">
        {number}
      </span>
      <div className="flex-1">
        <p className="whitespace-pre-wrap break-words font-display font-bold">
          {rule.text}
        </p>
        <p className="mt-1 text-xs font-semibold text-ink/50">
          by {rule.createdBy.name}
          {rule.updatedBy && ` · edited by ${rule.updatedBy.name}`}
        </p>
      </div>
      <Avatar member={rule.createdBy} size="sm" />
      <div className="flex flex-col items-center gap-1">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded-full px-1 text-sm text-ink/40 transition-colors hover:text-ink"
          aria-label="Edit rule"
        >
          ✏️
        </button>
        <ConfirmDeleteButton
          action={deleteRule}
          hiddenName="id"
          hiddenValue={rule.id}
          confirmMessage={`Delete rule ${number}? This can't be undone.`}
        />
      </div>
    </li>
  );
}
