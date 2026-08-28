import { format, startOfDay } from "date-fns";
import { prisma } from "@/lib/prisma";
import { requireMember } from "@/lib/session";
import { deleteEvent } from "@/actions/events";
import { deleteBlock } from "@/actions/blocks";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDeleteButton } from "@/components/ui/ConfirmDeleteButton";
import { AddEventForm } from "./AddEventForm";
import { AddBlockForm } from "./AddBlockForm";

export default async function CalendarPage() {
  const me = await requireMember();
  const [events, blocks] = await Promise.all([
    prisma.event.findMany({
      where: { date: { gte: startOfDay(new Date()) } },
      include: { addedBy: true },
      orderBy: { date: "asc" },
    }),
    prisma.block.findMany({
      where: { endDate: { gte: startOfDay(new Date()) } },
      include: { member: true },
      orderBy: { startDate: "asc" },
    }),
  ]);

  const byMonth = new Map<string, typeof events>();
  for (const e of events) {
    const key = format(e.date, "MMMM yyyy");
    byMonth.set(key, [...(byMonth.get(key) ?? []), e]);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-extrabold">Flat Calendar 📅</h1>
        <p className="font-semibold text-ink/60">
          Guests, parties, quiet days...
        </p>
      </div>

      <Card className="p-4">
        <h2 className="mb-3 font-display text-lg font-bold">
          Add an event
        </h2>
        <AddEventForm />
      </Card>

      <Card className="p-4">
        <h2 className="font-display text-lg font-bold">
          Block a week 🚫📅
        </h2>
        <p className="mb-3 text-xs font-semibold text-ink/50">
          Exams, deadlines, anything that means no chores for you that week.
          Bills still apply, just cleaning is paused.
        </p>
        <AddBlockForm />
        {blocks.length > 0 && (
          <div className="mt-3 flex flex-col gap-2 border-t-2 border-dashed border-ink/20 pt-3">
            {blocks.map((b) => (
              <div
                key={b.id}
                className="flex items-center gap-2 text-sm font-semibold"
              >
                <Avatar member={b.member} size="sm" />
                <span className="flex-1">
                  {b.member.name}: {format(b.startDate, "d MMM")} to{" "}
                  {format(b.endDate, "d MMM")}
                  {b.reason && (
                    <span className="text-ink/50"> ({b.reason})</span>
                  )}
                </span>
                {b.memberId === me.id && (
                  <ConfirmDeleteButton
                    action={deleteBlock}
                    hiddenName="id"
                    hiddenValue={b.id}
                    confirmMessage={`Remove your block for ${format(b.startDate, "d MMM")} to ${format(b.endDate, "d MMM")}?`}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {events.length === 0 && (
        <EmptyState emoji="🦗" message="Nothing planned, peaceful flat!" />
      )}

      {[...byMonth.entries()].map(([month, monthEvents]) => (
        <div key={month} className="flex flex-col gap-3">
          <h2 className="font-display text-xl font-bold">{month}</h2>
          {monthEvents.map((e) => (
            <Card
              key={e.id}
              className="animate-pop-in flex items-center gap-3 p-3"
            >
              <span className="flex min-w-14 flex-col items-center rounded-blob border-2 border-ink bg-sunny px-2 py-1">
                <span className="font-display text-xl font-extrabold leading-none">
                  {format(e.date, "d")}
                </span>
                <span className="text-[10px] font-bold uppercase">
                  {format(e.date, "EEE")}
                </span>
              </span>
              <span className="flex-1">
                <span className="block font-display font-bold leading-tight">
                  {e.title}
                </span>
                {e.note && (
                  <span className="text-xs font-semibold text-ink/60">
                    {e.note}
                  </span>
                )}
              </span>
              <Avatar member={e.addedBy} size="sm" />
              <form action={deleteEvent}>
                <input type="hidden" name="id" value={e.id} />
                <button
                  type="submit"
                  className="rounded-full px-1 text-ink/30 transition-colors hover:text-coral"
                  aria-label={`Delete ${e.title}`}
                >
                  ✕
                </button>
              </form>
            </Card>
          ))}
        </div>
      ))}
    </div>
  );
}
