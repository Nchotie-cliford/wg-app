import { prisma } from "@/lib/prisma";
import { MemberPicker } from "./MemberPicker";

export default async function WhoAmIPage() {
  const members = await prisma.member.findMany({
    orderBy: { order: "asc" },
    select: { id: true, name: true, emoji: true, colorHex: true },
  });

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 p-6">
      <div className="animate-pop-in text-center">
        <h1 className="text-4xl font-extrabold">Who are you? 👀</h1>
        <p className="font-semibold text-ink/60">Pick your character</p>
      </div>
      <MemberPicker members={members} />
    </main>
  );
}
