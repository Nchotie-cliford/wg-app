"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireMember } from "@/lib/session";

export async function confirmPayment(formData: FormData) {
  const me = await requireMember();
  const toId = Number(formData.get("toId"));
  const amount = Number(formData.get("amount"));
  if (!toId || toId === me.id || !Number.isFinite(amount) || amount <= 0)
    return;
  const to = await prisma.member.findUnique({ where: { id: toId } });
  if (!to) return;
  await prisma.payment.create({
    data: { fromId: me.id, toId, amount: Math.round(amount * 100) / 100 },
  });
  revalidatePath("/balances");
  revalidatePath("/");
}

export async function deletePayment(formData: FormData) {
  const me = await requireMember();
  const id = Number(formData.get("id"));
  const payment = await prisma.payment.findUnique({ where: { id } });
  if (!payment || payment.fromId !== me.id) return;
  await prisma.payment.delete({ where: { id } });
  revalidatePath("/balances");
  revalidatePath("/");
}
