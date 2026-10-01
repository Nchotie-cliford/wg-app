/**
 * Bootstrap PIN reset, run from a machine that has DATABASE_URL.
 *
 *   npm run reset-pin -- Cliford
 *   npm run reset-pin -- 0                  # by member order
 *   npm run reset-pin -- --all              # everyone (fresh start)
 *
 * Go through npm, not `npx tsx` directly: the script needs DATABASE_URL and the
 * npm script passes --env-file-if-exists=.env to load it (tsx does not read .env
 * on its own, and nothing else in this project loads it for a plain node run).
 *
 * The in-app reset (Settings → "Flatmate forgot their PIN?") is the normal
 * route and needs no database access. This script exists for the one case that
 * cannot reach it: nobody is able to log in, so there is no flatmate to ask.
 * Same effect — a one-time temp PIN, every session invalidated, and the member
 * held at /set-pin until they choose their own.
 */
import { PrismaClient } from "@prisma/client";
import { hashPin, generateTempPin } from "../src/lib/crypto";

const prisma = new PrismaClient();

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error(
      "DATABASE_URL is not set. Run this as `npm run reset-pin -- <name>` so .env is loaded."
    );
    process.exit(1);
  }

  const who = process.argv[2];
  if (!who) {
    console.error("Usage: npm run reset-pin -- <name|order|--all>");
    process.exit(1);
  }

  let members;
  if (who === "--all") {
    // Fresh start for the whole flat: everyone gets a temp PIN and picks their
    // own on next login. Only PIN/session columns change — no data is touched.
    members = await prisma.member.findMany({ orderBy: { order: "asc" } });
  } else {
    const asOrder = Number(who);
    const member = Number.isInteger(asOrder)
      ? await prisma.member.findUnique({ where: { order: asOrder } })
      : await prisma.member.findFirst({
          where: { name: { equals: who, mode: "insensitive" } },
        });

    if (!member) {
      const all = await prisma.member.findMany({
        orderBy: { order: "asc" },
        select: { order: true, name: true },
      });
      console.error(`No member matched "${who}". Known members:`);
      for (const m of all) console.error(`  order=${m.order}  ${m.name}`);
      process.exit(1);
    }
    members = [member];
  }

  console.log("");
  for (const member of members) {
    const tempPin = generateTempPin();
    await prisma.member.update({
      where: { id: member.id },
      data: {
        pin: await hashPin(tempPin),
        mustChangePin: true,
        sessionVersion: member.sessionVersion + 1,
        failedPinAttempts: 0,
        pinLockedUntil: null,
        pinResetRequestedAt: null,
      },
    });
    console.log(`  ${member.name.padEnd(12)} temp PIN: ${tempPin}`);
  }
  console.log(
    "\nEveryone listed is signed out. Each logs in with their temp PIN, then picks"
  );
  console.log("their own. Shown once — not stored readably.\n");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
