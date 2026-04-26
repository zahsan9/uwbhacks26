import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
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
  getHabitStreak,
  getLevel,
  getLevelXpCurrent,
  getLevelXpRequired,
  getOverallStreak,
} from '../../lib/scoreEngine';
import { Eyebrow, H2, SectionDivider, UI, WorldBg } from '../../src/Components';
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

export default function LandingScreen() {
  const router = useRouter();
  const accent = useTabAccentMode();
  const [data, setData] = useState<HomeData>(FALLBACK);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setTabAccentMode('green');
    }, [])
  );
  const fetchedRef = useRef(false);

  const loadData = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const userId = session.user.id;

      // 1. Fetch user row
      const { data: userRow } = await supabase
        .from('users')
        .select('username, total_xp, created_at')
        .eq('id', userId)
        .single();

      const totalXp: number = userRow?.total_xp ?? 0;
      const username: string = userRow?.username ?? 'Adventurer';
      const dayNum = userRow?.created_at ? getDaySince(userRow.created_at) : 1;

      // 2. Fetch habits
      const { data: habitRows } = await supabase
        .from('habits')
        .select('id, name, habit_id_key, is_healthkit, tier')
        .eq('user_id', userId);

      const habits: LiveHabit[] = await Promise.all(
        (habitRows ?? []).map(async (h: { id: string; name: string; habit_id_key: string; is_healthkit: boolean; tier: number }) => {
          const locked = (h.tier ?? 1) >= 2;
          const [score, streak] = locked
            ? [50, 0]
            : await Promise.all([getHabitScore(h.id), getHabitStreak(h.id)]);
          return {
            id: h.id,
            name: HABIT_DISPLAY_NAME[h.habit_id_key] ?? h.name,
            habitIdKey: h.habit_id_key,
            icon: HABIT_ICON[h.habit_id_key] ?? '❓',
            state: locked ? 'sick' as AvatarState : getAvatarState(score),
            streak,
            locked,
          };
        })
      );

      // 3. Composite score + streak
      const compositeScore = await getCompositeScore(userId);
      const streak = await getOverallStreak(userId);

      // 4. Photo habit keys for verify route (active only — skip locked and HealthKit)
      const photoHabitIds = (habitRows ?? [])
        .filter((h: { is_healthkit: boolean; habit_id_key: string; tier: number }) => !h.is_healthkit && (h.tier ?? 1) < 2)
        .map((h: { is_healthkit: boolean; habit_id_key: string; tier: number }) => h.habit_id_key)
        .filter(Boolean);

      setData({
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
      });
    } catch (err) {
      console.warn('[index] loadData error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    loadData();
  }, [loadData]);

  const handleCameraFAB = () => {
    if (data.photoHabitIds.length > 0) {
      router.push({ pathname: '/verify', params: { habitIds: data.photoHabitIds.join(',') } });
    } else {
      router.push('/verify');
    }
  };

  return (
    <WorldBg>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 }}>
            <View style={{ gap: 4 }}>
              <Eyebrow>Day {data.dayNum}</Eyebrow>
              <H2>Hi, {data.username.split(' ')[0]}</H2>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 2 }}>
              <Text style={{ fontFamily: 'VT323_400Regular', fontSize: 22, color: VQ.tangerine, lineHeight: 22 }}>
                Lv {data.level}
              </Text>
              <Text style={{ fontFamily: 'PixelifySans_400Regular', fontSize: 10, color: UI.text.soft }}>
                {data.levelXpCurrent} / {data.levelXpRequired} xp
              </Text>
            </View>
          </View>

          {/* Avatar card */}
          <View style={{ marginHorizontal: 20, marginVertical: 12, backgroundColor: UI.surface.base, borderRadius: UI.radius.card, borderWidth: 1, borderColor: UI.border.base, padding: 20 }}>
            {/* Circular avatar frame — headshot crop */}
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <View style={{ width: 110, height: 110, borderRadius: 55, backgroundColor: UI.surface.raised, borderWidth: 1.5, borderColor: UI.border.base, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {loading
                  ? <ActivityIndicator size="large" color={VQ.water3} />
                  : <Image source={PANDA_GIF[data.avatarState]} style={{ width: 220, height: 220, marginTop: 80 }} contentFit="contain" />
                }
              </View>
            </View>
            {/* Streak + Health stat tiles */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1, backgroundColor: UI.surface.cream, borderRadius: UI.radius.card, borderWidth: 1, borderColor: UI.border.soft, paddingVertical: 18, paddingHorizontal: 12, alignItems: 'center', gap: 6 }}>
                <Ionicons name="flame" size={22} color="#e07a20" />
                <Text style={{ fontFamily: 'PixelifySans_700Bold', fontSize: 20, color: '#E8E0D4', lineHeight: 22 }}>
                  {data.streak} Days
                </Text>
                <Text style={{ fontFamily: 'PixelifySans_400Regular', fontSize: 9, color: UI.text.soft, textTransform: 'uppercase', letterSpacing: 1.4 }}>STREAK</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: UI.surface.cream, borderRadius: UI.radius.card, borderWidth: 1, borderColor: UI.border.soft, paddingVertical: 18, paddingHorizontal: 12, alignItems: 'center', gap: 6 }}>
                <Ionicons name="heart" size={22} color="#e06060" />
                <Text style={{ fontFamily: 'PixelifySans_700Bold', fontSize: 20, color: '#E8E0D4', lineHeight: 22 }}>
                  {data.compositeScore} / 100
                </Text>
                <Text style={{ fontFamily: 'PixelifySans_400Regular', fontSize: 9, color: UI.text.soft, textTransform: 'uppercase', letterSpacing: 1.4 }}>HEALTH</Text>
              </View>
            </View>
          </View>

          {/* HABITAT divider */}
          <SectionDivider label="Habitat" style={{ marginHorizontal: 20, marginTop: 8, marginBottom: 4 }} />

          {/* Your World + Habitat Strength */}
          <View style={{ paddingHorizontal: 20, marginTop: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Eyebrow>Your world</Eyebrow>
              <Text style={{ fontFamily: 'PixelifySans_400Regular', fontSize: 11, color: UI.text.soft }}>
                {loading ? '…' : `${data.habits.length} island${data.habits.length !== 1 ? 's' : ''}`}
              </Text>
            </View>

            <View style={{ backgroundColor: UI.surface.base, borderRadius: UI.radius.card, borderWidth: 1, borderColor: UI.border.base, padding: 14 }}>
              {/* Habitat strength bar */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <Text style={{ fontFamily: 'PixelifySans_700Bold', fontSize: 14, color: '#E8E0D4' }}>Habitat Strength</Text>
                <Text style={{ fontFamily: 'VT323_400Regular', fontSize: 25, color: 'rgba(110,212,163,0.95)', lineHeight: 25 }}>
                  {loading ? '—' : `${data.compositeScore}%`}
                </Text>
              </View>
              {/* Bamboo-style progress bar — fill underlays, joints span full width */}
              <View style={{ height: 14, borderRadius: 7, backgroundColor: 'rgba(41,68,42,0.68)', overflow: 'hidden', borderWidth: 1, borderColor: UI.border.base, marginBottom: 14 }}>
                {/* Green fill underlay */}
                <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${data.compositeScore}%` as any, backgroundColor: 'rgba(110,165,96,0.92)' }} />
                {/* Bamboo joints across full track */}
                <View style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, flexDirection: 'row' }}>
                  {[0, 1, 2, 3, 4, 5].map(i => (
                    <View key={i} style={{ flex: 1, borderRightWidth: i === 5 ? 0 : 2, borderRightColor: 'rgba(44,91,50,0.55)' }}>
                      <View style={{ height: 3, marginTop: 2, marginHorizontal: 5, borderRadius: 2, backgroundColor: 'rgba(210,238,180,0.18)' }} />
                    </View>
                  ))}
                </View>
              </View>

              {/* Habit rows */}
              {loading ? (
                <ActivityIndicator size="small" color={VQ.water3} style={{ paddingVertical: 20 }} />
              ) : data.habits.length === 0 ? (
                <Text style={{ fontFamily: 'PixelifySans_400Regular', fontSize: 13, color: UI.text.muted, textAlign: 'center', paddingVertical: 20 }}>
                  No habits yet — complete onboarding to begin!
                </Text>
              ) : (
                data.habits.map((h) => {
                  const accentColor = h.state === 'sick' ? VQ.tangerine : h.state === 'critical' ? VQ.red : 'transparent';
                  const statusColor = HABIT_STATUS_COLOR[h.state];
                  const png = HABIT_PNG[h.habitIdKey];
                  return (
                    <View key={h.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: UI.surface.raised, borderRadius: UI.radius.card, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: UI.border.soft, overflow: 'hidden', opacity: h.locked ? 0.45 : 1 }}>
                      {/* Left accent strip */}
                      <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: accentColor }} />

                      {/* Island image */}
                      <View style={{ width: 52, height: 34, alignItems: 'center', justifyContent: 'center' }}>
                        {h.locked
                          ? <Text style={{ fontSize: 18 }}>🔒</Text>
                          : png
                            ? <Image source={png} style={{ width: 52, height: 34 }} contentFit="contain" />
                            : <Text style={{ fontSize: 18 }}>{h.icon}</Text>
                        }
                      </View>

                      {/* Name + status */}
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: 'PixelifySans_700Bold', fontSize: 14, color: '#E8E0D4' }}>{h.name}</Text>
                        {!h.locked && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 }}>
                            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: statusColor }} />
                            <Text style={{ fontFamily: 'PixelifySans_400Regular', fontSize: 11, color: statusColor }}>
                              {HABIT_STATUS_LABEL[h.state]}
                            </Text>
                          </View>
                        )}
                        {h.locked && (
                          <Text style={{ fontFamily: 'PixelifySans_400Regular', fontSize: 10, color: UI.text.soft, marginTop: 1 }}>locked island</Text>
                        )}
                      </View>

                      {/* Streak */}
                      {!h.locked && (
                        <View style={{ alignItems: 'flex-end', gap: 2 }}>
                          <Text style={{ fontFamily: 'PixelifySans_700Bold', fontSize: 16, color: '#E8E0D4' }}>{h.streak}</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                            <Ionicons name="flame" size={10} color={VQ.tangerine} />
                            <Text style={{ fontFamily: 'PixelifySans_400Regular', fontSize: 10, color: VQ.tangerine }}>
                              {h.streak === 1 ? 'day' : 'days'}
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
          style={{ position: 'absolute', bottom: 88, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: accent === 'blue' ? VQ.water3 : VQ.tea, alignItems: 'center', justifyContent: 'center', shadowColor: accent === 'blue' ? VQ.water3 : VQ.tea, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 0 }}
        >
          <Text style={{ fontSize: 24 }}>📷</Text>
        </Pressable>

      </SafeAreaView>
    </WorldBg>
  );
}
