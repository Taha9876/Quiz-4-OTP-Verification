# Quiz 4 – OTP Phone Number Verification (React Native / Expo + Firebase)

An Expo app that verifies a phone number with a one-time password sent **by SMS** through **Firebase Authentication (Phone Auth)**. After a successful check, the number is **registered** as a user in Firebase Console → Authentication → Users.

1. Enter a phone number
2. Request an OTP, which Firebase sends by SMS
3. Enter the 6-digit code
4. See a **success** (number verified and registered) or **failure** screen

## Screenshots & recording

| Enter number | SMS received | Enter code | Success | Failure | Firebase console |
| --- | --- | --- | --- | --- | --- |
| ![](screenshots/1-enter-number.png) | ![](screenshots/2-sms-received.png) | ![](screenshots/3-enter-code.png) | ![](screenshots/4-success.png) | ![](screenshots/5-failure.png) | ![](screenshots/6-firebase-users.png) |

Screen recording: [`screenshots/demo.mp4`](screenshots/demo.mp4)

## How it works

```
 Phone screen ──► Security-check sheet (WebView)                    Firebase Auth
                  Firebase JS SDK + invisible reCAPTCHA
                  signInWithPhoneNumber(phone) ───────────────────►  sends SMS with OTP
                  ◄──────────────────────────── verificationId ─────
 Code screen  ──► accounts:signInWithPhoneNumber {verificationId, code} ──► INVALID_CODE → failure screen
                                                                     └► user created → success screen
                                                                        (listed in Console → Users)
```

* **Sending the SMS:** Firebase only sends phone-auth SMS after a reCAPTCHA check, and reCAPTCHA needs a browser. `src/components/firebase-sms-sender.tsx` opens a sheet with a `react-native-webview`. The sheet loads the official Firebase JS SDK, using the project's `authDomain` as its base URL, and calls `signInWithPhoneNumber` with an invisible reCAPTCHA. It then passes the `verificationId` back to the app. This works inside **Expo Go**, so no custom native build is needed.
* **Checking the code:** `src/lib/firebase-auth.ts` sends the `verificationId` and the typed code to Firebase's Identity Toolkit endpoint `accounts:signInWithPhoneNumber`, the same call the Firebase SDK makes. The right code signs the user in and creates them in Firebase. A wrong code returns `INVALID_CODE`, and the app shows **Verification failed** with *Try again*.
* The SMS comes from Firebase's own sender, not a personal phone.
* **Free Spark plan:** Firebase only sends real SMS on the paid Blaze plan. On the free plan, use **Authentication → Sign-in method → Phone → Phone numbers for testing**: add a number and its code, e.g. `+92 300 0000001` / `123456`. The app first asks Firebase directly with `accounts:sendVerificationCode`, which works for test numbers without reCAPTCHA. It opens the reCAPTCHA sheet only for real numbers. Also allow your country under **Authentication → Settings → SMS region policy**.

## Tech stack

Expo SDK 58 · React Native 0.88 · Expo Router · TypeScript · Firebase Authentication (Phone) · react-native-webview

## Project structure

```
src/
  app/
    _layout.tsx                    Stack navigator
    index.tsx                      Step 1 – phone number entry
    verify.tsx                     Step 2 – OTP entry, resend timer
    result.tsx                     Success / failure screen (shows Firebase UID)
  components/
    firebase-sms-sender.tsx        WebView sheet: reCAPTCHA + signInWithPhoneNumber
    otp-input.tsx                  6-box code input with SMS autofill
    button.tsx, screen.tsx, screen-header.tsx
  lib/
    firebase-config.ts             Firebase web config from .env
    firebase-auth.ts               Confirms the code with Firebase
    phone.ts                       E.164 formatting and masking
```

## Run it

### 1. Firebase setup

1. In <https://console.firebase.google.com>, create a project.
2. Go to **Authentication → Sign-in method → Phone** and enable it. Add a test number and code under **Phone numbers for testing** (this is free).
3. Go to **Authentication → Settings → SMS region policy** and allow your country. Real SMS to any number also needs the **Blaze** plan.
4. Go to **Project settings → Your apps → Web app (`</>`)**, register an app and copy its `firebaseConfig`.

### 2. Configure and start

```bash
npm install
cp .env.example .env      # paste the firebaseConfig values
npx expo start
```

Open the app in **Expo Go** on an Android/iOS phone by scanning the QR code. With USB debugging you can also run `adb reverse tcp:8081 tcp:8081`, then start with `npx expo start --localhost` and open `exp://127.0.0.1:8081`.

After a successful verification, open **Firebase Console → Authentication → Users**. The phone number is listed there as a registered user.
