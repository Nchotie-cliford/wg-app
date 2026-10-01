"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireMember } from "@/lib/session";

const MAX_RULE = 500;

function readText(formData: FormData) {
  return String(formData.get("text") ?? "").trim().slice(0, MAX_RULE);
}

function readId(formData: FormData) {
  const id = Number(formData.get("id"));
  return Number.isInteger(id) && id > 0 ? id : null;
}

// House rules are a shared flat resource, like the shopping list: any
// authenticated member may add, edit or delete any rule. Auth is still required.

export async function addRule(formData: FormData) {
  const me = await requireMember();
  const text = readText(formData);
  if (!text) return;
  await prisma.houseRule.create({ data: { text, createdById: me.id } });
  revalidatePath("/rules");
}

export async function updateRule(formData: FormData) {
  const me = await requireMember();
  const id = readId(formData);
  const text = readText(formData);
  if (!id || !text) return;
  // updateMany so a rule deleted by someone else meanwhile is a no-op, not a throw.
  await prisma.houseRule.updateMany({
    where: { id },
    data: { text, updatedById: me.id },
  });
  revalidatePath("/rules");
}

export async function deleteRule(formData: FormData) {
  await requireMember();
  const id = readId(formData);
  if (!id) return;
  await prisma.houseRule.deleteMany({ where: { id } });
  revalidatePath("/rules");
}
