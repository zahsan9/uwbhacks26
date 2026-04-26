import { Image } from 'expo-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { setTabAccentMode, useTabAccentMode } from '../../src/tabAccent';
import {
  getAvatarState,
  getCompositeScore,
  getDaySince,
  getHabitScore,
  getLevel,
  getLevelXpCurrent,
  getLevelXpRequired,
  getOverallStreak,
} from '../../lib/scoreEngine';
import { Eyebrow, SectionDivider } from '../../src/Components';
import { AvatarState, VQ } from '../../src/theme';

// ── Display maps for all known habit_id_key values ────────────────────────────
const HABIT_ICON: Record<string, string> = {
  walk: '🚶', sleep: '🌙', screen: '📱',
  gym: '💪', running: '🏃', reading: '📖',
  cooking: '🍳', meditation: '🧘',
};

const HABIT_PNG: Record<string, any> = {
  walk:       require('../../assets/walk_island.png'),
  sleep:      require('../../assets/sleep_island.png'),
  screen:     require('../../assets/screen_island.png'),
  gym:        require('../../assets/workout_island-removebg-preview.png'),
  running:    require('../../assets/running_pixel-removebg-preview.png'),
  meditation: require('../../assets/FINAL_HOTSPRING_MEDITATION-removebg-preview.png'),
};
const HABIT_DISPLAY_NAME: Record<string, string> = {
  walk: 'Walking', sleep: 'Sleep', screen: 'Screen Time',
  gym: 'Workout', running: 'Running', reading: 'Reading',
  cooking: 'Cooking', meditation: 'Meditation',
};

const PANDA_GIF: Record<AvatarState, any> = {
  thriving: require('../../assets/cute_chubby_fat_blue_panda_round_roly-poly_body_si_happy_south.gif'),
  healthy:  require('../../assets/cute_chubby_fat_blue_panda_round_roly-poly_body_si_standing_south.gif'),
  sick:     require('../../assets/cute_chubby_fat_blue_panda_round_roly-poly_body_si_sleepy_south.gif'),
  critical: require('../../assets/cute_chubby_fat_blue_panda_round_roly-poly_body_si_crying_south.gif'),
};

const HABIT_STATUS_LABEL: Record<AvatarState, string> = {
  thriving: 'Thriving',
  healthy: 'Stable',
  sick: 'Needs Care',
  critical: 'Critical',
};

const HABIT_STATUS_COLOR: Record<AvatarState, string> = {
  thriving: '#6ed4a3',
  healthy: VQ.lavender,
  sick: VQ.tangerine,
  critical: VQ.red,
};

const HOME_UI = {
  bg: '#0b2552',
  panel: '#081d44',
  panelBorder: 'rgba(143,200,216,0.16)',
  tile: '#163469',
  tileBorder: 'rgba(143,200,216,0.18)',
  row: '#163469',
  rowBorder: 'rgba(143,200,216,0.20)',
  text: '#F0E7DA',
  muted: 'rgba(240,231,218,0.52)',
  soft: 'rgba(240,231,218,0.38)',
  greenTrack: '#274c28',
  greenFill: '#76b164',
  greenJoint: 'rgba(104,154,86,0.95)',
  greenHighlight: 'rgba(188,223,146,0.32)',
  cyan: '#79d0b9',
} as const;

interface LiveHabit {
  id: string;
  name: string;
  habitIdKey: string;
  icon: string;
  state: AvatarState;
  streak: number;
  locked: boolean;
}

interface HomeData {
  username: string;
  dayNum: number;
  level: number;
  levelXpCurrent: number;
  levelXpRequired: number;
  compositeScore: number;
  streak: number;
  avatarState: AvatarState;
  habits: LiveHabit[];
  photoHabitIds: string[]; // habit_id_key values for /verify filter
}

const FALLBACK: HomeData = {
  username: 'Adventurer',
  dayNum: 1,
  level: 1,
  levelXpCurrent: 0,
  levelXpRequired: 100,
  compositeScore: 50,
  streak: 0,
  avatarState: 'healthy',
  habits: [],
  photoHabitIds: [],
};

const HOME_CACHE_KEY = 'vitaquest:home-cache';
const HOME_CACHE_TTL_MS = 60 * 1000;

type HomeCacheEntry = {
  userId: string;
  cachedAt: number;
  data: HomeData;
};

let memoryHomeCache: HomeCacheEntry | null = null;

