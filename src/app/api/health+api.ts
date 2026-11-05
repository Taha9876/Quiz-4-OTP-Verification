import { getProvider, isConfigured } from '@/server/otp-service';

/** GET /api/health — lets you check the backend is up without exposing any secrets. */
export function GET() {
  return Response.json({ ok: true, provider: getProvider(), configured: isConfigured() });
}
