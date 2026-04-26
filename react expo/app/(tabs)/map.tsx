import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { useCallback, useEffect, useRef, useState } from "react";
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
import { useFocusEffect } from "@react-navigation/native";
import Svg, { Path } from "react-native-svg";
import Blob from "../../src/Blob";
import { setTabAccentMode } from "../../src/tabAccent";

import {
  BackButton,
  Eyebrow,
  H2,
  H3,
  Small,
  StatePill,
  VQCard,
  WaterBg,
  WorldBg,
} from "../../src/Components";
import Island from "../../src/Island";
import { ISLAND_STATES, islandMeta, islandName } from "../../src/models";
import { AvatarState, IslandType, VQ } from "../../src/theme";

const WALK_GIF = require("../../assets/cute_chubby_fat_blue_panda_round_roly-poly_body_si_sleepy_east.gif");
const HOME_ISLAND_IMG = require("../../assets/home_island.png");
const WALK_ISLAND_IMG = require("../../assets/walk_island.png");
const SLEEP_ISLAND_IMG = require("../../assets/sleep_island.png");
const SCREEN_ISLAND_IMG = require("../../assets/screen_island.png");
const MEDITATION_ISLAND_IMG = require("../../assets/FINAL_HOTSPRING_MEDITATION-removebg-preview.png");
const WORKOUT_ISLAND_IMG = require("../../assets/workout_island-removebg-preview.png");

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

const POSITIONS: Record<string, { x: number; y: number; scale: number }> = {
  home: { x: W * 0.5, y: H * 0.44, scale: 3.6 },
  slot0: { x: W * 0.82, y: H * 0.18, scale: 2.8 },
  slot1: { x: W * 0.18, y: H * 0.18, scale: 2.8 },
  slot2: { x: W * 0.84, y: H * 0.68, scale: 2.7 },
  slot3: { x: W * 0.16, y: H * 0.68, scale: 2.7 },
  slot4: { x: W * 0.5, y: H * 0.03, scale: 2.5 },
};

const DRAG_BOUNDS = {
  minX: -W * 0.35,
  maxX: W * 0.35,
  minY: -H * 0.15,
  maxY: H * 0.22,
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
  { habitId: "meditate", key: "meditation", label: "Meditation", locked: true },
];

