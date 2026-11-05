import { isE164 } from '@/lib/phone';
import { errorResponse, OtpError } from '@/server/otp-error';
import { logOtpEntered, logOtpResult } from '@/server/otp-log';
import { checkToken } from '@/server/otp-token';

// Verified numbers -> user id, kept while the server runs.
const g = globalThis as typeof globalThis & { __registeredUsers?: Map<string, string> };
const registered = (g.__registeredUsers ??= new Map());

function newUserId() {
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  return `USR-${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
}

/** POST /api/otp/verify  { phone: "+923001234567", code: "123456", token: "<from /send>" } */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { phone?: unknown; code?: unknown; token?: unknown } | null;
  const phone = typeof body?.phone === 'string' ? body.phone.trim() : '';
  const code = typeof body?.code === 'string' ? body.code.trim() : '';
  const token = typeof body?.token === 'string' ? body.token.trim() : '';

  if (!isE164(phone)) {
    return Response.json({ ok: false, code: 'invalid_phone', message: 'Missing or invalid phone number.' }, { status: 400 });
  }
  if (!/^\d{6}$/.test(code)) {
    return Response.json({ ok: false, code: 'invalid_code', message: 'The code must be 6 digits.' }, { status: 400 });
  }

  try {
    logOtpEntered(phone, code);
    const result = await checkToken(token, phone, code);

    if (result === 'approved') {
      const userId = registered.get(phone) ?? newUserId();
      registered.set(phone, userId);
      logOtpResult(phone, result, userId, registered.size);
      return Response.json({ ok: true, verified: true, userId, message: 'Phone number verified and registered.' });
    }

    logOtpResult(phone, result);
    if (result === 'wrong_code') {
      return Response.json({ ok: true, verified: false, message: 'The code you entered is incorrect.' });
    }
    if (result === 'expired') throw new OtpError(410, 'expired', 'This code has expired or was already used. Request a new code.');
    if (result === 'max_attempts') throw new OtpError(429, 'max_attempts', 'Too many incorrect attempts. Request a new code.');
    throw new OtpError(400, 'invalid_token', 'This verification session is not valid. Request a new code.');
  } catch (error) {
    return errorResponse(error);
  }
}
