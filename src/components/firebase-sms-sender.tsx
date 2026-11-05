/**
 * Step 1 of Firebase phone sign-in, done inside a WebView so it runs in Expo Go.
 *
 * Firebase only sends the SMS after a reCAPTCHA check, and reCAPTCHA needs a
 * browser. The WebView loads the official Firebase JS SDK with the project's
 * authDomain as base URL (an authorised domain), runs signInWithPhoneNumber
 * with an invisible reCAPTCHA and posts the verificationId back to the app.
 * If Google wants an image challenge, it appears inside this sheet.
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { Colors, Spacing } from '@/constants/theme';
import { firebaseConfig } from '@/lib/firebase-config';

const FIREBASE_SDK = 'https://www.gstatic.com/firebasejs/10.14.1';

type Props = {
  /** E.164 number to text. The sheet is open while this is set. */
  phone: string | null;
  onSent: (verificationId: string) => void;
  onError: (message: string) => void;
  onCancel: () => void;
};

const FRIENDLY_ERRORS: Record<string, string> = {
  'auth/invalid-phone-number': "That phone number isn't valid. Check the country code and number.",
  'auth/missing-phone-number': 'Enter a phone number first.',
  'auth/too-many-requests': 'Too many codes were requested for this number. Wait a while and try again.',
  'auth/quota-exceeded': 'The Firebase SMS quota is used up for today.',
  'auth/operation-not-allowed': 'Phone sign-in is turned off. Enable it in Firebase Console → Authentication → Sign-in method → Phone.',
  'auth/billing-not-enabled': 'Firebase needs the Blaze plan to send SMS. Upgrade the project in Firebase Console.',
  'auth/unauthorized-domain': "The Firebase authDomain isn't authorised. Check Authentication → Settings → Authorized domains.",
  'auth/captcha-check-failed': 'The security check failed. Please try again.',
  'auth/invalid-app-credential': 'The security check failed. Please try again.',
  'auth/network-request-failed': 'No internet connection on the phone. Check your network and try again.',
  'auth/invalid-api-key': 'The Firebase API key in .env is wrong.',
};

function buildHtml(phone: string) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
  <style>
    body { margin: 0; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center;
           font-family: -apple-system, Roboto, sans-serif; background: #ffffff; color: #64748B; }
    .spinner { width: 34px; height: 34px; border: 3px solid #E0E7FF; border-top-color: #4F46E5; border-radius: 50%;
               animation: spin 0.8s linear infinite; margin-bottom: 16px; }
    @keyframes spin { to { transform: rotate(360deg); } }
    p { font-size: 15px; margin: 0; text-align: center; padding: 0 24px; }
  </style>
  <script src="${FIREBASE_SDK}/firebase-app-compat.js"></script>
  <script src="${FIREBASE_SDK}/firebase-auth-compat.js"></script>
</head>
<body>
  <div class="spinner"></div>
  <p id="status">Checking you're not a robot…</p>
  <div id="recaptcha"></div>
  <script>
    function send(msg) { window.ReactNativeWebView.postMessage(JSON.stringify(msg)); }
    try {
      firebase.initializeApp(${JSON.stringify(firebaseConfig)});
      var auth = firebase.auth();
      auth.useDeviceLanguage();
      var verifier = new firebase.auth.RecaptchaVerifier('recaptcha', { size: 'invisible' });
      document.getElementById('status').textContent = 'Sending the code by SMS…';
      auth.signInWithPhoneNumber(${JSON.stringify(phone)}, verifier)
        .then(function (result) { send({ type: 'sent', verificationId: result.verificationId }); })
        .catch(function (e) { send({ type: 'error', code: e.code || 'unknown', message: e.message || String(e) }); });
    } catch (e) {
      send({ type: 'error', code: (e && e.code) || 'init', message: (e && e.message) || 'Could not load Firebase. Check the internet connection.' });
    }
  </script>
</body>
</html>`;
}

export function FirebaseSmsSender({ phone, onSent, onError, onCancel }: Props) {
  const html = useMemo(() => (phone ? buildHtml(phone) : ''), [phone]);

  function handleMessage(event: WebViewMessageEvent) {
    let msg: { type?: string; verificationId?: string; code?: string; message?: string };
    try {
      msg = JSON.parse(event.nativeEvent.data);
    } catch {
      return;
    }
    if (msg.type === 'sent' && msg.verificationId) {
      onSent(msg.verificationId);
    } else if (msg.type === 'error') {
      console.warn(`[firebase] ${msg.code}: ${msg.message}`);
      onError(FRIENDLY_ERRORS[msg.code ?? ''] ?? msg.message ?? 'Could not send the code.');
    }
  }

  return (
    <Modal visible={phone !== null} animationType="slide" presentationStyle="pageSheet" onRequestClose={onCancel}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>Security check</Text>
            <Text style={styles.subtitle}>Firebase is sending your code to {phone}</Text>
          </View>
          <Pressable onPress={onCancel} hitSlop={12} accessibilityRole="button" accessibilityLabel="Cancel">
            <Ionicons name="close" size={26} color={Colors.textMuted} />
          </Pressable>
        </View>
        {phone ? (
          <WebView
            key={phone}
            source={{ html, baseUrl: `https://${firebaseConfig.authDomain}` }}
            originWhitelist={['*']}
            onMessage={handleMessage}
            javaScriptEnabled
            domStorageEnabled
            mixedContentMode="always"
            style={styles.webview}
          />
        ) : null}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.card },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerText: { flex: 1 },
  title: { fontSize: 18, fontWeight: '700', color: Colors.text },
  subtitle: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  webview: { flex: 1 },
});
