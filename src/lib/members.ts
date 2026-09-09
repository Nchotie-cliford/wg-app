/** Name of the signed session cookie. Kept here so `proxy.ts` can import it
 * without pulling in server-only modules. */
export const MEMBER_COOKIE = "wg_member";

/**
 * Client-safe shared member shape. This is the ONLY member projection that may
 * cross to the browser — it deliberately omits `pin`, `failedPinAttempts`,
 * `pinLockedUntil` and `sessionVersion`.
 */
export type SafeMember = {
  id: number;
  name: string;
  emoji: string;
  colorHex: string;
  isAway: boolean;
  order: number;
};

/**
 * Prisma `select` matching {@link SafeMember}. Lives in this dependency-free
 * module so the data/cache layer can use it without importing the DAL (which
 * pulls in `next/headers`).
 */
export const SAFE_MEMBER_SELECT = {
  id: true,
  name: true,
  emoji: true,
  colorHex: true,
  isAway: true,
  order: true,
} as const;
