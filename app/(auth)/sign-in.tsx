import * as React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Localization from "expo-localization";
import { Link } from "expo-router";

import { PixelButton } from "@/components/ui/PixelButton";
import { PixelPanel } from "@/components/ui/PixelPanel";
import { supabase } from "@/data/supabase";
import { FONTS } from "@/theme/fonts";
import { PIXEL_PALETTES } from "@/theme/palettes";

export default function SignIn() {
  const p = PIXEL_PALETTES.terracotta;
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [appleAvailable, setAppleAvailable] = React.useState(false);

  React.useEffect(() => {
    if (Platform.OS === "ios") {
      AppleAuthentication.isAvailableAsync().then(setAppleAvailable);
    }
  }, []);

  const onSubmit = async () => {
    if (!email.trim() || !password) {
      setError("Email and password required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setSubmitting(false);
    if (err) setError(err.message);
  };

  const onApple = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!credential.identityToken) throw new Error("Apple did not return an identity token.");
      const { error: err } = await supabase.auth.signInWithIdToken({
        provider: "apple",
        token: credential.identityToken,
      });
      if (err) {
        setError(err.message);
        return;
      }
      // First-time Apple sign-in returns name only on the first attempt.
      // Persist to profile.tz so the cron knows the user's timezone.
      const tz = Localization.getCalendars()[0]?.timeZone ?? "UTC";
      await supabase.auth.updateUser({ data: { tz } });
    } catch (e: any) {
      if (e.code === "ERR_REQUEST_CANCELED") return;
      setError(e?.message ?? "Apple sign-in failed.");
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: p.bgPanel }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={[styles.title, { fontFamily: FONTS.displayBold, color: p.ink }]}>
          🌿 GREENHOUSE
        </Text>
        <Text style={[styles.sub, { fontFamily: FONTS.body, color: p.inkSoft }]}>
          Sign in to keep your garden growing.
        </Text>

        <PixelPanel palette={p} pad={14} style={styles.panel}>
          <Text style={[styles.label, { fontFamily: FONTS.display, color: p.inkSoft }]}>EMAIL</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            placeholder="you@example.com"
            placeholderTextColor={p.inkSoft + "88"}
            style={[styles.input, { borderColor: p.ink, color: p.ink, fontFamily: FONTS.body }]}
          />
          <Text
            style={[
              styles.label,
              { fontFamily: FONTS.display, color: p.inkSoft, marginTop: 12 },
            ]}
          >
            PASSWORD
          </Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="current-password"
            placeholder="••••••••"
            placeholderTextColor={p.inkSoft + "88"}
            style={[styles.input, { borderColor: p.ink, color: p.ink, fontFamily: FONTS.body }]}
          />
          {error && (
            <Text style={[styles.error, { color: p.accent, fontFamily: FONTS.body }]}>
              {error}
            </Text>
          )}
        </PixelPanel>

        <View style={styles.actions}>
          <PixelButton palette={p} onPress={onSubmit} disabled={submitting}>
            {submitting ? "SIGNING IN…" : "SIGN IN"}
          </PixelButton>

          {appleAvailable && (
            <View style={{ marginTop: 8 }}>
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                cornerRadius={2}
                style={{ width: "100%", height: 44 }}
                onPress={onApple}
              />
            </View>
          )}
        </View>

        <Link href="/(auth)/sign-up" style={styles.link}>
          <Text style={{ fontFamily: FONTS.body, color: p.inkSoft }}>
            Don&apos;t have an account?{" "}
            <Text style={{ color: p.accent, fontFamily: FONTS.bodySemibold }}>Sign up →</Text>
          </Text>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 24, paddingTop: 64, gap: 16 },
  title: { fontSize: 28, letterSpacing: 1, marginBottom: 6 },
  sub: { fontSize: 14, marginBottom: 20 },
  panel: { marginBottom: 8 },
  label: { fontSize: 11, letterSpacing: 1 },
  input: {
    borderWidth: 2,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 16,
    marginTop: 6,
  },
  error: { fontSize: 13, marginTop: 10 },
  actions: { gap: 4 },
  link: { marginTop: 18, alignSelf: "center" },
});
