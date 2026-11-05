import { isE164, maskPhone } from '@/lib/phone';
import { errorResponse } from '@/server/otp-error';
import { logOtpSent } from '@/server/otp-log';
import { createToken, generateCode, OTP_TTL_MS } from '@/server/otp-token';

/**
 * POST /api/otp/send  { phone: "+923001234567" }
 * Generates a random 6-digit OTP, prints it in the server console and returns
 * a signed token (the code itself is never sent back to the app).
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { phone?: unknown } | null;
  const phone = typeof body?.phone === 'string' ? body.phone.trim() : '';

  if (!isE164(phone)) {
    return Response.json(
      { ok: false, code: 'invalid_phone', message: 'Enter the number in international format, e.g. +923001234567.' },
      { status: 400 },
    );
  }

  try {
    const code = generateCode();
    const token = await createToken(phone, code);
    logOtpSent(phone, code, OTP_TTL_MS / 60000);
    return Response.json({ ok: true, to: maskPhone(phone), token, expiresInSeconds: OTP_TTL_MS / 1000 });
  } catch (error) {
    return errorResponse(error);
  }
}
