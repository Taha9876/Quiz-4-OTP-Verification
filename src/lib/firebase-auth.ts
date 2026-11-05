/**
 * Step 2 of Firebase phone sign-in: exchange the verification ID (from the SMS
 * step) and the code the user typed for a signed-in Firebase user.
 * Uses the Identity Toolkit REST API, the same endpoint the Firebase SDK calls.
 * On success the number appears in Firebase Console -> Authentication -> Users.
 */
import { firebaseConfig } from '@/lib/firebase-config';

export type ConfirmResult =
  | { verified: true; uid: string; phoneNumber: string; isNewUser: boolean }
  | { verified: false; reason: string };

export class FirebaseAuthError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
  }
}

export type DirectSendResult =
  | { status: 'sent'; verificationId: string }
  | { status: 'needs_recaptcha' }
  | { status: 'error'; message: string };

/**
 * Step 1 without a browser: Firebase accepts this for the console's
 * "Phone numbers for testing". Real numbers need the reCAPTCHA sheet
 * (FirebaseSmsSender), which the caller opens on `needs_recaptcha`.
 */
export async function sendCodeDirect(phone: string): Promise<DirectSendResult> {
  let res: Response;
  try {
    res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:sendVerificationCode?key=${encodeURIComponent(firebaseConfig.apiKey)}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phoneNumber: phone }) },
    );
  } catch {
    return { status: 'error', message: 'No internet connection. Check your network and try again.' };
  }

  const data = (await res.json().catch(() => ({}))) as { sessionInfo?: string; error?: { message?: string } };
  if (res.ok && data.sessionInfo) {
    console.log(`[firebase] OTP requested for ${phone}`);
    return { status: 'sent', verificationId: data.sessionInfo };
  }

  const error = data.error?.message ?? '';
  if (error.startsWith('BILLING_NOT_ENABLED')) {
    return {
      status: 'error',
      message:
        'This Firebase project is on the free Spark plan, so it only sends codes to the test numbers set in Firebase Console → Authentication → Phone → Phone numbers for testing.',
    };
  }
  if (error.startsWith('INVALID_PHONE_NUMBER')) {
    return { status: 'error', message: "That phone number isn't valid. Check the country code and number." };
  }
  if (error.startsWith('TOO_MANY_ATTEMPTS') || error.startsWith('QUOTA_EXCEEDED')) {
    return { status: 'error', message: 'Too many codes were requested. Wait a few minutes and try again.' };
  }
  if (error.startsWith('OPERATION_NOT_ALLOWED')) {
    return {
      status: 'error',
      message: 'Firebase blocked this request. Enable Phone sign-in and allow this country under Authentication → Settings → SMS region policy.',
    };
  }
  return { status: 'needs_recaptcha' };
}

export async function confirmCode(verificationId: string, code: string): Promise<ConfirmResult> {
  let res: Response;
  try {
    res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPhoneNumber?key=${encodeURIComponent(firebaseConfig.apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionInfo: verificationId, code }),
      },
    );
  } catch {
    throw new FirebaseAuthError('No internet connection. Check your network and try again.', 'network');
  }

  const data = (await res.json().catch(() => ({}))) as {
    localId?: string;
    phoneNumber?: string;
    isNewUser?: boolean;
    error?: { message?: string };
  };

  if (res.ok && data.localId) {
    return { verified: true, uid: data.localId, phoneNumber: data.phoneNumber ?? '', isNewUser: Boolean(data.isNewUser) };
  }

  const error = data.error?.message ?? `HTTP_${res.status}`;
  if (error.startsWith('INVALID_CODE')) return { verified: false, reason: 'The code you entered is incorrect.' };
  if (error.startsWith('SESSION_EXPIRED') || error.startsWith('CODE_EXPIRED') || error.startsWith('INVALID_SESSION_INFO')) {
    return { verified: false, reason: 'This code has expired. Go back and request a new code.' };
  }
  if (error.startsWith('TOO_MANY_ATTEMPTS')) {
    throw new FirebaseAuthError('Too many attempts. Wait a few minutes and try again.', 'too_many');
  }
  throw new FirebaseAuthError(`Firebase rejected the request (${error}).`, 'firebase');
}
