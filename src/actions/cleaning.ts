"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireMember } from "@/lib/session";

export async function toggleSubtask(formData: FormData) {
  const me = await requireMember();
  const id = Number(formData.get("id"));
  const check = await prisma.subtaskCheck.findUnique({
    where: { id },
    include: { cleaningWeek: true },
  });
  if (!check || check.cleaningWeek.memberId !== me.id) return;

  await prisma.subtaskCheck.update({
    where: { id },
    data: { done: !check.done },
  });

  const allChecks = await prisma.subtaskCheck.findMany({
    where: { cleaningWeekId: check.cleaningWeekId },
  });
  const allDone = allChecks.every((c) => c.done);
  await prisma.cleaningWeek.update({
    where: { id: check.cleaningWeekId },
    data: { done: allDone },
  });

  revalidatePath("/cleaning");
  revalidatePath("/");
}
