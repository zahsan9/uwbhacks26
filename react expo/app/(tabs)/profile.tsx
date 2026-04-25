import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Animated, Pressable, ScrollView, Text, View } from 'react-native';
import { useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

const PANDA_GIF: Record<string, any> = {
  thriving: require('../../assets/cute_chubby_fat_blue_panda_round_roly-poly_body_si_happy_south.gif'),
  healthy:  require('../../assets/cute_chubby_fat_blue_panda_round_roly-poly_body_si_standing_south.gif'),
  sick:     require('../../assets/cute_chubby_fat_blue_panda_round_roly-poly_body_si_sleepy_south.gif'),
  critical: require('../../assets/cute_chubby_fat_blue_panda_round_roly-poly_body_si_crying_south.gif'),
};
import { Body, Eyebrow, H1, H2, H3, Small, VQCard, WorldBg } from '../../src/Components';
import { VQ } from '../../src/theme';

function SettingsRow({ label, value, onPress, danger }: { label: string; value?: string; onPress?: () => void; danger?: boolean }) {
  return (
    <Pressable onPress={onPress}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(232,224,212,0.12)' }}>
        <H3 style={{ flex: 1, color: danger ? VQ.red : '#E8E0D4' }}>{label}</H3>
        {value && <Small>{value}</Small>}
        {onPress && !danger && <Ionicons name="chevron-forward" size={14} color="rgba(232,224,212,0.4)" />}
      </View>
    </Pressable>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const pressAnim = useRef(new Animated.Value(0)).current;

  const handleLogout = async () => {
    await AsyncStorage.removeItem('onboarded');
    router.replace('/');
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
              <View style={{ width: 110, height: 110, borderRadius: 55, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(10,30,18,0.8)', overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(232,224,212,0.38)' }}>
                <Image source={PANDA_GIF['healthy']} style={{ width: 200, height: 200, marginTop: 80 }} contentFit="contain" />
              </View>
              <View style={{ alignItems: 'center', gap: 4 }}>
                <H2>Zainab</H2>
                <Small>Level 4 · 320 / 440 xp</Small>
              </View>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 4, width: '100%' }}>
                {[
                  { label: 'streak',  val: '12',  icon: 'flame'          as const, color: '#e07a20' },
                  { label: 'islands', val: '3',   icon: 'map-outline'    as const, color: 'rgba(110,212,163,0.9)' },
                  { label: 'health',  val: '78',  icon: 'heart'          as const, color: '#e06060' },
                ].map(s => (
                  <View key={s.label} style={{ flex: 1, backgroundColor: 'rgba(10,26,14,0.60)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(232,224,212,0.38)', padding: 12, alignItems: 'center', gap: 6 }}>
                    <Ionicons name={s.icon} size={18} color={s.color} />
                    <Text style={{ fontFamily: 'PixelifySans_700Bold', fontSize: 18, color: '#E8E0D4', lineHeight: 20 }}>{s.val}</Text>
                    <Text style={{ fontFamily: 'PixelifySans_400Regular', fontSize: 9, color: 'rgba(232,224,212,0.5)', textTransform: 'uppercase', letterSpacing: 1 }}>{s.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          </VQCard>

          {/* Account */}
          <View style={{ marginTop: 24 }}>
            <Eyebrow style={{ marginBottom: 8 }}>Account</Eyebrow>
            <VQCard>
              <SettingsRow label="Username" value="zainab" />
              <SettingsRow label="Email" value="zainab@email.com" />
              <SettingsRow label="Change password" onPress={() => {}} />
            </VQCard>
          </View>

          {/* Health */}
          <View style={{ marginTop: 20 }}>
            <Eyebrow style={{ marginBottom: 8 }}>Health & Data</Eyebrow>
            <VQCard>
              {/* Apple Health row */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(232,224,212,0.12)' }}>
                <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(220,60,60,0.15)', borderWidth: 1, borderColor: 'rgba(220,80,80,0.3)', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="heart" size={18} color="#e06060" />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={{ fontFamily: 'PixelifySans_500Medium', fontSize: 14, color: '#E8E0D4' }}>Apple Health</Text>
                  <Text style={{ fontFamily: 'PixelifySans_400Regular', fontSize: 11, color: 'rgba(232,224,212,0.5)' }}>Steps · Sleep · Heart rate</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(110,212,163,0.12)', borderWidth: 1, borderColor: 'rgba(110,212,163,0.3)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(110,212,163,0.9)' }} />
                  <Text style={{ fontFamily: 'PixelifySans_600SemiBold', fontSize: 11, color: 'rgba(110,212,163,0.9)' }}>Connected</Text>
                </View>
              </View>
              <SettingsRow label="Manage habits" onPress={() => {}} />
              <SettingsRow label="Export data" onPress={() => {}} />
            </VQCard>
          </View>

          {/* Preferences */}
          <View style={{ marginTop: 20 }}>
            <Eyebrow style={{ marginBottom: 8 }}>Preferences</Eyebrow>
            <VQCard>
              <SettingsRow label="Notifications" value="On" onPress={() => {}} />
              <SettingsRow label="Daily reminder" value="9:00 AM" onPress={() => {}} />
            </VQCard>
          </View>

          {/* Log out */}
          <View style={{ marginTop: 24 }}>
            <Pressable onPress={handleLogout} onPressIn={onPressIn} onPressOut={onPressOut}>
              <Animated.View style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                backgroundColor: 'rgba(180,50,50,0.12)',
                borderRadius: 16, borderWidth: 1, borderColor: 'rgba(200,80,80,0.45)',
                paddingVertical: 16,
                transform: [{ translateX: translate }, { translateY: translate }],
              }}>
                <Ionicons name="log-out-outline" size={16} color="rgba(220,100,100,0.9)" />
                <Text style={{ fontFamily: 'PixelifySans_600SemiBold', fontSize: 14, color: 'rgba(220,100,100,0.9)', letterSpacing: 0.5 }}>Log out</Text>
              </Animated.View>
            </Pressable>
          </View>

          <Body style={{ marginTop: 16, textAlign: 'center' }}>HABITAT v1.0 · UWBHACKS 2026</Body>
        </ScrollView>
      </SafeAreaView>
    </WorldBg>
  );
}
