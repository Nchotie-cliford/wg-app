"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireMember } from "@/lib/session";

export async function confirmPayment(formData: FormData) {
  const me = await requireMember();
  const toId = Number(formData.get("toId"));
  const amount = Number(formData.get("amount"));

  if (!Number.isInteger(toId) || toId === me.id) return;
  if (!Number.isFinite(amount) || amount <= 0 || amount > 100_000) return;

  const to = await prisma.member.findUnique({
    where: { id: toId },
    select: { id: true },
  });
  if (!to) return;

  // Payer is always the session member — never taken from the form.
  await prisma.payment.create({
    data: { fromId: me.id, toId, amount: Math.round(amount * 100) / 100 },
  });
  revalidatePath("/balances");
  revalidatePath("/");
}

export async function deletePayment(formData: FormData) {
  const me = await requireMember();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;

  const payment = await prisma.payment.findUnique({
    where: { id },
    select: { fromId: true },
  });
  if (!payment || payment.fromId !== me.id) return;

  await prisma.payment.delete({ where: { id } });
  revalidatePath("/balances");
  revalidatePath("/");
}
