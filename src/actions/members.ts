"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireMember } from "@/lib/session";
import { EMOJI_OPTIONS, COLOR_OPTIONS } from "@/lib/characters";

export async function updateMember(formData: FormData) {
  const me = await requireMember();
  const name = String(formData.get("name") ?? "").trim();
  const emoji = String(formData.get("emoji") ?? "").trim();
  const colorHex = String(formData.get("colorHex") ?? "").trim();
  if (!name || !EMOJI_OPTIONS.includes(emoji as (typeof EMOJI_OPTIONS)[number]))
    return;
  if (!COLOR_OPTIONS.includes(colorHex as (typeof COLOR_OPTIONS)[number]))
    return;
  await prisma.member.update({
    where: { id: me.id },
    data: { name, emoji, colorHex },
  });
  revalidatePath("/", "layout");
}

export async function changeMyPin(
  _prev: { error?: string; ok?: boolean },
  formData: FormData
): Promise<{ error?: string; ok?: boolean }> {
  const me = await requireMember();
  const pin = String(formData.get("pin") ?? "").trim();
  if (!/^\d{4,8}$/.test(pin)) {
    return { error: "PIN must be 4-8 digits" };
  }
  await prisma.member.update({ where: { id: me.id }, data: { pin } });
  return { ok: true };
}

export async function toggleAway() {
  const me = await requireMember();
  await prisma.member.update({
    where: { id: me.id },
    data: { isAway: !me.isAway },
  });
  revalidatePath("/", "layout");
}
