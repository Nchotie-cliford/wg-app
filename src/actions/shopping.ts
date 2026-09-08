"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireMember } from "@/lib/session";

const MAX_NAME = 120;

export async function addShoppingItem(formData: FormData) {
  const me = await requireMember();
  const name = String(formData.get("name") ?? "").trim().slice(0, MAX_NAME);
  if (!name) return;
  await prisma.shoppingItem.create({ data: { name, addedById: me.id } });
  revalidatePath("/shopping");
  revalidatePath("/");
}

// The shopping list is a shared flat resource: any authenticated member may
// tick items off or clear bought ones. Auth is still required.
export async function toggleShoppingItem(formData: FormData) {
  await requireMember();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;
  const item = await prisma.shoppingItem.findUnique({
    where: { id },
    select: { done: true },
  });
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
