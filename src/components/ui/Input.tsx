export function Input({
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-full border-2 border-ink bg-white px-4 py-2.5 font-semibold shadow-sticker-sm outline-none placeholder:text-ink/40 focus:shadow-sticker ${className}`}
      {...props}
    />
  );
}

export function Select({
  className = "",
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`w-full appearance-none rounded-full border-2 border-ink bg-white px-4 py-2.5 font-semibold shadow-sticker-sm outline-none focus:shadow-sticker ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}
