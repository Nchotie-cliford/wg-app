"use client";

import { useState } from "react";
import { toggleSubtask } from "@/actions/cleaning";
import { Avatar } from "@/components/ui/Avatar";

type Subtask = { id: number; label: string; order: number };
type SubtaskCheck = { id: number; subtaskId: number; done: boolean };
type AssignmentMember = {
  id: number;
  name: string;
  emoji: string;
  colorHex: string;
  isAway: boolean;
};

export function TaskChecklist({
  taskEmoji,
  taskName,
  member,
  memberAway,
  subtasks,
  subtaskChecks,
  done,
  isMine,
  animationDelay,
}: {
  taskEmoji: string;
  taskName: string;
  member: AssignmentMember;
  memberAway: boolean;
  subtasks: Subtask[];
  subtaskChecks: SubtaskCheck[];
  done: boolean;
  isMine: boolean;
  animationDelay: number;
}) {
  const [open, setOpen] = useState(false);
  const checkFor = (subtaskId: number) =>
    subtaskChecks.find((c) => c.subtaskId === subtaskId);
  const doneCount = subtaskChecks.filter((c) => c.done).length;

  return (
    <div
      className="animate-pop-in overflow-hidden rounded-blob border-2 border-ink shadow-sticker"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex w-full items-center gap-3 p-4 text-left transition-all ${
          done ? "bg-mint/40" : "bg-white"
        } ${isMine ? "hover:-translate-y-0.5 active:scale-[0.98]" : "opacity-80"}`}
      >
        <span className="text-3xl">{taskEmoji}</span>
        <span className="flex-1">
          <span
            className={`block font-display text-lg font-bold ${
              done ? "line-through opacity-50" : ""
            }`}
          >
            {taskName}
          </span>
          <span className="text-sm font-semibold text-ink/60">
            {isMine ? "Your turn" : `Only ${member.name} can mark this`} ·{" "}
            {doneCount}/{subtaskChecks.length}
          </span>
        </span>
        <Avatar member={member} size="sm" away={memberAway} />
        <span
          className={`flex size-8 items-center justify-center rounded-full border-2 border-ink text-lg ${
            done ? "bg-mint" : "bg-white"
          }`}
        >
          {done ? "✓" : open ? "▲" : "▼"}
        </span>
      </button>

      {open && (
        <div className="animate-pop-in flex flex-col gap-1 border-t-2 border-ink bg-cream p-3">
          {subtasks.map((subtask) => {
            const check = checkFor(subtask.id);
            if (!check) return null;
            const row = (
              <>
                <span
                  className={`flex size-6 shrink-0 items-center justify-center rounded-md border-2 border-ink text-sm ${
                    check.done ? "bg-mint" : "bg-white"
                  }`}
                >
                  {check.done ? "✓" : ""}
                </span>
                <span
                  className={`text-sm font-semibold ${
                    check.done ? "line-through opacity-50" : ""
                  }`}
                >
                  {subtask.label}
                </span>
              </>
            );
            if (!isMine) {
              return (
                <div key={subtask.id} className="flex items-center gap-2 p-1.5">
                  {row}
                </div>
              );
            }
            return (
              <form key={subtask.id} action={toggleSubtask}>
                <input type="hidden" name="id" value={check.id} />
                <button
                  type="submit"
                  className="flex w-full items-center gap-2 rounded-lg p-1.5 text-left transition-colors hover:bg-white active:scale-[0.98]"
                >
                  {row}
                </button>
              </form>
            );
          })}
        </div>
      )}
    </div>
  );
}
