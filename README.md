# Quiz 4 – OTP Phone Number Verification (React Native / Expo)

An Expo app that verifies a phone number with a one-time password sent **by SMS** through **Twilio Verify**.

1. Enter a phone number
2. Request an OTP, which arrives by SMS
3. Enter the 6-digit code
4. See a **success** or **failure** screen

## Screenshots & recording

| Enter number | SMS received | Enter code | Success | Failure |
| --- | --- | --- | --- | --- |
| ![](screenshots/1-enter-number.png) | ![](screenshots/2-sms-received.png) | ![](screenshots/3-enter-code.png) | ![](screenshots/4-success.png) | ![](screenshots/5-failure.png) |

Screen recording: [`screenshots/demo.mp4`](screenshots/demo.mp4)

## How it works

```
 Expo app (phone)                 Expo dev server (laptop)                 Twilio Verify
 ───────────────                  ────────────────────────                 ─────────────
 Send OTP  ── POST /api/otp/send ──►  send+api.ts   ── POST /Verifications ──►  texts a code
 Verify    ── POST /api/otp/verify ─► verify+api.ts ── POST /VerificationCheck ─► approved / pending
```

* The app never holds the Twilio Auth Token. It calls its own **Expo Router API routes** (`src/app/api/otp/*+api.ts`). These run on the server and read the credentials from `.env`.
* Twilio Verify generates the code, sends the SMS, handles expiry (10 min) and limits retries, so no codes are stored in this project.
* A wrong code returns `pending` → **Verification failed** screen with *Try again*. The right code returns `approved` → **Phone number verified** screen.
* Twilio errors (unverified trial number, blocked country, too many attempts, expired code) are turned into readable messages.

## Tech stack

Expo SDK 58 · React Native 0.88 · Expo Router (screens + API routes) · TypeScript · Twilio Verify REST API

## Project structure

```
src/
  app/
    _layout.tsx            Stack navigator
    index.tsx              Step 1 – phone number entry
    verify.tsx             Step 2 – OTP entry, resend timer
    result.tsx             Success / failure screen
    api/otp/send+api.ts    POST: start a Twilio verification (send SMS)
    api/otp/verify+api.ts  POST: check the code
    api/health+api.ts      GET: is the backend configured?
  components/              Button, OtpInput, Screen, ScreenHeader
  lib/phone.ts             E.164 formatting and masking
  lib/otp-client.ts        App-side fetch helpers
  server/twilio-verify.ts  Server-only Twilio client + error mapping
```

## Run it

### 1. Twilio setup (free trial, no card needed)

1. Sign up at <https://www.twilio.com/try-twilio> and verify your own mobile number.
2. In the Console home, copy the **Account SID** and **Auth Token**.
3. Go to **Verify → Services → Create new**, give it a name, and copy the **Service SID** (starts with `VA`).
4. Trial accounts can only text **verified numbers**. The number you signed up with already is one. Add others under *Phone Numbers → Manage → Verified Caller IDs*.
5. If SMS to your country is blocked, enable it under *Verify → Settings → Geo permissions*.

### 2. Configure and start

```bash
npm install
cp .env.example .env      # then paste the three TWILIO_* values
npx expo start            # add --tunnel if the phone is on a different network
```

Open **Expo Go** on an Android/iOS phone and scan the QR code. The API routes are served by the same dev server, so nothing else needs to run.

Check the backend: open `http://localhost:8081/api/health`. It should show `"configured": true`.

## API

| Method | Path | Body | Success response |
| --- | --- | --- | --- |
| POST | `/api/otp/send` | `{ "phone": "+923001234567" }` | `{ ok: true, status: "pending", to: "+92300 ••• 4567" }` |
| POST | `/api/otp/verify` | `{ "phone": "+923001234567", "code": "123456" }` | `{ ok: true, verified: true \| false, status, message }` |
| GET | `/api/health` | – | `{ ok: true, provider: "twilio-verify", configured: true }` |

Errors come back as `{ ok: false, code, message }` with a matching HTTP status.
