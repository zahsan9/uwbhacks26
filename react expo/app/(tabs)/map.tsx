import { Image } from 'expo-image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';
import Blob from '../../src/Blob';

const WALK_GIF = require('../../assets/cute_chubby_fat_blue_panda_round_roly-poly_body_si_sleepy_east.gif');
const HOME_ISLAND_IMG = require('../../assets/home_island.png');
const WALK_ISLAND_IMG   = require('../../assets/walk_island.png');
const SCREEN_ISLAND_IMG = require('../../assets/screen_island.png');
const SLEEP_ISLAND_IMG  = require('../../assets/sleep_island.png');
import { BackButton, Eyebrow, H2, H3, Small, StatePill, UI, WaterBg } from '../../src/Components';
import Island from '../../src/Island';
import { ISLAND_STATES, islandMeta, islandName } from '../../src/models';
import { AvatarState, IslandType } from '../../src/theme';
import { setTabAccentMode } from '../../src/tabAccent';

const { width: W, height: H } = Dimensions.get('window');

const POSITIONS: Record<string, { x: number; y: number; scale: number }> = {
  home:   { x: W * 0.50, y: H * 0.42, scale: 3.6 },
  quest:  { x: W * 0.50, y: H * 0.10, scale: 2.6 },
  walk:   { x: W * 0.78, y: H * 0.24, scale: 3.0 },
  sleep:  { x: W * 0.22, y: H * 0.26, scale: 2.9 },
  screen: { x: W * 0.76, y: H * 0.60, scale: 2.7 },
  learn:  { x: W * 0.24, y: H * 0.62, scale: 2.7 },
};

const SATELLITES: IslandType[] = ['walk', 'sleep', 'screen', 'learn', 'quest'];
const CURVE_OFFSETS: Record<string, number> = { walk: 32, sleep: -28, screen: -34, learn: 26, quest: 30 };
const MAP_ISLAND_IMG: Partial<Record<IslandType, any>> = {
  walk: WALK_ISLAND_IMG,
  sleep: SLEEP_ISLAND_IMG,
  screen: SCREEN_ISLAND_IMG,
};
const MAP_LABEL: Record<IslandType | 'home', string> = {
  home: 'Home',
  walk: 'Steps',
  sleep: 'Sleep',
  screen: 'Screen Time',
  learn: 'Learning',
  quest: 'Quest',
};
const SQUARE = Math.floor((W - 60 - 36) / 10);

// Panda scale=4.5 -> 90x90px; centered on home island, feet sit on island surface
const home = POSITIONS.home;
const PANDA_SCALE = 4.5;
const PANDA_SIZE  = PANDA_SCALE * 20; // 90
const PANDA_HOME_X = home.x;
const PANDA_LEFT  = PANDA_HOME_X - PANDA_SIZE / 2;
const PANDA_TOP   = home.y - home.scale * 11 - (PANDA_SIZE - 62); // feet sit on island surface

type WalkRoute = {
  endX: number;
  endY: number;
  controlX: number;
  controlY: number;
};

function getCurveControl(from: { x: number; y: number }, to: { x: number; y: number }, offset: number) {
  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;

  return {
    x: mx + (-dy / len) * offset,
    y: my + (dx / len) * offset,
  };
}

function getPandaRoute(type: IslandType): WalkRoute {
  const pos = POSITIONS[type];
  const start = { x: PANDA_HOME_X, y: home.y - home.scale * 11 };
  const end = { x: pos.x, y: pos.y - pos.scale * 11 };
  const control = getCurveControl(start, end, CURVE_OFFSETS[type] ?? 28);

  return {
    endX: end.x - start.x,
    endY: end.y - start.y,
    controlX: control.x - start.x,
    controlY: control.y - start.y,
  };
}

function pointOnRoute(route: WalkRoute, t: number) {
  const inv = 1 - t;

  return {
    x: 2 * inv * t * route.controlX + t * t * route.endX,
    y: 2 * inv * t * route.controlY + t * t * route.endY,
  };
}

function MapIslandArt({ type, state, scale }: { type: IslandType; state: AvatarState; scale: number }) {
  const source = MAP_ISLAND_IMG[type];

  if (!source) {
    return <Island type={type} state={state} scale={scale} />;
  }

  return (
    <Image
      source={source}
      style={{ width: 52 * scale, height: 32 * scale }}
      contentFit="contain"
    />
  );
}

