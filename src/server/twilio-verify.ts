/**
 * Server-only Twilio Verify client. Imported only by the API routes in src/app/api,
 * so the Twilio Auth Token never ships inside the mobile app bundle.
 *
 * Docs: https://www.twilio.com/docs/verify/api
 */
import { maskPhone } from '@/lib/phone';

const VERIFY_API = 'https://verify.twilio.com/v2/Services';

export class OtpError extends Error {
  constructor(
    public readonly httpStatus: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

type TwilioErrorBody = { code?: number; message?: string };

type VerificationResponse = {
  sid: string;
  to: string;
  channel: string;
  status: 'pending' | 'approved' | 'canceled' | 'max_attempts_reached' | 'deleted' | 'failed' | 'expired';
  valid?: boolean;
};

function getConfig() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID?.trim();

  if (!accountSid || !authToken || !serviceSid) {
    throw new OtpError(
      500,
      'not_configured',
      'The server has no Twilio credentials yet. Copy .env.example to .env, fill in the three TWILIO_* values and restart `npx expo start`.',
    );
  }
  return { accountSid, authToken, serviceSid };
}

export function isTwilioConfigured(): boolean {
  try {
    getConfig();
    return true;
  } catch {
    return false;
  }
}

/** Turns Twilio error codes into messages a user can act on. */
function toOtpError(httpStatus: number, body: TwilioErrorBody): OtpError {
  switch (body.code) {
    case 20003:
      return new OtpError(500, 'bad_credentials', 'Twilio rejected the credentials. Check TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in .env.');
    case 20404:
      return new OtpError(410, 'expired', 'This code has expired or was already used. Request a new code.');
    case 21608:
    case 21610:
      return new OtpError(403, 'unverified_number', 'Twilio trial accounts can only text verified numbers. Add this number under Phone Numbers → Verified Caller IDs in the Twilio Console.');
    case 60200:
      return new OtpError(400, 'invalid_phone', "That phone number isn't valid. Check the country code and the number.");
    case 60202:
      return new OtpError(429, 'max_attempts', 'Too many incorrect attempts. Request a new code.');
    case 60203:
      return new OtpError(429, 'max_sends', 'Too many codes were sent to this number. Wait 10 minutes and try again.');
    case 60410:
      return new OtpError(403, 'fraud_blocked', 'Twilio Fraud Guard temporarily blocked this number prefix. Try another number.');
    case 60605:
      return new OtpError(403, 'geo_blocked', 'SMS to this country is switched off. Enable it in Twilio Console → Verify → Settings → Geo permissions.');
    default:
      return new OtpError(502, 'twilio_error', body.message ?? `Twilio returned HTTP ${httpStatus}.`);
  }
}

async function twilioPost(path: string, params: Record<string, string>): Promise<VerificationResponse> {
  const { accountSid, authToken, serviceSid } = getConfig();

  let res: Response;
  try {
    res = await fetch(`${VERIFY_API}/${serviceSid}/${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(params).toString(),
    });
  } catch {
    throw new OtpError(502, 'twilio_unreachable', 'The server could not reach Twilio. Check the laptop’s internet connection.');
  }

  const body = (await res.json().catch(() => ({}))) as VerificationResponse & TwilioErrorBody;
  if (!res.ok) {
    console.warn(`[otp] Twilio error ${body.code ?? res.status}: ${body.message ?? 'unknown'}`);
    throw toOtpError(res.status, body);
  }
  return body;
}

/** Asks Twilio to text a one-time code to `phone` (E.164). */
export async function startVerification(phone: string) {
  const result = await twilioPost('Verifications', { To: phone, Channel: 'sms' });
  console.log(`[otp] SMS code sent to ${maskPhone(phone)} (status: ${result.status})`);
  return result;
}

/** Checks the code the user typed. `approved` means it matched. */
export async function checkVerification(phone: string, code: string) {
  const result = await twilioPost('VerificationCheck', { To: phone, Code: code });
  console.log(`[otp] Code check for ${maskPhone(phone)}: ${result.status}`);
  return result;
}

export function errorResponse(error: unknown): Response {
  if (error instanceof OtpError) {
    return Response.json({ ok: false, code: error.code, message: error.message }, { status: error.httpStatus });
  }
  console.error('[otp] Unexpected error', error);
  return Response.json({ ok: false, code: 'server_error', message: 'Something went wrong on the server.' }, { status: 500 });
}
