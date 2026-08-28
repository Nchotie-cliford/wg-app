export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-blob border-2 border-ink bg-white shadow-sticker ${className}`}
    >
      {children}
    </div>
  );
}