const habitKeyToIslandType = (key: string): IslandType => {
  if (key === "walk" || key === "sleep" || key === "screen")
    return key as IslandType;
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
// Canvas center x of panda when at home
const PANDA_HOME_X = PANDA_LEFT + PANDA_SIZE / 2;

// ─── Bezier walk helpers ──────────────────────────────────────────────────────
type WalkRoute = { endX: number; endY: number; controlX: number; controlY: number };

function getCurveControl(from: { x: number; y: number }, to: { x: number; y: number }, offset: number) {
  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  return { x: mx + (-dy / len) * offset, y: my + (dx / len) * offset };
}

function getPandaRoute(slotKey: string): WalkRoute {
  const pos = POSITIONS[slotKey];
  const start = { x: PANDA_HOME_X, y: home.y - home.scale * 11 };
  const end   = { x: pos.x,        y: pos.y  - pos.scale  * 11 };
  const ctrl  = getCurveControl(start, end, CURVE_OFFSETS[slotKey] ?? 28);
  return {
    endX:     end.x  - start.x,
    endY:     end.y  - start.y,
    controlX: ctrl.x - start.x,
    controlY: ctrl.y - start.y,
  };
}

function pointOnRoute(route: WalkRoute, t: number) {
  const inv = 1 - t;
  return {
    x: 2 * inv * t * route.controlX + t * t * route.endX,
    y: 2 * inv * t * route.controlY + t * t * route.endY,
  };
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
      hit: "#78c8d8",
      partial: "#f5a842",
      missed: "#d06868",
      today: "#f07848",
      future: "rgba(28,80,100,0.25)",
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
    <WaterBg>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingTop: 8, paddingBottom: 4 }}>
          <BackButton onPress={onBack} />
          <View style={{ flex: 1 }}>
            <H3>{name}</H3>
            <Small>Island detail</Small>
          </View>
          <StatePill state={state} />
        </View>

        {/* Island art */}
        <View style={{ alignItems: "center", height: 200, justifyContent: "center" }}>
          <View style={{ alignItems: "center" }}>
            <View style={{ marginBottom: -58, zIndex: 1, transform: [{ translateX: 22 }] }}>
              <Blob state={state} scale={5} />
            </View>
            {habitKey && HABIT_PNG[habitKey] ? (
              <Image source={HABIT_PNG[habitKey]} style={{ width: 52 * 4 * detailScaleBoost, height: 32 * 4 * detailScaleBoost }} contentFit="contain" />
            ) : (
              <Island type={type} state={state} scale={4} />
            )}
          </View>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 44 }}>
          {/* Main stat */}
          <View style={{ backgroundColor: "rgba(0,30,45,0.65)", borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", padding: 20, alignItems: "center", gap: 6 }}>
            <Text style={{ fontFamily: "PixelifySans_700Bold", fontSize: 38, color: "#E8E0D4", lineHeight: 42 }}>
              {meta.stat}
            </Text>
            <Text style={{ fontFamily: "PixelifySans_400Regular", fontSize: 12, color: "rgba(232,224,212,0.6)" }}>
              {meta.unit} · goal {meta.goal}
            </Text>
          </View>

          {/* Streak calendar */}
          <View style={{ backgroundColor: "rgba(0,30,45,0.65)", borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", padding: 16, gap: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={{ fontSize: 18, marginRight: 8 }}>🔥</Text>
              <Text style={{ fontFamily: "PixelifySans_700Bold", fontSize: 16, color: "#E8E0D4", flex: 1 }}>
                {meta.streak} Day Streak
              </Text>
              <Text style={{ fontFamily: "PixelifySans_400Regular", fontSize: 11, color: "rgba(232,224,212,0.5)" }}>
                Last 30 Days
              </Text>
            </View>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
              {pattern.map((p, i) => (
                <View
                  key={i}
                  style={{
                    width: SQUARE,
                    height: SQUARE,
                    backgroundColor: dayColor(p),
                    borderRadius: 6,
                    borderWidth: p === "today" ? 2 : 0,
                    borderColor: "#f07848",
                  }}
                />
              ))}
            </View>
            <View style={{ flexDirection: "row", gap: 16 }}>
              {[
                ["Hit",     "#78c8d8"],
                ["Partial", "#f5a842"],
                ["Missed",  "#d06868"],
              ].map(([label, color]) => (
                <View key={label} style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                  <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: color }} />
                  <Text style={{ fontFamily: "PixelifySans_400Regular", fontSize: 11, color: "rgba(232,224,212,0.55)" }}>{label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Today's log */}
          <View style={{ backgroundColor: "rgba(0,30,45,0.65)", borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", padding: 16, gap: 8 }}>
            <Text style={{ fontFamily: "PixelifySans_600SemiBold", fontSize: 9, color: "rgba(232,224,212,0.5)", textTransform: "uppercase", letterSpacing: 2 }}>TODAY'S LOG</Text>
            <Text style={{ fontFamily: "PixelifySans_500Medium", fontSize: 14, color: "#E8E0D4", lineHeight: 20 }}>{todayLog[state]}</Text>
          </View>

          {/* Bottom stat tiles */}
          <View style={{ flexDirection: "row", gap: 8 }}>
            {[
              { icon: "⭐", val: "+24 xp", label: "Today" },
              { icon: "🏆", val: "Lvl 4", label: "Next: 120 xp" },
              { icon: "❤️", val: "78/100", label: "Health" },
            ].map((item) => (
              <View key={item.label} style={{ flex: 1, backgroundColor: "rgba(0,30,45,0.65)", borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", padding: 14, alignItems: "center", gap: 6 }}>
                <Text style={{ fontSize: 22 }}>{item.icon}</Text>
                <Text style={{ fontFamily: "PixelifySans_700Bold", fontSize: 16, color: "#E8E0D4", lineHeight: 18 }}>{item.val}</Text>
                <Text style={{ fontFamily: "PixelifySans_400Regular", fontSize: 10, color: "rgba(232,224,212,0.5)" }}>{item.label}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </WaterBg>
  );
}

// ─── Map screen ───────────────────────────────────────────────────────────────
export default function MapScreen() {
  const [overlayIsland, setOverlayIsland] = useState<string | null>(null);
  const [habitSlots, setHabitSlots] =
    useState<HabitSlot[]>(DEFAULT_HABIT_SLOTS);

  useFocusEffect(
    useCallback(() => {
      setTabAccentMode('blue');
    }, [])
  );

  useEffect(() => {
    AsyncStorage.getItem("selectedHabitSlots").then((raw) => {
      if (raw) setHabitSlots(JSON.parse(raw));
    });
  }, []);

  const pandaTX = useRef(new Animated.Value(0)).current;
  const pandaTY = useRef(new Animated.Value(0)).current;
  // Bezier path driver (JS-side, drives pandaTX/pandaTY via listener)
  const pandaPathT = useRef(new Animated.Value(0)).current;
  const pandaPathListener = useRef<string | null>(null);
  const lastRoute = useRef<WalkRoute | null>(null);
  const mapScale = useRef(new Animated.Value(1)).current;
  const mapTX = useRef(new Animated.Value(0)).current;
  const mapTY = useRef(new Animated.Value(0)).current;
  const overlayOpa = useRef(new Animated.Value(0)).current;
  const dragX = useRef(new Animated.Value(0)).current;
  const dragY = useRef(new Animated.Value(0)).current;
  const totalTX = useRef(Animated.add(dragX, mapTX)).current;
  const totalTY = useRef(Animated.add(dragY, mapTY)).current;
  const walkOpa = useRef(new Animated.Value(0)).current;
  const idleOpa = useRef(new Animated.Value(1)).current;
  const walkScaleX = useRef(new Animated.Value(1)).current;
  const homeBobAnim = useRef(new Animated.Value(0)).current;
  const slotBobAnims = useRef({
    slot0: new Animated.Value(0),
    slot1: new Animated.Value(0),
    slot2: new Animated.Value(0),
    slot3: new Animated.Value(0),
    slot4: new Animated.Value(0),
  }).current;

  useEffect(() => {
    const bob = (anim: Animated.Value, duration: number) =>
      Animated.loop(Animated.sequence([
        Animated.timing(anim, { toValue: -5, duration, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(anim, { toValue: 0,  duration, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ])).start();
    bob(homeBobAnim,            1500);
    bob(slotBobAnims.slot0,     1700);
    bob(slotBobAnims.slot1,     1800);
    bob(slotBobAnims.slot2,     1600);
    bob(slotBobAnims.slot3,     1900);
    bob(slotBobAnims.slot4,     1750);
    return () => {
      homeBobAnim.stopAnimation();
      Object.values(slotBobAnims).forEach(a => a.stopAnimation());
    };
  }, []);

  useEffect(() => {
    return () => {
      if (pandaPathListener.current) pandaPathT.removeListener(pandaPathListener.current);
    };
  }, []);

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
        dragX.setValue(
          Math.max(
            DRAG_BOUNDS.minX,
            Math.min(DRAG_BOUNDS.maxX, dragStart.current.x + g.dx),
          ),
        );
        dragY.setValue(
          Math.max(
            DRAG_BOUNDS.minY,
            Math.min(DRAG_BOUNDS.maxY, dragStart.current.y + g.dy),
          ),
        );
      },
    }),
  ).current;

  const startWalking = (flipped: boolean) => {
    walkScaleX.setValue(flipped ? -1 : 1);
    walkOpa.setValue(1);
    idleOpa.setValue(0);
  };
  const stopWalking = () => {
    walkOpa.setValue(0);
    idleOpa.setValue(1);
  };

  const animatePandaAlongRoute = (route: WalkRoute, toValue: 0 | 1, duration: number) => {
    if (pandaPathListener.current) pandaPathT.removeListener(pandaPathListener.current);
    pandaPathT.stopAnimation();
    pandaPathT.setValue(toValue === 1 ? 0 : 1);
    pandaPathListener.current = pandaPathT.addListener(({ value }) => {
      const pt = pointOnRoute(route, value);
      pandaTX.setValue(pt.x);
      pandaTY.setValue(pt.y);
    });
    return Animated.timing(pandaPathT, {
      toValue,
      duration,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: false,
    });
  };

  const canvasCY = useRef(home.y);
  const lastIslandX = useRef(home.x);

  const openIsland = (slotKey: string) => {
    const pos = POSITIONS[slotKey];
    if (!pos) return;
    dragX.setValue(0);
    dragY.setValue(0);
    dragStart.current = { x: 0, y: 0 };
    isAnimating.current = true;
    setOverlayIsland(slotKey);

    const route = getPandaRoute(slotKey);
    const s = 3.2;
    const panX = s * (W * 0.5 - pos.x);
    const panY = s * (canvasCY.current - pos.y);
    lastIslandX.current = pos.x;
    lastRoute.current = route;
    startWalking(pos.x < home.x);

    // Phase 1: panda walks bezier curve to island
    Animated.parallel([
      animatePandaAlongRoute(route, 1, 1900),
      Animated.timing(mapTX, { toValue: panX * 0.4, duration: 1900, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(mapTY, { toValue: panY * 0.4, duration: 1900, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start(() => {
      stopWalking();
      // Phase 2: zoom into island
      Animated.parallel([
        Animated.timing(mapScale, { toValue: s,    duration: 1100, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        Animated.timing(mapTX,    { toValue: panX, duration: 1100, useNativeDriver: true }),
        Animated.timing(mapTY,    { toValue: panY, duration: 1100, useNativeDriver: true }),
        Animated.sequence([
          Animated.delay(600),
          Animated.timing(overlayOpa, { toValue: 1, duration: 500, useNativeDriver: true }),
        ]),
      ]).start();
    });
  };

  const closeIsland = () => {
    const route = lastRoute.current;
    startWalking(lastIslandX.current >= home.x);

    Animated.parallel([
      Animated.timing(overlayOpa, { toValue: 0, duration: 280, useNativeDriver: true }),
      Animated.sequence([
        Animated.delay(150),
        Animated.parallel([
          Animated.timing(mapScale, { toValue: 1, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(mapTX,    { toValue: 0, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(mapTY,    { toValue: 0, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          route
            ? animatePandaAlongRoute(route, 0, 1600)
            : Animated.parallel([
                Animated.timing(pandaTX, { toValue: 0, duration: 1100, easing: Easing.linear, useNativeDriver: true }),
                Animated.timing(pandaTY, { toValue: 0, duration: 1100, easing: Easing.linear, useNativeDriver: true }),
              ]),
        ]),
      ]),
    ]).start(() => {
      stopWalking();
      setOverlayIsland(null);
      isAnimating.current = false;
    });
  };

  return (
    <View style={{ flex: 1 }}>
      <WaterBg>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={{ paddingHorizontal: 24, paddingTop: 8 }}>
            <H2 style={{ color: "#fff" }}>My Habit Islands</H2>
          </View>
          <Text
            style={{
              fontFamily: "PixelifySans_400Regular",
              fontSize: 10,
              color: "rgba(255,255,255,0.45)",
              textAlign: "center",
              letterSpacing: 0.6,
              marginTop: 2,
            }}
          >
            drag to explore
          </Text>

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
              const bobAnim = slotBobAnims[slotKey as keyof typeof slotBobAnims];
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
                  <Animated.View style={{ transform: [{ translateY: bobAnim }], alignItems: "center" }}>
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
                  </Animated.View>
                </Pressable>
              );
            })}

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
