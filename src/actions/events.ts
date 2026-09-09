"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireMember } from "@/lib/session";

const MAX_TITLE = 100;
const MAX_NOTE = 500;

export async function addEvent(
  _prev: { error?: string; ok?: boolean },
  formData: FormData
): Promise<{ error?: string; ok?: boolean }> {
  const me = await requireMember();
  const title = String(formData.get("title") ?? "").trim().slice(0, MAX_TITLE);
  const dateStr = String(formData.get("date") ?? "");
  const note =
    String(formData.get("note") ?? "").trim().slice(0, MAX_NOTE) || null;
  const date = new Date(dateStr);

  if (!title) return { error: "Give it a title! 📝" };
  if (isNaN(date.getTime())) return { error: "Pick a valid date 📅" };

  await prisma.event.create({ data: { title, date, note, addedById: me.id } });
  revalidatePath("/calendar");
  revalidatePath("/");
  return { ok: true };
}

export async function deleteEvent(formData: FormData) {
  const me = await requireMember();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;

  // Only the member who added an event may delete it.
  const event = await prisma.event.findUnique({
    where: { id },
    select: { addedById: true },
  });
  if (!event || event.addedById !== me.id) return;

  await prisma.event.delete({ where: { id } });
  revalidatePath("/calendar");
  revalidatePath("/");
}
