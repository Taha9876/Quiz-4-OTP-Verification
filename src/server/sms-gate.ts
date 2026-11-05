/**
 * Server-only client for SMS Gateway for Android (https://sms-gate.app).
 * The Android app turns a phone into an SMS gateway; its public cloud API
 * forwards our request to the phone, which sends the SMS from its own SIM.
 *
 * Docs: https://docs.sms-gate.app/getting-started/public-cloud-server/
 */
import { maskPhone } from '@/lib/phone';
import { OtpError } from '@/server/otp-error';

const DEFAULT_API = 'https://api.sms-gate.app/3rdparty/v1';

function getConfig() {
  const username = process.env.SMSGATE_USERNAME?.trim();
  const password = process.env.SMSGATE_PASSWORD?.trim();
  const baseUrl = (process.env.SMSGATE_URL?.trim() || DEFAULT_API).replace(/\/$/, '');
  if (!username || !password) {
    throw new OtpError(
      500,
      'not_configured',
      'The server has no SMS Gateway credentials yet. Put SMSGATE_USERNAME and SMSGATE_PASSWORD in .env and restart `npx expo start`.',
    );
  }
  return { username, password, baseUrl };
}

export function isSmsGateConfigured(): boolean {
  return Boolean(process.env.SMSGATE_USERNAME?.trim() && process.env.SMSGATE_PASSWORD?.trim());
}

export async function sendSms(phone: string, text: string, ttlSeconds: number): Promise<{ id?: string; state?: string }> {
  const { username, password, baseUrl } = getConfig();

  let res: Response;
  try {
    res = await fetch(`${baseUrl}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(`${username}:${password}`)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ textMessage: { text }, phoneNumbers: [phone], ttl: ttlSeconds, withDeliveryReport: true }),
    });
  } catch {
    throw new OtpError(502, 'gateway_unreachable', 'The server could not reach the SMS gateway. Check the laptop’s internet connection.');
  }

  const body = (await res.json().catch(() => ({}))) as { id?: string; state?: string; message?: string; error?: string };
  if (!res.ok) {
    console.warn(`[otp] SMS gateway error ${res.status}: ${body.message ?? body.error ?? 'unknown'}`);
    if (res.status === 401) {
      throw new OtpError(500, 'bad_credentials', 'The SMS gateway rejected the username/password in .env.');
    }
    throw new OtpError(502, 'gateway_error', body.message ?? `The SMS gateway returned HTTP ${res.status}.`);
  }

  console.log(`[otp] SMS queued on gateway phone for ${maskPhone(phone)} (id: ${body.id ?? '?'}, state: ${body.state ?? '?'})`);
  return body;
}
