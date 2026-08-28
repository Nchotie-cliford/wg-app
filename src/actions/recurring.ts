"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireMember } from "@/lib/session";

export async function addRecurringExpense(formData: FormData) {
  const me = await requireMember();
  const title = String(formData.get("title") ?? "").trim();
  const category = String(formData.get("category") ?? "Other");
  const amount = Number(
    String(formData.get("amount") ?? "").replace(",", ".")
  );
  const paidById = Number(formData.get("paidById")) || me.id;
  if (!title || !Number.isFinite(amount) || amount <= 0) return;
  await prisma.recurringExpense.create({
    data: { title, category, amount, paidById, addedById: me.id },
  });
  revalidatePath("/expenses");
}

export async function deleteRecurringExpense(formData: FormData) {
  const me = await requireMember();
  const id = Number(formData.get("id"));
  const recurring = await prisma.recurringExpense.findUnique({
    where: { id },
  });
  if (!recurring || recurring.addedById !== me.id) return;
  await prisma.recurringExpense.delete({ where: { id } });
  revalidatePath("/expenses");
}
