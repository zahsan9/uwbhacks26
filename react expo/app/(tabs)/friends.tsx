import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Pressable, ScrollView, Text, TextInput, View, Dimensions, Easing, PanResponder } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';
import { supabase } from '../../lib/supabase';
import { getAvatarState, getCompositeScore, getHabitScore, getHabitStreak, getLevel, getOverallStreak } from '../../lib/scoreEngine';
import Blob from '../../src/Blob';
import { BackButton, Eyebrow, H1, H3, SectionDivider, Small, SpeechBubble, StatePill, UI, VQButton, WaterBg, WorldBg } from '../../src/Components';
import Island from '../../src/Island';
import { AvatarState, IslandType, stateColor } from '../../src/theme';
import { setTabAccentMode } from '../../src/tabAccent';

const PANDA_GIF: Record<string, any> = {
  thriving: require('../../assets/cute_chubby_fat_blue_panda_round_roly-poly_body_si_happy_south.gif'),
  healthy:  require('../../assets/cute_chubby_fat_blue_panda_round_roly-poly_body_si_standing_south.gif'),
  sick:     require('../../assets/cute_chubby_fat_blue_panda_round_roly-poly_body_si_sleepy_south.gif'),
  critical: require('../../assets/cute_chubby_fat_blue_panda_round_roly-poly_body_si_crying_south.gif'),
};

const MAP_ISLAND_IMG: Partial<Record<string, any>> = {
  walk: require('../../assets/walk_island.png'),
  sleep: require('../../assets/sleep_island.png'),
  screen: require('../../assets/screen_island.png'),
  meditation: require('../../assets/FINAL_HOTSPRING_MEDITATION-removebg-preview.png'),
  gym: require('../../assets/workout_island-removebg-preview.png'),
};
const HOME_ISLAND_IMG = require('../../assets/home_island.png');
const WALK_GIF = require('../../assets/cute_chubby_fat_blue_panda_round_roly-poly_body_si_sleepy_east.gif');
const { width: W } = Dimensions.get('window');
const { height: H } = Dimensions.get('window');
const VISIT_SQUARE = Math.floor((W - 60 - 36) / 10);
const FRIEND_POSITIONS: Record<string, { x: number; y: number; scale: number }> = {
  home: { x: W * 0.5, y: H * 0.27, scale: 3.25 },
  slot0: { x: W * 0.82, y: H * 0.11, scale: 2.6 },
  slot1: { x: W * 0.18, y: H * 0.11, scale: 2.6 },
  slot2: { x: W * 0.84, y: H * 0.47, scale: 2.5 },
  slot3: { x: W * 0.18, y: H * 0.45, scale: 2.45 },
  slot4: { x: W * 0.5, y: H * 0.01, scale: 2.25 },
};
const FRIEND_DRAG_BOUNDS = {
  minX: -W * 0.28,
  maxX: W * 0.28,
  minY: -H * 0.05,
  maxY: H * 0.14,
};
const FRIEND_CURVE_OFFSETS: Record<string, number> = {
  slot0: 34,
  slot1: -30,
  slot2: -36,
  slot3: 28,
  slot4: 16,
};
const FRIEND_HABIT_SLOT_KEYS = ['slot0', 'slot1', 'slot2', 'slot3', 'slot4'] as const;
const FRIEND_PANDA_SCALE = 4.2;
const FRIEND_PANDA_SIZE = FRIEND_PANDA_SCALE * 20;
const FRIEND_PANDA_LEFT = FRIEND_POSITIONS.home.x - (FRIEND_PANDA_SIZE / 2 + 26);
const FRIEND_PANDA_TOP = FRIEND_POSITIONS.home.y - FRIEND_POSITIONS.home.scale * 11 - (FRIEND_PANDA_SIZE - 60);
const FRIEND_PANDA_HOME_X = FRIEND_PANDA_LEFT + FRIEND_PANDA_SIZE / 2;

const STATE_LABEL: Record<AvatarState, string> = {
  thriving: 'On A Roll',
  healthy:  'Doing Well',
  sick:     'Falling Behind',
  critical: 'Struggling',
};

type FriendshipStatus = 'accepted' | 'pending' | 'declined';

type FriendshipRow = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: FriendshipStatus;
  created_at: string;
};

type UserRow = {
  id: string;
  username: string;
  email?: string | null;
  total_xp: number | null;
};

type FriendSummary = {
  id: string;
  name: string;
  email: string;
  level: number;
  state: AvatarState;
  streak: number;
  totalXp: number;
};

type SearchUser = FriendSummary & {
  relation: 'none' | 'accepted' | 'incoming' | 'outgoing';
};

type VisitHabit = {
  id: string;
  key: string;
  label: string;
  state: AvatarState;
  locked: boolean;
  detail?: VisitHabitDetail;
};

type VisitPayload = {
  friend: FriendSummary;
  habits: VisitHabit[];
};

type VisitDayCell = {
  status: 'hit' | 'missed';
  isToday: boolean;
};

type VisitHabitDetail = {
  stat: string;
  unit: string;
  goal: string;
  streak: number;
  pattern: VisitDayCell[];
  todayLog: string;
  todayXp: number;
  score: number;
  weekCount: number;
};

function habitKeyToIslandType(key: string): IslandType {
  if (key === 'walk' || key === 'sleep' || key === 'screen') {
    return key as IslandType;
  }
  const map: Record<string, IslandType> = {
    gym: 'walk',
    running: 'walk',
    reading: 'learn',
    cooking: 'sleep',
    meditation: 'quest',
  };
  return map[key] ?? 'walk';
}

function MapIslandArt({ type, habitKey, state, scale, locked }: { type: IslandType; habitKey?: string; state: AvatarState; scale: number; locked?: boolean }) {
  const source = habitKey ? MAP_ISLAND_IMG[habitKey] : undefined;
  if (!source) return <Island type={type} state={state} scale={scale} locked={locked} />;
  return (
    <View style={{ opacity: locked ? 0.62 : 1 }}>
      <Image source={source} style={{ width: 52 * scale, height: 32 * scale }} contentFit="contain" />
    </View>
  );
}

