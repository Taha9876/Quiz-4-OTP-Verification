import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { Colors, Spacing } from '@/constants/theme';

export default function ResultScreen() {
  const { status, phone = '', reason, uid } = useLocalSearchParams<{ status: string; phone?: string; reason?: string; uid?: string }>();
  const success = status === 'success';

  const [scale] = useState(() => new Animated.Value(0.6));
  useEffect(() => {
    Animated.spring(scale, { toValue: 1, friction: 5, tension: 120, useNativeDriver: true }).start();
  }, [scale]);

  const tone = success ? Colors.success : Colors.danger;
  const toneSoft = success ? Colors.successSoft : Colors.dangerSoft;

  return (
    <Screen centered>
      <View style={styles.center}>
        <Animated.View style={[styles.halo, { backgroundColor: toneSoft, transform: [{ scale }] }]}>
          <View style={[styles.circle, { backgroundColor: tone }]}>
            <Ionicons name={success ? 'checkmark' : 'close'} size={52} color="#FFFFFF" />
          </View>
        </Animated.View>

        <Text style={[styles.badge, { color: tone, backgroundColor: toneSoft }]}>{success ? 'SUCCESS' : 'FAILED'}</Text>
        <Text style={styles.title}>{success ? 'Phone number verified' : 'Verification failed'}</Text>
        <Text style={styles.message}>
          {success ? (
            <>
              <Text style={styles.phone}>{phone}</Text> has been verified and registered successfully.
            </>
          ) : (
            (reason ?? 'The code you entered is incorrect.')
          )}
        </Text>
        {success && uid ? <Text style={styles.uid}>User ID: {uid}</Text> : null}
      </View>

      <View style={styles.actions}>
        {success ? (
          <Button title="Verify another number" onPress={() => router.dismissAll()} />
        ) : (
          <>
            <Button title="Try again" onPress={() => router.back()} />
            <Button title="Change phone number" variant="secondary" onPress={() => router.dismissAll()} />
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center' },
  halo: { width: 132, height: 132, borderRadius: 66, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg },
  circle: { width: 92, height: 92, borderRadius: 46, alignItems: 'center', justifyContent: 'center' },
  badge: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  title: { fontSize: 26, fontWeight: '800', color: Colors.text, textAlign: 'center', marginBottom: Spacing.sm },
  message: { fontSize: 16, lineHeight: 23, color: Colors.textMuted, textAlign: 'center', maxWidth: 340 },
  phone: { color: Colors.text, fontWeight: '700' },
  uid: { marginTop: Spacing.md, fontSize: 12, color: Colors.textMuted, fontFamily: 'monospace' },
  actions: { marginTop: Spacing.xxl, gap: Spacing.md },
});
