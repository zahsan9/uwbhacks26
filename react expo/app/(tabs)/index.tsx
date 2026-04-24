import { useRouter } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Blob from '../../src/Blob';
import { Body, Eyebrow, H2, H3, StreakNum, VQButton, VQCard, WeekDashes, WorldBg } from '../../src/Components';
import { sampleHabits } from '../../src/models';
import { AvatarState, IslandType, VQ, avatarMessage } from '../../src/theme';

const AVATAR_STATE: AvatarState = 'healthy';

const HABIT_ICON: Record<IslandType, string> = {
  walk: '🚶', sleep: '🌙', screen: '📱', learn: '📚', quest: '✨',
};

export default function LandingScreen() {
  const router = useRouter();
  return (
    <WorldBg>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 }}>
            <View style={{ gap: 4 }}>
              <Eyebrow>Day 12</Eyebrow>
              <H2>Hi, Zainab</H2>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 2 }}>
              <Text style={{ fontFamily: 'VT323_400Regular', fontSize: 22, color: VQ.tangerine, lineHeight: 22 }}>Lv 4</Text>
              <Text style={{ fontFamily: 'PixelifySans_400Regular', fontSize: 10, color: VQ.inkDim }}>320 / 440 xp</Text>
            </View>
          </View>

          {/* Avatar card */}
          <View style={{ marginHorizontal: 20, marginVertical: 12, backgroundColor: VQ.surface, borderRadius: 8, borderWidth: 1.5, borderColor: VQ.border, overflow: 'hidden', shadowColor: 'rgba(29,29,27,0.12)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 8 }}>
            <View style={{ alignItems: 'center', paddingTop: 24, paddingBottom: 8 }}>
              <Blob state={AVATAR_STATE} scale={7} />
            </View>
            <View style={{ paddingHorizontal: 20, paddingBottom: 20, alignItems: 'center', gap: 8 }}>
              <Text style={{ fontFamily: 'PixelifySans_400Regular', fontSize: 15, letterSpacing: 0.2, lineHeight: 22, color: VQ.ink, textAlign: 'center' }}>
                {'"'}{avatarMessage[AVATAR_STATE]}{'"'}
              </Text>
              <View style={{ flexDirection: 'row', gap: 16, marginTop: 4 }}>
                {[
                  { label: 'streak', val: '12 🔥' },
                  { label: 'health', val: '78/100 ❤️' },
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
              <Text style={{ fontFamily: 'PixelifySans_400Regular', fontSize: 11, color: VQ.inkDim }}>3 islands</Text>
            </View>
            <VQCard>
              {sampleHabits.map((h, idx) => (
                <View key={h.type} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: idx < sampleHabits.length - 1 ? 1 : 0, borderBottomColor: VQ.border }}>
                  <Text style={{ fontSize: 18 }}>{HABIT_ICON[h.type]}</Text>
                  <H3 style={{ flex: 1 }}>{h.type.charAt(0).toUpperCase() + h.type.slice(1)}</H3>
                  <WeekDashes state={h.state} />
                  <StreakNum value={h.streak} />
                </View>
              ))}
            </VQCard>
          </View>

          <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
            <VQButton label="Open world map" onPress={() => router.push('/map')} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </WorldBg>
  );
}
