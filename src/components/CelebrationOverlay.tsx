// Task-complete celebration. Listens to useGameStore.celebrate; when set,
// fades in a centered card with the linked plant + coins/xp earned + a
// "GREW TO X" line if the stage advanced. Tap KEEP GOING to dismiss.
//
// Animations use react-native's built-in Animated API (no Reanimated worklet
// ceremony for a one-shot transition).

import * as React from "react";
import { Animated, Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { CoinIcon, StarIcon, XPIcon } from "@/components/ui/icons";
import { Plant } from "@/components/plants/Plant";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelPanel } from "@/components/ui/PixelPanel";
import { STAGE_NAMES } from "@/domain/health";
import { useGameStore } from "@/store/useGameStore";
import { FONTS } from "@/theme/fonts";
import type { Palette } from "@/theme/palettes";

type Props = { palette: Palette };

export function CelebrationOverlay({ palette }: Props) {
  const celebrate = useGameStore((s) => s.celebrate);
  const plants = useGameStore((s) => s.plants);
  const clear = useGameStore((s) => s.clearCelebrate);
  const visible = !!celebrate;

  // Pop-in animation for the panel.
  const scale = React.useRef(new Animated.Value(0.6)).current;
  const opacity = React.useRef(new Animated.Value(0)).current;
  // Plant grow-pulse if stage changed.
  const plantScale = React.useRef(new Animated.Value(1)).current;
  // Sparkle float anim (cycles up + fade).
  const sparkle = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (!visible) return;
    scale.setValue(0.6);
    opacity.setValue(0);
    plantScale.setValue(1);
    sparkle.setValue(0);
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 6, tension: 80 }),
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();

    const grew =
      celebrate?.oldStage != null &&
      celebrate?.newStage != null &&
      celebrate.oldStage !== celebrate.newStage;
    if (grew) {
      Animated.sequence([
        Animated.timing(plantScale, { toValue: 1.3, duration: 250, useNativeDriver: true }),
        Animated.timing(plantScale, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    }
    Animated.timing(sparkle, { toValue: 1, duration: 1200, useNativeDriver: true }).start();
  }, [visible, celebrate?.taskId]);

  if (!celebrate) return null;
  const plant = celebrate.plantId ? plants.find((p) => p.id === celebrate.plantId) : null;
  const grew =
    celebrate.oldStage != null &&
    celebrate.newStage != null &&
    celebrate.oldStage !== celebrate.newStage;

  const sparkleY = sparkle.interpolate({ inputRange: [0, 1], outputRange: [0, -40] });
  const sparkleOpacity = sparkle.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });

  return (
    <Modal visible transparent animationType="none" onRequestClose={clear}>
      <View style={styles.backdrop}>
        <Animated.View style={{ width: 280, transform: [{ scale }], opacity }}>
          <PixelPanel palette={palette} pad={20}>
            <Text
              style={[
                styles.headline,
                { color: palette.accent, fontFamily: FONTS.displayBold },
              ]}
            >
              DONE!
            </Text>
            {plant && (
              <View style={styles.plantWrap}>
                {[
                  [-40, -20],
                  [40, -30],
                  [-50, -50],
                  [50, -60],
                ].map(([x, y], i) => (
                  <Animated.View
                    key={i}
                    style={[
                      styles.sparkle,
                      {
                        left: 140 + x,
                        top: 70 + y,
                        opacity: sparkleOpacity,
                        transform: [{ translateY: sparkleY }],
                      },
                    ]}
                  >
                    <StarIcon palette={palette} scale={1.5} />
                  </Animated.View>
                ))}
                <Animated.View style={{ transform: [{ scale: plantScale }] }}>
                  <Plant type={plant.type} stage={plant.stageIdx} scale={4} />
                </Animated.View>
              </View>
            )}
            {grew && (
              <Text
                style={[
                  styles.grew,
                  { color: palette.leafD, fontFamily: FONTS.displayBold },
                ]}
              >
                GREW TO {STAGE_NAMES[celebrate.newStage!].toUpperCase()}!
              </Text>
            )}
            <View style={styles.payoutRow}>
              <View style={styles.payoutItem}>
                <CoinIcon palette={palette} scale={3} />
                <Text style={[styles.payoutText, { color: palette.coinDark, fontFamily: FONTS.displayBold }]}>
                  +{celebrate.coins}
                </Text>
              </View>
              <View style={styles.payoutItem}>
                <XPIcon palette={palette} scale={3} />
                <Text style={[styles.payoutText, { color: palette.accentB, fontFamily: FONTS.displayBold }]}>
                  +{celebrate.xp}
                </Text>
              </View>
            </View>
            <PixelButton palette={palette} onPress={clear}>
              KEEP GOING →
            </PixelButton>
          </PixelPanel>
        </Animated.View>
        {/* Catch outside tap to dismiss */}
        <Pressable style={StyleSheet.absoluteFill} onPress={clear} pointerEvents="box-only" />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "#00000088",
    alignItems: "center",
    justifyContent: "center",
  },
  headline: {
    fontSize: 22,
    letterSpacing: 1,
    marginBottom: 8,
    textAlign: "center",
  },
  plantWrap: {
    height: 140,
    alignItems: "center",
    justifyContent: "flex-end",
    position: "relative",
  },
  sparkle: { position: "absolute" },
  grew: {
    fontSize: 12,
    marginTop: 4,
    textAlign: "center",
  },
  payoutRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 18,
    marginVertical: 14,
  },
  payoutItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  payoutText: { fontSize: 22 },
});
