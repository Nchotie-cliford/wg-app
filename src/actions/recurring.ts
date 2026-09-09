"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireMember } from "@/lib/session";
import { CATEGORIES } from "@/lib/categories";

const CATEGORY_NAMES = new Set<string>(CATEGORIES.map((c) => c.name));
const MAX_TITLE = 80;

export async function addRecurringExpense(formData: FormData) {
  const me = await requireMember();
  const title = String(formData.get("title") ?? "").trim().slice(0, MAX_TITLE);
  const categoryRaw = String(formData.get("category") ?? "Other");
  const category = CATEGORY_NAMES.has(categoryRaw) ? categoryRaw : "Other";
  const amount = Number(String(formData.get("amount") ?? "").replace(",", "."));

  if (!title || !Number.isFinite(amount) || amount <= 0 || amount > 100_000) {
    return;
  }

  const paidByRaw = Number(formData.get("paidById"));
  const exists = await prisma.member.findUnique({
    where: { id: paidByRaw },
    select: { id: true },
  });
  const paidById = exists ? paidByRaw : me.id;

  await prisma.recurringExpense.create({
    data: { title, category, amount, paidById, addedById: me.id },
  });
  revalidatePath("/expenses");
}

export async function deleteRecurringExpense(formData: FormData) {
  const me = await requireMember();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;

  const recurring = await prisma.recurringExpense.findUnique({
    where: { id },
    select: { addedById: true },
  });
  if (!recurring || recurring.addedById !== me.id) return;

  await prisma.recurringExpense.delete({ where: { id } });
  revalidatePath("/expenses");
}
