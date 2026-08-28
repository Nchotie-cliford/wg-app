"use client";

import { useOptimistic, useState, useTransition } from "react";
import { toggleSubtask } from "@/actions/cleaning";
import { Avatar } from "@/components/ui/Avatar";
import { taskColor, taskBlurb } from "@/lib/cleaningTasks";

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
  cleaningWeekId,
  taskEmoji,
  taskName,
  member,
  memberAway,
  subtasks,
  subtaskChecks,
  isMine,
  animationDelay,
}: {
  cleaningWeekId: number;
  taskEmoji: string;
  taskName: string;
  member: AssignmentMember;
  memberAway: boolean;
  subtasks: Subtask[];
  subtaskChecks: SubtaskCheck[];
  isMine: boolean;
  animationDelay: number;
}) {
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const [optimisticChecks, applyOptimistic] = useOptimistic(
    subtaskChecks,
    (state, toggledId: number) =>
      state.map((c) => (c.id === toggledId ? { ...c, done: !c.done } : c))
  );

  const checkFor = (subtaskId: number) =>
    optimisticChecks.find((c) => c.subtaskId === subtaskId);
  const doneCount = optimisticChecks.filter((c) => c.done).length;
  const done = optimisticChecks.length > 0 && doneCount === optimisticChecks.length;
  const color = taskColor(taskName);
  const blurb = taskBlurb(taskName);

  const handleToggle = (check: SubtaskCheck) => {
    startTransition(async () => {
      applyOptimistic(check.id);
      const fd = new FormData();
      fd.set("id", String(check.id));
      fd.set("cleaningWeekId", String(cleaningWeekId));
      fd.set("done", String(!check.done));
      await toggleSubtask(fd);
    });
  };

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
        <span
          className="flex size-12 shrink-0 items-center justify-center rounded-full border-2 border-ink text-2xl"
          style={{ backgroundColor: `${color}33` }}
        >
          {taskEmoji}
        </span>
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
            {doneCount}/{optimisticChecks.length}
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

      {/* Colored strip so each task reads as a distinct area at a glance */}
      <div className="h-1.5" style={{ backgroundColor: color }} />

      {open && (
        <div className="animate-pop-in flex flex-col gap-1 border-t-2 border-ink bg-cream p-3">
          {blurb && (
            <p className="mb-1 text-xs font-bold uppercase tracking-wide text-ink/40">
              {blurb}
            </p>
          )}
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
              <button
                key={subtask.id}
                type="button"
                onClick={() => handleToggle(check)}
                className="flex w-full items-center gap-2 rounded-lg p-1.5 text-left transition-colors hover:bg-white active:scale-[0.98]"
              >
                {row}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
