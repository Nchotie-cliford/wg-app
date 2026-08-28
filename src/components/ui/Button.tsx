const variants = {
  coral: "bg-coral text-white",
  sunny: "bg-sunny text-ink",
  mint: "bg-mint text-ink",
  sky: "bg-sky text-white",
  white: "bg-white text-ink",
} as const;

export function Button({
  children,
  variant = "coral",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
}) {
  return (
    <button
      className={`rounded-full border-2 border-ink px-5 py-2.5 font-display font-bold shadow-sticker-sm transition-all hover:-translate-y-0.5 hover:shadow-sticker active:translate-y-0 active:scale-95 active:shadow-none disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
