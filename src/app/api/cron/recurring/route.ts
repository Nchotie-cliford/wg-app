import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { generateDueRecurringExpenses } from "@/lib/recurring";

export const dynamic = "force-dynamic";

/**
 * Generates any recurring bills due this month. Invoked by Vercel Cron (see
 * vercel.json), which sends `Authorization: Bearer $CRON_SECRET`. This replaces
 * the old behaviour of running generation on every /expenses render.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const provided = request.headers.get("authorization");

  if (!secret || provided !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await generateDueRecurringExpenses();
  revalidatePath("/expenses");
  revalidatePath("/balances");
  revalidatePath("/");

  return NextResponse.json({ ok: true, ranAt: new Date().toISOString() });
}
