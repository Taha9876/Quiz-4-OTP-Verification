import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { Colors, OTP_LENGTH, Radius } from '@/constants/theme';

type Props = {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
};

/**
 * Six digit boxes backed by one invisible TextInput, so paste and
 * Android SMS autofill (autoComplete="sms-otp") fill every box at once.
 */
export function OtpInput({ value, onChange, length = OTP_LENGTH, disabled = false }: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.row}>
      {Array.from({ length }, (_, i) => {
        const digit = value[i] ?? '';
        const isActive = focused && (i === value.length || (value.length === length && i === length - 1));
        return (
          <View key={i} style={[styles.box, digit !== '' && styles.boxFilled, isActive && styles.boxActive]}>
            <Text style={styles.digit}>{digit}</Text>
          </View>
        );
      })}
      <TextInput
        value={value}
        onChangeText={(text) => onChange(text.replace(/\D/g, '').slice(0, length))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        editable={!disabled}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        maxLength={length}
        autoFocus
        caretHidden
        accessibilityLabel="One-time code"
        style={styles.hiddenInput}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  box: {
    flex: 1,
    maxWidth: 54,
    aspectRatio: 0.86,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxFilled: { borderColor: Colors.textMuted },
  boxActive: { borderColor: Colors.primary, borderWidth: 2 },
  digit: { fontSize: 24, fontWeight: '700', color: Colors.text },
  hiddenInput: { ...StyleSheet.absoluteFill, opacity: 0, color: 'transparent' },
});
