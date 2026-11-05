/**
 * Server-only OTP generation and checking.
 *
 * The code is never stored. The server returns a signed token
 *   base64url({ phone, expiresAt, nonce }) + "." + HMAC(secret, phone|expiresAt|nonce|code)
 * and checks the code by recomputing the HMAC, so it works without a database.
 */

export const OTP_TTL_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;

type Payload = { phone: string; expiresAt: number; nonce: string };

// Best-effort attempt counter and used-token list (in memory, cleared on restart).
const g = globalThis as typeof globalThis & { __otpAttempts?: Map<string, number>; __otpUsed?: Set<string> };
const attempts = (g.__otpAttempts ??= new Map());
const used = (g.__otpUsed ??= new Set());

const encoder = new TextEncoder();

// Set OTP_SECRET in .env for real use; the fallback keeps the demo working without one.
function getSecret(): string {
  return process.env.OTP_SECRET?.trim() || 'quiz4-local-demo-secret';
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(text: string): string {
  const padded = text.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (text.length % 4)) % 4);
  return atob(padded);
}

async function sign(payload: Payload, code: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', encoder.encode(getSecret()), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const data = encoder.encode(`${payload.phone}|${payload.expiresAt}|${payload.nonce}|${code}`);
  return toBase64Url(new Uint8Array(await crypto.subtle.sign('HMAC', key, data)));
}

/** Uniform random 6-digit code. */
export function generateCode(): string {
  const buf = new Uint32Array(1);
  let n: number;
  do {
    crypto.getRandomValues(buf);
    n = buf[0];
  } while (n >= 4_294_000_000); // drop the uneven tail so every code is equally likely
  return String(n % 1_000_000).padStart(6, '0');
}

export async function createToken(phone: string, code: string): Promise<string> {
  const nonce = toBase64Url(crypto.getRandomValues(new Uint8Array(12)));
  const payload: Payload = { phone, expiresAt: Date.now() + OTP_TTL_MS, nonce };
  const body = toBase64Url(encoder.encode(JSON.stringify(payload)));
  return `${body}.${await sign(payload, code)}`;
}

export type TokenCheck = 'approved' | 'wrong_code' | 'expired' | 'max_attempts' | 'invalid';

export async function checkToken(token: string, phone: string, code: string): Promise<TokenCheck> {
  const [body, signature] = token.split('.');
  if (!body || !signature) return 'invalid';

  let payload: Payload;
  try {
    payload = JSON.parse(fromBase64Url(body)) as Payload;
  } catch {
    return 'invalid';
  }
  if (payload.phone !== phone || typeof payload.nonce !== 'string') return 'invalid';
  if (used.has(payload.nonce) || Date.now() > payload.expiresAt) return 'expired';

  const tries = (attempts.get(payload.nonce) ?? 0) + 1;
  if (tries > MAX_ATTEMPTS) return 'max_attempts';
  attempts.set(payload.nonce, tries);

  if ((await sign(payload, code)) !== signature) return 'wrong_code';

  used.add(payload.nonce);
  attempts.delete(payload.nonce);
  return 'approved';
}
