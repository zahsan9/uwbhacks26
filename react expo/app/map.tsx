import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  PanResponder,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import Blob from "../src/Blob";

import {
  BackButton,
  Eyebrow,
  H2,
  H3,
  Small,
  StatePill,
  VQCard,
  WaterBg,
} from "../src/Components";
import Island from "../src/Island";
import { ISLAND_STATES, islandMeta, islandName } from "../src/models";
import { AvatarState, IslandType, VQ } from "../src/theme";

const WALK_GIF = require("../assets/cute_chubby_fat_blue_panda_round_roly-poly_body_si_sleepy_east.gif");
const HOME_ISLAND_IMG = require("../assets/home_island.png");
const WALK_ISLAND_IMG = require("../assets/walk_island.png");
const SLEEP_ISLAND_IMG = require("../assets/sleep_island.png");
const SCREEN_ISLAND_IMG = require("../assets/screen_island.png");
const MEDITATION_ISLAND_IMG = require("../assets/FINAL_HOTSPRING_MEDITATION-removebg-preview.png");
const WORKOUT_ISLAND_IMG = require("../assets/workout_island-removebg-preview.png");

// Custom PNG lookup — these replace the pixel-art Island component for known habits
const HABIT_PNG: Record<string, any> = {
  walk: WALK_ISLAND_IMG,
  sleep: SLEEP_ISLAND_IMG,
  screen: SCREEN_ISLAND_IMG,
  meditation: MEDITATION_ISLAND_IMG,
  gym: WORKOUT_ISLAND_IMG,
};

const HABIT_SIZE_MULTIPLIER: Record<string, number> = {
  meditation: 0.9,
  gym: 1.25,
};

const { width: W, height: H } = Dimensions.get("window");

// ─── Map geometry ─────────────────────────────────────────────────────────────
// Positions are in the canvas coordinate space (same W×H as screen).
// Drag bounds let the user reveal content near the edges and slightly beyond.
const POSITIONS: Record<string, { x: number; y: number; scale: number }> = {
  home: { x: W * 0.5, y: H * 0.44, scale: 3.6 },
  slot0: { x: W * 0.82, y: H * 0.18, scale: 2.8 }, // top-right
  slot1: { x: W * 0.18, y: H * 0.18, scale: 2.8 }, // top-left
  slot2: { x: W * 0.84, y: H * 0.68, scale: 2.7 }, // bottom-right
  slot3: { x: W * 0.16, y: H * 0.68, scale: 2.7 }, // bottom-left
  slot4: { x: W * 0.5, y: H * 0.03, scale: 2.5 }, // top-center (drag down to reveal)
};

// How much the user can pan the map. Generous bounds for future island expansion.
const DRAG_BOUNDS = {
  minX: -W * 0.35,
  maxX: W * 0.35,
  minY: -H * 0.15,
  maxY: H * 0.22, // more downward slack to reveal slot4
};

const CURVE_OFFSETS: Record<string, number> = {
  slot0: 34,
  slot1: -30,
  slot2: -36,
  slot3: 28,
  slot4: 16,
};

const HABIT_SLOT_KEYS = ["slot0", "slot1", "slot2", "slot3", "slot4"] as const;

type HabitSlot = {
  habitId: string;
  key: string;
  label: string;
  locked: boolean;
};
const DEFAULT_HABIT_SLOTS: HabitSlot[] = [
  { habitId: "steps", key: "walk", label: "Walking", locked: false },
  { habitId: "sleep", key: "sleep", label: "Sleep", locked: false },
  { habitId: "screen", key: "screen", label: "Screen Time", locked: false },
  { habitId: "gym", key: "gym", label: "Workout", locked: true },
  { habitId: "read", key: "reading", label: "Read", locked: true },
];

const habitKeyToIslandType = (key: string): IslandType => {
  if (key === "walk" || key === "sleep" || key === "screen")
    return key as IslandType;
  // Map other habits to island visual types until custom art arrives
  const map: Record<string, IslandType> = {
    gym: "walk",
    running: "walk",
    reading: "learn",
    cooking: "sleep",
    meditation: "quest",
  };
  return map[key] ?? "walk";
};

const SQUARE = Math.floor((W - 60 - 36) / 10);

