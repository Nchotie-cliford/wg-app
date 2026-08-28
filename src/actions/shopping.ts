"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireMember } from "@/lib/session";

export async function addShoppingItem(formData: FormData) {
  const me = await requireMember();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  await prisma.shoppingItem.create({ data: { name, addedById: me.id } });
  revalidatePath("/shopping");
  revalidatePath("/");
}

export async function toggleShoppingItem(formData: FormData) {
  await requireMember();
  const id = Number(formData.get("id"));
  const item = await prisma.shoppingItem.findUnique({ where: { id } });
  if (!item) return;
  await prisma.shoppingItem.update({
    where: { id },
    data: { done: !item.done },
  });
  revalidatePath("/shopping");
  revalidatePath("/");
}

export async function clearDoneItems() {
  await requireMember();
  await prisma.shoppingItem.deleteMany({ where: { done: true } });
  revalidatePath("/shopping");
  revalidatePath("/");
}
