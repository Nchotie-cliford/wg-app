import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AUTH_COOKIE, AUTH_VALUE } from "@/lib/session";
import { MemberPicker } from "./MemberPicker";

export default async function WhoAmIPage() {
  const store = await cookies();
  if (store.get(AUTH_COOKIE)?.value !== AUTH_VALUE) redirect("/login");
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
