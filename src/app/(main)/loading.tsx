/**
 * Instant navigation feedback. Because the (main) layout no longer awaits
 * `cookies()` at its top level, this fallback renders immediately on every
 * tab switch while the route's data streams in.
 */
export default function Loading() {
  return (
    <div className="flex animate-pulse flex-col gap-5" aria-hidden>
      <div className="flex flex-col gap-2">
        <div className="h-8 w-2/3 rounded-full bg-ink/10" />
        <div className="h-4 w-1/2 rounded-full bg-ink/10" />
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="rounded-blob border-2 border-ink/10 bg-white p-4 shadow-sticker"
        >
          <div className="h-5 w-1/3 rounded-full bg-ink/10" />
          <div className="mt-3 h-4 w-3/4 rounded-full bg-ink/10" />
          <div className="mt-2 h-4 w-1/2 rounded-full bg-ink/10" />
        </div>
      ))}
    </div>
  );
}
