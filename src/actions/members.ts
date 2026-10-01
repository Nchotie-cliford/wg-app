"use server";

import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireMember, loadMember, createSession } from "@/lib/session";
import { MEMBERS_TAG } from "@/lib/data";
import { hashPin, verifyPin, generateTempPin } from "@/lib/crypto";
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

/**
 * Flatmate-initiated PIN reset — the app's whole "forgot my PIN" story, since
 * there is no email or phone to send anything to. Any logged-in member can reset
 * another member's PIN; the four of us share a flat, so "ask someone in the
 * kitchen" is the recovery channel. The caller sees the temp PIN exactly once
 * (it is hashed before it is returned and never stored in readable form), the
 * owner is signed out everywhere, and `mustChangePin` holds them at /set-pin on
 * their next login so a flatmate's knowledge of the temp PIN is short-lived.
 */
export async function resetFlatmatePin(
  _prev: { error?: string; tempPin?: string; name?: string },
  formData: FormData
): Promise<{ error?: string; tempPin?: string; name?: string }> {
  const me = await requireMember();
  const memberId = Number(formData.get("memberId"));

  if (!Number.isInteger(memberId) || memberId <= 0) {
    return { error: "Pick a flatmate first 👀" };
  }
  // Self-service has its own form (and would need the current PIN, which is the
  // thing that has been forgotten), so only *other* members are resettable here.
  if (memberId === me.id) {
    return { error: "That's you — use 'Your personal PIN' above ☝️" };
  }

  const target = await prisma.member.findUnique({
    where: { id: memberId },
    select: { id: true, name: true, sessionVersion: true },
  });
  if (!target) return { error: "That flatmate no longer exists" };

  const tempPin = generateTempPin();
  await prisma.member.update({
    where: { id: target.id },
    data: {
      pin: await hashPin(tempPin),
      mustChangePin: true,
      // Sign out every device holding the old session, and clear any lockout so
      // they are not locked out of the temp PIN by their own failed guesses.
      sessionVersion: target.sessionVersion + 1,
      failedPinAttempts: 0,
      pinLockedUntil: null,
      // Approving a request also closes it.
      pinResetRequestedAt: null,
    },
  });

  return { tempPin, name: target.name };
}

/**
 * Turns down a reset request without changing anyone's PIN — for a request
 * nobody in the flat recognises, or one the person resolved by remembering it.
 */
export async function dismissPinResetRequest(formData: FormData) {
  await requireMember();
  const memberId = Number(formData.get("memberId"));
  if (!Number.isInteger(memberId) || memberId <= 0) return;

  await prisma.member.updateMany({
    where: { id: memberId },
    data: { pinResetRequestedAt: null },
  });

  revalidatePath("/settings");
}

/**
 * Completes a reset: the member is logged in on a temp PIN and pinned to
 * /set-pin. No current-PIN check — they just proved they hold the temp PIN by
 * logging in, and requiring it again would only re-ask for the value their
 * flatmate read out to them.
 */
export async function setNewPin(
  _prev: { error?: string },
  formData: FormData
): Promise<{ error?: string }> {
  const me = await loadMember();
  const newPin = String(formData.get("pin") ?? "").trim();
  const confirmPin = String(formData.get("confirmPin") ?? "").trim();

  if (!me.mustChangePin) return { error: "Nothing to do here" };
  if (!/^\d{4,8}$/.test(newPin)) return { error: "PIN must be 4-8 digits" };
  if (newPin !== confirmPin) return { error: "The two PINs don't match 🙈" };

  const row = await prisma.member.findUnique({
    where: { id: me.id },
    select: { pin: true, sessionVersion: true },
  });
  if (!row) return { error: "Something went wrong" };

  // Reusing the temp PIN would leave the flatmate who read it out able to log in.
  const { ok: sameAsTemp } = await verifyPin(newPin, row.pin);
  if (sameAsTemp) return { error: "Pick something other than the temp PIN 🙃" };

  const nextVersion = row.sessionVersion + 1;
  await prisma.member.update({
    where: { id: me.id },
    data: {
      pin: await hashPin(newPin),
      mustChangePin: false,
      sessionVersion: nextVersion,
      failedPinAttempts: 0,
      pinLockedUntil: null,
      pinResetRequestedAt: null,
    },
  });
  // Re-issue this device's cookie at the new version, otherwise the bump above
  // would sign the member out of the very session that just set the PIN.
  await createSession({ id: me.id, sessionVersion: nextVersion });

  redirect("/");
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
