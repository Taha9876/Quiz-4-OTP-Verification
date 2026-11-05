# Quiz 4 – OTP Phone Number Verification (React Native / Expo)

An Expo app that verifies a phone number with a one-time password sent **by SMS**. The SMS is sent through the **SMS Gateway for Android** cloud API ([sms-gate.app](https://sms-gate.app)). **Twilio Verify** is also supported (set `OTP_PROVIDER=twilio`).

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
 Expo app (phone)                Expo dev server (laptop)                 SMS provider
 ───────────────                 ────────────────────────                 ────────────
 Send OTP ── POST /api/otp/send ──►  makes a random 6-digit code  ── SMS Gateway API ──► SMS sent from
                                     returns a signed token                              a phone's SIM
 Verify   ── POST /api/otp/verify ─► checks code against token   ──►  verified: true / false
```

* The app calls its own **Expo Router API routes** (`src/app/api/otp/*+api.ts`). These run on the server, so the provider credentials in `.env` never reach the app.
* **SMS Gateway mode (default):** the server makes a random 6-digit code and sends it with `POST https://api.sms-gate.app/3rdparty/v1/messages`. The code itself is never stored. The app gets a token signed with HMAC-SHA256 that holds the phone number, a 5-minute expiry and a nonce. Verifying recomputes the signature with the typed code. Each code can be used once, with at most 5 attempts.
* **Twilio mode:** Twilio Verify creates, sends and checks the code (`/Verifications`, `/VerificationCheck`).
* A wrong code shows the **Verification failed** screen with *Try again*. The right code shows the **Phone number verified** screen.

## Tech stack

Expo SDK 58 · React Native 0.88 · Expo Router (screens + API routes) · TypeScript · SMS Gateway for Android API / Twilio Verify · Web Crypto (HMAC-SHA256)

## Project structure

```
src/
  app/
    _layout.tsx            Stack navigator
    index.tsx              Step 1 – phone number entry
    verify.tsx             Step 2 – OTP entry, resend timer
    result.tsx             Success / failure screen
    api/otp/send+api.ts    POST: generate + send the OTP SMS
    api/otp/verify+api.ts  POST: check the code
    api/health+api.ts      GET: is the backend configured?
  components/              Button, OtpInput, Screen, ScreenHeader
  lib/phone.ts             E.164 formatting and masking
  lib/otp-client.ts        App-side fetch helpers
  server/otp-service.ts    Picks the provider (smsgate / twilio)
  server/otp-token.ts      Code generation + signed token check
  server/sms-gate.ts       SMS Gateway for Android client
  server/twilio-verify.ts  Twilio Verify client + error mapping
```

## Run it

### 1. SMS Gateway setup (free, no sign-up)

1. On an Android phone with a SIM, install the APK from <https://github.com/capcom6/android-sms-gateway/releases>.
2. Open it, allow the SMS permission, turn on **Cloud Server**, tap **Start Service**, then **Sign Up**.
3. Copy the **username** and **password** shown in the Cloud Server section into `.env`.

The OTP SMS is sent from that phone's SIM. It can text its own number or any other number.

*Twilio instead:* create a free trial at <https://www.twilio.com/try-twilio>, create a Verify service, fill the `TWILIO_*` values and set `OTP_PROVIDER=twilio`.

### 2. Configure and start

```bash
npm install
cp .env.example .env      # then fill SMSGATE_USERNAME / SMSGATE_PASSWORD / OTP_SECRET
npx expo start            # add --tunnel if the phone is on a different network
```

Open **Expo Go** on an Android/iOS phone and scan the QR code. The API routes are served by the same dev server, so nothing else needs to run.

Check the backend: open `http://localhost:8081/api/health`. It should show `"configured": true`.

## API

| Method | Path | Body | Success response |
| --- | --- | --- | --- |
| POST | `/api/otp/send` | `{ "phone": "+923001234567" }` | `{ ok: true, provider, to: "+92300 ••• 4567", token }` |
| POST | `/api/otp/verify` | `{ "phone", "code": "123456", "token" }` | `{ ok: true, verified: true \| false, message }` |
| GET | `/api/health` | – | `{ ok: true, provider: "smsgate", configured: true }` |

Errors come back as `{ ok: false, code, message }` with a matching HTTP status.
