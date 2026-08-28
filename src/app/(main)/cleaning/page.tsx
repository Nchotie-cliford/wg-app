import { addWeeks } from "date-fns";
import {
  getWeekAssignments,
  getPastWeeks,
  getBlockedMemberIds,
} from "@/lib/cleaning";
import { weekLabel, rotationIndex, currentWeekStart } from "@/lib/week";
import { prisma } from "@/lib/prisma";
import { requireMember } from "@/lib/session";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { TaskChecklist } from "./TaskChecklist";
import { taskColor } from "@/lib/cleaningTasks";

export default async function CleaningPage() {
  const me = await requireMember();
  const { weekStart, assignments, blockedIds } = await getWeekAssignments();
  const doneCount = assignments.filter((a) => a.done).length;

  const nextWeekStart = currentWeekStart(addWeeks(new Date(), 1));
  const [tasks, members, pastWeeks, nextBlockedIds] = await Promise.all([
    prisma.cleaningTask.findMany({ orderBy: { order: "asc" } }),
    prisma.member.findMany({ orderBy: { order: "asc" } }),
    getPastWeeks(4),
    getBlockedMemberIds(nextWeekStart),
  ]);
  const nextRot = rotationIndex(nextWeekStart);
  const awayMembers = members.filter((m) => m.isAway);
  const blockedThisWeek = members.filter(
    (m) => !m.isAway && blockedIds.has(m.id)
  );
  const notCleaningThisWeek = [...awayMembers, ...blockedThisWeek];
  const nextActive = members.filter(
    (m) => !m.isAway && !nextBlockedIds.has(m.id)
  );
  const nextPool = nextActive.length > 0 ? nextActive : members;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-extrabold">Cleaning Plan 🧹</h1>
        <p className="font-semibold text-ink/60">{weekLabel(weekStart)}</p>
      </div>

      {notCleaningThisWeek.length > 0 && (
        <Card className="bg-sunny/30 p-3">
          <p className="text-sm font-bold">
            🌴 Not cleaning this week:{" "}
            {notCleaningThisWeek.map((m) => `${m.emoji} ${m.name}`).join(", ")}
            , their tasks are covered by whoever&apos;s around.
          </p>
        </Card>
      )}

      <Card className="p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-display font-bold">This week</span>
          <span className="font-display text-sm font-bold text-ink/60">
            {doneCount}/{assignments.length} done
          </span>
        </div>
        <div className="h-4 overflow-hidden rounded-full border-2 border-ink bg-cream">
          <div
            className="h-full bg-mint transition-all"
            style={{
              width: `${(doneCount / Math.max(assignments.length, 1)) * 100}%`,
            }}
          />
        </div>
      </Card>

      <div className="flex flex-col gap-3">
        {assignments.map((a, i) => (
          <TaskChecklist
            key={a.id}
            cleaningWeekId={a.id}
            taskEmoji={a.task.emoji}
            taskName={a.task.name}
            member={a.member}
            memberAway={a.member.isAway || blockedIds.has(a.member.id)}
            subtasks={a.task.subtasks}
            subtaskChecks={a.subtaskChecks}
            isMine={a.memberId === me.id}
            animationDelay={i * 60}
          />
        ))}
      </div>

      <Card className="p-4">
        <h2 className="mb-3 font-display text-lg font-bold">Next week 🔮</h2>
        <div className="flex flex-col gap-2">
          {tasks.map((task) => {
            const member = nextPool[(nextRot + task.order) % nextPool.length];
            return (
              <div
                key={task.id}
                className="flex items-center gap-2 text-sm font-semibold"
              >
                <span
                  className="flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-ink text-sm"
                  style={{ backgroundColor: `${taskColor(task.name)}33` }}
                >
                  {task.emoji}
                </span>
                <span className="flex-1">{task.name}</span>
                <span className="text-ink/60">{member.name}</span>
                <Avatar
                  member={member}
                  size="sm"
                  away={member.isAway || nextBlockedIds.has(member.id)}
                />
              </div>
            );
          })}
        </div>
      </Card>

      {pastWeeks.length > 0 && (
        <Card className="p-4">
          <h2 className="mb-3 font-display text-lg font-bold">
            Past weeks 🗂️
          </h2>
          <div className="flex flex-col gap-3">
            {pastWeeks.map(({ weekStart: ws, rows }) => (
              <div key={+ws} className="flex flex-col gap-1">
                <span className="text-xs font-bold text-ink/50">
                  {weekLabel(ws)}
                </span>
                <div className="flex flex-wrap gap-2">
                  {rows.map((r) => (
                    <span
                      key={r.id}
                      className={`flex items-center gap-1 rounded-full border-2 border-ink px-2 py-1 text-xs font-bold ${
                        r.done ? "bg-mint/40" : "bg-coral/20"
                      }`}
                      title={`${r.task.name}: ${r.member.name}`}
                    >
                      {r.task.emoji} {r.done ? "✓" : "✕"}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
