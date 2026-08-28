export function euroToCents(input: string): number {
  const n = Number(String(input).replace(",", "."));
  if (!Number.isFinite(n)) return NaN;
  return Math.round(n * 100);
}

export function splitEvenCents(
  totalCents: number,
  memberIds: number[],
  payerId: number
): Record<number, number> {
  const n = memberIds.length;
  const base = Math.floor(totalCents / n);
  const remainder = totalCents - base * n;
  const result: Record<number, number> = {};
  for (const id of memberIds) result[id] = base;
  if (memberIds.includes(payerId)) {
    result[payerId] += remainder;
  } else if (memberIds.length > 0) {
    result[memberIds[0]] += remainder;
  }
  return result;
}
