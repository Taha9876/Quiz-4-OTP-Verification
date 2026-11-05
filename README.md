# Quiz 4 – OTP Phone Number Verification (React Native / Expo)

An Expo app that verifies a phone number with a **random one-time password (OTP)**. The app's own backend (Expo Router API routes) generates the OTP and delivers it to the **server console**: the laptop terminal running `npx expo start`. Every step is logged there as proof: OTP generated → OTP entered → verified → registered. It's free: no paid SMS service or account is needed.

1. Enter a phone number on the phone
2. Tap **Send OTP**. A random 6-digit OTP appears in the laptop console.
3. Type that OTP on the phone
4. See a **success** (verified + registered, with a user ID) or **failure** screen

## Screenshots & recording

| Enter number | OTP in console | Enter code | Success | Failure |
| --- | --- | --- | --- | --- |
| ![](screenshots/1-enter-number.png) | ![](screenshots/2-console-otp.png) | ![](screenshots/3-enter-code.png) | ![](screenshots/4-success.png) | ![](screenshots/5-failure.png) |

Screen recording: [`screenshots/demo.mp4`](screenshots/demo.mp4)

### Example console log

```
════════════════════════════════════════════════════
 📩  OTP GENERATED  [15:25:14]
     Phone : +923001234567
     OTP   : 665869
     Valid : 5 minutes, single use
════════════════════════════════════════════════════
 🔑  OTP ENTERED    [15:25:15]  +923001234567 typed 665876
 ❌  REJECTED       [15:25:15]  +923001234567 (wrong OTP)
 🔑  OTP ENTERED    [15:25:15]  +923001234567 typed 665869
 ✅  VERIFIED       [15:25:15]  +923001234567
 👤  REGISTERED     user USR-A9AC4203  (registered numbers: 1)
```

## How it works

```
 Expo app (phone)                        Expo dev server (laptop)
 ───────────────                         ────────────────────────
 Send OTP ── POST /api/otp/send ──────►  random 6-digit OTP (crypto.getRandomValues)
                                         prints it in the console ("📩 OTP GENERATED")
          ◄── signed token ────────────  token = HMAC-SHA256(phone, expiry, nonce, OTP)
 Verify   ── POST /api/otp/verify ────►  logs "🔑 OTP ENTERED", recomputes the HMAC
          ◄── verified / incorrect ────  "✅ VERIFIED" + "👤 REGISTERED" or "❌ REJECTED"
```

* **Random OTP:** `generateCode()` in `src/server/otp-token.ts` uses the Web Crypto random generator, giving every 6-digit code an equal chance.
* **Never stored, never sent to the app:** the server returns only a signed token holding the phone number, a 5-minute expiry and a nonce. Checking recomputes the signature with the typed code. Each OTP works once, with at most 5 wrong attempts.
* **Registration:** a verified number gets a user ID (`USR-…`). The ID is logged in the console and shown on the success screen.
* **Failure cases** each get their own message: wrong code, expired, already used, too many attempts.

## Tech stack

Expo SDK 58 · React Native 0.88 · Expo Router (screens + API routes) · TypeScript · Web Crypto (random OTP, HMAC-SHA256)

## Project structure

```
src/
  app/
    _layout.tsx            Stack navigator
    index.tsx              Step 1 – phone number entry
    verify.tsx             Step 2 – OTP entry, resend timer
    result.tsx             Success / failure screen
    api/otp/send+api.ts    POST: generate OTP, log it, return token
    api/otp/verify+api.ts  POST: check OTP, log result, register number
  components/              Button, OtpInput, Screen, ScreenHeader
  lib/phone.ts             E.164 formatting and masking
  lib/otp-client.ts        App-side fetch helpers
  server/otp-token.ts      Random code + signed token check
  server/otp-log.ts        Console log lines (generated / entered / verified / registered)
  server/otp-error.ts      Error responses
```

## Run it

```bash
npm install
npx expo start            # keep this terminal visible: OTPs appear here
```

Open **Expo Go** on the phone and scan the QR code. The phone must be on the same Wi-Fi as the laptop. If it can't connect, use `npx expo start --tunnel`. Enter a number, read the OTP from the terminal, and type it into the app.

Optional: set `OTP_SECRET` in `.env` (any long random string) to sign the tokens.

## API

| Method | Path | Body | Success response |
| --- | --- | --- | --- |
| POST | `/api/otp/send` | `{ "phone": "+923001234567" }` | `{ ok: true, to: "+92300 ••• 4567", token, expiresInSeconds: 300 }` |
| POST | `/api/otp/verify` | `{ "phone", "code": "123456", "token" }` | `{ ok: true, verified: true \| false, userId?, message }` |

Errors come back as `{ ok: false, code, message }` with a matching HTTP status.
