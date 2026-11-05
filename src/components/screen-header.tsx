import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps, ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/theme';

type Props = {
  icon: ComponentProps<typeof Ionicons>['name'];
  step: string;
  title: string;
  subtitle: ReactNode;
};

export function ScreenHeader({ icon, step, title, subtitle }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.iconBadge}>
        <Ionicons name={icon} size={30} color={Colors.primary} />
      </View>
      <Text style={styles.step}>{step}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: Spacing.xl },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  step: { fontSize: 12, fontWeight: '700', letterSpacing: 1.2, color: Colors.primary, marginBottom: Spacing.sm },
  title: { fontSize: 28, fontWeight: '800', color: Colors.text, marginBottom: Spacing.sm },
  subtitle: { fontSize: 16, lineHeight: 23, color: Colors.textMuted },
});