const home = POSITIONS.home;
const PANDA_SCALE = 4.5;
const PANDA_SIZE = PANDA_SCALE * 20;
const PANDA_LEFT = home.x - (PANDA_SIZE / 2 + 28);
const PANDA_TOP = home.y - home.scale * 11 - (PANDA_SIZE - 62);

function LegacyWorldBg({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ flex: 1, backgroundColor: "#1a2e1c" }}>
      <LinearGradient
        colors={["#1a2e1c", "#243426", "#2a3a2d"]}
        style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
      />
      {children}
    </View>
  );
}

// ─── Island detail overlay ────────────────────────────────────────────────────
function IslandDetail({
  type,
  state,
  habitKey,
  onBack,
}: {
  type: IslandType;
  state: AvatarState;
  habitKey?: string;
  onBack: () => void;
}) {
  const meta = islandMeta[type];
  const name = islandName[type];
  const today = 25;

  const pattern = Array.from({ length: 30 }, (_, i) => {
    if (i > today) return "future";
    if (i === today) return "today";
    if (type === "walk") return i % 7 === 3 && i < 15 ? "missed" : "hit";
    if (type === "sleep") return i < 18 && i % 5 === 2 ? "partial" : "hit";
    return i < 20 && i % 3 !== 0 ? "missed" : "hit";
  });

  const dayColor = (p: string) =>
    ({
      hit: "#6ed4a3",
      partial: "#ffc260",
      missed: "#d76060",
      today: "#ff8b6a",
      future: "rgba(31,58,74,0.1)",
    })[p] ?? "transparent";
  const detailScaleBoost = habitKey
    ? (HABIT_SIZE_MULTIPLIER[habitKey] ?? 1)
    : 1;

  const todayLog: Record<AvatarState, string> = {
    thriving: "✓ pulled from HealthKit · 82% of goal",
    healthy: "pulled from HealthKit · 68% of goal",
    sick: "missed yesterday — a short walk recovers you",
    critical: "3 days missed — your island is wilting",
  };

  return (
    <LegacyWorldBg>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Nav — locked */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingTop: 8, paddingBottom: 20 }}>
          <BackButton onPress={onBack} />
          <H3 style={{ flex: 1 }}>{name}</H3>
          <StatePill state={state} />
        </View>

        {/* Island hero + cards — all scroll together */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 60 }}
        >
          <View style={{ alignItems: "center", marginBottom: 36 }}>
            <View style={{ position: "relative", alignItems: "center" }}>
              {habitKey && HABIT_PNG[habitKey] ? (
                <Image
                  source={HABIT_PNG[habitKey]}
                  style={{ width: 52 * 4 * detailScaleBoost, height: 32 * 4 * detailScaleBoost }}
                  contentFit="contain"
                />
              ) : (
                <Island type={type} state={state} scale={4} />
              )}
              <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, alignItems: "center", zIndex: 2 }}>
                <Blob state={state} scale={5} />
              </View>
            </View>
          </View>
          <VQCard warm>
            <View style={{ alignItems: "center", gap: 4 }}>
              <Text
                style={{
                  fontFamily: "PixelifySans_700Bold",
                  fontSize: 34,
                  color: VQ.ink,
                  lineHeight: 38,
                }}
              >
                {meta.stat}
              </Text>
              <Small>
                {meta.unit} · goal {meta.goal}
              </Small>
            </View>
          </VQCard>

          <VQCard>
            <View style={{ gap: 10 }}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <Text style={{ fontSize: 16 }}>🔥</Text>
                <H3 style={{ flex: 1 }}>{meta.streak} day streak</H3>
                <Small>last 30 days</Small>
              </View>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
                {pattern.map((p, i) => (
                  <View
                    key={i}
                    style={{
                      width: SQUARE,
                      height: SQUARE,
                      backgroundColor: dayColor(p),
                      borderRadius: 2,
                      borderWidth: p === "today" ? 2 : 0,
                      borderColor: "#ff8b6a",
                    }}
                  />
                ))}
              </View>
              <View style={{ flexDirection: "row", gap: 14 }}>
                {[
                  ["hit", "#6ed4a3"],
                  ["partial", "#ffc260"],
                  ["missed", "#d76060"],
                ].map(([label, color]) => (
                  <View
                    key={label}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <View
                      style={{
                        width: 10,
                        height: 10,
                        backgroundColor: color as string,
                      }}
                    />
                    <Small>{label}</Small>
                  </View>
                ))}
              </View>
            </View>
          </VQCard>

          <VQCard soft>
            <Eyebrow style={{ marginBottom: 6 }}>today's log</Eyebrow>
            <H3>{todayLog[state]}</H3>
          </VQCard>

          <View style={{ flexDirection: "row", gap: 8 }}>
            {[
              { icon: "⭐", val: "+24 xp", label: "today" },
              { icon: "🏆", val: "Lvl 4", label: "next: 120 xp" },
              { icon: "❤️", val: "78/100", label: "health" },
            ].map((item) => (
              <VQCard key={item.label}>
                <View style={{ alignItems: "center", gap: 4, flex: 1 }}>
                  <Text style={{ fontSize: 16 }}>{item.icon}</Text>
                  <H3>{item.val}</H3>
                  <Small>{item.label}</Small>
                </View>
              </VQCard>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LegacyWorldBg>
  );
}

// ─── Map screen ───────────────────────────────────────────────────────────────
export default function MapScreen() {
  const router = useRouter();
  const [overlayIsland, setOverlayIsland] = useState<string | null>(null);
  const [habitSlots, setHabitSlots] =
    useState<HabitSlot[]>(DEFAULT_HABIT_SLOTS);

  useEffect(() => {
    AsyncStorage.getItem("selectedHabitSlots").then((raw) => {
      if (raw) setHabitSlots(JSON.parse(raw));
    });
  }, []);

  // ── Animation values ──────────────────────────────────────────────────────
  const pandaTX = useRef(new Animated.Value(0)).current;
  const pandaTY = useRef(new Animated.Value(0)).current;
  const mapScale = useRef(new Animated.Value(1)).current;
  const mapTX = useRef(new Animated.Value(0)).current; // island open/close pan
  const mapTY = useRef(new Animated.Value(0)).current;
  const overlayOpa = useRef(new Animated.Value(0)).current;

  const dragX = useRef(new Animated.Value(0)).current; // user drag pan
  const dragY = useRef(new Animated.Value(0)).current;
  // Combined canvas translation = user drag + island zoom animation
  const totalTX = useRef(Animated.add(dragX, mapTX)).current;
  const totalTY = useRef(Animated.add(dragY, mapTY)).current;

  const walkOpa = useRef(new Animated.Value(0)).current;
  const idleOpa = useRef(new Animated.Value(1)).current;
  const walkScaleX = useRef(new Animated.Value(1)).current;

  const homeBobAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(homeBobAnim, {
          toValue: -5,
          duration: 1500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(homeBobAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ]),
    ).start();
    return () => homeBobAnim.stopAnimation();
  }, []);

  // ── Drag / pan with bounded limits ────────────────────────────────────────
  const isAnimating = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isAnimating.current,
      onMoveShouldSetPanResponder: (_, g) =>
        !isAnimating.current && (Math.abs(g.dx) > 3 || Math.abs(g.dy) > 3),
      onPanResponderGrant: () => {
        dragStart.current = {
          x: (dragX as any)._value,
          y: (dragY as any)._value,
        };
      },
      onPanResponderMove: (_, g) => {
        const nx = Math.max(
          DRAG_BOUNDS.minX,
          Math.min(DRAG_BOUNDS.maxX, dragStart.current.x + g.dx),
        );
        const ny = Math.max(
          DRAG_BOUNDS.minY,
          Math.min(DRAG_BOUNDS.maxY, dragStart.current.y + g.dy),
        );
        dragX.setValue(nx);
        dragY.setValue(ny);
      },
    }),
  ).current;

  // ── Walking helpers ────────────────────────────────────────────────────────
  const startWalking = (flipped: boolean) => {
    walkScaleX.setValue(flipped ? -1 : 1);
    walkOpa.setValue(1);
    idleOpa.setValue(0);
  };
  const stopWalking = () => {
    walkOpa.setValue(0);
    idleOpa.setValue(1);
  };

  const canvasCY = useRef(home.y);
  const lastIslandX = useRef(home.x);

  // ── Island open / close ────────────────────────────────────────────────────
  const openIsland = (slotKey: string) => {
    const pos = POSITIONS[slotKey];
    if (!pos) return;

    // Snap drag back to origin — the zoom math assumes canvas is at (0,0) base
    dragX.setValue(0);
    dragY.setValue(0);
    dragStart.current = { x: 0, y: 0 };
    isAnimating.current = true;

    setOverlayIsland(slotKey);

    const dx = pos.x - home.x + 28;
    const dy = pos.y - pos.scale * 11 - (home.y - home.scale * 11);
    const s = 3.2;
    const panX = s * (W * 0.5 - pos.x);
    const panY = s * (canvasCY.current - pos.y);

    lastIslandX.current = pos.x;
    startWalking(pos.x < home.x);

    Animated.parallel([
      Animated.timing(pandaTX, {
        toValue: dx,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.timing(pandaTY, {
        toValue: dy,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.timing(mapTX, {
        toValue: panX * 0.4,
        duration: 1200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(mapTY, {
        toValue: panY * 0.4,
        duration: 1200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      stopWalking();
      Animated.parallel([
        Animated.timing(mapScale, {
          toValue: s,
          duration: 1100,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(mapTX, {
          toValue: panX,
          duration: 1100,
          useNativeDriver: true,
        }),
        Animated.timing(mapTY, {
          toValue: panY,
          duration: 1100,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(600),
          Animated.timing(overlayOpa, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    });
  };

  const closeIsland = () => {
    startWalking(lastIslandX.current >= home.x);

    Animated.parallel([
      Animated.timing(overlayOpa, {
        toValue: 0,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(150),
        Animated.parallel([
          Animated.timing(mapScale, {
            toValue: 1,
            duration: 700,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(mapTX, {
            toValue: 0,
            duration: 700,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(mapTY, {
            toValue: 0,
            duration: 700,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(pandaTX, {
            toValue: 0,
            duration: 1100,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(pandaTY, {
            toValue: 0,
            duration: 1100,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start(() => {
      stopWalking();
      setOverlayIsland(null);
      isAnimating.current = false;
    });
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1 }}>
      <WaterBg>
        <SafeAreaView style={{ flex: 1 }}>
          {/* Header — fixed, not transformed */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingHorizontal: 24,
              paddingTop: 8,
            }}
          >
            <H2 style={{ color: "#fff" }}>My Habit Islands</H2>
            <Pressable onPress={() => router.back()}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  backgroundColor: "rgba(255,255,255,0.12)",
                  borderRadius: 4,
                  borderWidth: 1.5,
                  borderColor: "rgba(255,255,255,0.25)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: "#fff", fontSize: 14 }}>‹</Text>
              </View>
            </Pressable>
          </View>

          {/* Drag hint */}
          <Text
            style={{
              fontFamily: "PixelifySans_400Regular",
              fontSize: 10,
              color: "rgba(255,255,255,0.45)",
              textAlign: "center",
              letterSpacing: 0.6,
              marginTop: 2,
              marginBottom: 0,
            }}
          >
            drag to explore
          </Text>

          {/* Canvas — drag + zoom transform */}
          <Animated.View
            {...panResponder.panHandlers}
            onLayout={(e) => {
              canvasCY.current = e.nativeEvent.layout.height / 2;
            }}
            style={{
              flex: 1,
              position: "relative",
              transform: [
                { translateX: totalTX },
                { translateY: totalTY },
                { scale: mapScale },
              ],
            }}
          >
            {/* Dashed connecting lines from home to each habit slot */}
            <Svg
              style={{ position: "absolute", width: "100%", height: "100%" }}
              width={W}
              height={H}
            >
              {HABIT_SLOT_KEYS.slice(0, habitSlots.length).map((key) => {
                const dest = POSITIONS[key];
                const x1 = home.x,
                  y1 = home.y,
                  x2 = dest.x,
                  y2 = dest.y;
                const mx = (x1 + x2) / 2,
                  my = (y1 + y2) / 2;
                const dx = x2 - x1,
                  dy = y2 - y1;
                const len = Math.sqrt(dx * dx + dy * dy);
                const offset = CURVE_OFFSETS[key] ?? 28;
                const cx = mx + (-dy / len) * offset;
                const cy = my + (dx / len) * offset;
                return (
                  <Path
                    key={key}
                    d={`M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`}
                    stroke="rgba(255,255,255,0.22)"
                    strokeWidth={1.5}
                    strokeDasharray="6,5"
                    fill="none"
                  />
                );
              })}
            </Svg>

            {/* Habit islands (5 slots: 3 active, 2 locked) */}
            {habitSlots.map((slot, i) => {
              const slotKey = HABIT_SLOT_KEYS[i];
              if (!slotKey) return null;
              const pos = POSITIONS[slotKey];
              const png = HABIT_PNG[slot.key];
              const sizeBoost = HABIT_SIZE_MULTIPLIER[slot.key] ?? 1;
              const islandType = habitKeyToIslandType(slot.key);
              const state = slot.locked
                ? "sick"
                : (ISLAND_STATES[islandType] ?? "healthy");
              return (
                <Pressable
                  key={slot.habitId}
                  onPress={() => !slot.locked && openIsland(slotKey)}
                  style={{
                    position: "absolute",
                    left: png
                      ? pos.x - pos.scale * 26 * sizeBoost
                      : pos.x - pos.scale * 16,
                    top: png
                      ? pos.y - pos.scale * 20 * sizeBoost
                      : pos.y - pos.scale * 11,
                    alignItems: "center",
                    opacity: slot.locked ? 0.55 : 1,
                  }}
                >
                  {png ? (
                    <Image
                      source={png}
                      style={{
                        width: 52 * pos.scale * sizeBoost,
                        height: 32 * pos.scale * sizeBoost,
                      }}
                      contentFit="contain"
                    />
                  ) : (
                    <Island
                      type={islandType}
                      state={state}
                      scale={pos.scale}
                      locked={slot.locked}
                    />
                  )}
                  <Text
                    style={{
                      fontFamily: "PixelifySans_500Medium",
                      fontSize: 10,
                      color: slot.locked
                        ? "rgba(255,255,255,0.35)"
                        : "rgba(255,255,255,0.85)",
                      letterSpacing: 0.4,
                      marginTop: 4,
                    }}
                  >
                    {slot.label}
                  </Text>
                </Pressable>
              );
            })}

            {/* Home island — custom PNG, with bob */}
            <Animated.View
              style={{
                position: "absolute",
                left: home.x - home.scale * 32,
                top: home.y - home.scale * 20,
                alignItems: "center",
                transform: [{ translateY: homeBobAnim }],
              }}
            >
              <Image
                source={HOME_ISLAND_IMG}
                style={{ width: 64 * home.scale, height: 40 * home.scale }}
                contentFit="contain"
              />
              <Text
                style={{
                  fontFamily: "PixelifySans_500Medium",
                  fontSize: 10,
                  color: "rgba(255,255,255,0.85)",
                  letterSpacing: 0.4,
                  marginTop: -10,
                }}
              >
                home
              </Text>
            </Animated.View>

            {/* Panda — opacity swap between walk GIF and idle blob */}
            <Animated.View
              style={{
                position: "absolute",
                left: PANDA_LEFT,
                top: PANDA_TOP,
                zIndex: 10,
                width: PANDA_SIZE,
                height: PANDA_SIZE,
                transform: [{ translateX: pandaTX }, { translateY: pandaTY }],
              }}
            >
              <Animated.View
                style={{
                  position: "absolute",
                  width: PANDA_SIZE,
                  height: PANDA_SIZE,
                  opacity: walkOpa,
                  transform: [{ scaleX: walkScaleX }],
                }}
              >
                <Image
                  source={WALK_GIF}
                  style={{ width: PANDA_SIZE, height: PANDA_SIZE }}
                  contentFit="contain"
                />
              </Animated.View>
              <Animated.View
                style={{
                  position: "absolute",
                  width: PANDA_SIZE,
                  height: PANDA_SIZE,
                  opacity: idleOpa,
                }}
              >
                <Blob state="healthy" scale={PANDA_SCALE} />
              </Animated.View>
            </Animated.View>
          </Animated.View>
        </SafeAreaView>
      </WaterBg>

      {/* Island detail overlay — rendered above WaterBg, full-screen */}
      {overlayIsland &&
        (() => {
          const slotIndex = HABIT_SLOT_KEYS.indexOf(overlayIsland as any);
          const slot = slotIndex >= 0 ? habitSlots[slotIndex] : null;
          const islandType: IslandType = slot
            ? habitKeyToIslandType(slot.key)
            : "walk";
          const islandState = ISLAND_STATES[islandType] ?? "healthy";
          return (
            <Animated.View
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: W,
                height: H,
                opacity: overlayOpa,
                zIndex: 100,
              }}
            >
              <IslandDetail
                type={islandType}
                state={islandState}
                habitKey={slot?.key}
                onBack={closeIsland}
              />
            </Animated.View>
          );
        })()}
    </View>
  );
}
