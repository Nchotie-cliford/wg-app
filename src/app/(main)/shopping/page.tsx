import { prisma } from "@/lib/prisma";
import {
  addShoppingItem,
  toggleShoppingItem,
  clearDoneItems,
} from "@/actions/shopping";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function ShoppingPage() {
  const items = await prisma.shoppingItem.findMany({
    include: { addedBy: true },
    orderBy: [{ done: "asc" }, { createdAt: "desc" }],
  });
  const doneCount = items.filter((i) => i.done).length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-extrabold">Shopping List 🛒</h1>
        <p className="font-semibold text-ink/60">
          Stuff the flat needs, anyone can grab it
        </p>
      </div>

      <Card className="p-4">
        <form action={addShoppingItem} className="flex gap-3">
          <Input name="name" placeholder="We need..." required />
          <Button type="submit" variant="mint">
            Add
          </Button>
        </form>
      </Card>

      <div className="flex flex-col gap-2">
        {items.length === 0 && (
          <EmptyState emoji="🧺" message="List is empty, the flat has everything!" />
        )}
        {items.map((item, i) => (
          <form key={item.id} action={toggleShoppingItem}>
            <input type="hidden" name="id" value={item.id} />
            <button
              type="submit"
              className={`animate-pop-in flex w-full items-center gap-3 rounded-blob border-2 border-ink p-3 text-left shadow-sticker-sm transition-all hover:-translate-y-0.5 active:scale-[0.98] active:shadow-none ${
                item.done ? "bg-mint/30" : "bg-white"
              }`}
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <span
                className={`flex size-7 items-center justify-center rounded-full border-2 border-ink ${
                  item.done ? "bg-mint" : "bg-white"
                }`}
              >
                {item.done ? "✓" : ""}
              </span>
              <span
                className={`flex-1 font-display font-bold ${
                  item.done ? "line-through opacity-50" : ""
                }`}
              >
                {item.name}
              </span>
              <Avatar member={item.addedBy} size="sm" />
            </button>
          </form>
        ))}
      </div>

      {doneCount > 0 && (
        <form action={clearDoneItems} className="text-center">
          <Button type="submit" variant="white">
            Clear {doneCount} bought item{doneCount > 1 ? "s" : ""} 🧹
          </Button>
        </form>
      )}
    </div>
  );
}
