const E164 = /^\+[1-9]\d{7,14}$/;

export function isE164(value: string): boolean {
  return E164.test(value);
}

/**
 * Builds an E.164 number (e.g. +923001234567) from a country code and a local number.
 * Accepts the local trunk prefix people usually type (0300 1234567) and strips it.
 * If the number already starts with "+", it is treated as a full international number.
 */
export function toE164(countryCode: string, localNumber: string): string | null {
  const raw = localNumber.trim();
  if (raw.startsWith('+')) {
    const full = `+${raw.replace(/\D/g, '')}`;
    return isE164(full) ? full : null;
  }

  const cc = countryCode.replace(/\D/g, '');
  const digits = raw.replace(/\D/g, '').replace(/^0+/, '');
  if (!cc || !digits) return null;

  const full = `+${cc}${digits}`;
  return isE164(full) ? full : null;
}

/** +923001234567 -> +92300 ••• 4567 */
export function maskPhone(e164: string): string {
  if (e164.length < 9) return e164;
  // Non-breaking spaces keep the masked number on one line.
  return `${e164.slice(0, e164.length - 7)} ••• ${e164.slice(-4)}`;
}
