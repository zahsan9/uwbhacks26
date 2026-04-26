import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Animated, Pressable, ScrollView, Text, View } from 'react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import {
  getAvatarState,
  getCompositeScore,
  getLevel,
  getLevelXpCurrent,
  getLevelXpRequired,
  getOverallStreak,
} from '../../lib/scoreEngine';
import { Body, Eyebrow, H1, H2, H3, SectionDivider, Small, UI, VQCard, WorldBg } from '../../src/Components';
import { AvatarState, VQ } from '../../src/theme';
import { setTabAccentMode } from '../../src/tabAccent';

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

export default function ProfileScreen() {
  const [profile, setProfile] = useState<ProfileData>(FALLBACK);
  const fetchedRef = useRef(false);
  const pressAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      setTabAccentMode('green');
    }, [])
  );

  const loadProfile = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const userId = session.user.id;
      const email = session.user.email ?? '';

      const { data: userRow } = await supabase
        .from('users')
        .select('username, total_xp')
        .eq('id', userId)
        .single();

      const totalXp: number = userRow?.total_xp ?? 0;
      const username: string = userRow?.username ?? 'Adventurer';

      const { data: habits } = await supabase
        .from('habits')
        .select('id')
        .eq('user_id', userId);

      const [compositeScore, streak] = await Promise.all([
        getCompositeScore(userId),
        getOverallStreak(userId),
      ]);

      setProfile({
        username, email,
        level: getLevel(totalXp),
        levelXpCurrent: getLevelXpCurrent(totalXp),
        levelXpRequired: getLevelXpRequired(),
        compositeScore,
        streak,
        avatarState: getAvatarState(compositeScore),
        habitCount: habits?.length ?? 0,
      });
    } catch (err) {
      console.warn('[profile] loadProfile error:', err);
    }
  }, []);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    loadProfile();
  }, [loadProfile]);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('onboarded');
    await supabase.auth.signOut();
  };

  const onPressIn  = () => Animated.timing(pressAnim, { toValue: 1, duration: 60, useNativeDriver: true }).start();
  const onPressOut = () => Animated.timing(pressAnim, { toValue: 0, duration: 60, useNativeDriver: true }).start();
  const translate  = pressAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 2] });

  return (
    <WorldBg>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 44 }}>
          <H1 style={{ marginBottom: 20 }}>Profile</H1>

          {/* Avatar + stats */}
          <VQCard>
            <View style={{ alignItems: 'center', gap: 12, paddingVertical: 8 }}>
              <View style={{ width: 110, height: 110, borderRadius: 55, alignItems: 'center', justifyContent: 'center', backgroundColor: UI.surface.raised, overflow: 'hidden', borderWidth: 1.5, borderColor: UI.border.base }}>
                <Image source={PANDA_GIF[profile.avatarState]} style={{ width: 200, height: 200, marginTop: 80 }} contentFit="contain" />
              </View>
              <View style={{ alignItems: 'center', gap: 4 }}>
                <H2>{profile.username.split(' ')[0]}</H2>
                <Small>Level {profile.level} · {profile.levelXpCurrent} / {profile.levelXpRequired} XP</Small>
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
              <SettingsRow label="Username" value={profile.username} />
              <SettingsRow label="Email" value={profile.email || '—'} last />
            </VQCard>
          </View>

          {/* Health */}
          <View style={{ marginTop: 20 }}>
            <Eyebrow style={{ marginBottom: 8 }}>Health & Data</Eyebrow>
            <VQCard>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: UI.border.soft }}>
                <View style={{ width: 36, height: 36, borderRadius: UI.radius.control, backgroundColor: 'rgba(220,60,60,0.15)', borderWidth: 1, borderColor: 'rgba(220,80,80,0.3)', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="heart" size={18} color="#e06060" />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={{ fontFamily: 'PixelifySans_500Medium', fontSize: 14, color: '#E8E0D4' }}>Apple Health</Text>
                  <Text style={{ fontFamily: 'PixelifySans_400Regular', fontSize: 11, color: UI.text.soft }}>Steps · Sleep · Heart Rate</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(110,212,163,0.12)', borderWidth: 1, borderColor: 'rgba(110,212,163,0.3)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: UI.radius.pill }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(110,212,163,0.9)' }} />
                  <Text style={{ fontFamily: 'PixelifySans_600SemiBold', fontSize: 11, color: 'rgba(110,212,163,0.9)' }}>Connected</Text>
                </View>
              </View>
              <SettingsRow label="Manage Habits" onPress={() => {}} />
              <SettingsRow label="Export Data" onPress={() => {}} last />
            </VQCard>
          </View>

          {/* Preferences */}
          <View style={{ marginTop: 20 }}>
            <Eyebrow style={{ marginBottom: 8 }}>Preferences</Eyebrow>
            <VQCard>
              <SettingsRow label="Notifications" value="On" onPress={() => {}} />
              <SettingsRow label="Daily Reminder" value="9:00 AM" onPress={() => {}} last />
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

          <Body style={{ marginTop: 16, textAlign: 'center' }}>VitaQuest v1.0 · UWBHACKS 2026</Body>
        </ScrollView>
      </SafeAreaView>
    </WorldBg>
  );
}
