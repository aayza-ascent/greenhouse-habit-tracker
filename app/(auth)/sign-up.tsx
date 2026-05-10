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
import * as Localization from "expo-localization";
import { Link } from "expo-router";

import { PixelButton } from "@/components/ui/PixelButton";
import { PixelPanel } from "@/components/ui/PixelPanel";
import { supabase } from "@/data/supabase";
import { FONTS } from "@/theme/fonts";
import { PIXEL_PALETTES } from "@/theme/palettes";

export default function SignUp() {
  const p = PIXEL_PALETTES.terracotta;
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [info, setInfo] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const onSubmit = async () => {
    if (!email.trim() || !password) {
      setError("Email and password required.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setSubmitting(true);
    setError(null);
    setInfo(null);
    const tz = Localization.getCalendars()[0]?.timeZone ?? "UTC";
    const { data, error: err } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { tz } },
    });
    setSubmitting(false);
    if (err) {
      setError(err.message);
      return;
    }
    if (data.session) return; // root layout will redirect to /(tabs)
    setInfo("Check your inbox for a confirmation link.");
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: p.bgPanel }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={[styles.title, { fontFamily: FONTS.displayBold, color: p.ink }]}>
          GROW WITH US
        </Text>
        <Text style={[styles.sub, { fontFamily: FONTS.body, color: p.inkSoft }]}>
          One greenhouse, synced across your devices.
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
            style={[styles.label, { fontFamily: FONTS.display, color: p.inkSoft, marginTop: 12 }]}
          >
            PASSWORD
          </Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="new-password"
            placeholder="at least 8 characters"
            placeholderTextColor={p.inkSoft + "88"}
            style={[styles.input, { borderColor: p.ink, color: p.ink, fontFamily: FONTS.body }]}
          />
          <Text
            style={[styles.label, { fontFamily: FONTS.display, color: p.inkSoft, marginTop: 12 }]}
          >
            CONFIRM
          </Text>
          <TextInput
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
            autoComplete="new-password"
            placeholder="••••••••"
            placeholderTextColor={p.inkSoft + "88"}
            style={[styles.input, { borderColor: p.ink, color: p.ink, fontFamily: FONTS.body }]}
          />
          {error && (
            <Text style={[styles.error, { color: p.accent, fontFamily: FONTS.body }]}>
              {error}
            </Text>
          )}
          {info && (
            <Text style={[styles.error, { color: p.leafD, fontFamily: FONTS.body }]}>{info}</Text>
          )}
        </PixelPanel>

        <View style={styles.actions}>
          <PixelButton palette={p} onPress={onSubmit} disabled={submitting}>
            {submitting ? "PLANTING…" : "PLANT MY GREENHOUSE 🌱"}
          </PixelButton>
        </View>

        <Link href="/(auth)/sign-in" style={styles.link}>
          <Text style={{ fontFamily: FONTS.body, color: p.inkSoft }}>
            Already have an account?{" "}
            <Text style={{ color: p.accent, fontFamily: FONTS.bodySemibold }}>Sign in →</Text>
          </Text>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 24, paddingTop: 64, gap: 16 },
  title: { fontSize: 24, letterSpacing: 1, marginBottom: 6 },
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
