import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Alert, Animated, Pressable, ScrollView, Text, View } from 'react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { readScreenCache, readStaleScreenCache, writeScreenCache } from '../../lib/screenCache';
import {
  getAvatarState,
  getCompositeScore,
  getLevel,
  getLevelXpCurrent,
  getLevelXpRequired,
  getOverallStreak,
} from '../../lib/scoreEngine';
import { Eyebrow, H1, H2, H3, SectionDivider, Small, UI, VQCard, WorldBg } from '../../src/Components';
import { AvatarState, VQ } from '../../src/theme';
import { setTabAccentMode } from '../../src/tabAccent';
import {
  readHealthKitSnapshotForCurrentUser,
  requestHealthKitPermissions,
  syncHealthKitHabitsForCurrentUser,
} from '../../src/healthkit';

const PANDA_GIF: Record<string, any> = {
  thriving: require('../../assets/cute_chubby_fat_blue_panda_round_roly-poly_body_si_happy_south.gif'),
  healthy:  require('../../assets/cute_chubby_fat_blue_panda_round_roly-poly_body_si_standing_south.gif'),
  sick:     require('../../assets/cute_chubby_fat_blue_panda_round_roly-poly_body_si_sleepy_south.gif'),
  critical: require('../../assets/cute_chubby_fat_blue_panda_round_roly-poly_body_si_crying_south.gif'),
};

function SettingsRow({ label, value, onPress, danger, last }: { label: string; value?: string; onPress?: () => void; danger?: boolean; last?: boolean }) {
  return (
    <Pressable onPress={onPress}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: last ? 0 : 1, borderBottomColor: UI.border.soft }}>
        <H3 style={{ flex: 1, color: danger ? VQ.red : '#E8E0D4' }}>{label}</H3>
        {value && <Small>{value}</Small>}
        {onPress && !danger && <Ionicons name="chevron-forward" size={14} color={UI.text.soft} />}
      </View>
    </Pressable>
  );
}

function PreferenceRow({
  label,
  value,
  onPress,
  last,
  expanded,
  children,
}: {
  label: string;
  value: string;
  onPress: () => void;
  last?: boolean;
  expanded?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <View style={{ paddingVertical: 14, borderBottomWidth: last && !expanded ? 0 : 1, borderBottomColor: UI.border.soft }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <H3 style={{ flex: 1, color: '#E8E0D4' }}>{label}</H3>
        <Pressable onPress={onPress} hitSlop={8}>
          <View style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: UI.radius.pill, borderWidth: 1, borderColor: UI.border.skyStrong, backgroundColor: 'rgba(158,214,223,0.08)' }}>
            <Small style={{ color: '#E8E0D4' }}>{value}</Small>
          </View>
        </Pressable>
      </View>
      {expanded ? <View style={{ marginTop: 12, gap: 8 }}>{children}</View> : null}
    </View>
  );
}

interface ProfileData {
  username: string;
  email: string;
  level: number;
  levelXpCurrent: number;
  levelXpRequired: number;
  compositeScore: number;
  streak: number;
  avatarState: AvatarState;
  habitCount: number;
}

const FALLBACK: ProfileData = {
  username: 'Adventurer', email: '',
  level: 1, levelXpCurrent: 0, levelXpRequired: 100,
  compositeScore: 50, streak: 0, avatarState: 'healthy', habitCount: 0,
};

const PROFILE_CACHE_KEY = 'cache:profile-data:v1';
const PROFILE_CACHE_TTL_MS = 5 * 60 * 1000;
const NOTIFICATIONS_KEY = 'profile:notifications-enabled';
const REMINDER_TIME_KEY = 'profile:daily-reminder';
const REMINDER_OPTIONS = ['7:00 AM', '8:00 AM', '9:00 AM', '6:00 PM', '8:00 PM'] as const;

