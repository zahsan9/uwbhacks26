import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Blob from '../src/Blob';
import { BackButton, Eyebrow, H3, Small, StatePill, VQCard, WorldBg } from '../src/Components';
import Island from '../src/Island';
import { islandMeta, islandName } from '../src/models';
import { AvatarState, IslandType, VQ } from '../src/theme';

export default function IslandDetailScreen() {
  const router = useRouter();
  const { key, state } = useLocalSearchParams<{ key: IslandType; state: AvatarState }>();
  const type  = (key   as IslandType)  || 'walk';
  const st    = (state as AvatarState) || 'healthy';
  const meta  = islandMeta[type];
  const name  = islandName[type];

  const streak = meta.streak;
  // Show only boxes from when the habit started — 1 box per day elapsed since day 1.
  // For the current streak, all days are hits; the last box is today.
  const totalDays = Math.max(streak, 1);
  const pattern = Array.from({ length: totalDays }, (_, i) =>
    i === totalDays - 1 ? 'today' : 'hit'
  );

  const dayColor = (p: string) => ({ hit: '#6ed4a3', partial: '#ffc260', missed: '#d76060', today: '#ff8b6a', future: 'rgba(31,58,74,0.1)' }[p] ?? 'transparent');

  const todayLog: Record<AvatarState, string> = {
    thriving: '✓ pulled from HealthKit · 82% of goal',
    healthy:  'pulled from HealthKit · 68% of goal',
    sick:     'missed yesterday — a short walk recovers you',
    critical: '3 days missed — your island is wilting',
  };

  return (
    <WorldBg>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Everything scrolls — nav included */}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 44 }}>
          {/* Nav */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 28 }}>
            <BackButton onPress={() => router.back()} />
            <H3 style={{ flex: 1 }}>{name}</H3>
            <StatePill state={st} />
          </View>

          {/* Island hero */}
          <View style={{ alignItems: 'center', marginBottom: 36 }}>
            <View style={{ position: 'relative', alignItems: 'center' }}>
              <Island type={type} state={st} scale={4} />
              <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, alignItems: 'center', zIndex: 2 }}>
                <Blob state={st} scale={5} />
              </View>
            </View>
          </View>
          {/* Big stat */}
          <VQCard warm>
            <View style={{ alignItems: 'center', gap: 4 }}>
              <Text style={{ fontFamily: 'PixelifySans_700Bold', fontSize: 34, color: VQ.ink, lineHeight: 38 }}>{meta.stat}</Text>
              <Small>{meta.unit} · goal {meta.goal}</Small>
            </View>
          </VQCard>

          {/* Streak grid */}
          <VQCard>
            <View style={{ gap: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 16 }}>🔥</Text>
                <H3 style={{ flex: 1 }}>{meta.streak} day streak</H3>
                <Small>since day 1</Small>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                {pattern.map((p, i) => (
                  <View key={i} style={{ width: '8.5%', aspectRatio: 1, backgroundColor: dayColor(p), borderRadius: 1, borderWidth: p === 'today' ? 2 : 0, borderColor: '#ff8b6a' }} />
                ))}
              </View>
              <View style={{ flexDirection: 'row', gap: 14 }}>
                {[['Hit','#6ed4a3'], ['Missed','#d76060']] .map(([label, color]) => (
                  <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <View style={{ width: 10, height: 10, backgroundColor: color }} />
                    <Small>{label}</Small>
                  </View>
                ))}
              </View>
            </View>
          </VQCard>

          {/* Today's log */}
          <VQCard soft>
            <Eyebrow style={{ marginBottom: 6 }}>today's log</Eyebrow>
            <H3>{todayLog[st]}</H3>
          </VQCard>


          {/* XP / Level / Health */}
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
