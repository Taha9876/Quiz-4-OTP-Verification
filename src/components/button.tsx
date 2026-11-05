import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/theme';

type Props = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
};

export function Button({ title, onPress, loading = false, disabled = false, variant = 'primary' }: Props) {
  const isDisabled = disabled || loading;
  const primary = variant === 'primary';

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        primary ? styles.primary : styles.secondary,
        pressed && !isDisabled && (primary ? styles.primaryPressed : styles.secondaryPressed),
        isDisabled && primary && styles.primaryDisabled,
      ]}>
      {loading ? (
        <ActivityIndicator color={primary ? '#FFFFFF' : Colors.primary} />
      ) : (
        <Text style={[styles.label, primary ? styles.primaryLabel : styles.secondaryLabel]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 54,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  primary: { backgroundColor: Colors.primary },
  primaryPressed: { backgroundColor: Colors.primaryPressed },
  primaryDisabled: { backgroundColor: Colors.disabled },
  secondary: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  secondaryPressed: { backgroundColor: Colors.primarySoft },
  label: { fontSize: 16, fontWeight: '600' },
  primaryLabel: { color: '#FFFFFF' },
  secondaryLabel: { color: Colors.text },
});
