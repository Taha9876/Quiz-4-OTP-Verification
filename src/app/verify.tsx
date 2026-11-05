import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { OtpInput } from '@/components/otp-input';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import { Colors, OTP_LENGTH, RESEND_COOLDOWN_SECONDS, Spacing } from '@/constants/theme';
import { OtpRequestError, sendOtp, verifyOtp } from '@/lib/otp-client';
import { maskPhone } from '@/lib/phone';

export default function VerifyScreen() {
  const params = useLocalSearchParams<{ phone: string; token?: string }>();
  const phone = params.phone ?? '';
  const [token, setToken] = useState(params.token ?? '');
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_COOLDOWN_SECONDS);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [secondsLeft]);

  async function handleVerify() {
    if (code.length !== OTP_LENGTH) return;
    setError(null);
    setNotice(null);
    setVerifying(true);
    try {
      const result = await verifyOtp(phone, code, token);
      setCode('');
      if (result.verified) {
        // Replace so "back" from the success screen doesn't return to a used code.
        router.replace({ pathname: '/result', params: { status: 'success', phone, uid: result.userId ?? '' } });
      } else {
        router.push({ pathname: '/result', params: { status: 'failure', phone, reason: result.message } });
      }
    } catch (e) {
      if (e instanceof OtpRequestError && e.code === 'network') {
        setError(e.message);
      } else {
        setCode('');
        const reason = e instanceof Error ? e.message : 'Verification failed.';
        router.push({ pathname: '/result', params: { status: 'failure', phone, reason } });
      }
    } finally {
      setVerifying(false);
    }
  }

  async function handleResend() {
    setError(null);
    setNotice(null);
    setResending(true);
    try {
      const sent = await sendOtp(phone);
      setToken(sent.token);
      setCode('');
      setSecondsLeft(RESEND_COOLDOWN_SECONDS);
      setNotice('A new OTP was generated. Check the server console.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not resend the code.');
    } finally {
      setResending(false);
    }
  }

  return (
    <Screen>
      <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back} accessibilityRole="button">
        <Ionicons name="chevron-back" size={20} color={Colors.primary} />
        <Text style={styles.backText}>Change number</Text>
      </Pressable>

      <ScreenHeader
        icon="chatbubble-ellipses-outline"
        step="STEP 2 OF 2"
        title="Enter the code"
        subtitle={
          <>
            A {OTP_LENGTH}-digit OTP was generated for <Text style={styles.phone}>{maskPhone(phone)}</Text>. Read it from the
            server console and type it below.
          </>
        }
      />

      <OtpInput value={code} onChange={setCode} disabled={verifying} />

      {error ? (
        <View style={styles.messageRow}>
          <Ionicons name="alert-circle" size={16} color={Colors.danger} />
          <Text style={[styles.messageText, { color: Colors.danger }]}>{error}</Text>
        </View>
      ) : notice ? (
        <View style={styles.messageRow}>
          <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
          <Text style={[styles.messageText, { color: Colors.success }]}>{notice}</Text>
        </View>
      ) : null}

      <View style={styles.action}>
        <Button title="Verify" onPress={handleVerify} loading={verifying} disabled={code.length !== OTP_LENGTH} />
      </View>

      <View style={styles.resendRow}>
        <Text style={styles.resendLabel}>Didn&apos;t get the code? </Text>
        {secondsLeft > 0 ? (
          <Text style={styles.resendTimer}>Resend in 0:{String(secondsLeft).padStart(2, '0')}</Text>
        ) : (
          <Pressable onPress={handleResend} disabled={resending} hitSlop={8} accessibilityRole="button">
            <Text style={styles.resendLink}>{resending ? 'Sending…' : 'Resend code'}</Text>
          </Pressable>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', marginBottom: Spacing.lg, marginLeft: -4 },
  backText: { fontSize: 15, fontWeight: '600', color: Colors.primary },
  phone: { color: Colors.text, fontWeight: '700' },
  messageRow: { flexDirection: 'row', gap: 6, marginTop: Spacing.md, alignItems: 'flex-start' },
  messageText: { flex: 1, fontSize: 13, lineHeight: 18 },
  action: { marginTop: Spacing.xl },
  resendRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: Spacing.lg },
  resendLabel: { fontSize: 14, color: Colors.textMuted },
  resendTimer: { fontSize: 14, fontWeight: '600', color: Colors.textMuted, fontVariant: ['tabular-nums'] },
  resendLink: { fontSize: 14, fontWeight: '700', color: Colors.primary },
});
