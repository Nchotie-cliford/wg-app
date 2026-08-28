import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const members = [
  { name: "Flatmate 1", emoji: "🦊", colorHex: "#FF6B6B", pin: "1111", order: 0 },
  { name: "Flatmate 2", emoji: "🐼", colorHex: "#4ECDC4", pin: "2222", order: 1 },
  { name: "Flatmate 3", emoji: "🐸", colorHex: "#FFD93D", pin: "3333", order: 2 },
  { name: "Flatmate 4", emoji: "🐙", colorHex: "#45AAF2", pin: "4444", order: 3 },
];

const tasks = [
  { name: "Kitchen", emoji: "🍳", order: 0 },
  { name: "Bathroom", emoji: "🛁", order: 1 },
  { name: "Toilet", emoji: "🚽", order: 2 },
  { name: "Floor", emoji: "🧹", order: 3 },
  { name: "Trash", emoji: "🗑️", order: 4 },
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
    await prisma.cleaningTask.upsert({
      where: { order: t.order },
      update: {},
      create: t,
    });
  }
  console.log("Seeded 4 members and 4 cleaning tasks.");
}

main().finally(() => prisma.$disconnect());
