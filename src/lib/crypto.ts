// No `server-only` guard here: this module is also imported by `proxy.ts`
// (which runs outside the RSC bundle). Importing `node:crypto` already makes it
// impossible to pull into a client bundle.
import {
  createHmac,
  randomBytes,
  scrypt as scryptCb,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number
) => Promise<Buffer>;

/**
 * Secret used to sign session tokens. Required in production; a fixed
 * development fallback keeps `next dev` working with no setup.
 */
function sessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (secret && secret.length >= 16) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "SESSION_SECRET is not set (or too short). Generate one with `openssl rand -base64 32`."
    );
  }
  return "dev-only-insecure-session-secret-change-me";
}

/* -------------------------------------------------------------------------- */
/*  PIN hashing (scrypt)                                                       */
/* -------------------------------------------------------------------------- */

const PIN_KEYLEN = 64;

/** Produce a `scrypt:<saltHex>:<hashHex>` string for storage. */
export async function hashPin(pin: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(pin.normalize(), salt, PIN_KEYLEN);
  return `scrypt:${salt.toString("hex")}:${hash.toString("hex")}`;
}

/** True when `stored` was produced by {@link hashPin}. */
export function isHashedPin(stored: string): boolean {
  return stored.startsWith("scrypt:");
}

/**
 * Constant-time PIN check. Supports transparent migration: if `stored` is a
 * legacy plaintext PIN it is compared directly and `needsUpgrade` is returned
 * so the caller can re-hash it.
 */
export async function verifyPin(
  pin: string,
  stored: string
): Promise<{ ok: boolean; needsUpgrade: boolean }> {
  if (!isHashedPin(stored)) {
    // Legacy plaintext. Length-limit + compare; upgrade on success.
    const ok =
      stored.length > 0 && stored.length < 128 && safeEqual(pin.normalize(), stored);
    return { ok, needsUpgrade: ok };
  }
  const [, saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return { ok: false, needsUpgrade: false };
  const expected = Buffer.from(hashHex, "hex");
  const actual = await scrypt(pin.normalize(), Buffer.from(saltHex, "hex"), PIN_KEYLEN);
  const ok = expected.length === actual.length && timingSafeEqual(expected, actual);
  return { ok, needsUpgrade: false };
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/* -------------------------------------------------------------------------- */
/*  Stateless session token: v1.<payloadB64url>.<hmacB64url>                   */
/* -------------------------------------------------------------------------- */

export type SessionPayload = {
  /** member id */
  m: number;
  /** member.sessionVersion at issue time */
  v: number;
  /** issued-at (unix seconds) */
  iat: number;
};

const TOKEN_VERSION = "v1";

function b64url(buf: Buffer): string {
  return buf.toString("base64url");
}

function sign(data: string): string {
  return b64url(createHmac("sha256", sessionSecret()).update(data).digest());
}

export function signSession(payload: SessionPayload): string {
  const body = `${TOKEN_VERSION}.${b64url(Buffer.from(JSON.stringify(payload)))}`;
  return `${body}.${sign(body)}`;
}

/**
 * Verify signature + structural integrity of a session token. Pure crypto:
 * no DB, safe to run in Proxy. Returns the payload or `null`.
 */
export function verifySession(token: string | undefined | null): SessionPayload | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [version, payloadB64, mac] = parts;
  if (version !== TOKEN_VERSION) return null;

  const body = `${version}.${payloadB64}`;
  const expectedMac = sign(body);
  const a = Buffer.from(mac);
  const b = Buffer.from(expectedMac);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(payloadB64, "base64url").toString("utf8")
    ) as SessionPayload;
    if (
      typeof payload.m !== "number" ||
      typeof payload.v !== "number" ||
      typeof payload.iat !== "number"
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
