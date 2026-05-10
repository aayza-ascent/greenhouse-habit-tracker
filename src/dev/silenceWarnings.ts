// Quiet noisy dev-only warnings that don't affect runtime correctness.
// Imported once from app/_layout.tsx so it runs before any animation /
// notification code.
//
// What we suppress and why:
//   - Reanimated reduced-motion: the user has iOS "Reduce Motion" enabled.
//     Reanimated correctly degrades animations, then logs a one-time warning.
//     We've already vetted that no critical UX depends on the animation.
//   - expo-notifications Expo-Go banners: SDK-53 boilerplate. Push token
//     registration already early-returns in Expo Go (registerPushToken.ts),
//     so the warnings are noise, not signal. They fire from inside the
//     expo-notifications package the moment the module is imported, so we
//     intercept at the console level — LogBox.ignoreLogs catches the
//     yellow-box variant, but the SDK-53 escalation logs through
//     console.error which LogBox doesn't filter.

import { LogBox } from "react-native";

// Try to silence the Reanimated reduced-motion warning. Wrapped in a
// best-effort try/catch so a Reanimated version mismatch can't take the
// whole app boot down — the warning is cosmetic, the app should run.
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const reanimated = require("react-native-reanimated");
  if (typeof reanimated.configureReanimatedLogger === "function") {
    reanimated.configureReanimatedLogger({
      level: reanimated.ReanimatedLogLevel?.warn ?? "warn",
      strict: false,
    });
  }
} catch {
  // ignore — silencer is best-effort
}

const SUPPRESS_PATTERNS: RegExp[] = [
  /expo-notifications: Android Push notifications/,
  /`expo-notifications` functionality is not fully supported in Expo Go/,
  /expo-notifications functionality is not fully supported in Expo Go/,
];

function shouldSuppress(args: unknown[]): boolean {
  if (args.length === 0) return false;
  const msg = args
    .map((a) => (typeof a === "string" ? a : ""))
    .join(" ");
  return SUPPRESS_PATTERNS.some((re) => re.test(msg));
}

const originalError = console.error;
const originalWarn = console.warn;

console.error = (...args: unknown[]) => {
  if (shouldSuppress(args)) return;
  // eslint-disable-next-line prefer-spread
  originalError.apply(console, args as []);
};
console.warn = (...args: unknown[]) => {
  if (shouldSuppress(args)) return;
  // eslint-disable-next-line prefer-spread
  originalWarn.apply(console, args as []);
};

LogBox.ignoreLogs(SUPPRESS_PATTERNS);
