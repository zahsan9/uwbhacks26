import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
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
import Blob from '../../src/Blob';
import { Eyebrow, H2, H3, StreakNum, VQButton, VQCard, WeekDashes, WorldBg } from '../../src/Components';
import { AvatarState, VQ, avatarMessage } from '../../src/theme';

// ── Display maps for all known habit_id_key values ────────────────────────────
const HABIT_ICON: Record<string, string> = {
  walk: '🚶', sleep: '🌙', screen: '📱',
  gym: '💪', running: '🏃', reading: '📖',
  cooking: '🍳', meditation: '🧘',
};
const HABIT_DISPLAY_NAME: Record<string, string> = {
  walk: 'Walking', sleep: 'Sleep', screen: 'Screen Time',
  gym: 'Workout', running: 'Running', reading: 'Reading',
  cooking: 'Cooking', meditation: 'Meditation',
};

interface LiveHabit {
  id: string;
  name: string;
  habitIdKey: string;
  icon: string;
  state: AvatarState;
  streak: number;
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
  const [data, setData] = useState<HomeData>(FALLBACK);
  const [loading, setLoading] = useState(true);
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
        .select('id, name, habit_id_key, is_healthkit')
        .eq('user_id', userId);

      const habits: LiveHabit[] = await Promise.all(
        (habitRows ?? []).map(async (h: { id: string; name: string; habit_id_key: string; is_healthkit: boolean }) => {
          const [score, streak] = await Promise.all([
            getHabitScore(h.id),
            getHabitStreak(h.id),
          ]);
          return {
            id: h.id,
            name: HABIT_DISPLAY_NAME[h.habit_id_key] ?? h.name,
            habitIdKey: h.habit_id_key,
            icon: HABIT_ICON[h.habit_id_key] ?? '❓',
            state: getAvatarState(score),
            streak,
          };
        })
      );

      // 3. Composite score + streak
      const compositeScore = await getCompositeScore(userId);
      const streak = await getOverallStreak(userId);

      // 4. Photo habit keys for verify route
      const photoHabitIds = (habitRows ?? [])
        .filter((h: { is_healthkit: boolean; habit_id_key: string }) => !h.is_healthkit)
        .map((h: { is_healthkit: boolean; habit_id_key: string }) => h.habit_id_key)
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
        <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>

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
              <Text style={{ fontFamily: 'PixelifySans_400Regular', fontSize: 10, color: VQ.inkDim }}>
                {data.levelXpCurrent} / {data.levelXpRequired} xp
              </Text>
            </View>
          </View>

          {/* Avatar card */}
          <View style={{ marginHorizontal: 20, marginVertical: 12, backgroundColor: VQ.surface, borderRadius: 8, borderWidth: 1.5, borderColor: VQ.border, overflow: 'hidden', shadowColor: 'rgba(29,29,27,0.12)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 8 }}>
            <View style={{ alignItems: 'center', paddingTop: 24, paddingBottom: 8 }}>
              {loading
                ? <ActivityIndicator size="large" color={VQ.water3} style={{ height: 112 }} />
                : <Blob state={data.avatarState} scale={7} />
              }
            </View>
            <View style={{ paddingHorizontal: 20, paddingBottom: 20, alignItems: 'center', gap: 8 }}>
              <Text style={{ fontFamily: 'PixelifySans_400Regular', fontSize: 15, letterSpacing: 0.2, lineHeight: 22, color: VQ.ink, textAlign: 'center' }}>
                {'"'}{avatarMessage[data.avatarState]}{'"'}
              </Text>
              <View style={{ flexDirection: 'row', gap: 16, marginTop: 4 }}>
                {[
                  { label: 'streak', val: `${data.streak} 🔥` },
                  { label: 'health', val: `${data.compositeScore}/100 ❤️` },
                ].map(item => (
                  <View key={item.label} style={{ alignItems: 'center', gap: 2 }}>
                    <Text style={{ fontFamily: 'PixelifySans_600SemiBold', fontSize: 13, color: VQ.ink }}>{item.val}</Text>
                    <Text style={{ fontFamily: 'PixelifySans_400Regular', fontSize: 10, color: VQ.inkDim, textTransform: 'uppercase', letterSpacing: 1 }}>{item.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Habit rows */}
          <View style={{ paddingHorizontal: 20, marginTop: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
              <Eyebrow>Your world</Eyebrow>
              <Text style={{ fontFamily: 'PixelifySans_400Regular', fontSize: 11, color: VQ.inkDim }}>
                {loading ? '…' : `${data.habits.length} island${data.habits.length !== 1 ? 's' : ''}`}
              </Text>
            </View>
            <VQCard>
              {loading ? (
                <ActivityIndicator size="small" color={VQ.water3} style={{ paddingVertical: 20 }} />
              ) : data.habits.length === 0 ? (
                <Text style={{ fontFamily: 'PixelifySans_400Regular', fontSize: 13, color: VQ.inkDim, textAlign: 'center', paddingVertical: 20 }}>
                  No habits yet — complete onboarding to begin!
                </Text>
              ) : (
                data.habits.map((h, idx) => (
                  <View key={h.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: idx < data.habits.length - 1 ? 1 : 0, borderBottomColor: VQ.border }}>
                    <Text style={{ fontSize: 18 }}>{h.icon}</Text>
                    <H3 style={{ flex: 1 }}>{h.name}</H3>
                    <WeekDashes state={h.state} />
                    <StreakNum value={h.streak} />
                  </View>
                ))
              )}
            </VQCard>
          </View>

          <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
            <VQButton label="Open world map" onPress={() => router.push('/map')} />
          </View>
        </ScrollView>

        {/* Camera FAB */}
        <Pressable
          onPress={handleCameraFAB}
          style={{ position: 'absolute', bottom: 24, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: VQ.water3, alignItems: 'center', justifyContent: 'center', shadowColor: VQ.water3, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 0 }}
        >
          <Text style={{ fontSize: 24 }}>📷</Text>
        </Pressable>

      </SafeAreaView>
    </WorldBg>
  );
}
