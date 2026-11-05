/**
 * App-side calls to our own API routes (src/app/api/otp/*).
 * Relative URLs resolve to the Expo dev server, which also runs the API routes.
 */

export class OtpRequestError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
  }
}

async function post<T>(path: string, payload: Record<string, string>): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new OtpRequestError(
      "Can't reach the server. Keep `npx expo start` running and make sure the phone and laptop share a network.",
      'network',
    );
  }

  const data = (await res.json().catch(() => null)) as (T & { ok?: boolean; code?: string; message?: string }) | null;
  if (!res.ok || !data?.ok) {
    throw new OtpRequestError(data?.message ?? `Request failed (HTTP ${res.status}).`, data?.code ?? 'unknown');
  }
  return data;
}

export function sendOtp(phone: string) {
  return post<{ ok: true; to: string; token: string; expiresInSeconds: number }>('/api/otp/send', { phone });
}

export function verifyOtp(phone: string, code: string, token: string) {
  return post<{ ok: true; verified: boolean; userId?: string; message: string }>('/api/otp/verify', { phone, code, token });
}
