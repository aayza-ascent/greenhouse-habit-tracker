// Shop tab — SEEDS grid (10 species, prices, OWNED state), REVIVE token,
// DECOR placeholder. Ported from
// greenhouse-prototype-design/project/screens.jsx → ShopScreen.

import * as React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { CoinIcon } from "@/components/ui/icons";
import { Plant } from "@/components/plants/Plant";
import { FLOWERS_V2, FLOWER_ORDER, type FlowerType } from "@/components/plants/flowers-v2";
import { PLANT_CATALOG } from "@/components/plants/catalog";
import { HUD } from "@/components/ui/HUD";
import { PixelPanel } from "@/components/ui/PixelPanel";
import { PixelButton } from "@/components/ui/PixelButton";
import { REVIVE_COST_COINS } from "@/domain/economy";
import { useGameStore } from "@/store/useGameStore";
import { FONTS } from "@/theme/fonts";
import { PIXEL_PALETTES } from "@/theme/palettes";

type Tab = "seeds" | "decor" | "revive";

export default function ShopScreen() {
  const profile = useGameStore((s) => s.profile);
  const inventory = useGameStore((s) => s.inventory);
  const buyPlant = useGameStore((s) => s.buyPlant);

  const palette = PIXEL_PALETTES[profile?.paletteKey ?? "terracotta"];
  const [tab, setTab] = React.useState<Tab>("seeds");
  const [flash, setFlash] = React.useState<FlowerType | null>(null);

  const buy = async (t: FlowerType) => {
    const price = PLANT_CATALOG[t].price;
    const result = await buyPlant(t, price);
    if (result) {
      setFlash(t);
      setTimeout(() => setFlash(null), 600);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: palette.bgPanel }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: palette.ink, fontFamily: FONTS.displayBold }]}>
            SHOP
          </Text>
          <Text style={[styles.sub, { color: palette.inkSoft, fontFamily: FONTS.body }]}>
            Spend coins, grow goodness
          </Text>
        </View>
        <HUD
          palette={palette}
          coins={profile?.coins ?? 0}
          xp={profile?.xp ?? 0}
          streak={profile?.streak ?? 0}
        />
      </View>

      <View style={styles.tabRow}>
        {(["seeds", "decor", "revive"] as Tab[]).map((id) => {
          const active = tab === id;
          return (
            <Pressable
              key={id}
              onPress={() => setTab(id)}
              style={[
                styles.tabBtn,
                {
                  borderColor: palette.ink,
                  backgroundColor: active ? palette.accent : palette.bgPanel,
                },
              ]}
            >
              <Text
                style={[
                  styles.tabLabel,
                  { fontFamily: FONTS.displayBold, color: active ? "#fff" : palette.ink },
                ]}
              >
                {id.toUpperCase()}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 32 }}>
        {tab === "seeds" && (
          <View style={styles.grid}>
            {FLOWER_ORDER.map((t) => {
              const meta = PLANT_CATALOG[t];
              const owned = inventory.includes(t);
              const canBuy = (profile?.coins ?? 0) >= meta.price;
              const justBought = flash === t;
              return (
                <View
                  key={t}
                  style={[
                    styles.card,
                    {
                      backgroundColor: palette.bgPanel,
                      borderColor: palette.ink,
                      transform: [{ translateY: justBought ? -4 : 0 }],
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.cardArt,
                      {
                        backgroundColor: palette.bgPanel2,
                        borderColor: palette.line,
                      },
                    ]}
                  >
                    <Plant type={t} stage={4} scale={3} />
                  </View>
                  <Text
                    style={[
                      styles.cardName,
                      { color: palette.ink, fontFamily: FONTS.displayBold },
                    ]}
                  >
                    {FLOWERS_V2[t].name.toUpperCase()}
                  </Text>
                  <Text
                    style={[
                      styles.cardDesc,
                      { color: palette.inkSoft, fontFamily: FONTS.body },
                    ]}
                  >
                    {meta.desc}
                  </Text>
                  <View style={styles.cardFooter}>
                    <View style={styles.priceRow}>
                      <CoinIcon palette={palette} scale={2} />
                      <Text
                        style={[
                          styles.price,
                          { color: palette.ink, fontFamily: FONTS.displayBold },
                        ]}
                      >
                        {meta.price}
                      </Text>
                    </View>
                    {owned && !justBought ? (
                      <View
                        style={[
                          styles.ownedTag,
                          {
                            backgroundColor: palette.leafX,
                            borderColor: palette.leafD,
                          },
                        ]}
                      >
                        <Text
                          style={{
                            color: palette.leafD,
                            fontFamily: FONTS.body,
                            fontSize: 11,
                          }}
                        >
                          OWNED
                        </Text>
                      </View>
                    ) : (
                      <Pressable
                        onPress={() => canBuy && buy(t)}
                        disabled={!canBuy}
                        style={[
                          styles.buyBtn,
                          {
                            backgroundColor: canBuy ? palette.accent : palette.line,
                            borderColor: palette.ink,
                            opacity: canBuy ? 1 : 0.6,
                          },
                        ]}
                      >
                        <Text style={[styles.buyText, { fontFamily: FONTS.displayBold }]}>
                          {justBought ? "GOT IT!" : "BUY"}
                        </Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {tab === "decor" && (
          <PixelPanel palette={palette} pad={20} style={{ alignItems: "center" }}>
            <Text style={[styles.cs, { color: palette.ink, fontFamily: FONTS.displayBold }]}>
              COMING SOON
            </Text>
            <Text
              style={[
                { color: palette.inkSoft, fontFamily: FONTS.body, fontSize: 13, marginTop: 6 },
              ]}
            >
              Pots, paths, trellises, fairy lights.
            </Text>
          </PixelPanel>
        )}

        {tab === "revive" && (
          <PixelPanel palette={palette} pad={14}>
            <Text
              style={[
                { color: palette.ink, fontFamily: FONTS.displayBold, fontSize: 14 },
              ]}
            >
              REVIVAL TOKEN
            </Text>
            <Text
              style={[
                {
                  color: palette.inkSoft,
                  fontFamily: FONTS.body,
                  fontSize: 13,
                  marginTop: 6,
                  marginBottom: 12,
                },
              ]}
            >
              Bring a wilted or dead plant back to 50 health. Tap a dead plant in the
              greenhouse to spend a token.
            </Text>
            <View style={styles.priceRow}>
              <CoinIcon palette={palette} scale={3} />
              <Text
                style={[
                  styles.price,
                  { color: palette.accent, fontFamily: FONTS.displayBold, fontSize: 18 },
                ]}
              >
                {REVIVE_COST_COINS}
              </Text>
              <Text
                style={[
                  { color: palette.inkSoft, fontFamily: FONTS.body, marginLeft: 8 },
                ]}
              >
                per revive
              </Text>
            </View>
          </PixelPanel>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { fontSize: 18, letterSpacing: 1 },
  sub: { fontSize: 12, marginTop: 2 },
  tabRow: { flexDirection: "row", paddingHorizontal: 14, gap: 6, marginBottom: 8 },
  tabBtn: {
    flex: 1,
    borderWidth: 2,
    paddingVertical: 8,
    alignItems: "center",
  },
  tabLabel: { fontSize: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  card: {
    width: "48%",
    borderWidth: 2,
    padding: 10,
  },
  cardArt: {
    height: 100,
    borderWidth: 2,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  cardName: { fontSize: 12, marginTop: 8 },
  cardDesc: { fontSize: 11, height: 28, lineHeight: 14, marginTop: 2 },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  price: { fontSize: 13 },
  ownedTag: { paddingVertical: 4, paddingHorizontal: 6, borderWidth: 1 },
  buyBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 2,
  },
  buyText: { color: "#fff", fontSize: 11 },
  cs: { fontSize: 16, letterSpacing: 1 },
});
