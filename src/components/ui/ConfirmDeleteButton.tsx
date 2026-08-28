"use client";

export function ConfirmDeleteButton({
  action,
  hiddenName,
  hiddenValue,
  confirmMessage,
  label = "✕",
}: {
  action: (formData: FormData) => void;
  hiddenName: string;
  hiddenValue: string | number;
  confirmMessage: string;
  label?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(confirmMessage)) e.preventDefault();
      }}
    >
      <input type="hidden" name={hiddenName} value={hiddenValue} />
      <button
        type="submit"
        className="rounded-full px-1 text-ink/30 transition-colors hover:text-coral"
        aria-label="Delete"
      >
        {label}
      </button>
    </form>
  );
}
