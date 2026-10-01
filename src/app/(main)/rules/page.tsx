import { prisma } from "@/lib/prisma";
import { requireMember, SAFE_MEMBER_SELECT } from "@/lib/session";
import { addRule } from "@/actions/rules";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { RuleItem } from "./RuleItem";

export default async function RulesPage() {
  await requireMember();

  const rules = await prisma.houseRule.findMany({
    select: {
      id: true,
      text: true,
      updatedAt: true,
      createdBy: { select: SAFE_MEMBER_SELECT },
      updatedBy: { select: SAFE_MEMBER_SELECT },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-extrabold">House Rules 📜</h1>
        <p className="font-semibold text-ink/60">
          What we agreed on, anyone can add, edit or remove a rule
        </p>
      </div>

      <Card className="p-4">
        <form action={addRule} className="flex flex-col gap-3">
          <textarea
            name="text"
            rows={2}
            maxLength={500}
            required
            placeholder="New rule, e.g. Quiet hours after 22:00 🤫"
            className="w-full resize-none rounded-blob border-2 border-ink bg-white px-4 py-2.5 font-semibold shadow-sticker-sm outline-none placeholder:text-ink/40 focus:shadow-sticker"
          />
          <Button type="submit" variant="mint" className="self-end">
            Add rule
          </Button>
        </form>
      </Card>

      <ol className="flex flex-col gap-2">
        {rules.length === 0 && (
          <EmptyState emoji="📜" message="No rules yet, add the first one!" />
        )}
        {rules.map((rule, i) => (
          <RuleItem key={rule.id} rule={rule} number={i + 1} />
        ))}
      </ol>
    </div>
  );
}
