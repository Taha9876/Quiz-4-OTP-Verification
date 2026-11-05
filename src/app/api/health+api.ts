import { isTwilioConfigured } from '@/server/twilio-verify';

/** GET /api/health — lets you check the backend is up without exposing any secrets. */
export function GET() {
  return Response.json({ ok: true, provider: 'twilio-verify', configured: isTwilioConfigured() });
}
