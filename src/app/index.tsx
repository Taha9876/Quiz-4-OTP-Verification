import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/button';
import { FirebaseSmsSender } from '@/components/firebase-sms-sender';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { FIREBASE_NOT_CONFIGURED, isFirebaseConfigured } from '@/lib/firebase-config';
import { toE164 } from '@/lib/phone';

export default function PhoneScreen() {
  const [countryCode, setCountryCode] = useState('+92');
  const [number, setNumber] = useState('');
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const phone = toE164(countryCode, number);

  function handleSend() {
    if (!phone) {
      setError('Enter a valid mobile number, e.g. 300 1234567.');
      return;
    }
    if (!isFirebaseConfigured) {
      setError(FIREBASE_NOT_CONFIGURED);
      return;
    }
    setError(null);
    setSendingTo(phone); // opens the Firebase security-check sheet, which sends the SMS
  }

  function handleSent(verificationId: string) {
    const to = sendingTo ?? '';
    setSendingTo(null);
    router.push({ pathname: '/verify', params: { phone: to, verificationId } });
  }

  return (
    <Screen footer={<PoweredBy />}>
      <FirebaseSmsSender
        phone={sendingTo}
        onSent={handleSent}
        onError={(message) => {
          setSendingTo(null);
          setError(message);
        }}
        onCancel={() => setSendingTo(null)}
      />
      <ScreenHeader
        icon="phone-portrait-outline"
        step="STEP 1 OF 2"
        title="Verify your phone"
        subtitle="Enter your mobile number and we'll text you a 6-digit code to confirm it's yours."
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
        <Text style={styles.hint}>{phone ? `Code will be sent to ${phone}` : 'Standard SMS rates may apply.'}</Text>
      )}

      <View style={styles.action}>
        <Button title="Send OTP" onPress={handleSend} loading={sendingTo !== null} disabled={!number.trim()} />
      </View>
    </Screen>
  );
}

function PoweredBy() {
  return (
    <View style={styles.powered}>
      <Ionicons name="shield-checkmark-outline" size={14} color={Colors.textMuted} />
      <Text style={styles.poweredText}>Phone verification by Firebase Authentication</Text>
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
