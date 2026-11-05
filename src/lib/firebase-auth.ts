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
