"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession } from "@/lib/session";
import { hashPin, verifyPin } from "@/lib/crypto";

const LOCK_THRESHOLD = 5;

/** Minutes to lock the account for after `attempts` consecutive failures. */
function lockMinutes(attempts: number): number {
  if (attempts < LOCK_THRESHOLD) return 0;
  return Math.min(30, 2 ** (attempts - LOCK_THRESHOLD)); // 1,2,4,8,16,30…
}

export async function pickMember(
  _prev: { error?: string },
  formData: FormData
): Promise<{ error?: string }> {
  const memberId = Number(formData.get("memberId"));
  const pin = String(formData.get("pin") ?? "");

  if (!Number.isInteger(memberId) || memberId <= 0) {
    return { error: "Pick a flatmate first 👀" };
  }
  if (pin.length < 4 || pin.length > 64) {
    return { error: "Wrong personal PIN! 🙈" };
  }

  const member = await prisma.member.findUnique({
    where: { id: memberId },
    select: {
      id: true,
      pin: true,
      failedPinAttempts: true,
      pinLockedUntil: true,
      sessionVersion: true,
      mustChangePin: true,
    },
  });

  // Uniform response whether or not the member exists / pin is wrong.
  const genericFail = { error: "Wrong personal PIN! 🙈" };
  if (!member) return genericFail;

  const now = new Date();
  if (member.pinLockedUntil && member.pinLockedUntil > now) {
    const mins = Math.ceil((+member.pinLockedUntil - +now) / 60000);
    return { error: `Too many tries. Locked for ${mins} more minute${mins === 1 ? "" : "s"} ⏳` };
  }

  const { ok, needsUpgrade } = await verifyPin(pin, member.pin);

  if (!ok) {
    const attempts = member.failedPinAttempts + 1;
    const lock = lockMinutes(attempts);
    await prisma.member.update({
      where: { id: member.id },
      data: {
        failedPinAttempts: attempts,
        pinLockedUntil:
          lock > 0 ? new Date(now.getTime() + lock * 60000) : null,
      },
    });
    return lock > 0
      ? { error: `Too many tries. Locked for ${lock} minute${lock === 1 ? "" : "s"} ⏳` }
      : genericFail;
  }

  // Success: clear counters, and transparently upgrade a legacy plaintext PIN.
  await prisma.member.update({
    where: { id: member.id },
    data: {
      failedPinAttempts: 0,
      pinLockedUntil: null,
      // They got in, so any "I'm locked out" request is moot.
      pinResetRequestedAt: null,
      ...(needsUpgrade ? { pin: await hashPin(pin) } : {}),
    },
  });

  await createSession({ id: member.id, sessionVersion: member.sessionVersion });
  // A PIN a flatmate reset only gets you as far as choosing a real one.
  redirect(member.mustChangePin ? "/set-pin" : "/");
}

/**
 * Raised from the login screen by someone who cannot get in — the one action
 * here that needs no session, because by definition they have none. It only
 * raises a flag: a logged-in flatmate still has to approve it in Settings, so
 * this grants no access on its own and the worst a stranger can do is put a
 * notice in the flat's Settings.
 */
export async function requestPinReset(
  _prev: { ok?: boolean; error?: string },
  formData: FormData
): Promise<{ ok?: boolean; error?: string }> {
  const memberId = Number(formData.get("memberId"));
  if (!Number.isInteger(memberId) || memberId <= 0) {
    return { error: "Pick a flatmate first 👀" };
  }

  // updateMany, not update: a bad id must not throw (and so confirm which ids
  // exist). Already-pending requests keep their original timestamp, so spamming
  // the button cannot push the request down a list ordered by age.
  await prisma.member.updateMany({
    where: { id: memberId, pinResetRequestedAt: null },
    data: { pinResetRequestedAt: new Date() },
  });

  // Settings renders the pending list per request, so nothing to revalidate.
  return { ok: true };
}

export async function logout() {
  await destroySession();
  redirect("/whoami");
}
