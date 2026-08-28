"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE, AUTH_VALUE, MEMBER_COOKIE } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax",
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
} as const;

export async function login(
  _prev: { error?: string },
  formData: FormData
): Promise<{ error?: string }> {
  const pin = String(formData.get("pin") ?? "");
  if (pin !== process.env.WG_APP_PIN) {
    return { error: "Wrong PIN, try again! 🙈" };
  }
  const store = await cookies();
  store.set(AUTH_COOKIE, AUTH_VALUE, COOKIE_OPTS);
  redirect("/whoami");
}

export async function pickMember(
  _prev: { error?: string },
  formData: FormData
): Promise<{ error?: string }> {
  const store = await cookies();
  if (store.get(AUTH_COOKIE)?.value !== AUTH_VALUE) redirect("/login");
  const memberId = Number(formData.get("memberId"));
  const pin = String(formData.get("pin") ?? "");
  const member = await prisma.member.findUnique({ where: { id: memberId } });
  if (!member) return { error: "That flatmate doesn't exist 🤔" };
  if (pin !== member.pin) return { error: "Wrong personal PIN! 🙈" };
  store.set(MEMBER_COOKIE, String(member.id), COOKIE_OPTS);
  redirect("/");
}

export async function logout() {
  const store = await cookies();
  store.delete(AUTH_COOKIE);
  store.delete(MEMBER_COOKIE);
  redirect("/login");
}
