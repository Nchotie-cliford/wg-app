"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireMember } from "@/lib/session";

export async function toggleTaskDone(formData: FormData) {
  const me = await requireMember();
  const id = Number(formData.get("id"));
  const current = await prisma.cleaningWeek.findUnique({ where: { id } });
  if (!current || current.memberId !== me.id) return;
  await prisma.cleaningWeek.update({
    where: { id },
    data: { done: !current.done },
  });
  revalidatePath("/cleaning");
  revalidatePath("/");
}
