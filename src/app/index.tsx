import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { sendOtp } from '@/lib/otp-client';
import { toE164 } from '@/lib/phone';

export default function PhoneScreen() {
  const [countryCode, setCountryCode] = useState('+92');
  const [number, setNumber] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const phone = toE164(countryCode, number);

  async function handleSend() {
    if (!phone) {
      setError('Enter a valid mobile number, e.g. 300 1234567.');
      return;
    }
    setError(null);
    setSending(true);
    try {
      const { token } = await sendOtp(phone);
      router.push({ pathname: '/verify', params: { phone, token } });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send the code.');
    } finally {
      setSending(false);
    }
  }

  return (
    <Screen footer={<PoweredBy />}>
      <ScreenHeader
        icon="phone-portrait-outline"
        step="STEP 1 OF 2"
        title="Verify your phone"
        subtitle="Enter your mobile number. The server generates a random 6-digit OTP for it."
      />

      <Text style={styles.label}>Mobile number</Text>
      <View style={[styles.inputRow, error && styles.inputRowError]}>
        <TextInput
          value={countryCode}
          onChangeText={(t) => setCountryCode(`+${t.replace(/\D/g, '').slice(0, 4)}`)}
          keyboardType="phone-pad"
          maxLength={5}
          accessibilityLabel="Country code"
          style={styles.countryCode}
        />
        <View style={styles.divider} />
        <TextInput
          value={number}
          onChangeText={(t) => {
            setNumber(t);
            if (error) setError(null);
          }}
          placeholder="300 1234567"
          placeholderTextColor="#94A3B8"
          keyboardType="phone-pad"
          textContentType="telephoneNumber"
          autoComplete="tel"
          autoFocus
          returnKeyType="send"
          onSubmitEditing={handleSend}
          accessibilityLabel="Phone number"
          style={styles.number}
        />
      </View>

      {error ? (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle" size={16} color={Colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <Text style={styles.hint}>{phone ? `OTP will be generated for ${phone}` : 'The OTP will appear in the server console.'}</Text>
      )}

      <View style={styles.action}>
        <Button title="Send OTP" onPress={handleSend} loading={sending} disabled={!number.trim()} />
      </View>
    </Screen>
  );
}

function PoweredBy() {
  return (
    <View style={styles.powered}>
      <Ionicons name="shield-checkmark-outline" size={14} color={Colors.textMuted} />
      <Text style={styles.poweredText}>OTP is delivered to the server console (laptop terminal)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 14, fontWeight: '600', color: Colors.text, marginBottom: Spacing.sm },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 58,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  inputRowError: { borderColor: Colors.danger },
  countryCode: { width: 76, height: '100%', textAlign: 'center', fontSize: 17, fontWeight: '600', color: Colors.text },
  divider: { width: 1, height: 28, backgroundColor: Colors.border },
  number: { flex: 1, height: '100%', paddingHorizontal: Spacing.md, fontSize: 17, color: Colors.text, letterSpacing: 0.5 },
  hint: { marginTop: Spacing.sm, fontSize: 13, color: Colors.textMuted },
  errorRow: { flexDirection: 'row', gap: 6, marginTop: Spacing.sm, alignItems: 'flex-start' },
  errorText: { flex: 1, fontSize: 13, lineHeight: 18, color: Colors.danger },
  action: { marginTop: Spacing.xl },
  powered: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  poweredText: { fontSize: 12, color: Colors.textMuted },
});
