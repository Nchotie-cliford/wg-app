import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";

export const AUTH_COOKIE = "wg_auth";
export const MEMBER_COOKIE = "wg_member";
export const AUTH_VALUE = "ok";

export async function requireMember() {
  const store = await cookies();
  if (store.get(AUTH_COOKIE)?.value !== AUTH_VALUE) redirect("/login");
  const memberId = Number(store.get(MEMBER_COOKIE)?.value);
  if (!memberId) redirect("/whoami");
  const member = await prisma.member.findUnique({ where: { id: memberId } });
  if (!member) redirect("/whoami");
  return member;
}
