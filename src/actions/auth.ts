"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MEMBER_COOKIE } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax",
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
} as const;

export async function pickMember(
  _prev: { error?: string },
  formData: FormData
): Promise<{ error?: string }> {
  const memberId = Number(formData.get("memberId"));
  const pin = String(formData.get("pin") ?? "");
  const member = await prisma.member.findUnique({ where: { id: memberId } });
  if (!member) return { error: "That flatmate doesn't exist 🤔" };
  if (pin !== member.pin) return { error: "Wrong personal PIN! 🙈" };
  const store = await cookies();
  store.set(MEMBER_COOKIE, String(member.id), COOKIE_OPTS);
  redirect("/");
}

export async function logout() {
  const store = await cookies();
  store.delete(MEMBER_COOKIE);
  redirect("/whoami");
}
