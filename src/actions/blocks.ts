"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireMember } from "@/lib/session";

export async function addBlock(
  _prev: { error?: string; ok?: boolean },
  formData: FormData
): Promise<{ error?: string; ok?: boolean }> {
  const me = await requireMember();
  const startDate = new Date(String(formData.get("startDate") ?? ""));
  const endDate = new Date(String(formData.get("endDate") ?? ""));
  const reason = String(formData.get("reason") ?? "").trim() || null;

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return { error: "Pick valid dates 📅" };
  }
  if (endDate < startDate) {
    return { error: "End date must be after start date" };
  }

  await prisma.block.create({
    data: { memberId: me.id, startDate, endDate, reason },
  });
  revalidatePath("/calendar");
  revalidatePath("/cleaning");
  revalidatePath("/");
  return { ok: true };
}

export async function deleteBlock(formData: FormData) {
  const me = await requireMember();
  const id = Number(formData.get("id"));
  const block = await prisma.block.findUnique({ where: { id } });
  if (!block || block.memberId !== me.id) return;
  await prisma.block.delete({ where: { id } });
  revalidatePath("/calendar");
  revalidatePath("/cleaning");
  revalidatePath("/");
}