function DetailPill({ state }: { state: AvatarState }) {
  const pillColor = state === 'critical'
    ? 'rgba(214,96,96,0.22)'
    : state === 'sick'
      ? 'rgba(255,194,96,0.20)'
      : 'rgba(158,214,223,0.18)';
  const textColor = state === 'critical'
    ? '#f3b2b1'
    : state === 'sick'
      ? '#ffd68f'
      : '#D6EDF2';

  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: UI.radius.pill,
      borderWidth: 1,
      borderColor: 'rgba(158,214,223,0.36)',
      backgroundColor: pillColor,
    }}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: textColor }} />
      <Text style={{ fontFamily: 'PixelifySans_600SemiBold', fontSize: 10, letterSpacing: 1, color: textColor, textTransform: 'uppercase' }}>
        {state}
      </Text>
    </View>
  );
}

// ─── Island detail ───────────────────────────────────────────────────
function IslandDetail({ type, state, onBack }: { type: IslandType; state: AvatarState; onBack: () => void }) {
  const meta = islandMeta[type];
  const name = islandName[type];
  const today = 25;

  const pattern = Array.from({ length: 30 }, (_, i) => {
    if (i > today) return 'future';
    if (i === today) return 'today';
    if (type === 'walk')  return (i % 7 === 3 && i < 15) ? 'missed' : 'hit';
    if (type === 'sleep') return (i < 18 && i % 5 === 2) ? 'partial' : 'hit';
    return (i < 20 && i % 3 !== 0) ? 'missed' : 'hit';
  });

  const dayColor = (p: string) =>
    ({ hit: '#8fd2e0', partial: '#ffc260', missed: '#d76060', today: '#ff8b6a', future: 'rgba(31,58,74,0.1)' }[p] ?? 'transparent');

  const todayLog: Record<AvatarState, string> = {
    thriving: 'Pulled From HealthKit · 82% Of Goal',
    healthy:  'Pulled From HealthKit · 68% Of Goal',
    sick:     'Missed Yesterday — A Short Walk Recovers You',
    critical: '3 Days Missed — Your Island Is Wilting',
  };

  return (
    <WaterBg>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingTop: 8, paddingBottom: 4 }}>
          <Pressable onPress={onBack}>
            <View style={{
              width: 34,
              height: 34,
              borderRadius: UI.radius.control,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(13,58,74,0.92)',
              borderWidth: 1,
              borderColor: UI.border.skyStrong,
            }}>
              <Text style={{ fontSize: 16, color: '#D6EDF2' }}>‹</Text>
            </View>
          </Pressable>
          <View style={{ flex: 1, gap: 1 }}>
            <H3 style={{ flex: 1 }}>{name}</H3>
            <Small style={{ color: 'rgba(255,255,255,0.62)' }}>Island detail</Small>
          </View>
          <DetailPill state={state} />
        </View>

        <View style={{ alignItems: 'center', height: 200, justifyContent: 'center' }}>
          <View style={{ alignItems: 'center' }}>
            <View style={{ marginBottom: MAP_ISLAND_IMG[type] ? -72 : -58, zIndex: 1, transform: [{ translateX: 22 }] }}>
              <Blob state={state} scale={5} />
            </View>
            <MapIslandArt type={type} state={state} scale={4} />
          </View>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 44 }}>
          <View style={{
            backgroundColor: 'rgba(14,58,74,0.70)',
            borderRadius: UI.radius.card,
            borderWidth: 1,
            borderColor: UI.border.sky,
            padding: 14,
          }}>
            <View style={{ alignItems: 'center', gap: 4 }}>
              <Text style={{ fontFamily: 'PixelifySans_700Bold', fontSize: 34, color: UI.text.cream, lineHeight: 38 }}>{meta.stat}</Text>
              <Small style={{ color: 'rgba(255,255,255,0.66)' }}>{meta.unit} · goal {meta.goal}</Small>
            </View>
          </View>

          <View style={{
            backgroundColor: 'rgba(10,40,52,0.78)',
            borderRadius: UI.radius.card,
            borderWidth: 1,
            borderColor: UI.border.sky,
            padding: 14,
          }}>
            <View style={{ gap: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 16 }}>🔥</Text>
                <H3 style={{ flex: 1, color: UI.text.cream }}>{meta.streak} Day Streak</H3>
                <Small style={{ color: 'rgba(255,255,255,0.62)' }}>Last 30 Days</Small>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                {pattern.map((p, i) => (
                  <View key={i} style={{ width: SQUARE, height: SQUARE, backgroundColor: dayColor(p), borderRadius: 2, borderWidth: p === 'today' ? 2 : 0, borderColor: '#8fd2e0' }} />
                ))}
              </View>
              <View style={{ flexDirection: 'row', gap: 14 }}>
                {[['Hit', '#8fd2e0'], ['Partial', '#ffc260'], ['Missed', '#d76060']].map(([label, color]) => (
                  <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <View style={{ width: 10, height: 10, backgroundColor: color as string }} />
                    <Small style={{ color: 'rgba(255,255,255,0.70)' }}>{label}</Small>
                  </View>
                ))}
              </View>
            </View>
          </View>

          <View style={{
            backgroundColor: 'rgba(10,40,52,0.68)',
            borderRadius: UI.radius.card,
            borderWidth: 1,
            borderColor: UI.border.sky,
            padding: 14,
          }}>
            <Eyebrow style={{ marginBottom: 6, color: 'rgba(214,237,241,0.70)' }}>Today's Log</Eyebrow>
            <H3 style={{ color: UI.text.cream }}>{todayLog[state]}</H3>
          </View>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          {[
              { icon: '⭐', val: '+24 XP', label: 'Today' },
              { icon: '🏆', val: 'Lvl 4',  label: 'Next: 120 XP' },
              { icon: '❤️', val: '78/100', label: 'Health' },
            ].map(item => (
              <View key={item.label} style={{
                flex: 1,
                backgroundColor: 'rgba(10,40,52,0.72)',
                borderRadius: UI.radius.card,
                borderWidth: 1,
                borderColor: UI.border.sky,
                paddingVertical: 12,
                paddingHorizontal: 10,
              }}>
                <View style={{ alignItems: 'center', gap: 4, flex: 1 }}>
                  <Text style={{ fontSize: 16 }}>{item.icon}</Text>
                  <H3 style={{ color: UI.text.cream }}>{item.val}</H3>
                  <Small style={{ color: 'rgba(255,255,255,0.64)' }}>{item.label}</Small>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </WaterBg>
  );
}

// ─── Map screen ──────────────────────────────────────────────────────
export default function MapScreen() {
  const [overlayIsland, setOverlayIsland] = useState<IslandType | null>(null);

  useFocusEffect(
    useCallback(() => {
      setTabAccentMode('blue');
    }, [])
  );

  // All native driver — smooth 60fps
  const pandaTX    = useRef(new Animated.Value(0)).current;
  const pandaTY    = useRef(new Animated.Value(0)).current;
  const pandaPathT = useRef(new Animated.Value(0)).current;
  const mapScale   = useRef(new Animated.Value(1)).current;
  const mapTX      = useRef(new Animated.Value(0)).current;
  const mapTY      = useRef(new Animated.Value(0)).current;
  const overlayOpa = useRef(new Animated.Value(0)).current;

  // Instant GIF/idle swap via setValue — no re-render lag
  const walkOpa  = useRef(new Animated.Value(0)).current;
  const idleOpa  = useRef(new Animated.Value(1)).current;
  const walkScaleX = useRef(new Animated.Value(1)).current;

  const homeBobAnim   = useRef(new Animated.Value(0)).current;
  const walkBobAnim   = useRef(new Animated.Value(0)).current;
  const screenBobAnim = useRef(new Animated.Value(0)).current;
  const sleepBobAnim  = useRef(new Animated.Value(0)).current;
  // Measured at runtime so pan targets the actual canvas center, not an estimate
  const canvasCY = useRef(home.y);
  // Track last visited island x so closeIsland knows which way to face when returning
  const lastIslandX = useRef(home.x);
  const lastRoute = useRef<WalkRoute | null>(null);
  const pandaPathListener = useRef<string | null>(null);

  useEffect(() => {
    const bob = (anim: Animated.Value, duration: number) =>
      Animated.loop(Animated.sequence([
        Animated.timing(anim, { toValue: -5, duration, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(anim, { toValue: 0,  duration, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ])).start();
    bob(homeBobAnim,   1500);
    bob(walkBobAnim,   1700);
    bob(screenBobAnim, 1600);
    bob(sleepBobAnim,  1800);
    return () => { homeBobAnim.stopAnimation(); walkBobAnim.stopAnimation(); screenBobAnim.stopAnimation(); sleepBobAnim.stopAnimation(); };
  }, []);

  useEffect(() => {
    return () => {
      if (pandaPathListener.current) {
        pandaPathT.removeListener(pandaPathListener.current);
      }
    };
  }, []);

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
    if (pandaPathListener.current) {
      pandaPathT.removeListener(pandaPathListener.current);
    }

    pandaPathT.stopAnimation();
    pandaPathT.setValue(toValue === 1 ? 0 : 1);
    pandaPathListener.current = pandaPathT.addListener(({ value }) => {
      const point = pointOnRoute(route, value);
      pandaTX.setValue(point.x);
      pandaTY.setValue(point.y);
    });

    return Animated.timing(pandaPathT, {
      toValue,
      duration,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: false,
    });
  };

  const openIsland = (type: IslandType) => {
    const pos = POSITIONS[type];
    setOverlayIsland(type);

    const route = getPandaRoute(type);
    const s = 3.2;
    const panX = s * (W * 0.5 - pos.x);
    const panY = s * (canvasCY.current - pos.y);

    lastIslandX.current = pos.x;
    lastRoute.current = route;
    startWalking(pos.x < home.x); // face left if island is left of home

    // Phase 1: walk to island
    Animated.parallel([
      animatePandaAlongRoute(route, 1, 1200),
      Animated.timing(mapTX,   { toValue: panX * 0.4,  duration: 1200, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(mapTY,   { toValue: panY * 0.4,  duration: 1200, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start(() => {
      stopWalking(); // instant stop the moment panda arrives

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
    startWalking(lastIslandX.current >= home.x); // face left if returning from a right island

    Animated.parallel([
      Animated.timing(overlayOpa, { toValue: 0, duration: 280, useNativeDriver: true }),
      Animated.sequence([
        Animated.delay(150),
        Animated.parallel([
          Animated.timing(mapScale, { toValue: 1, duration: 700,  easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(mapTX,    { toValue: 0, duration: 700,  easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(mapTY,    { toValue: 0, duration: 700,  easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          route
            ? animatePandaAlongRoute(route, 0, 1100)
            : Animated.parallel([
                Animated.timing(pandaTX, { toValue: 0, duration: 1100, easing: Easing.linear, useNativeDriver: true }),
                Animated.timing(pandaTY, { toValue: 0, duration: 1100, easing: Easing.linear, useNativeDriver: true }),
              ]),
        ]),
      ]),
    ]).start(() => {
      stopWalking();
      setOverlayIsland(null);
    });
  };

  return (
    <View style={{ flex: 1 }}>
      <WaterBg>
        <SafeAreaView style={{ flex: 1 }}>
          {/* Header — not zoomed */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 8 }}>
            <View style={{ gap: 2 }}>
              <H2 style={{ color: '#fff' }}>My Habitat</H2>
              <Small style={{ color: 'rgba(255,255,255,0.62)' }}>Tap an island to view details</Small>
            </View>
          </View>

          {/* Canvas — pans and zooms */}
          <Animated.View
            onLayout={e => { canvasCY.current = e.nativeEvent.layout.height / 2; }}
            style={{
              flex: 1, position: 'relative',
              transform: [{ translateX: mapTX }, { translateY: mapTY }, { scale: mapScale }],
            }}
          >
            {/* Connecting lines */}
            <Svg style={{ position: 'absolute', width: '100%', height: '100%' }} width={W} height={H}>
              {SATELLITES.map(key => {
                const dest = POSITIONS[key];
                const x1 = home.x, y1 = home.y, x2 = dest.x, y2 = dest.y;
                const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
                const dx = x2 - x1, dy = y2 - y1;
                const len = Math.sqrt(dx * dx + dy * dy);
                const offset = CURVE_OFFSETS[key] ?? 28;
                const cx = mx + (-dy / len) * offset;
                const cy = my + (dx / len) * offset;
                  return (
                  <Path key={key}
                    d={`M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`}
                    stroke="rgba(255,255,255,0.18)" strokeWidth={1.5}
                    strokeDasharray="5,6"
                    fill="none"
                  />
                );
              })}
            </Svg>

            {/* Satellite islands */}
            {SATELLITES.filter(key => key !== 'walk' && key !== 'screen' && key !== 'sleep').map(key => {
              const pos = POSITIONS[key];
              const locked = key === 'learn' || key === 'quest';
              return (
                <Pressable key={key} onPress={() => !locked && openIsland(key)}
                  style={{ position: 'absolute', left: pos.x - pos.scale * 16, top: pos.y - pos.scale * 11, alignItems: 'center', opacity: locked ? 0.6 : 1 }}>
                  <Island type={key} state={locked ? 'sick' : ISLAND_STATES[key]} scale={pos.scale} locked={locked} />
                  <Text style={{ fontFamily: 'PixelifySans_500Medium', fontSize: 10, color: locked ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.85)', letterSpacing: 0.4, marginTop: 4 }}>{MAP_LABEL[key]}</Text>
                </Pressable>
              );
            })}

            {/* Sleep island — custom PNG, same size as home island */}
            {(() => { const pos = POSITIONS.sleep; return (
              <Pressable onPress={() => openIsland('sleep')}
                style={{ position: 'absolute', left: pos.x - pos.scale * 26, top: pos.y - pos.scale * 20, alignItems: 'center' }}>
                <Animated.View style={{ transform: [{ translateY: sleepBobAnim }], alignItems: 'center' }}>
                  <Image source={SLEEP_ISLAND_IMG} style={{ width: 52 * pos.scale, height: 32 * pos.scale }} contentFit="contain" />
                  <Text style={{ fontFamily: 'PixelifySans_500Medium', fontSize: 10, color: 'rgba(255,255,255,0.86)', letterSpacing: 0.4, marginTop: 4 }}>Sleep</Text>
                </Animated.View>
              </Pressable>
            ); })()}

            {/* Screen island — custom PNG, same size as home island */}
            {(() => { const pos = POSITIONS.screen; return (
              <Pressable onPress={() => openIsland('screen')}
                style={{ position: 'absolute', left: pos.x - pos.scale * 26, top: pos.y - pos.scale * 20, alignItems: 'center' }}>
                <Animated.View style={{ transform: [{ translateY: screenBobAnim }], alignItems: 'center' }}>
                  <Image source={SCREEN_ISLAND_IMG} style={{ width: 52 * pos.scale, height: 32 * pos.scale }} contentFit="contain" />
                  <Text style={{ fontFamily: 'PixelifySans_500Medium', fontSize: 10, color: 'rgba(255,255,255,0.86)', letterSpacing: 0.4, marginTop: 4 }}>Screen Time</Text>
                </Animated.View>
              </Pressable>
            ); })()}

            {/* Walk island — custom PNG, same size as home island */}
            {(() => { const pos = POSITIONS.walk; return (
              <Pressable onPress={() => openIsland('walk')}
                style={{ position: 'absolute', left: pos.x - pos.scale * 26, top: pos.y - pos.scale * 20, alignItems: 'center' }}>
                <Animated.View style={{ transform: [{ translateY: walkBobAnim }], alignItems: 'center' }}>
                  <Image source={WALK_ISLAND_IMG} style={{ width: 52 * pos.scale, height: 32 * pos.scale }} contentFit="contain" />
                  <Text style={{ fontFamily: 'PixelifySans_500Medium', fontSize: 10, color: 'rgba(255,255,255,0.86)', letterSpacing: 0.4, marginTop: 4 }}>Steps</Text>
                </Animated.View>
              </Pressable>
            ); })()}

            {/* Home island (no panda — panda is rendered separately) */}
            <Animated.View style={{ position: 'absolute', left: home.x - home.scale * 32, top: home.y - home.scale * 20, alignItems: 'center', transform: [{ translateY: homeBobAnim }] }}>
              <Image source={HOME_ISLAND_IMG} style={{ width: 64 * home.scale, height: 40 * home.scale }} contentFit="contain" />
              <Text style={{ fontFamily: 'PixelifySans_500Medium', fontSize: 10, color: 'rgba(255,255,255,0.86)', letterSpacing: 0.4, marginTop: -10 }}>Home</Text>
            </Animated.View>

            {/* Panda — Animated opacity toggled via setValue (instant, no render cycle) */}
            <Animated.View style={{
              position: 'absolute',
              left: PANDA_LEFT,
              top: PANDA_TOP,
              zIndex: 10,
              width: PANDA_SIZE,
              height: PANDA_SIZE,
              transform: [{ translateX: pandaTX }, { translateY: pandaTY }],
            }}>
              <Animated.View style={{ position: 'absolute', width: PANDA_SIZE, height: PANDA_SIZE, opacity: walkOpa, transform: [{ scaleX: walkScaleX }] }}>
                <Image source={WALK_GIF} style={{ width: PANDA_SIZE, height: PANDA_SIZE }} contentFit="contain" />
              </Animated.View>
              <Animated.View style={{ position: 'absolute', width: PANDA_SIZE, height: PANDA_SIZE, opacity: idleOpa }}>
                <Blob state="healthy" scale={PANDA_SCALE} />
              </Animated.View>
            </Animated.View>
          </Animated.View>

        </SafeAreaView>
      </WaterBg>

      {/* Full-screen island detail — sibling to WaterBg, covers everything */}
      {overlayIsland && (
        <Animated.View style={{
          position: 'absolute', top: 0, left: 0, width: W, height: H,
          opacity: overlayOpa, zIndex: 100,
        }}>
          <IslandDetail
            type={overlayIsland}
            state={ISLAND_STATES[overlayIsland]}
            onBack={closeIsland}
          />
        </Animated.View>
      )}
    </View>
  );
}