async function readHomeCache(userId: string): Promise<HomeCacheEntry | null> {
  if (memoryHomeCache?.userId === userId) return memoryHomeCache;

  try {
    const raw = await AsyncStorage.getItem(HOME_CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as HomeCacheEntry;
    if (parsed.userId !== userId) return null;

    memoryHomeCache = parsed;
    return parsed;
  } catch (err) {
    console.warn('[index] readHomeCache error:', err);
    return null;
  }
}

async function writeHomeCache(entry: HomeCacheEntry) {
  memoryHomeCache = entry;
  try {
    await AsyncStorage.setItem(HOME_CACHE_KEY, JSON.stringify(entry));
  } catch (err) {
    console.warn('[index] writeHomeCache error:', err);
  }
}

export default function LandingScreen() {
  const router = useRouter();
  const accent = useTabAccentMode();
  const [data, setData] = useState<HomeData>(FALLBACK);
  const [loading, setLoading] = useState(true);
  const hydratedFromCache = useRef(false);

  const fetchHomeData = useCallback(async (userId: string): Promise<HomeData> => {
    const [{ data: userRow }, { data: habitRows }] = await Promise.all([
      supabase
        .from('users')
        .select('username, total_xp, created_at')
        .eq('id', userId)
        .single(),
      supabase
        .from('habits')
        .select('id, name, habit_id_key, is_healthkit, tier, created_at')
        .eq('user_id', userId),
    ]);

    const totalXp: number = userRow?.total_xp ?? 0;
    const username: string = userRow?.username ?? 'Adventurer';
    const dayNum = userRow?.created_at ? getDaySince(userRow.created_at) : 1;

    const uniqueHabitRows = Array.from(
      new Map(
        (habitRows ?? [])
          .filter((h: { habit_id_key: string }) => Boolean(h.habit_id_key))
          .map((h: { id: string; name: string; habit_id_key: string; is_healthkit: boolean; tier: number; created_at?: string }) => [h.habit_id_key, h])
      ).values()
    ).slice(0, 5);

    const [habits, compositeScore, streak] = await Promise.all([
      Promise.all(
        uniqueHabitRows.map(async (h: { id: string; name: string; habit_id_key: string; is_healthkit: boolean; tier: number; created_at?: string }) => {
          const locked = (h.tier ?? 1) >= 2;
          const score = locked ? 50 : await getHabitScore(h.id);
          const streakValue = locked ? 0 : getDaySince(h.created_at ?? userRow?.created_at ?? new Date().toISOString());
          return {
            id: h.id,
            name: HABIT_DISPLAY_NAME[h.habit_id_key] ?? h.name,
            habitIdKey: h.habit_id_key,
            icon: HABIT_ICON[h.habit_id_key] ?? '❓',
            state: locked ? 'sick' as AvatarState : getAvatarState(score),
            streak: streakValue,
            locked,
          } satisfies LiveHabit;
        })
      ),
      getCompositeScore(userId),
      getOverallStreak(userId),
    ]);

    const photoHabitIds = uniqueHabitRows
      .filter((h: { is_healthkit: boolean; habit_id_key: string; tier: number }) => !h.is_healthkit && (h.tier ?? 1) < 2)
      .map((h: { habit_id_key: string }) => h.habit_id_key)
      .filter(Boolean);

    return {
      username,
      dayNum,
      level: getLevel(totalXp),
      levelXpCurrent: getLevelXpCurrent(totalXp),
      levelXpRequired: getLevelXpRequired(),
      compositeScore,
      streak,
      avatarState: getAvatarState(compositeScore),
      habits,
      photoHabitIds,
    };
  }, []);

  const loadData = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setLoading(false);
        return;
      }

      const userId = session.user.id;
      const cached = await readHomeCache(userId);
      const cacheIsFresh = cached ? Date.now() - cached.cachedAt < HOME_CACHE_TTL_MS : false;

      if (cached) {
        setData(cached.data);
        hydratedFromCache.current = true;
        setLoading(false);
        if (cacheIsFresh) return;
      } else if (!hydratedFromCache.current) {
        setLoading(true);
      }

      const freshData = await fetchHomeData(userId);
      setData(freshData);
      hydratedFromCache.current = true;
      setLoading(false);
      await writeHomeCache({
        userId,
        cachedAt: Date.now(),
        data: freshData,
      });
    } catch (err) {
      console.warn('[index] loadData error:', err);
      setLoading(false);
    }
  }, [fetchHomeData]);

  useFocusEffect(
    useCallback(() => {
      setTabAccentMode('blue');
      void loadData();
    }, [loadData])
  );

  const handleCameraFAB = () => {
    if (data.photoHabitIds.length > 0) {
      router.push({ pathname: '/verify', params: { habitIds: data.photoHabitIds.join(',') } });
    } else {
      router.push('/verify');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: HOME_UI.bg }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 10 }}>
            <View style={{ gap: 4 }}>
              <Eyebrow style={{ color: HOME_UI.muted }}>{`Day ${data.dayNum}`}</Eyebrow>
              <Text style={{ fontFamily: 'PixelifySans_600SemiBold', fontSize: 28, color: HOME_UI.text, lineHeight: 32 }}>
                Hi, {data.username.split(' ')[0]}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 2 }}>
              <Text style={{ fontFamily: 'VT323_400Regular', fontSize: 22, color: VQ.tangerine, lineHeight: 22 }}>
                Lv {data.level}
              </Text>
              <Text style={{ fontFamily: 'PixelifySans_400Regular', fontSize: 10, color: HOME_UI.soft }}>
                {data.levelXpCurrent} / {data.levelXpRequired} xp
              </Text>
            </View>
          </View>

          {/* Avatar card */}
          <View style={{ marginHorizontal: 20, marginVertical: 12, backgroundColor: HOME_UI.panel, borderRadius: 28, borderWidth: 1, borderColor: HOME_UI.panelBorder, padding: 22 }}>
            {/* Circular avatar frame — headshot crop */}
            <View style={{ alignItems: 'center', marginBottom: 18, marginTop: 2 }}>
              <View style={{ width: 124, height: 124, borderRadius: 62, backgroundColor: 'rgba(36,55,41,0.5)', borderWidth: 2, borderColor: 'rgba(205,224,203,0.16)', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {loading
                  ? <ActivityIndicator size="large" color={HOME_UI.cyan} />
                  : <Image source={PANDA_GIF[data.avatarState]} style={{ width: 236, height: 236, marginTop: 82 }} contentFit="contain" />
                }
              </View>
            </View>
            {/* Streak + Health stat tiles */}
            <View style={{ flexDirection: 'row', gap: 14 }}>
              <View style={{ flex: 1, backgroundColor: HOME_UI.tile, borderRadius: 24, borderWidth: 1, borderColor: HOME_UI.tileBorder, paddingVertical: 20, paddingHorizontal: 12, alignItems: 'center', gap: 8 }}>
                <Ionicons name="flame" size={22} color="#e07a20" />
                <Text style={{ fontFamily: 'PixelifySans_700Bold', fontSize: 20, color: HOME_UI.text, lineHeight: 22 }}>
                  {data.streak} Days
                </Text>
                <Text style={{ fontFamily: 'PixelifySans_400Regular', fontSize: 9, color: HOME_UI.soft, textTransform: 'uppercase', letterSpacing: 1.4 }}>STREAK</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: HOME_UI.tile, borderRadius: 24, borderWidth: 1, borderColor: HOME_UI.tileBorder, paddingVertical: 20, paddingHorizontal: 12, alignItems: 'center', gap: 8 }}>
                <Ionicons name="heart" size={22} color="#e06060" />
                <Text style={{ fontFamily: 'PixelifySans_700Bold', fontSize: 20, color: HOME_UI.text, lineHeight: 22 }}>
                  {data.compositeScore} / 100
                </Text>
                <Text style={{ fontFamily: 'PixelifySans_400Regular', fontSize: 9, color: HOME_UI.soft, textTransform: 'uppercase', letterSpacing: 1.4 }}>HEALTH</Text>
              </View>
            </View>
          </View>

          {/* HABITAT divider */}
          <SectionDivider label="Habitat" style={{ marginHorizontal: 20, marginTop: 10, marginBottom: 8 }} />

          {/* Your World + Habitat Strength */}
          <View style={{ paddingHorizontal: 20, marginTop: 4 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Eyebrow style={{ color: HOME_UI.muted }}>Your world</Eyebrow>
              <Text style={{ fontFamily: 'PixelifySans_400Regular', fontSize: 11, color: HOME_UI.soft }}>
                {loading ? '…' : `${data.habits.length} island${data.habits.length !== 1 ? 's' : ''}`}
              </Text>
            </View>

            <View style={{ backgroundColor: HOME_UI.panel, borderRadius: 28, borderWidth: 1, borderColor: HOME_UI.panelBorder, padding: 16 }}>
              {/* Habitat strength bar */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ fontFamily: 'PixelifySans_700Bold', fontSize: 14, color: HOME_UI.text }}>Habitat Strength</Text>
                <Text style={{ fontFamily: 'VT323_400Regular', fontSize: 25, color: HOME_UI.cyan, lineHeight: 25 }}>
                  {loading ? '—' : `${data.compositeScore}%`}
                </Text>
              </View>
              <View style={{ height: 14, borderRadius: 7, backgroundColor: HOME_UI.greenTrack, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(143,200,216,0.14)', marginBottom: 16 }}>
                <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${data.compositeScore}%` as any, backgroundColor: HOME_UI.greenFill }} />
                <View style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, flexDirection: 'row' }}>
                  {[0, 1, 2, 3, 4, 5].map(i => (
                    <View key={i} style={{ flex: 1, borderRightWidth: i === 5 ? 0 : 2, borderRightColor: HOME_UI.greenJoint }}>
                      <View style={{ height: 3, marginTop: 2, marginHorizontal: 5, borderRadius: 2, backgroundColor: HOME_UI.greenHighlight }} />
                    </View>
                  ))}
                </View>
              </View>

              {/* Habit rows */}
              {loading ? (
                <ActivityIndicator size="small" color={HOME_UI.cyan} style={{ paddingVertical: 20 }} />
              ) : data.habits.length === 0 ? (
                <Text style={{ fontFamily: 'PixelifySans_400Regular', fontSize: 13, color: HOME_UI.muted, textAlign: 'center', paddingVertical: 20 }}>
                  No habits yet — complete onboarding to begin!
                </Text>
              ) : (
                data.habits.map((h) => {
                  const accentColor = h.state === 'sick' ? VQ.tangerine : h.state === 'critical' ? VQ.red : 'rgba(143,200,216,0.72)';
                  const statusColor = HABIT_STATUS_COLOR[h.state];
                  const png = HABIT_PNG[h.habitIdKey];
                  return (
                    <View
                      key={h.id}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 14,
                        backgroundColor: HOME_UI.row,
                        borderRadius: 28,
                        paddingVertical: 18,
                        paddingHorizontal: 18,
                        marginBottom: 14,
                        borderWidth: 1,
                        borderColor: HOME_UI.rowBorder,
                        overflow: 'hidden',
                        opacity: h.locked ? 0.45 : 1,
                      }}
                    >
                      {/* Left accent strip */}
                      <View
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: 14,
                          bottom: 14,
                          width: 5,
                          borderRadius: 4,
                          backgroundColor: accentColor,
                        }}
                      />

                      {/* Island image */}
                      <View style={{ width: 72, height: 52, alignItems: 'center', justifyContent: 'center', marginLeft: 10 }}>
                        {h.locked
                          ? <Text style={{ fontSize: 18 }}>🔒</Text>
                          : png
                            ? <Image source={png} style={{ width: 68, height: 48 }} contentFit="contain" />
                            : <Text style={{ fontSize: 18 }}>{h.icon}</Text>
                        }
                      </View>

                      {/* Name + status */}
                      <View style={{ flex: 1, gap: 5 }}>
                        <Text style={{ fontFamily: 'PixelifySans_700Bold', fontSize: 16, color: HOME_UI.text, lineHeight: 18 }}>{h.name}</Text>
                        {!h.locked && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 }}>
                            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: statusColor, opacity: 0.9 }} />
                            <Text style={{ fontFamily: 'PixelifySans_400Regular', fontSize: 11, color: statusColor, opacity: 0.95 }}>
                              {HABIT_STATUS_LABEL[h.state]}
                            </Text>
                          </View>
                        )}
                        {h.locked && (
                          <Text style={{ fontFamily: 'PixelifySans_400Regular', fontSize: 10, color: HOME_UI.soft, marginTop: 1 }}>locked island</Text>
                        )}
                      </View>

                      {/* Streak */}
                      {!h.locked && (
                        <View style={{ alignItems: 'flex-end', justifyContent: 'space-between', minHeight: 54 }}>
                          <Text style={{ fontFamily: 'PixelifySans_700Bold', fontSize: 18, color: HOME_UI.text, lineHeight: 20 }}>
                            {h.streak}
                          </Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <Ionicons name="flame" size={12} color={VQ.tangerine} />
                            <Text style={{ fontFamily: 'PixelifySans_600SemiBold', fontSize: 10, color: VQ.tangerine }}>
                              {h.streak} {h.streak === 1 ? 'day' : 'days'}
                            </Text>
                          </View>
                        </View>
                      )}
                    </View>
                  );
                })
              )}
            </View>
          </View>

        </ScrollView>

        {/* Camera FAB — sits above the 72px absolute tab bar */}
        <Pressable
          onPress={handleCameraFAB}
          style={{
            position: 'absolute',
            bottom: 88,
            right: 20,
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: '#EAE4DA',
            borderWidth: 1,
            borderColor: accent === 'blue' ? 'rgba(207,234,242,0.24)' : 'rgba(232,224,212,0.16)',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: accent === 'blue' ? VQ.midnight : VQ.tea,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.5,
            shadowRadius: 0
          }}
        >
          <Ionicons name="camera" size={22} color={VQ.midnightSoft} />
        </Pressable>

      </SafeAreaView>
    </View>
  );
}
