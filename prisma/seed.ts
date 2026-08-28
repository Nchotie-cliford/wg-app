import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const members = [
  { name: "Flatmate 1", emoji: "🦊", colorHex: "#FF6B6B", pin: "1111", order: 0 },
  { name: "Flatmate 2", emoji: "🐼", colorHex: "#4ECDC4", pin: "2222", order: 1 },
  { name: "Flatmate 3", emoji: "🐸", colorHex: "#FFD93D", pin: "3333", order: 2 },
  { name: "Flatmate 4", emoji: "🐙", colorHex: "#45AAF2", pin: "4444", order: 3 },
];

const tasks = [
  {
    name: "Kitchen",
    emoji: "🍳",
    order: 0,
    subtasks: [
      "Sweep & mop the kitchen floor",
      "Empty the dishwasher / put away clean dishes",
      "Wash, dry & put away anything left in the sink",
      "Wipe down countertops & stovetop",
      "Wipe down the kitchen table",
    ],
  },
  {
    name: "Bathroom",
    emoji: "🛁",
    order: 1,
    subtasks: [
      "Wipe down sink & counter",
      "Clean the shower/tub (walls, glass/curtain, drain hair)",
      "Wipe the mirror",
      "Sweep & mop the bathroom floor",
    ],
  },
  {
    name: "Toilet",
    emoji: "🚽",
    order: 2,
    subtasks: [
      "Scrub the bowl",
      "Wipe seat, lid & outside of the bowl",
      "Wipe the flush handle & surrounding wall/tiles",
      "Top up toilet paper if the flat's stock is out",
    ],
  },
  {
    name: "Floor & Trash",
    emoji: "🧹",
    order: 3,
    subtasks: [
      "Sweep & mop common areas",
      "Empty the kitchen bin",
      "Empty the bathroom bin",
      "Empty the toilet bin",
      "Take everything out to the outside trash & recycling bins",
      "Restock bin bags where needed",
    ],
  },
];

async function main() {
  for (const m of members) {
    await prisma.member.upsert({
      where: { order: m.order },
      update: {},
      create: m,
    });
  }
  for (const t of tasks) {
    const task = await prisma.cleaningTask.upsert({
      where: { order: t.order },
      update: { name: t.name, emoji: t.emoji },
      create: { name: t.name, emoji: t.emoji, order: t.order },
    });
    const existing = await prisma.cleaningSubtask.findMany({
      where: { taskId: task.id },
    });
    if (existing.length === 0) {
      for (let i = 0; i < t.subtasks.length; i++) {
        await prisma.cleaningSubtask.create({
          data: { taskId: task.id, label: t.subtasks[i], order: i },
        });
      }
    }
  }
  console.log("Seeded 4 members and 4 cleaning tasks with subtasks.");
}

main().finally(() => prisma.$disconnect());
