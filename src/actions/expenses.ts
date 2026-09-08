"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireMember } from "@/lib/session";
import { euroToCents, splitEvenCents } from "@/lib/money";
import { euro } from "@/lib/balances";
import { CATEGORIES } from "@/lib/categories";

const CATEGORY_NAMES = new Set<string>(CATEGORIES.map((c) => c.name));
const MAX_TITLE = 80;
const MAX_AMOUNT_CENTS = 100_000_00; // 100k € sanity ceiling

export async function addExpense(
  _prev: { error?: string; ok?: boolean },
  formData: FormData
): Promise<{ error?: string; ok?: boolean }> {
  const me = await requireMember();

  const title = String(formData.get("title") ?? "").trim().slice(0, MAX_TITLE);
  const categoryRaw = String(formData.get("category") ?? "Other");
  const category = CATEGORY_NAMES.has(categoryRaw) ? categoryRaw : "Other";
  const totalCents = euroToCents(String(formData.get("amount") ?? ""));
  const mode = String(formData.get("mode") ?? "equal");

  if (!title) return { error: "Give it a name! 📝" };
  if (!Number.isFinite(totalCents) || totalCents <= 0) {
    return { error: "That doesn't look like a valid price 🤔" };
  }
  if (totalCents > MAX_AMOUNT_CENTS) {
    return { error: "That's a suspiciously large amount 😅" };
  }

  // The set of real member ids — every share/payer must be in here.
  const validIds = new Set(
    (await prisma.member.findMany({ select: { id: true } })).map((m) => m.id)
  );

  const paidByRaw = Number(formData.get("paidById"));
  const paidById = validIds.has(paidByRaw) ? paidByRaw : me.id;

  let shares: Record<number, number>;

  if (mode === "custom") {
    const entries: [number, number][] = [];
    for (const id of validIds) {
      const raw = formData.get(`share_${id}`);
      if (raw === null) continue;
      const cents = euroToCents(String(raw));
      if (Number.isFinite(cents) && cents > 0) entries.push([id, cents]);
    }
    if (entries.length === 0) {
      return { error: "Pick at least one person to split with 🤔" };
    }
    const sum = entries.reduce((s, [, c]) => s + c, 0);
    if (Math.abs(sum - totalCents) > 1) {
      return {
        error: `Custom split must add up to ${euro(totalCents / 100)} (currently ${euro(sum / 100)}) 🧮`,
      };
    }
    const diff = totalCents - sum;
    if (diff !== 0) {
      entries.sort((a, b) => b[1] - a[1]);
      entries[0][1] += diff;
    }
    shares = Object.fromEntries(entries);
  } else {
    const splitWith = formData
      .getAll("splitWith")
      .map((v) => Number(v))
      .filter((n) => validIds.has(n));
    if (splitWith.length === 0) {
      return { error: "Pick at least one person to split with 🤔" };
    }
    shares = splitEvenCents(totalCents, splitWith, paidById);
  }

  await prisma.expense.create({
    data: {
      title,
      category,
      amount: totalCents / 100,
      paidById,
      shares: {
        create: Object.entries(shares).map(([memberId, cents]) => ({
          memberId: Number(memberId),
          cents,
        })),
      },
    },
  });
  revalidatePath("/expenses");
  revalidatePath("/balances");
  revalidatePath("/");
  return { ok: true };
}

export async function deleteExpense(formData: FormData) {
  const me = await requireMember();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;

  // Ownership check: only the payer can delete their expense.
  const expense = await prisma.expense.findUnique({
    where: { id },
    select: { paidById: true },
  });
  if (!expense || expense.paidById !== me.id) return;

  await prisma.expense.delete({ where: { id } });
  revalidatePath("/expenses");
  revalidatePath("/balances");
  revalidatePath("/");
}
