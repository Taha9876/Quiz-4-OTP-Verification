/**
 * Picks the OTP provider from .env:
 *   OTP_PROVIDER=smsgate  -> SMS Gateway for Android sends the SMS; this server makes and checks the code
 *   OTP_PROVIDER=twilio   -> Twilio Verify makes, sends and checks the code
 * If OTP_PROVIDER is empty, SMS Gateway is used when its credentials are present.
 */
import { OtpError } from '@/server/otp-error';
import { checkToken, createToken, generateCode, OTP_TTL_MS } from '@/server/otp-token';
import { isSmsGateConfigured, sendSms } from '@/server/sms-gate';
import { checkVerification, isTwilioConfigured, startVerification } from '@/server/twilio-verify';

export type Provider = 'smsgate' | 'twilio';

export function getProvider(): Provider {
  const chosen = process.env.OTP_PROVIDER?.trim().toLowerCase();
  if (chosen === 'twilio' || chosen === 'smsgate') return chosen;
  return isSmsGateConfigured() || !isTwilioConfigured() ? 'smsgate' : 'twilio';
}

export function isConfigured(): boolean {
  return getProvider() === 'smsgate' ? isSmsGateConfigured() : isTwilioConfigured();
}

/** Sends a code. Returns a token the app must send back with the code (SMS Gateway only). */
export async function startOtp(phone: string): Promise<{ token: string | null }> {
  if (getProvider() === 'twilio') {
    await startVerification(phone);
    return { token: null };
  }
  const code = generateCode();
  const minutes = Math.round(OTP_TTL_MS / 60000);
  await sendSms(phone, `Your OTP Verify code is ${code}. It expires in ${minutes} minutes. Do not share it with anyone.`, OTP_TTL_MS / 1000);
  return { token: await createToken(phone, code) };
}

export async function checkOtp(phone: string, code: string, token: string): Promise<boolean> {
  if (getProvider() === 'twilio') {
    const check = await checkVerification(phone, code);
    return check.status === 'approved';
  }

  const result = await checkToken(token, phone, code);
  console.log(`[otp] Code check: ${result}`);
  switch (result) {
    case 'approved':
      return true;
    case 'wrong_code':
      return false;
    case 'expired':
      throw new OtpError(410, 'expired', 'This code has expired or was already used. Request a new code.');
    case 'max_attempts':
      throw new OtpError(429, 'max_attempts', 'Too many incorrect attempts. Request a new code.');
    default:
      throw new OtpError(400, 'invalid_token', 'This verification session is not valid. Request a new code.');
  }
}
