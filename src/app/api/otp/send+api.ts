import { isE164, maskPhone } from '@/lib/phone';
import { errorResponse } from '@/server/otp-error';
import { getProvider, startOtp } from '@/server/otp-service';

/** POST /api/otp/send  { phone: "+923001234567" } */
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
    const { token } = await startOtp(phone);
    return Response.json({ ok: true, provider: getProvider(), to: maskPhone(phone), token });
  } catch (error) {
    return errorResponse(error);
  }
}
