type AvatarMember = { name: string; emoji: string; colorHex: string };

const sizes = {
  sm: "size-8 text-base",
  md: "size-11 text-xl",
  lg: "size-16 text-3xl",
} as const;

const badgeSizes = {
  sm: "text-[10px] -right-0.5 -bottom-0.5 size-3.5",
  md: "text-xs -right-0.5 -bottom-0.5 size-4.5",
  lg: "text-sm -right-1 -bottom-1 size-6",
} as const;

export function Avatar({
  member,
  size = "md",
  away = false,
}: {
  member: AvatarMember;
  size?: keyof typeof sizes;
  away?: boolean;
}) {
  return (
    <span className="relative inline-flex">
      <span
        className={`inline-flex items-center justify-center rounded-full border-2 border-ink ${sizes[size]} ${
          away ? "grayscale opacity-70" : ""
        }`}
        style={{ backgroundColor: member.colorHex }}
        title={away ? `${member.name} (away)` : member.name}
      >
        {member.emoji}
      </span>
      {away && (
        <span
          className={`absolute flex items-center justify-center rounded-full border border-ink bg-sunny leading-none ${badgeSizes[size]}`}
          title="Away"
        >
          🌴
        </span>
      )}
    </span>
  );
}
