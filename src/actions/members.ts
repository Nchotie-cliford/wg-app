"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireMember, createSession } from "@/lib/session";
import { MEMBERS_TAG } from "@/lib/data";
import { hashPin, verifyPin } from "@/lib/crypto";
import { EMOJI_OPTIONS, COLOR_OPTIONS } from "@/lib/characters";

const MAX_NAME = 40;

export async function updateMember(formData: FormData) {
  const me = await requireMember();
  const name = String(formData.get("name") ?? "").trim().slice(0, MAX_NAME);
  const emoji = String(formData.get("emoji") ?? "").trim();
  const colorHex = String(formData.get("colorHex") ?? "").trim();

  if (!name) return;
  if (!EMOJI_OPTIONS.includes(emoji as (typeof EMOJI_OPTIONS)[number])) return;
  if (!COLOR_OPTIONS.includes(colorHex as (typeof COLOR_OPTIONS)[number])) return;

  // A member can only ever edit their own row — identity comes from the session.
  await prisma.member.update({
    where: { id: me.id },
    data: { name, emoji, colorHex },
  });

  revalidateTag(MEMBERS_TAG, "max");
  revalidatePath("/settings");
  revalidatePath("/", "layout");
}

export async function changeMyPin(
  _prev: { error?: string; ok?: boolean },
  formData: FormData
): Promise<{ error?: string; ok?: boolean }> {
  const me = await requireMember();
  const currentPin = String(formData.get("currentPin") ?? "");
  const newPin = String(formData.get("pin") ?? "").trim();

  if (!/^\d{4,8}$/.test(newPin)) {
    return { error: "New PIN must be 4-8 digits" };
  }
  if (currentPin.length < 4 || currentPin.length > 64) {
    return { error: "Enter your current PIN" };
  }

  const row = await prisma.member.findUnique({
    where: { id: me.id },
    select: { pin: true, sessionVersion: true },
  });
  if (!row) return { error: "Something went wrong" };

  const { ok } = await verifyPin(currentPin, row.pin);
  if (!ok) return { error: "Current PIN is wrong 🙈" };

  // Bump sessionVersion so any other logged-in device is signed out,
  // then re-issue this device's cookie at the new version.
  const nextVersion = row.sessionVersion + 1;
  await prisma.member.update({
    where: { id: me.id },
    data: {
      pin: await hashPin(newPin),
      sessionVersion: nextVersion,
      failedPinAttempts: 0,
      pinLockedUntil: null,
    },
  });
  await createSession({ id: me.id, sessionVersion: nextVersion });

  return { ok: true };
}

export async function toggleAway() {
  const me = await requireMember();
  await prisma.member.update({
    where: { id: me.id },
    data: { isAway: !me.isAway },
  });

  revalidateTag(MEMBERS_TAG, "max");
  revalidatePath("/settings");
  revalidatePath("/cleaning");
  revalidatePath("/expenses");
  revalidatePath("/");
}