function HomeIslandArt({ scale }: { scale: number }) {
  return <Image source={HOME_ISLAND_IMG} style={{ width: 64 * scale, height: 40 * scale }} contentFit="contain" />;
}

type WalkRoute = { endX: number; endY: number; controlX: number; controlY: number };

function getCurveControl(from: { x: number; y: number }, to: { x: number; y: number }, offset: number) {
  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  return { x: mx + (-dy / len) * offset, y: my + (dx / len) * offset };
}

function getFriendPandaRoute(slotKey: string): WalkRoute {
  const pos = FRIEND_POSITIONS[slotKey];
  const home = FRIEND_POSITIONS.home;
  const start = { x: FRIEND_PANDA_HOME_X, y: home.y - home.scale * 11 };
  const end = { x: pos.x, y: pos.y - pos.scale * 11 };
  const ctrl = getCurveControl(start, end, FRIEND_CURVE_OFFSETS[slotKey] ?? 28);
  return {
    endX: end.x - start.x,
    endY: end.y - start.y,
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

function localDayKey(input: string | Date): string {
  const date = typeof input === 'string' ? new Date(input) : input;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dayKeysEndingToday(numDays: number): string[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: numDays }, (_, index) => {
    const day = new Date(today);
    day.setDate(today.getDate() - index);
    return localDayKey(day);
  });
}

function buildVisitPattern(logDayKeys: Set<string>): VisitDayCell[] {
  const last30 = dayKeysEndingToday(30).reverse();
  const todayKey = localDayKey(new Date());
  return last30.map((dayKey) => ({
    status: logDayKeys.has(dayKey) ? 'hit' : 'missed',
    isToday: dayKey === todayKey,
  }));
}

function daysAgoFromKey(dayKey: string): number {
  const target = new Date(`${dayKey}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.max(
    0,
    Math.round((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24))
  );
}

function buildVisitMainStat(habitKey: string, weekCount: number): Pick<VisitHabitDetail, 'stat' | 'unit' | 'goal'> {
  if (habitKey === 'walk') return { stat: `${weekCount}/7`, unit: 'walk days this week', goal: '7 days' };
  if (habitKey === 'sleep') return { stat: `${weekCount}/7`, unit: 'sleep days this week', goal: '7 days' };
  if (habitKey === 'screen') return { stat: `${weekCount}/7`, unit: 'screen wins this week', goal: '7 days' };
  return { stat: String(weekCount), unit: 'logs this week', goal: '7 / week' };
}

async function buildVisitHabitDetail(habitRowId: string, habitKey: string): Promise<VisitHabitDetail> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setHours(0, 0, 0, 0);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);

  const { data: logs, error } = await supabase
    .from('habit_logs')
    .select('completed_at, verified_by, xp_awarded')
    .eq('habit_id', habitRowId)
    .gte('completed_at', thirtyDaysAgo.toISOString())
    .order('completed_at', { ascending: false });

  if (error) {
    console.warn('[friends] failed to fetch visit habit logs:', error.message);
  }

  const recentLogs = logs ?? [];
  const logDayKeys = new Set(
    recentLogs.map((log: { completed_at: string }) => localDayKey(log.completed_at))
  );
  const last7Keys = new Set(dayKeysEndingToday(7));
  const weekCount = Array.from(logDayKeys).filter((dayKey) => last7Keys.has(dayKey)).length;
  const todayKey = localDayKey(new Date());
  const todayLogs = recentLogs.filter(
    (log: { completed_at: string }) => localDayKey(log.completed_at) === todayKey
  );
  const todayXp = todayLogs.reduce(
    (sum: number, log: { xp_awarded: number | null }) => sum + (log.xp_awarded ?? 0),
    0
  );
  const latestLog = recentLogs[0];
  const latestKey = latestLog ? localDayKey(latestLog.completed_at) : null;
  const todayLog = todayLogs.length > 0
    ? `Completed today via ${todayLogs[0].verified_by}.`
    : latestKey
      ? `Last completed ${daysAgoFromKey(latestKey)} day${daysAgoFromKey(latestKey) === 1 ? '' : 's'} ago.`
      : 'No check-ins yet for this island.';

  const [score, streak] = await Promise.all([
    getHabitScore(habitRowId),
    getHabitStreak(habitRowId),
  ]);

  return {
    ...buildVisitMainStat(habitKey, weekCount),
    streak,
    pattern: buildVisitPattern(logDayKeys),
    todayLog,
    todayXp,
    score,
    weekCount,
  };
}

function FriendIslandDetail({
  habit,
  onBack,
}: {
  habit: VisitHabit;
  onBack: () => void;
}) {
  const islandType = habitKeyToIslandType(habit.key);

  return (
    <WaterBg>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header — locked */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingTop: 8, paddingBottom: 20 }}>
          <BackButton onPress={onBack} />
          <View style={{ flex: 1 }}>
            <H3>{habit.label}</H3>
            <Small>Friend island detail</Small>
          </View>
          <StatePill state={habit.state} />
        </View>

        {/* Island hero + cards — all scroll together */}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 60 }}>
          <View style={{ alignItems: 'center', marginBottom: 36 }}>
            <View style={{ position: 'relative', alignItems: 'center' }}>
              <MapIslandArt type={islandType} habitKey={habit.key} state={habit.state} scale={4} locked={habit.locked} />
              <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, alignItems: 'center', zIndex: 2 }}>
                <Blob state={habit.state} scale={5} />
              </View>
            </View>
          </View>
          <View style={{ backgroundColor: 'rgba(0,30,45,0.65)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', padding: 20, alignItems: 'center', gap: 6 }}>
            <Text style={{ fontFamily: 'PixelifySans_700Bold', fontSize: 38, color: '#E8E0D4', lineHeight: 42 }}>
              {habit.detail?.stat ?? '—'}
            </Text>
            <Text style={{ fontFamily: 'PixelifySans_400Regular', fontSize: 12, color: 'rgba(232,224,212,0.6)' }}>
              {habit.detail ? `${habit.detail.unit} · goal ${habit.detail.goal}` : 'Loading…'}
            </Text>
          </View>

          <View style={{ backgroundColor: 'rgba(0,30,45,0.65)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', padding: 16, gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 18, marginRight: 8 }}>🔥</Text>
              <Text style={{ fontFamily: 'PixelifySans_700Bold', fontSize: 16, color: '#E8E0D4', flex: 1 }}>
                {habit.detail?.streak ?? 0} Day Streak
              </Text>
              <Text style={{ fontFamily: 'PixelifySans_400Regular', fontSize: 11, color: 'rgba(232,224,212,0.5)' }}>
                Last 30 Days
              </Text>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
              {(habit.detail?.pattern ?? []).map((cell, i) => (
                <View
                  key={i}
                  style={{
                    width: VISIT_SQUARE,
                    height: VISIT_SQUARE,
                    backgroundColor: cell.status === 'hit' ? '#78c8d8' : '#d06868',
                    borderRadius: 6,
                    borderWidth: cell.isToday ? 2 : 0,
                    borderColor: '#f07848',
                  }}
                />
              ))}
            </View>
          </View>

          <View style={{ backgroundColor: 'rgba(0,30,45,0.65)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', padding: 16, gap: 8 }}>
            <Text style={{ fontFamily: 'PixelifySans_600SemiBold', fontSize: 9, color: 'rgba(232,224,212,0.5)', textTransform: 'uppercase', letterSpacing: 2 }}>TODAY&apos;S LOG</Text>
            <Text style={{ fontFamily: 'PixelifySans_500Medium', fontSize: 14, color: '#E8E0D4', lineHeight: 20 }}>
              {habit.detail?.todayLog ?? 'Loading…'}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[
              { icon: '⭐', val: `+${habit.detail?.todayXp ?? 0} xp`, label: 'Today' },
              { icon: '🏆', val: `${habit.detail?.weekCount ?? 0}/7`, label: 'This week' },
              { icon: '❤️', val: `${habit.detail?.score ?? 0}/100`, label: 'Health' },
            ].map((item) => (
              <View key={item.label} style={{ flex: 1, backgroundColor: 'rgba(0,30,45,0.65)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', padding: 14, alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 22 }}>{item.icon}</Text>
                <Text style={{ fontFamily: 'PixelifySans_700Bold', fontSize: 16, color: '#E8E0D4', lineHeight: 18 }}>{item.val}</Text>
                <Text style={{ fontFamily: 'PixelifySans_400Regular', fontSize: 10, color: 'rgba(232,224,212,0.5)' }}>{item.label}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </WaterBg>
  );
}

function StreakBadge({ value }: { value: number }) {
  if (value === 0) {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: UI.surface.creamSoft, paddingHorizontal: 7, paddingVertical: 3, borderRadius: UI.radius.pill }}>
        <Ionicons name="moon-outline" size={11} color="rgba(232,224,212,0.45)" />
        <Text style={{ fontFamily: 'PixelifySans_600SemiBold', fontSize: 11, color: UI.text.soft }}>No Streak</Text>
      </View>
    );
  }
  const hot = value >= 20;
  const warm = value >= 7;
  const bg = hot ? 'rgba(200,134,10,0.22)' : warm ? 'rgba(224,122,32,0.18)' : UI.surface.creamSoft;
  const color = hot ? '#c8860a' : warm ? '#e07a20' : 'rgba(232,224,212,0.55)';
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: bg, paddingHorizontal: 7, paddingVertical: 3, borderRadius: UI.radius.pill }}>
      <Ionicons name="flame" size={11} color={color} />
      <Text style={{ fontFamily: 'PixelifySans_700Bold', fontSize: 11, color }}>{value} Day{value !== 1 ? 's' : ''}</Text>
    </View>
  );
}

function SupportButton({ nudged, onPress }: { nudged: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={nudged ? undefined : onPress} hitSlop={8}>
      <View style={{
        width: 38, height: 38, borderRadius: UI.radius.control, alignItems: 'center', justifyContent: 'center',
        backgroundColor: nudged ? 'rgba(110,212,163,0.14)' : 'rgba(235,130,120,0.12)',
        borderWidth: 1,
        borderColor: nudged ? UI.border.goodStrong : UI.border.careStrong,
      }}>
        <Ionicons name={nudged ? 'checkmark' : 'megaphone-outline'} size={16} color={nudged ? 'rgba(110,212,163,0.94)' : 'rgba(235,130,120,0.92)'} />
      </View>
    </Pressable>
  );
}

function FriendCard({ friend, nudged, onNudge, onVisit }: { friend: FriendSummary; nudged: boolean; onNudge: () => void; onVisit: () => void }) {
  const needs = friend.state === 'sick' || friend.state === 'critical';
  return (
    <Pressable onPress={onVisit}>
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 13,
        backgroundColor: needs ? 'rgba(44,24,18,0.62)' : UI.surface.base,
        borderRadius: UI.radius.card, borderWidth: 1,
        borderColor: needs ? UI.border.care : UI.border.sky,
        padding: 12, marginBottom: 10,
        position: 'relative', overflow: 'hidden',
      }}>
        <View style={{ position: 'absolute', left: 0, top: 10, bottom: 10, width: 3, borderTopRightRadius: 2, borderBottomRightRadius: 2, backgroundColor: needs ? UI.border.careStrong : 'rgba(142,178,170,0.58)' }} />
        <View style={{ width: 58, height: 58, borderRadius: UI.radius.card, alignItems: 'center', justifyContent: 'center', backgroundColor: UI.surface.raised, overflow: 'hidden', borderWidth: 1, borderColor: needs ? UI.border.care : UI.border.sky }}>
          <Image source={PANDA_GIF[friend.state]} style={{ width: 104, height: 104, marginTop: 42 }} contentFit="contain" />
        </View>
        <View style={{ flex: 1, gap: 7 }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 7 }}>
            <Text style={{ fontFamily: 'PixelifySans_700Bold', fontSize: 16, color: '#E8E0D4', lineHeight: 19 }}>{friend.name}</Text>
            <Text style={{ fontFamily: 'VT323_400Regular', fontSize: 18, color: UI.text.muted, lineHeight: 18 }}>Lv {friend.level}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
            <StreakBadge value={friend.streak} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: stateColor[friend.state] }} />
              <Text style={{ fontFamily: 'PixelifySans_400Regular', fontSize: 11, color: needs ? 'rgba(235,130,120,0.9)' : UI.text.muted }}>
                {STATE_LABEL[friend.state]}
              </Text>
            </View>
          </View>
        </View>
        {needs ? (
          <SupportButton nudged={nudged} onPress={onNudge} />
        ) : (
          <View style={{ width: 38, height: 38, borderRadius: UI.radius.control, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: UI.border.sky, backgroundColor: 'rgba(158,214,223,0.06)' }}>
            <Ionicons name="map-outline" size={15} color="rgba(158,214,223,0.78)" />
          </View>
        )}
      </View>
    </Pressable>
  );
}

function FriendVisit({
  payload,
  loading,
  onBack,
  onNudge,
  nudged,
}: {
  payload: VisitPayload | null;
  loading: boolean;
  onBack: () => void;
  onNudge: () => void;
  nudged: boolean;
}) {
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [overlayIsland, setOverlayIsland] = useState<string | null>(null);
  const pandaTX = useRef(new Animated.Value(0)).current;
  const pandaTY = useRef(new Animated.Value(0)).current;
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
  const canvasCY = useRef(FRIEND_POSITIONS.home.y);
  const lastIslandX = useRef(FRIEND_POSITIONS.home.x);
  const dragStart = useRef({ x: 0, y: 0 });
  const isAnimating = useRef(false);
  const friend = payload?.friend ?? null;
  const habits = payload?.habits ?? [];
  const selectedHabit = selectedHabitId ? habits.find((habit) => habit.id === selectedHabitId) ?? null : null;
  const quote: Record<AvatarState, string> = {
    critical: '"I haven\'t done my habits in days..."',
    sick:     '"This week has been rough."',
    healthy:  '"Doing okay. Want to compare islands?"',
    thriving: '"Everything feels great right now."',
  };
  useEffect(() => {
    const bob = (anim: Animated.Value, duration: number) =>
      Animated.loop(Animated.sequence([
        Animated.timing(anim, { toValue: -5, duration, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(anim, { toValue: 0, duration, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ])).start();
    bob(homeBobAnim, 1500);
    bob(slotBobAnims.slot0, 1700);
    bob(slotBobAnims.slot1, 1800);
    bob(slotBobAnims.slot2, 1600);
    bob(slotBobAnims.slot3, 1900);
    bob(slotBobAnims.slot4, 1750);
    return () => {
      homeBobAnim.stopAnimation();
      Object.values(slotBobAnims).forEach((anim) => anim.stopAnimation());
      if (pandaPathListener.current) pandaPathT.removeListener(pandaPathListener.current);
    };
  }, [homeBobAnim, pandaPathT, slotBobAnims]);

  const startWalking = (flipped: boolean) => {
    walkScaleX.setValue(flipped ? -1 : 1);
    walkOpa.setValue(1);
    idleOpa.setValue(0);
  };

  const stopWalking = () => {
    walkOpa.setValue(0);
    idleOpa.setValue(1);
  };

  const animatePandaAlongRoute = useCallback((route: WalkRoute, toValue: 0 | 1, duration: number) => {
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
  }, [pandaPathT, pandaTX, pandaTY]);

  const openIsland = useCallback((slotKey: string, habitId: string) => {
    const pos = FRIEND_POSITIONS[slotKey];
    if (!pos) return;
    dragX.setValue(0);
    dragY.setValue(0);
    dragStart.current = { x: 0, y: 0 };
    isAnimating.current = true;
    setOverlayIsland(slotKey);
    setSelectedHabitId(habitId);

    const route = getFriendPandaRoute(slotKey);
    const home = FRIEND_POSITIONS.home;
    const scale = 3.2;
    const panX = scale * (W * 0.5 - pos.x);
    const panY = scale * (canvasCY.current - pos.y);
    lastIslandX.current = pos.x;
    lastRoute.current = route;
    startWalking(pos.x < home.x);

    Animated.parallel([
      animatePandaAlongRoute(route, 1, 1900),
      Animated.timing(mapTX, { toValue: panX * 0.4, duration: 1900, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(mapTY, { toValue: panY * 0.4, duration: 1900, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start(() => {
      stopWalking();
      Animated.parallel([
        Animated.timing(mapScale, { toValue: scale, duration: 1100, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        Animated.timing(mapTX, { toValue: panX, duration: 1100, useNativeDriver: true }),
        Animated.timing(mapTY, { toValue: panY, duration: 1100, useNativeDriver: true }),
        Animated.sequence([
          Animated.delay(600),
          Animated.timing(overlayOpa, { toValue: 1, duration: 500, useNativeDriver: true }),
        ]),
      ]).start();
    });
  }, [animatePandaAlongRoute, dragX, dragY, mapScale, mapTX, mapTY, overlayOpa, walkScaleX, walkOpa, idleOpa]);

  const closeIsland = useCallback(() => {
    const route = lastRoute.current;
    startWalking(lastIslandX.current >= FRIEND_POSITIONS.home.x);
    Animated.parallel([
      Animated.timing(overlayOpa, { toValue: 0, duration: 280, useNativeDriver: true }),
      Animated.sequence([
        Animated.delay(150),
        Animated.parallel([
          Animated.timing(mapScale, { toValue: 1, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(mapTX, { toValue: 0, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(mapTY, { toValue: 0, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
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
      setSelectedHabitId(null);
      isAnimating.current = false;
    });
  }, [animatePandaAlongRoute, mapScale, mapTX, mapTY, overlayOpa, pandaTX, pandaTY]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isAnimating.current,
      onMoveShouldSetPanResponder: (_, g) => !isAnimating.current && (Math.abs(g.dx) > 3 || Math.abs(g.dy) > 3),
      onPanResponderGrant: () => {
        dragStart.current = {
          x: (dragX as any)._value,
          y: (dragY as any)._value,
        };
      },
      onPanResponderMove: (_, g) => {
        dragX.setValue(
          Math.max(
            FRIEND_DRAG_BOUNDS.minX,
            Math.min(FRIEND_DRAG_BOUNDS.maxX, dragStart.current.x + g.dx),
          ),
        );
        dragY.setValue(
          Math.max(
            FRIEND_DRAG_BOUNDS.minY,
            Math.min(FRIEND_DRAG_BOUNDS.maxY, dragStart.current.y + g.dy),
          ),
        );
      },
    }),
  ).current;

  if (!payload || !friend) {
    return (
      <WaterBg>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 8 }}>
            <BackButton onPress={onBack} />
            <View style={{ flex: 1 }}>
              <H3>Friend World</H3>
              <Small>Loading…</Small>
            </View>
          </View>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color="#D6EDF2" />
          </View>
        </SafeAreaView>
      </WaterBg>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <WaterBg>
        <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 8 }}>
          <BackButton onPress={onBack} />
          <View style={{ flex: 1 }}>
            <H3>{friend.name}'s World</H3>
            <Small>{friend.email || 'No Gmail saved'} · Lv {friend.level}</Small>
          </View>
        </View>
        <Text
          style={{
            fontFamily: 'PixelifySans_400Regular',
            fontSize: 10,
            color: 'rgba(255,255,255,0.45)',
            textAlign: 'center',
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
            position: 'relative',
            transform: [
              { translateX: totalTX },
              { translateY: totalTY },
              { scale: mapScale },
            ],
          }}
        >
          <Svg
            style={{ position: 'absolute', width: '100%', height: '100%' }}
            width={W}
            height={H}
          >
            {FRIEND_HABIT_SLOT_KEYS.slice(0, habits.length).map((key) => {
              const home = FRIEND_POSITIONS.home;
              const dest = FRIEND_POSITIONS[key];
              const x1 = home.x;
              const y1 = home.y;
              const x2 = dest.x;
              const y2 = dest.y;
              const mx = (x1 + x2) / 2;
              const my = (y1 + y2) / 2;
              const dx = x2 - x1;
              const dy = y2 - y1;
              const len = Math.sqrt(dx * dx + dy * dy) || 1;
              const offset = FRIEND_CURVE_OFFSETS[key] ?? 28;
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

          {habits.map((habit, index) => {
            const slotKey = FRIEND_HABIT_SLOT_KEYS[index];
            if (!slotKey) return null;
            const pos = FRIEND_POSITIONS[slotKey];
            const islandType = habitKeyToIslandType(habit.key);
            const bobAnim = slotBobAnims[slotKey as keyof typeof slotBobAnims];
            return (
              <Pressable
                key={habit.id}
                onPress={() => !habit.locked && openIsland(slotKey, habit.id)}
                style={{
                  position: 'absolute',
                  left: pos.x - pos.scale * 26,
                  top: pos.y - pos.scale * 20,
                  alignItems: 'center',
                  opacity: habit.locked ? 0.55 : 1,
                }}
              >
                <Animated.View style={{ transform: [{ translateY: bobAnim }], alignItems: 'center' }}>
                  <MapIslandArt type={islandType} habitKey={habit.key} state={habit.state} scale={pos.scale} locked={habit.locked} />
                  <Text
                    style={{
                      fontFamily: 'PixelifySans_500Medium',
                      fontSize: 10,
                      color: habit.locked ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.85)',
                      letterSpacing: 0.4,
                      marginTop: 4,
                    }}
                  >
                    {habit.label}
                  </Text>
                </Animated.View>
              </Pressable>
            );
          })}

          <Animated.View
            style={{
              position: 'absolute',
              left: FRIEND_POSITIONS.home.x - FRIEND_POSITIONS.home.scale * 32,
              top: FRIEND_POSITIONS.home.y - FRIEND_POSITIONS.home.scale * 20,
              alignItems: 'center',
              transform: [{ translateY: homeBobAnim }],
            }}
          >
            <HomeIslandArt scale={FRIEND_POSITIONS.home.scale} />
            <Text
              style={{
                fontFamily: 'PixelifySans_500Medium',
                fontSize: 10,
                color: 'rgba(255,255,255,0.85)',
                letterSpacing: 0.4,
                marginTop: -10,
              }}
            >
              home
            </Text>
          </Animated.View>

          <Animated.View
            style={{
              position: 'absolute',
              left: FRIEND_PANDA_LEFT,
              top: FRIEND_PANDA_TOP,
              zIndex: 10,
              width: FRIEND_PANDA_SIZE,
              height: FRIEND_PANDA_SIZE,
              transform: [{ translateX: pandaTX }, { translateY: pandaTY }],
            }}
          >
            <Animated.View
              style={{
                position: 'absolute',
                width: FRIEND_PANDA_SIZE,
                height: FRIEND_PANDA_SIZE,
                opacity: walkOpa,
                transform: [{ scaleX: walkScaleX }],
              }}
            >
              <Image
                source={WALK_GIF}
                style={{ width: FRIEND_PANDA_SIZE, height: FRIEND_PANDA_SIZE }}
                contentFit="contain"
              />
            </Animated.View>
            <Animated.View
              style={{
                position: 'absolute',
                width: FRIEND_PANDA_SIZE,
                height: FRIEND_PANDA_SIZE,
                opacity: idleOpa,
              }}
            >
              <Blob state={friend.state} scale={FRIEND_PANDA_SCALE} />
            </Animated.View>
          </Animated.View>
        </Animated.View>

        <View style={{ paddingHorizontal: 16, paddingBottom: 120, gap: 10 }}>
          <SpeechBubble>
            <View style={{ gap: 8 }}>
              <H3>{quote[friend.state]}</H3>
              <Small>Tap any island to visit it.</Small>
            </View>
          </SpeechBubble>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 2 }}>
              <VQButton label={nudged ? 'Nudged today' : 'Send nudge'} onPress={onNudge} disabled={nudged} />
            </View>
            <View style={{ flex: 1 }}><VQButton label="Back" style="ghost" onPress={onBack} /></View>
          </View>
        </View>
        {loading && (
          <View style={{ position: 'absolute', top: 78, right: 18 }}>
            <ActivityIndicator size="small" color="#D6EDF2" />
          </View>
        )}
        </SafeAreaView>
      </WaterBg>

      {overlayIsland && selectedHabit && (
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: W,
            height: H,
            opacity: overlayOpa,
            zIndex: 100,
          }}
        >
          <FriendIslandDetail habit={selectedHabit} onBack={closeIsland} />
        </Animated.View>
      )}
    </View>
  );
}

async function selectUsersByIds(ids: string[]): Promise<UserRow[]> {
  if (ids.length === 0) return [];
  const withEmail = await supabase
    .from('users')
    .select('id, username, email, total_xp')
    .in('id', ids);

  if (!withEmail.error && withEmail.data) return withEmail.data as UserRow[];

  const fallback = await supabase
    .from('users')
    .select('id, username, total_xp')
    .in('id', ids);

  return (fallback.data ?? []).map((row: any) => ({ ...row, email: '' })) as UserRow[];
}

export default function FriendsScreen() {
  const [userId, setUserId] = useState<string | null>(null);
  const [friends, setFriends] = useState<FriendSummary[]>([]);
  const [pendingIncoming, setPendingIncoming] = useState<FriendSummary[]>([]);
  const [pendingOutgoingIds, setPendingOutgoingIds] = useState<Set<string>>(new Set());
  const [recentNudges, setRecentNudges] = useState<FriendSummary[]>([]);
  const [unreadNudgeCount, setUnreadNudgeCount] = useState(0);
  const [nudged, setNudged] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [visiting, setVisiting] = useState<VisitPayload | null>(null);
  const [visitLoading, setVisitLoading] = useState(false);

  const pendingCount = pendingIncoming.length + unreadNudgeCount;

  // Load cached friends immediately on mount — avoids full spinner on every open
  useEffect(() => {
    AsyncStorage.getItem('friendSummaries').then((raw) => {
      if (!raw) return;
      try {
        const cached = JSON.parse(raw) as FriendSummary[];
        setFriends(cached);
        setLoading(false);
      } catch {}
    });
  }, []);

  const loadFriendsData = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) return;
      const currentUserId = session.user.id;
      setUserId(currentUserId);

      const { data: friendshipRows } = await supabase
        .from('friendships')
        .select('id, requester_id, addressee_id, status, created_at')
        .or(`requester_id.eq.${currentUserId},addressee_id.eq.${currentUserId}`);

      const rows = (friendshipRows ?? []) as FriendshipRow[];
      const acceptedRows = rows.filter((row) => row.status === 'accepted');
      const incomingRows = rows.filter((row) => row.status === 'pending' && row.addressee_id === currentUserId);
      const outgoingIds = new Set(
        rows
          .filter((row) => row.status === 'pending' && row.requester_id === currentUserId)
          .map((row) => row.addressee_id)
      );
      setPendingOutgoingIds(outgoingIds);

      const acceptedIds = acceptedRows.map((row) =>
        row.requester_id === currentUserId ? row.addressee_id : row.requester_id
      );
      const incomingIds = incomingRows.map((row) => row.requester_id);
      const allIds = Array.from(new Set([...acceptedIds, ...incomingIds]));
      const userRows = await selectUsersByIds(allIds);
      const userMap = new Map(userRows.map((row) => [row.id, row]));

      const friendSummaries = await Promise.all(
        acceptedIds.map(async (id) => {
          const row = userMap.get(id);
          const totalXp = row?.total_xp ?? 0;
          const [compositeScore, streak] = await Promise.all([
            getCompositeScore(id),
            getOverallStreak(id),
          ]);
          return {
            id,
            name: row?.username ?? 'Friend',
            email: row?.email ?? '',
            totalXp,
            level: getLevel(totalXp),
            state: getAvatarState(compositeScore),
            streak,
          } satisfies FriendSummary;
        })
      );

      const incomingSummaries = await Promise.all(
        incomingIds.map(async (id) => {
          const row = userMap.get(id);
          const totalXp = row?.total_xp ?? 0;
          return {
            id,
            name: row?.username ?? 'Friend',
            email: row?.email ?? '',
            totalXp,
            level: getLevel(totalXp),
            state: 'healthy' as AvatarState,
            streak: 0,
          } satisfies FriendSummary;
        })
      );

      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: sentNudges } = await supabase
        .from('nudges')
        .select('receiver_id')
        .eq('sender_id', currentUserId)
        .gte('sent_at', since);
      setNudged(new Set((sentNudges ?? []).map((row: { receiver_id: string }) => row.receiver_id)));

      const { data: receivedNudges } = await supabase
        .from('nudges')
        .select('sender_id, read_at')
        .eq('receiver_id', currentUserId)
        .gte('sent_at', since)
        .is('read_at', null)
        .order('sent_at', { ascending: false });

      const recentSenderIds = Array.from(new Set((receivedNudges ?? []).map((row: { sender_id: string }) => row.sender_id)));
      const recent = friendSummaries.filter((friend) => recentSenderIds.includes(friend.id));

      setFriends(friendSummaries);
      void AsyncStorage.setItem('friendSummaries', JSON.stringify(friendSummaries));
      setPendingIncoming(incomingSummaries);
      setRecentNudges(recent);
      setUnreadNudgeCount(recentSenderIds.length);
    } catch (err) {
      console.warn('[friends] loadFriendsData error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!notifOpen || !userId || unreadNudgeCount === 0) return;

    const markNudgesRead = async () => {
      try {
        const { error } = await supabase
          .from('nudges')
          .update({ read_at: new Date().toISOString() })
          .eq('receiver_id', userId)
          .is('read_at', null);

        if (error) {
          console.warn('[friends] mark nudges read error:', error);
          return;
        }

        setUnreadNudgeCount(0);
      } catch (err) {
        console.warn('[friends] mark nudges read unexpected error:', err);
      }
    };

    void markNudgesRead();
  }, [notifOpen, unreadNudgeCount, userId]);

  useFocusEffect(
    useCallback(() => {
      setTabAccentMode('blue');
      void loadFriendsData();
    }, [loadFriendsData])
  );

  const relationshipForUser = useCallback((id: string): SearchUser['relation'] => {
    if (friends.some((friend) => friend.id === id)) return 'accepted';
    if (pendingIncoming.some((friend) => friend.id === id)) return 'incoming';
    if (pendingOutgoingIds.has(id)) return 'outgoing';
    return 'none';
  }, [friends, pendingIncoming, pendingOutgoingIds]);

  const handleSearch = useCallback(async (term: string) => {
    setSearchTerm(term);
    if (!userId) return;
    if (term.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const like = `%${term.trim()}%`;
      let rows: UserRow[] = [];

      const withEmail = await supabase
        .from('users')
        .select('id, username, email, total_xp')
        .or(`username.ilike.${like},email.ilike.${like}`)
        .neq('id', userId)
        .limit(8);

      if (!withEmail.error && withEmail.data) {
        rows = withEmail.data as UserRow[];
      } else {
        const fallback = await supabase
          .from('users')
          .select('id, username, total_xp')
          .ilike('username', like)
          .neq('id', userId)
          .limit(8);

        rows = (fallback.data ?? []).map((row: any) => ({ ...row, email: '' })) as UserRow[];
      }

      const results = await Promise.all(
        rows.map(async (row) => {
          const totalXp = row.total_xp ?? 0;
          return {
            id: row.id,
            name: row.username,
            email: row.email ?? '',
            totalXp,
            level: getLevel(totalXp),
            state: 'healthy' as AvatarState,
            streak: 0,
            relation: relationshipForUser(row.id),
          } satisfies SearchUser;
        })
      );

      setSearchResults(results);
    } catch (err) {
      console.warn('[friends] search error:', err);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, [relationshipForUser, userId]);

  const handleSendRequest = useCallback(async (targetId: string) => {
    if (!userId) return;
    try {
      await supabase.from('friendships').insert({
        requester_id: userId,
        addressee_id: targetId,
        status: 'pending',
      });
      await loadFriendsData();
      await handleSearch(searchTerm);
    } catch (err) {
      console.warn('[friends] send request error:', err);
    }
  }, [handleSearch, loadFriendsData, searchTerm, userId]);

  const handleRespondToRequest = useCallback(async (targetId: string, accept: boolean) => {
    if (!userId) return;
    try {
      await supabase
        .from('friendships')
        .update({ status: accept ? 'accepted' : 'declined' })
        .eq('requester_id', targetId)
        .eq('addressee_id', userId)
        .eq('status', 'pending');
      await loadFriendsData();
      await handleSearch(searchTerm);
    } catch (err) {
      console.warn('[friends] respond request error:', err);
    }
  }, [handleSearch, loadFriendsData, searchTerm, userId]);

  const handleNudge = useCallback(async (friendId: string) => {
    if (!userId || nudged.has(friendId)) return;
    try {
      await supabase.from('nudges').insert({
        sender_id: userId,
        receiver_id: friendId,
      });
      setNudged((prev) => new Set([...prev, friendId]));
      await loadFriendsData();
    } catch (err) {
      console.warn('[friends] nudge error:', err);
    }
  }, [loadFriendsData, nudged, userId]);

  const openVisit = useCallback(async (friend: FriendSummary) => {
    setVisitLoading(true);
    setVisiting({ friend, habits: [] });
    try {
      const { data: rows } = await supabase
        .from('habits')
        .select('id, habit_id_key, name, tier')
        .eq('user_id', friend.id)
        .order('created_at', { ascending: true });

      const deduped = Array.from(
        new Map(
          (rows ?? [])
            .filter((row: any) => Boolean(row.habit_id_key))
            .map((row: any) => [row.habit_id_key, row])
        ).values()
      ).slice(0, 5);

      const habits = await Promise.all(
        deduped.map(async (row: any) => {
          const locked = (row.tier ?? 1) >= 2;
          const detail = locked ? undefined : await buildVisitHabitDetail(row.id, row.habit_id_key);
          const score = locked ? 50 : (detail?.score ?? 0);
          return {
            id: row.id,
            key: row.habit_id_key,
            label: row.name,
            locked,
            detail,
            state: locked ? 'sick' as AvatarState : getAvatarState(score),
          } satisfies VisitHabit;
        })
      );

      setVisiting({ friend, habits });
    } catch (err) {
      console.warn('[friends] openVisit error:', err);
    } finally {
      setVisitLoading(false);
    }
  }, []);

  const needsAttention = useMemo(
    () => friends.filter((friend) => friend.state === 'sick' || friend.state === 'critical'),
    [friends]
  );
  const doingWell = useMemo(
    () => friends.filter((friend) => friend.state !== 'sick' && friend.state !== 'critical'),
    [friends]
  );

  if (visiting) {
    return (
      <FriendVisit
        payload={visiting}
        loading={visitLoading}
        nudged={nudged.has(visiting.friend.id)}
        onNudge={() => void handleNudge(visiting.friend.id)}
        onBack={() => setVisiting(null)}
      />
    );
  }

  return (
    <WorldBg>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 54 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
            <View style={{ flex: 1, gap: 2 }}>
              <H1>Friends</H1>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable onPress={() => setNotifOpen((prev) => !prev)}>
                <View style={{ width: 40, height: 40, borderRadius: UI.radius.control, backgroundColor: UI.surface.cream, borderWidth: 1, borderColor: UI.border.base, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="notifications-outline" size={17} color="rgba(232,224,212,0.75)" />
                  {pendingCount > 0 && (
                    <View style={{ position: 'absolute', top: -2, right: -2, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: 'rgba(235,130,120,0.95)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }}>
                      <Text style={{ fontFamily: 'PixelifySans_700Bold', fontSize: 9, color: '#fff' }}>{pendingCount}</Text>
                    </View>
                  )}
                </View>
              </Pressable>
              <Pressable onPress={() => setSearchOpen((prev) => !prev)}>
                <View style={{ width: 40, height: 40, borderRadius: UI.radius.control, backgroundColor: UI.surface.cream, borderWidth: 1, borderColor: UI.border.base, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="person-add-outline" size={17} color="rgba(232,224,212,0.75)" />
                </View>
              </Pressable>
            </View>
          </View>

          {searchOpen && (
            <View style={{ backgroundColor: UI.surface.base, borderRadius: UI.radius.card, borderWidth: 1, borderColor: UI.border.sky, padding: 14, marginBottom: 14, gap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="search-outline" size={16} color="rgba(158,214,223,0.78)" />
                <TextInput
                  value={searchTerm}
                  onChangeText={(text) => void handleSearch(text)}
                  placeholder="Search by name or Gmail"
                  placeholderTextColor="rgba(232,224,212,0.35)"
                  style={{ flex: 1, color: '#E8E0D4', fontFamily: 'PixelifySans_400Regular', fontSize: 13, paddingVertical: 0 }}
                />
              </View>
              {searching ? (
                <ActivityIndicator size="small" color="#D6EDF2" />
              ) : searchResults.length > 0 ? (
                searchResults.map((user) => (
                  <View key={user.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderTopWidth: 1, borderTopColor: UI.border.soft }}>
                    <View style={{ width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: UI.surface.raised, borderWidth: 1, borderColor: UI.border.sky }}>
                      <Blob state={user.state} scale={1.5} />
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={{ fontFamily: 'PixelifySans_700Bold', fontSize: 13, color: '#E8E0D4' }}>{user.name}</Text>
                      <Text style={{ fontFamily: 'PixelifySans_400Regular', fontSize: 11, color: UI.text.soft }}>{user.email || 'No Gmail saved'}</Text>
                    </View>
                    {user.relation === 'none' && <VQButton label="Add" onPress={() => void handleSendRequest(user.id)} />}
                    {user.relation === 'accepted' && <Small>Friends</Small>}
                    {user.relation === 'incoming' && <VQButton label="Accept" onPress={() => void handleRespondToRequest(user.id, true)} />}
                    {user.relation === 'outgoing' && <Small>Pending</Small>}
                  </View>
                ))
              ) : searchTerm.trim().length >= 2 ? (
                <Small>No matches yet.</Small>
              ) : (
                <Small>Type at least 2 characters to search.</Small>
              )}
            </View>
          )}

          {notifOpen && (
            <View style={{ backgroundColor: UI.surface.base, borderRadius: UI.radius.card, borderWidth: 1, borderColor: UI.border.sky, padding: 14, marginBottom: 14, gap: 14 }}>
              <View>
                <Eyebrow style={{ marginBottom: 8 }}>Requests</Eyebrow>
                {pendingIncoming.length === 0 ? (
                  <Small>No pending requests.</Small>
                ) : (
                  pendingIncoming.map((friend) => (
                    <View key={friend.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: 'PixelifySans_700Bold', fontSize: 13, color: '#E8E0D4' }}>{friend.name}</Text>
                        <Text style={{ fontFamily: 'PixelifySans_400Regular', fontSize: 11, color: UI.text.soft }}>{friend.email || 'No Gmail saved'}</Text>
                      </View>
                      <Pressable onPress={() => void handleRespondToRequest(friend.id, false)}>
                        <View style={{ width: 34, height: 34, borderRadius: UI.radius.control, borderWidth: 1, borderColor: UI.border.careStrong, alignItems: 'center', justifyContent: 'center' }}>
                          <Ionicons name="close" size={16} color="rgba(235,130,120,0.92)" />
                        </View>
                      </Pressable>
                      <Pressable onPress={() => void handleRespondToRequest(friend.id, true)}>
                        <View style={{ width: 34, height: 34, borderRadius: UI.radius.control, borderWidth: 1, borderColor: UI.border.goodStrong, alignItems: 'center', justifyContent: 'center' }}>
                          <Ionicons name="checkmark" size={16} color="rgba(110,212,163,0.94)" />
                        </View>
                      </Pressable>
                    </View>
                  ))
                )}
              </View>
              <View>
                <Eyebrow style={{ marginBottom: 8 }}>Recent Nudges</Eyebrow>
                {recentNudges.length === 0 ? (
                  <Small>No recent nudges.</Small>
                ) : (
                  recentNudges.map((friend) => (
                    <View key={friend.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 }}>
                      <Ionicons name="megaphone-outline" size={14} color="rgba(235,130,120,0.9)" />
                      <Text style={{ fontFamily: 'PixelifySans_400Regular', fontSize: 12, color: UI.text.muted }}>{friend.name} nudged you.</Text>
                    </View>
                  ))
                )}
              </View>
            </View>
          )}

          <View style={{ backgroundColor: UI.surface.base, borderRadius: UI.radius.card, borderWidth: 1, borderColor: UI.border.sky, padding: 14, marginBottom: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View style={{ width: 76, height: 52, alignItems: 'center', justifyContent: 'center' }}>
                <HomeIslandArt scale={1.05} />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={{ fontFamily: 'PixelifySans_700Bold', fontSize: 15, color: '#E8E0D4' }}>
                  {needsAttention.length} World{needsAttention.length === 1 ? '' : 's'} Need Support
                </Text>
                <Text style={{ fontFamily: 'PixelifySans_400Regular', fontSize: 12, color: UI.text.muted, lineHeight: 17 }}>
                  Search by Gmail or name, nudge struggling friends, and visit their islands.
                </Text>
              </View>
            </View>
          </View>

          <SectionDivider label="Worlds" style={{ marginTop: 20, marginBottom: 12 }} />

          {loading ? (
            <ActivityIndicator size="large" color="#D6EDF2" style={{ paddingVertical: 32 }} />
          ) : (
            <>
              {needsAttention.length > 0 && (
                <View style={{ marginBottom: 16 }}>
                  <Eyebrow style={{ marginBottom: 9, color: 'rgba(235,130,120,0.88)' }}>Needs Support</Eyebrow>
                  {needsAttention.map((friend) => (
                    <FriendCard
                      key={friend.id}
                      friend={friend}
                      nudged={nudged.has(friend.id)}
                      onNudge={() => void handleNudge(friend.id)}
                      onVisit={() => void openVisit(friend)}
                    />
                  ))}
                </View>
              )}

              {doingWell.length > 0 && (
                <View>
                  <Eyebrow style={{ marginBottom: 9 }}>All Worlds</Eyebrow>
                  {doingWell.map((friend) => (
                    <FriendCard
                      key={friend.id}
                      friend={friend}
                      nudged={nudged.has(friend.id)}
                      onNudge={() => void handleNudge(friend.id)}
                      onVisit={() => void openVisit(friend)}
                    />
                  ))}
                </View>
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </WorldBg>
  );
}
