import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";

export const MEMBER_COOKIE = "wg_member";

export async function requireMember() {
  const store = await cookies();
  const memberId = Number(store.get(MEMBER_COOKIE)?.value);
  if (!memberId) redirect("/whoami");
  const member = await prisma.member.findUnique({ where: { id: memberId } });
  if (!member) redirect("/whoami");
  return member;
}
