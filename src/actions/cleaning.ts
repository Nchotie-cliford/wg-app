"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireMember } from "@/lib/session";

export async function toggleSubtask(formData: FormData) {
  const me = await requireMember();
  const id = Number(formData.get("id"));
  const cleaningWeekId = Number(formData.get("cleaningWeekId"));
  const done = formData.get("done") === "true";

  const result = await prisma.subtaskCheck.updateMany({
    where: { id, cleaningWeekId, cleaningWeek: { memberId: me.id } },
    data: { done },
  });
  if (result.count === 0) return;

  await prisma.$executeRaw`
    UPDATE "CleaningWeek"
    SET "done" = NOT EXISTS (
      SELECT 1 FROM "SubtaskCheck"
      WHERE "cleaningWeekId" = ${cleaningWeekId} AND "done" = false
    )
    WHERE "id" = ${cleaningWeekId}
  `;

  revalidatePath("/cleaning");
  revalidatePath("/");
}