export default function ProfileScreen() {
  const [profile, setProfile] = useState<ProfileData>(FALLBACK);
  const [healthConnected, setHealthConnected] = useState(false);
  const [healthSyncing, setHealthSyncing] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [reminderTime, setReminderTime] = useState<(typeof REMINDER_OPTIONS)[number]>('9:00 AM');
  const [reminderMenuOpen, setReminderMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const hydratedFromCache = useRef(false);
  const pressAnim = useRef(new Animated.Value(0)).current;

  const refreshHealthStatus = useCallback(async () => {
    try {
      const summary = await readHealthKitSnapshotForCurrentUser();
      setHealthConnected(Boolean(summary));
    } catch (err) {
      console.warn('[profile] refreshHealthStatus error:', err);
      setHealthConnected(false);
    }
  }, []);

  const loadPreferences = useCallback(async () => {
    try {
      const [notificationsRaw, reminderRaw] = await Promise.all([
        AsyncStorage.getItem(NOTIFICATIONS_KEY),
        AsyncStorage.getItem(REMINDER_TIME_KEY),
      ]);

      if (notificationsRaw !== null) {
        setNotificationsEnabled(notificationsRaw === 'true');
      }

      if (reminderRaw && REMINDER_OPTIONS.includes(reminderRaw as (typeof REMINDER_OPTIONS)[number])) {
        setReminderTime(reminderRaw as (typeof REMINDER_OPTIONS)[number]);
      }
    } catch (err) {
      console.warn('[profile] loadPreferences error:', err);
    }
  }, []);

  const loadProfile = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const userId = session.user.id;
      const email = session.user.email ?? '';

      const [{ data: userRow }, { data: habits }] = await Promise.all([
        supabase
          .from('users')
          .select('username, total_xp')
          .eq('id', userId)
          .single(),
        supabase
          .from('habits')
          .select('habit_id_key, tier')
          .eq('user_id', userId),
      ]);

      const totalXp: number = userRow?.total_xp ?? 0;
      const username: string = userRow?.username ?? 'Adventurer';

      const habitCount = new Set(
        (habits ?? [])
          .filter((habit: { habit_id_key: string; tier: number | null }) =>
            (habit.tier ?? 1) < 2 && Boolean(habit.habit_id_key)
          )
          .map((habit: { habit_id_key: string }) => habit.habit_id_key)
      ).size;

      const [compositeScore, streak] = await Promise.all([
        getCompositeScore(userId),
        getOverallStreak(userId),
      ]);

      const nextProfile: ProfileData = {
        username, email,
        level: getLevel(totalXp),
        levelXpCurrent: getLevelXpCurrent(totalXp),
        levelXpRequired: getLevelXpRequired(),
        compositeScore,
        streak,
        avatarState: getAvatarState(compositeScore),
        habitCount,
      };

      setProfile(nextProfile);
      hydratedFromCache.current = true;
      await writeScreenCache(PROFILE_CACHE_KEY, nextProfile);
    } catch (err) {
      console.warn('[profile] loadProfile error:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const hydrate = async () => {
      const cached = await readStaleScreenCache<ProfileData>(PROFILE_CACHE_KEY);
      if (cached) {
        setProfile(cached);
        setLoading(false);
        hydratedFromCache.current = true;
        const fresh = await readScreenCache<ProfileData>(PROFILE_CACHE_KEY, PROFILE_CACHE_TTL_MS);
        if (!fresh) void loadProfile(true);
        return;
      }
      void loadProfile(false);
    };
    void hydrate();
    void refreshHealthStatus();
    void loadPreferences();
  }, [loadPreferences, loadProfile, refreshHealthStatus]);

  useFocusEffect(
    useCallback(() => {
      setTabAccentMode('blue');
      void loadProfile(hydratedFromCache.current);
      void refreshHealthStatus();
      void loadPreferences();
    }, [loadPreferences, loadProfile, refreshHealthStatus])
  );

  const handleHealthConnect = useCallback(async () => {
    setHealthSyncing(true);
    try {
      const result = await requestHealthKitPermissions();
      if (!result.available) {
        const synced = await syncHealthKitHabitsForCurrentUser();
        if (!synced) {
          Alert.alert(
            'Health sync not found',
            'Open the VitaQuest Health helper app, sync Apple Health there, then come back here.',
          );
        } else {
          await refreshHealthStatus();
        }
        return;
      }

      if (!result.authorized) {
        Alert.alert(
          'Health access not granted',
          'Apple Health permission was not granted on this device.',
        );
        return;
      }

      await syncHealthKitHabitsForCurrentUser();
      await refreshHealthStatus();
    } catch (err) {
      console.warn('[profile] handleHealthConnect error:', err);
      Alert.alert('Health sync failed', 'We could not connect Apple Health right now.');
    } finally {
      setHealthSyncing(false);
    }
  }, [refreshHealthStatus]);

  const handleManageHabits = useCallback(() => {
    Alert.alert('Manage Habits', 'Habit management is not wired on this screen yet.');
  }, []);

  const handleExportData = useCallback(() => {
    Alert.alert('Export Data', 'Data export is not wired yet.');
  }, []);

  const handleToggleNotifications = useCallback(async () => {
    setReminderMenuOpen(false);
    const nextValue = !notificationsEnabled;
    setNotificationsEnabled(nextValue);
    try {
      await AsyncStorage.setItem(NOTIFICATIONS_KEY, String(nextValue));
    } catch (err) {
      console.warn('[profile] handleToggleNotifications error:', err);
      setNotificationsEnabled(!nextValue);
    }
  }, [notificationsEnabled]);

  const saveReminderTime = useCallback(async (nextValue: (typeof REMINDER_OPTIONS)[number]) => {
    setReminderTime(nextValue);
    setReminderMenuOpen(false);
    try {
      await AsyncStorage.setItem(REMINDER_TIME_KEY, nextValue);
    } catch (err) {
      console.warn('[profile] saveReminderTime error:', err);
      setReminderTime(reminderTime);
    }
  }, [reminderTime]);

  const handleChooseReminderTime = useCallback(() => {
    setReminderMenuOpen((open) => !open);
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.multiRemove([
      'onboarded',
      'selectedHabitSlots',
      NOTIFICATIONS_KEY,
      REMINDER_TIME_KEY,
      'cache:home-data:v1',
      'cache:profile-data:v1',
      'cache:map-habit-slots:v1',
      'cache:friends-summaries:v1',
    ]);
    await supabase.auth.signOut();
  };

  const onPressIn  = () => Animated.timing(pressAnim, { toValue: 1, duration: 60, useNativeDriver: true }).start();
  const onPressOut = () => Animated.timing(pressAnim, { toValue: 0, duration: 60, useNativeDriver: true }).start();
  const translate  = pressAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 2] });

  return (
    <WorldBg>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 170 }}>
          <H1 style={{ marginBottom: 20 }}>Profile</H1>

          {/* Avatar + stats */}
          <VQCard>
            <View style={{ alignItems: 'center', gap: 12, paddingVertical: 8 }}>
              <View style={{ width: 110, height: 110, borderRadius: 55, alignItems: 'center', justifyContent: 'center', backgroundColor: UI.surface.raised, overflow: 'hidden', borderWidth: 1.5, borderColor: UI.border.base }}>
                {loading ? (
                  <Ionicons name="reload" size={20} color={UI.text.soft} />
                ) : (
                  <Image source={PANDA_GIF[profile.avatarState]} style={{ width: 200, height: 200, marginTop: 80 }} contentFit="contain" />
                )}
              </View>
              <View style={{ alignItems: 'center', gap: 4 }}>
                <H2>{loading && !hydratedFromCache.current ? '...' : profile.username.split(' ')[0]}</H2>
                <Small>{loading && !hydratedFromCache.current ? 'Loading profile...' : `Level ${profile.level} · ${profile.levelXpCurrent} / ${profile.levelXpRequired} XP`}</Small>
              </View>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 4, width: '100%' }}>
                {[
                  { label: 'Streak',  val: String(profile.streak),        icon: 'flame'       as const, color: '#e07a20' },
                  { label: 'Islands', val: String(profile.habitCount),    icon: 'map-outline' as const, color: 'rgba(110,212,163,0.9)' },
                  { label: 'Health',  val: String(profile.compositeScore),icon: 'heart'       as const, color: '#e06060' },
                ].map(s => (
                  <View key={s.label} style={{ flex: 1, backgroundColor: UI.surface.cream, borderRadius: UI.radius.card, borderWidth: 1, borderColor: UI.border.base, padding: 12, alignItems: 'center', gap: 6 }}>
                    <Ionicons name={s.icon} size={18} color={s.color} />
                    <Text style={{ fontFamily: 'PixelifySans_700Bold', fontSize: 18, color: '#E8E0D4', lineHeight: 20 }}>{s.val}</Text>
                    <Text style={{ fontFamily: 'PixelifySans_400Regular', fontSize: 9, color: UI.text.soft, textTransform: 'uppercase', letterSpacing: 1 }}>{s.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          </VQCard>

          <SectionDivider label="Settings" />

          {/* Account */}
          <View style={{ marginTop: 18 }}>
            <Eyebrow style={{ marginBottom: 8 }}>Account</Eyebrow>
            <VQCard>
              <SettingsRow label="Username" value={loading && !hydratedFromCache.current ? 'Loading...' : profile.username} />
              <SettingsRow label="Email" value={loading && !hydratedFromCache.current ? 'Loading...' : (profile.email || '—')} last />
            </VQCard>
          </View>

          {/* Health */}
          <View style={{ marginTop: 20 }}>
            <Eyebrow style={{ marginBottom: 8 }}>Health & Data</Eyebrow>
            <VQCard>
              <Pressable onPress={handleHealthConnect}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: UI.border.soft }}>
                <View style={{ width: 36, height: 36, borderRadius: UI.radius.control, backgroundColor: 'rgba(220,60,60,0.15)', borderWidth: 1, borderColor: 'rgba(220,80,80,0.3)', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="heart" size={18} color="#e06060" />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={{ fontFamily: 'PixelifySans_500Medium', fontSize: 14, color: '#E8E0D4' }}>Apple Health</Text>
                  <Text style={{ fontFamily: 'PixelifySans_400Regular', fontSize: 11, color: UI.text.soft }}>Steps · Sleep · Heart Rate</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: healthConnected ? 'rgba(110,212,163,0.12)' : 'rgba(220,120,80,0.12)', borderWidth: 1, borderColor: healthConnected ? 'rgba(110,212,163,0.3)' : 'rgba(220,120,80,0.3)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: UI.radius.pill }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: healthConnected ? 'rgba(110,212,163,0.9)' : 'rgba(220,120,80,0.9)' }} />
                  <Text style={{ fontFamily: 'PixelifySans_600SemiBold', fontSize: 11, color: healthConnected ? 'rgba(110,212,163,0.9)' : 'rgba(220,120,80,0.9)' }}>
                    {healthSyncing ? 'Syncing' : healthConnected ? 'Connected' : 'Connect'}
                  </Text>
                </View>
                </View>
              </Pressable>
              <SettingsRow label="Manage Habits" onPress={handleManageHabits} />
              <SettingsRow label="Export Data" onPress={handleExportData} last />
            </VQCard>
          </View>

          {/* Preferences */}
          <View style={{ marginTop: 20 }}>
            <Eyebrow style={{ marginBottom: 8 }}>Preferences</Eyebrow>
            <VQCard>
              <PreferenceRow
                label="Notifications"
                value={notificationsEnabled ? 'On' : 'Off'}
                onPress={() => void handleToggleNotifications()}
              />
              <PreferenceRow
                label="Daily Reminder"
                value={reminderTime}
                onPress={handleChooseReminderTime}
                expanded={reminderMenuOpen}
                last
              >
                {REMINDER_OPTIONS.map((option) => {
                  const selected = option === reminderTime;
                  return (
                    <Pressable key={option} onPress={() => void saveReminderTime(option)}>
                      <View style={{
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        borderRadius: UI.radius.control,
                        borderWidth: 1,
                        borderColor: selected ? UI.border.skyStrong : UI.border.base,
                        backgroundColor: selected ? 'rgba(158,214,223,0.14)' : 'rgba(232,224,212,0.05)',
                      }}>
                        <Text style={{ fontFamily: 'PixelifySans_500Medium', fontSize: 12, color: '#E8E0D4' }}>
                          {option}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </PreferenceRow>
            </VQCard>
          </View>

          {/* Log out */}
          <View style={{ marginTop: 24 }}>
            <Pressable onPress={handleLogout} onPressIn={onPressIn} onPressOut={onPressOut}>
              <Animated.View style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                backgroundColor: 'rgba(180,50,50,0.12)',
                borderRadius: UI.radius.card, borderWidth: 1, borderColor: 'rgba(200,80,80,0.45)',
                paddingVertical: 16,
                transform: [{ translateX: translate }, { translateY: translate }],
              }}>
                <Ionicons name="log-out-outline" size={16} color="rgba(220,100,100,0.9)" />
                <Text style={{ fontFamily: 'PixelifySans_600SemiBold', fontSize: 14, color: 'rgba(220,100,100,0.9)', letterSpacing: 0.5 }}>Log Out</Text>
              </Animated.View>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </WorldBg>
  );
}
