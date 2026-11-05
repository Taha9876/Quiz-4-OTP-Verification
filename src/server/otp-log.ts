/**
 * Prints each OTP step in the laptop terminal (the `npx expo start` window).
 * This console is the OTP delivery channel and the proof log for the demo.
 */
const line = '═'.repeat(52);

function time() {
  return new Date().toLocaleTimeString('en-GB', { hour12: false });
}

export function logOtpSent(phone: string, code: string, minutes: number) {
  console.log(
    [
      '',
      line,
      ` 📩  OTP GENERATED  [${time()}]`,
      `     Phone : ${phone}`,
      `     OTP   : ${code}`,
      `     Valid : ${minutes} minutes, single use`,
      line,
    ].join('\n'),
  );
}

export function logOtpEntered(phone: string, code: string) {
  console.log(` 🔑  OTP ENTERED    [${time()}]  ${phone} typed ${code}`);
}

export function logOtpResult(phone: string, result: string, userId?: string, totalRegistered?: number) {
  if (result === 'approved') {
    console.log(
      [
        ` ✅  VERIFIED       [${time()}]  ${phone}`,
        ` 👤  REGISTERED     user ${userId}  (registered numbers: ${totalRegistered})`,
        line,
      ].join('\n'),
    );
  } else {
    const reason =
      result === 'wrong_code' ? 'wrong OTP' : result === 'expired' ? 'OTP expired or already used' : result === 'max_attempts' ? 'too many attempts' : 'invalid session';
    console.log(` ❌  REJECTED       [${time()}]  ${phone} (${reason})`);
  }
}
