import { isE164 } from '@/lib/phone';
import { checkVerification, errorResponse } from '@/server/twilio-verify';

/** POST /api/otp/verify  { phone: "+923001234567", code: "123456" } */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { phone?: unknown; code?: unknown } | null;
  const phone = typeof body?.phone === 'string' ? body.phone.trim() : '';
  const code = typeof body?.code === 'string' ? body.code.trim() : '';

  if (!isE164(phone)) {
    return Response.json({ ok: false, code: 'invalid_phone', message: 'Missing or invalid phone number.' }, { status: 400 });
  }
  if (!/^\d{4,10}$/.test(code)) {
    return Response.json({ ok: false, code: 'invalid_code', message: 'The code must contain digits only.' }, { status: 400 });
  }

  try {
    const check = await checkVerification(phone, code);
    const verified = check.status === 'approved';
    return Response.json({
      ok: true,
      verified,
      status: check.status,
      message: verified ? 'Phone number verified.' : 'The code you entered is incorrect.',
    });
  } catch (error) {
    return errorResponse(error);
  }
}
