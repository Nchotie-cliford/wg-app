import type { Member } from "@prisma/client";
import { addDays } from "date-fns";
import { prisma } from "./prisma";
import { currentWeekStart, rotationIndex } from "./week";

export async function getBlockedMemberIds(weekStart: Date) {
  const weekEnd = addDays(weekStart, 6);
  const blocks = await prisma.block.findMany({
    where: { startDate: { lte: weekEnd }, endDate: { gte: weekStart } },
  });
  return new Set(blocks.map((b) => b.memberId));
}

export async function getWeekAssignments(date = new Date()) {
  const weekStart = currentWeekStart(date);
  const [tasks, members, blockedIds, existing] = await Promise.all([
    prisma.cleaningTask.findMany({
      orderBy: { order: "asc" },
      include: { subtasks: { orderBy: { order: "asc" } } },
    }),
    prisma.member.findMany({ orderBy: { order: "asc" } }),
    getBlockedMemberIds(weekStart),
    prisma.cleaningWeek.findMany({
      where: { weekStart },
      include: {
        task: { include: { subtasks: { orderBy: { order: "asc" } } } },
        member: true,
        subtaskChecks: true,
      },
      orderBy: { task: { order: "asc" } },
    }),
  ]);

  // Fast path: on every load after the first one this week, everything
  // already exists, so skip straight to returning it (avoids ~4 extra
  // sequential round-trips on what is by far the common case).
  const isComplete = tasks.every((task) => {
    const week = existing.find((w) => w.taskId === task.id);
    return week && week.subtaskChecks.length === task.subtasks.length;
  });
  if (isComplete) {
    return { weekStart, assignments: existing, blockedIds };
  }

  const rot = rotationIndex(weekStart);
  const activeMembers = members.filter(
    (m) => !m.isAway && !blockedIds.has(m.id)
  );
  const pool = activeMembers.length > 0 ? activeMembers : members;

  const weeks = await Promise.all(
    tasks.map((task) => {
      const member = pool[(rot + task.order) % pool.length];
      return prisma.cleaningWeek.upsert({
        where: { weekStart_taskId: { weekStart, taskId: task.id } },
        update: {},
        create: { weekStart, taskId: task.id, memberId: member.id },
      });
    })
  );
  const weekIdByTaskId = new Map(weeks.map((w) => [w.taskId, w.id]));

  const existingChecks = await prisma.subtaskCheck.findMany({
    where: { cleaningWeekId: { in: weeks.map((w) => w.id) } },
    select: { cleaningWeekId: true, subtaskId: true },
  });
  const existingKeys = new Set(
    existingChecks.map((c) => `${c.cleaningWeekId}:${c.subtaskId}`)
  );
  const missing = tasks.flatMap((task) => {
    const weekId = weekIdByTaskId.get(task.id)!;
    return task.subtasks
      .filter((s) => !existingKeys.has(`${weekId}:${s.id}`))
      .map((s) => ({ cleaningWeekId: weekId, subtaskId: s.id }));
  });
  if (missing.length > 0) {
    await prisma.subtaskCheck.createMany({
      data: missing,
      skipDuplicates: true,
    });
  }

  const assignments = await prisma.cleaningWeek.findMany({
    where: { weekStart },
    include: {
      task: { include: { subtasks: { orderBy: { order: "asc" } } } },
      member: true,
      subtaskChecks: true,
    },
    orderBy: { task: { order: "asc" } },
  });
  return { weekStart, assignments, blockedIds };
}

export async function getPastWeeks(count = 4, date = new Date()) {
  const thisWeekStart = currentWeekStart(date);
  const rows = await prisma.cleaningWeek.findMany({
    where: { weekStart: { lt: thisWeekStart } },
    include: { task: true, member: true },
    orderBy: [{ weekStart: "desc" }, { task: { order: "asc" } }],
  });
  const byWeek = new Map<number, typeof rows>();
  for (const row of rows) {
    const key = +row.weekStart;
    byWeek.set(key, [...(byWeek.get(key) ?? []), row]);
  }
  return [...byWeek.entries()]
    .sort((a, b) => b[0] - a[0])
    .slice(0, count)
    .map(([weekStart, weekRows]) => ({
      weekStart: new Date(weekStart),
      rows: weekRows,
    }));
}

export async function computeStreaks(members: Member[], date = new Date()) {
  const thisWeekStart = currentWeekStart(date);
  const rows = await prisma.cleaningWeek.findMany({
    where: { weekStart: { lt: thisWeekStart } },
    orderBy: { weekStart: "desc" },
  });
  const weekStarts = [...new Set(rows.map((r) => +r.weekStart))].sort(
    (a, b) => b - a
  );

  const streaks = new Map<number, number>();
  for (const member of members) {
    let streak = 0;
    for (const wt of weekStarts) {
      const weekRows = rows.filter(
        (r) => +r.weekStart === wt && r.memberId === member.id
      );
      if (weekRows.length === 0) break;
      if (weekRows.every((r) => r.done)) streak++;
      else break;
    }
    streaks.set(member.id, streak);
  }
  return streaks;
}
