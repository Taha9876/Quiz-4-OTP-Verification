export const Colors = {
  background: '#F5F6FA',
  card: '#FFFFFF',
  text: '#0F172A',
  textMuted: '#64748B',
  border: '#E2E8F0',
  primary: '#4F46E5',
  primaryPressed: '#4338CA',
  primarySoft: '#EEF2FF',
  success: '#16A34A',
  successSoft: '#DCFCE7',
  danger: '#DC2626',
  dangerSoft: '#FEE2E2',
  disabled: '#A5B4FC',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const Radius = {
  sm: 10,
  md: 14,
  lg: 20,
  full: 999,
} as const;

/** Twilio Verify sends 6-digit codes unless the service is configured otherwise. */
export const OTP_LENGTH = 6;

/** Seconds the user must wait before asking for another code. */
export const RESEND_COOLDOWN_SECONDS = 30;
