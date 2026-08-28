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
  const [tasks, members, blockedIds] = await Promise.all([
    prisma.cleaningTask.findMany({ orderBy: { order: "asc" } }),
    prisma.member.findMany({ orderBy: { order: "asc" } }),
    getBlockedMemberIds(weekStart),
  ]);
  const rot = rotationIndex(weekStart);
  const activeMembers = members.filter(
    (m) => !m.isAway && !blockedIds.has(m.id)
  );
  const pool = activeMembers.length > 0 ? activeMembers : members;
  for (const task of tasks) {
    const member = pool[(rot + task.order) % pool.length];
    await prisma.cleaningWeek.upsert({
      where: { weekStart_taskId: { weekStart, taskId: task.id } },
      update: {},
      create: { weekStart, taskId: task.id, memberId: member.id },
    });
  }
  const assignments = await prisma.cleaningWeek.findMany({
    where: { weekStart },
    include: { task: true, member: true },
    orderBy: { task: { order: "asc" } },
  });
  return { weekStart, assignments };
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
