export function EmptyState({
  emoji,
  message,
}: {
  emoji: string;
  message: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center">
      <span className="text-5xl">{emoji}</span>
      <p className="font-semibold text-ink/60">{message}</p>
    </div>
  );
}
