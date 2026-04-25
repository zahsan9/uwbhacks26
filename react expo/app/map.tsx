import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import Blob from '../src/Blob';

const WALK_GIF = require('../assets/cute_chubby_fat_blue_panda_round_roly-poly_body_si_sleepy_east.gif');
const HOME_ISLAND_IMG = require('../assets/home_island.png');
const WALK_ISLAND_IMG   = require('../assets/walk_island.png');
const SCREEN_ISLAND_IMG = require('../assets/screen_island.png');
const SLEEP_ISLAND_IMG  = require('../assets/sleep_island.png');
import { BackButton, Eyebrow, H2, H3, Small, StatePill, VQCard, WaterBg, WorldBg } from '../src/Components';
import Island from '../src/Island';
import { ISLAND_STATES, islandMeta, islandName } from '../src/models';
import { AvatarState, IslandType, VQ } from '../src/theme';

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
const SQUARE = Math.floor((W - 60 - 36) / 10);

// Panda scale=4.5 → 90×90px; left of island center, feet 52px into island top
const home = POSITIONS.home;
const PANDA_SCALE = 4.5;
const PANDA_SIZE  = PANDA_SCALE * 20; // 90
const PANDA_LEFT  = home.x - (PANDA_SIZE / 2 + 28);       // center = home.x - 28
const PANDA_TOP   = home.y - home.scale * 11 - (PANDA_SIZE - 62); // feet sit on island surface

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
    ({ hit: '#6ed4a3', partial: '#ffc260', missed: '#d76060', today: '#ff8b6a', future: 'rgba(31,58,74,0.1)' }[p] ?? 'transparent');

  const todayLog: Record<AvatarState, string> = {
    thriving: '✓ pulled from HealthKit · 82% of goal',
    healthy:  'pulled from HealthKit · 68% of goal',
    sick:     'missed yesterday — a short walk recovers you',
    critical: '3 days missed — your island is wilting',
  };

  return (
    <WorldBg>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingTop: 8, paddingBottom: 4 }}>
          <BackButton onPress={onBack} />
          <H3 style={{ flex: 1 }}>{name}</H3>
          <StatePill state={state} />
        </View>

        <View style={{ alignItems: 'center', height: 200, justifyContent: 'center' }}>
          <View style={{ alignItems: 'center' }}>
            <View style={{ marginBottom: -58, zIndex: 1, transform: [{ translateX: 22 }] }}>
              <Blob state={state} scale={5} />
            </View>
            <Island type={type} state={state} scale={4} />
          </View>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 44 }}>
          <VQCard warm>
            <View style={{ alignItems: 'center', gap: 4 }}>
              <Text style={{ fontFamily: 'PixelifySans_700Bold', fontSize: 34, color: VQ.ink, lineHeight: 38 }}>{meta.stat}</Text>
              <Small>{meta.unit} · goal {meta.goal}</Small>
            </View>
          </VQCard>

          <VQCard>
            <View style={{ gap: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 16 }}>🔥</Text>
                <H3 style={{ flex: 1 }}>{meta.streak} day streak</H3>
                <Small>last 30 days</Small>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                {pattern.map((p, i) => (
                  <View key={i} style={{ width: SQUARE, height: SQUARE, backgroundColor: dayColor(p), borderRadius: 2, borderWidth: p === 'today' ? 2 : 0, borderColor: '#ff8b6a' }} />
                ))}
              </View>
              <View style={{ flexDirection: 'row', gap: 14 }}>
                {[['hit', '#6ed4a3'], ['partial', '#ffc260'], ['missed', '#d76060']].map(([label, color]) => (
                  <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <View style={{ width: 10, height: 10, backgroundColor: color as string }} />
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

          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[
              { icon: '⭐', val: '+24 xp', label: 'today' },
              { icon: '🏆', val: 'Lvl 4',  label: 'next: 120 xp' },
              { icon: '❤️', val: '78/100', label: 'health' },
            ].map(item => (
              <VQCard key={item.label}>
                <View style={{ alignItems: 'center', gap: 4, flex: 1 }}>
                  <Text style={{ fontSize: 16 }}>{item.icon}</Text>
                  <H3>{item.val}</H3>
                  <Small>{item.label}</Small>
                </View>
              </VQCard>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </WorldBg>
  );
}

// ─── Map screen ──────────────────────────────────────────────────────
export default function MapScreen() {
  const router = useRouter();
  const [overlayIsland, setOverlayIsland] = useState<IslandType | null>(null);

  // All native driver — smooth 60fps
  const pandaTX    = useRef(new Animated.Value(0)).current;
  const pandaTY    = useRef(new Animated.Value(0)).current;
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

  const startWalking = (flipped: boolean) => {
    walkScaleX.setValue(flipped ? -1 : 1);
    walkOpa.setValue(1);
    idleOpa.setValue(0);
  };
  const stopWalking = () => {
    walkOpa.setValue(0);
    idleOpa.setValue(1);
  };

  // Measured at runtime so pan targets the actual canvas center, not an estimate
  const canvasCY = useRef(home.y);
  // Track last visited island x so closeIsland knows which way to face when returning
  const lastIslandX = useRef(home.x);

  const openIsland = (type: IslandType) => {
    const pos = POSITIONS[type];
    setOverlayIsland(type);

    const dx = pos.x - home.x + 28;
    const dy = (pos.y - pos.scale * 11) - (home.y - home.scale * 11);
    const s = 3.2;
    const panX = s * (W * 0.5 - pos.x);
    const panY = s * (canvasCY.current - pos.y);

    lastIslandX.current = pos.x;
    startWalking(pos.x < home.x); // face left if island is left of home

    // Phase 1: walk to island
    Animated.parallel([
      Animated.timing(pandaTX, { toValue: dx,          duration: 1200, easing: Easing.linear,          useNativeDriver: true }),
      Animated.timing(pandaTY, { toValue: dy,          duration: 1200, easing: Easing.linear,          useNativeDriver: true }),
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
    startWalking(lastIslandX.current >= home.x); // face left if returning from a right island

    Animated.parallel([
      Animated.timing(overlayOpa, { toValue: 0, duration: 280, useNativeDriver: true }),
      Animated.sequence([
        Animated.delay(150),
        Animated.parallel([
          Animated.timing(mapScale, { toValue: 1, duration: 700,  easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(mapTX,    { toValue: 0, duration: 700,  easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(mapTY,    { toValue: 0, duration: 700,  easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(pandaTX,  { toValue: 0, duration: 1100, easing: Easing.linear,            useNativeDriver: true }),
          Animated.timing(pandaTY,  { toValue: 0, duration: 1100, easing: Easing.linear,            useNativeDriver: true }),
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
            <View style={{ gap: 4 }}>

              <H2 style={{ color: '#fff' }}>My Habit Islands</H2>
            </View>
            <Pressable onPress={() => router.back()}>
              <View style={{ width: 36, height: 36, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 4, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#fff', fontSize: 14 }}>‹</Text>
              </View>
            </Pressable>
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
                const CURVE_OFFSETS: Record<string, number> = { walk: 32, sleep: -28, screen: -34, learn: 26, quest: 30 };
                const offset = CURVE_OFFSETS[key] ?? 28;
                const cx = mx + (-dy / len) * offset;
                const cy = my + (dx / len) * offset;
                return (
                  <Path key={key}
                    d={`M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`}
                    stroke="rgba(255,255,255,0.22)" strokeWidth={1.5}
                    strokeDasharray="6,5"
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
                  <Text style={{ fontFamily: 'PixelifySans_500Medium', fontSize: 10, color: locked ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.85)', letterSpacing: 0.4, marginTop: 4 }}>{key}</Text>
                </Pressable>
              );
            })}

            {/* Sleep island — custom PNG, same size as home island */}
            {(() => { const pos = POSITIONS.sleep; return (
              <Pressable onPress={() => openIsland('sleep')}
                style={{ position: 'absolute', left: pos.x - pos.scale * 26, top: pos.y - pos.scale * 20, alignItems: 'center' }}>
                <Animated.View style={{ transform: [{ translateY: sleepBobAnim }], alignItems: 'center' }}>
                  <Image source={SLEEP_ISLAND_IMG} style={{ width: 52 * pos.scale, height: 32 * pos.scale }} contentFit="contain" />
                  <Text style={{ fontFamily: 'PixelifySans_500Medium', fontSize: 10, color: 'rgba(255,255,255,0.85)', letterSpacing: 0.4, marginTop: 4 }}>sleep</Text>
                </Animated.View>
              </Pressable>
            ); })()}

            {/* Screen island — custom PNG, same size as home island */}
            {(() => { const pos = POSITIONS.screen; return (
              <Pressable onPress={() => openIsland('screen')}
                style={{ position: 'absolute', left: pos.x - pos.scale * 26, top: pos.y - pos.scale * 20, alignItems: 'center' }}>
                <Animated.View style={{ transform: [{ translateY: screenBobAnim }], alignItems: 'center' }}>
                  <Image source={SCREEN_ISLAND_IMG} style={{ width: 52 * pos.scale, height: 32 * pos.scale }} contentFit="contain" />
                  <Text style={{ fontFamily: 'PixelifySans_500Medium', fontSize: 10, color: 'rgba(255,255,255,0.85)', letterSpacing: 0.4, marginTop: 4 }}>screen time</Text>
                </Animated.View>
              </Pressable>
            ); })()}

            {/* Walk island — custom PNG, same size as home island */}
            {(() => { const pos = POSITIONS.walk; return (
              <Pressable onPress={() => openIsland('walk')}
                style={{ position: 'absolute', left: pos.x - pos.scale * 26, top: pos.y - pos.scale * 20, alignItems: 'center' }}>
                <Animated.View style={{ transform: [{ translateY: walkBobAnim }], alignItems: 'center' }}>
                  <Image source={WALK_ISLAND_IMG} style={{ width: 52 * pos.scale, height: 32 * pos.scale }} contentFit="contain" />
                  <Text style={{ fontFamily: 'PixelifySans_500Medium', fontSize: 10, color: 'rgba(255,255,255,0.85)', letterSpacing: 0.4, marginTop: 4 }}>walk</Text>
                </Animated.View>
              </Pressable>
            ); })()}

            {/* Home island (no panda — panda is rendered separately) */}
            <Animated.View style={{ position: 'absolute', left: home.x - home.scale * 32, top: home.y - home.scale * 20, alignItems: 'center', transform: [{ translateY: homeBobAnim }] }}>
              <Image source={HOME_ISLAND_IMG} style={{ width: 64 * home.scale, height: 40 * home.scale }} contentFit="contain" />
              <Text style={{ fontFamily: 'PixelifySans_500Medium', fontSize: 10, color: 'rgba(255,255,255,0.85)', letterSpacing: 0.4, marginTop: -10 }}>home</Text>
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
