"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireMember } from "@/lib/session";

export async function addEvent(
  _prev: { error?: string; ok?: boolean },
  formData: FormData
): Promise<{ error?: string; ok?: boolean }> {
  const me = await requireMember();
  const title = String(formData.get("title") ?? "").trim();
  const dateStr = String(formData.get("date") ?? "");
  const note = String(formData.get("note") ?? "").trim() || null;
  const date = new Date(dateStr);
  if (!title) return { error: "Give it a title! 📝" };
  if (isNaN(date.getTime())) return { error: "Pick a valid date 📅" };
  await prisma.event.create({ data: { title, date, note, addedById: me.id } });
  revalidatePath("/calendar");
  revalidatePath("/");
  return { ok: true };
}

export async function deleteEvent(formData: FormData) {
  await requireMember();
  const id = Number(formData.get("id"));
  await prisma.event.delete({ where: { id } });
  revalidatePath("/calendar");
  revalidatePath("/");
}
