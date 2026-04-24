import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Blob from '../../src/Blob';
import { Body, Eyebrow, H1, H2, H3, Small, VQCard, WorldBg } from '../../src/Components';
import { VQ } from '../../src/theme';

function SettingsRow({ label, value, onPress, danger }: { label: string; value?: string; onPress?: () => void; danger?: boolean }) {
  return (
    <Pressable onPress={onPress}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: VQ.border }}>
        <H3 style={{ flex: 1, color: danger ? VQ.red : VQ.ink }}>{label}</H3>
        {value && <Small>{value}</Small>}
        {onPress && !danger && <Text style={{ color: VQ.inkDim, fontSize: 14, marginLeft: 6 }}>›</Text>}
      </View>
    </Pressable>
  );
}

export default function ProfileScreen() {
  const router = useRouter();

  const handleLogout = async () => {
    await AsyncStorage.removeItem('onboarded');
    router.replace('/');
  };

  return (
    <WorldBg>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 44 }}>
          <H1 style={{ marginBottom: 20 }}>Profile</H1>

          {/* Avatar + stats */}
          <VQCard>
            <View style={{ alignItems: 'center', gap: 12, paddingVertical: 8 }}>
              <Blob state="healthy" scale={6} />
              <View style={{ alignItems: 'center', gap: 4 }}>
                <H2>Zainab</H2>
                <Small>Level 4 · 320 / 440 xp</Small>
              </View>
              <View style={{ flexDirection: 'row', gap: 24, marginTop: 4 }}>
                {[
                  { label: 'Day streak', val: '12 🔥' },
                  { label: 'Islands', val: '3 🏝️' },
                  { label: 'Health', val: '78 ❤️' },
                ].map(s => (
                  <View key={s.label} style={{ alignItems: 'center', gap: 2 }}>
                    <Text style={{ fontFamily: 'PixelifySans_600SemiBold', fontSize: 14, color: VQ.ink }}>{s.val}</Text>
                    <Text style={{ fontFamily: 'PixelifySans_400Regular', fontSize: 10, color: VQ.inkDim, textTransform: 'uppercase', letterSpacing: 1 }}>{s.label}</Text>
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
              <SettingsRow label="Apple Health" value="Connected ✓" />
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
            <Pressable onPress={handleLogout}>
              <View style={{ backgroundColor: VQ.red, borderRadius: 4, paddingVertical: 14, alignItems: 'center', shadowColor: '#8a1c1c', shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0 }}>
                <Text style={{ fontFamily: 'PixelifySans_600SemiBold', fontSize: 14, color: '#fff', letterSpacing: 0.5 }}>Log out</Text>
              </View>
            </Pressable>
          </View>

          <Body style={{ marginTop: 16, textAlign: 'center' }}>VitaQuest v1.0 · UWBHACKS 2026</Body>
        </ScrollView>
      </SafeAreaView>
    </WorldBg>
  );
}
