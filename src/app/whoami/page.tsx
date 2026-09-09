import { getMembers } from "@/lib/data";
import { MemberPicker } from "./MemberPicker";

// Rendered per request: the member list must reflect the live DB (e.g. a
// newly-seeded flatmate) without needing a redeploy, and the build must not
// depend on the database being reachable.
export const dynamic = "force-dynamic";

export default async function WhoAmIPage() {
  const members = await getMembers();

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
