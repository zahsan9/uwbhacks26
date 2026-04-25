import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { Eyebrow, H1, SectionDivider, UI, VQCard, WorldBg } from '../../src/Components';
import { sampleHabits } from '../../src/models';
import { AvatarState, IslandType, VQ, stateColor } from '../../src/theme';
import { setTabAccentMode } from '../../src/tabAccent';

const AVATAR_STATE: AvatarState = 'healthy';

const PANDA_GIF: Record<string, any> = {
  thriving: require('../../assets/cute_chubby_fat_blue_panda_round_roly-poly_body_si_happy_south.gif'),
  healthy:  require('../../assets/cute_chubby_fat_blue_panda_round_roly-poly_body_si_standing_south.gif'),
  sick:     require('../../assets/cute_chubby_fat_blue_panda_round_roly-poly_body_si_sleepy_south.gif'),
  critical: require('../../assets/cute_chubby_fat_blue_panda_round_roly-poly_body_si_crying_south.gif'),
};

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];
const HABIT_ICON: Record<IslandType, IoniconName> = {
  walk: 'walk-outline', sleep: 'moon-outline', screen: 'phone-portrait-outline', learn: 'book-outline', quest: 'star-outline',
};
const ISLAND_ART: Partial<Record<IslandType, any>> = {
  walk: require('../../assets/walk_island.png'),
  sleep: require('../../assets/sleep_island.png'),
  screen: require('../../assets/screen_island.png'),
};
const pondBlue = 'rgba(158,214,223,0.22)';
const cardRadius = UI.radius.card;

const ISLAND_STAT: Record<IslandType, { stat: string }> = {
  walk: { stat: '8.2k' },
  sleep: { stat: '7h 42m' },
  screen: { stat: '4h 18m' },
  learn: { stat: '--' },
  quest: { stat: '--' },
};
const HOME_HABIT_LABEL: Record<IslandType, string> = {
  walk: 'Steps',
  sleep: 'Sleep',
  screen: 'Screen Time',
  learn: 'Learning',
  quest: 'Quest',
};

function IslandStatCard({ h }: { h: typeof sampleHabits[0] }) {
  const needsCare = h.state === 'sick' || h.state === 'critical';
  const stat = ISLAND_STAT[h.type];

  return (
    <View style={{
      backgroundColor: UI.surface.cream,
      borderRadius: cardRadius, borderWidth: 1,
      borderColor: UI.border.base,
      padding: 12,
      position: 'relative',
      overflow: 'hidden',
    }}>
      <View style={{
        position: 'absolute', left: 0, top: 10, bottom: 10, width: 3,
        borderTopRightRadius: 2, borderBottomRightRadius: 2,
        backgroundColor: needsCare ? VQ.tangerine : 'rgba(142,178,170,0.68)',
      }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ width: 58, height: 42, alignItems: 'center', justifyContent: 'center' }}>
          {ISLAND_ART[h.type] ? (
            <Image source={ISLAND_ART[h.type]} style={{ width: 62, height: 39 }} contentFit="contain" />
          ) : (
            <Ionicons name={HABIT_ICON[h.type]} size={24} color="rgba(232,224,212,0.65)" />
          )}
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={{ fontFamily: 'PixelifySans_700Bold', fontSize: 15, color: '#E8E0D4', lineHeight: 18 }}>
            {HOME_HABIT_LABEL[h.type]}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: stateColor[h.state] }} />
            <Text style={{ fontFamily: 'PixelifySans_400Regular', fontSize: 11, color: UI.text.muted }}>
              {needsCare ? 'Needs Care' : 'Stable'}
            </Text>
          </View>
        </View>
        <View style={{ width: 88, alignItems: 'flex-end', gap: 4 }}>
          <Text style={{ width: '100%', textAlign: 'right', fontFamily: 'VT323_400Regular', fontSize: 25, color: '#E8E0D4', lineHeight: 24 }}>{stat.stat}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 5, width: '100%' }}>
            <View style={{ minWidth: 45, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 3 }}>
              <Ionicons name="flame" size={11} color={VQ.tangerine} />
              <Text style={{ fontFamily: 'VT323_400Regular', fontSize: 21, color: VQ.tangerine, lineHeight: 21 }}>{h.streak}</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

export default function LandingScreen() {
  useFocusEffect(
    useCallback(() => {
      setTabAccentMode('green');
    }, [])
  );

  return (
    <WorldBg>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
            <View style={{ gap: 2 }}>
              <Eyebrow>Day 12</Eyebrow>
              <H1>Hi, Zainab</H1>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 1, paddingRight: 2 }}>
              <Text style={{ fontFamily: 'VT323_400Regular', fontSize: 22, color: VQ.tangerine, lineHeight: 22 }}>Lv 4</Text>
              <Text style={{ fontFamily: 'PixelifySans_400Regular', fontSize: 10, color: 'rgba(232,224,212,0.55)' }}>320 / 440 XP</Text>
            </View>
          </View>

          {/* Avatar card */}
          <View style={{ marginHorizontal: 20, marginVertical: 12, backgroundColor: UI.surface.raised, borderRadius: cardRadius, borderWidth: 1.5, borderColor: UI.border.base, overflow: 'hidden' }}>
            <View style={{ alignItems: 'center', paddingTop: 24, paddingBottom: 8 }}>
              <View style={{ width: 110, height: 110, borderRadius: 55, alignItems: 'center', justifyContent: 'center', backgroundColor: UI.surface.raised, overflow: 'hidden', borderWidth: 1.5, borderColor: UI.border.base }}>
                <Image source={PANDA_GIF[AVATAR_STATE]} style={{ width: 200, height: 200, marginTop: 80 }} contentFit="contain" />
              </View>
            </View>
            <View style={{ paddingHorizontal: 20, paddingBottom: 20, alignItems: 'center', gap: 8 }}>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 8, width: '100%' }}>
                {[
                  { label: 'Streak', val: '12 Days', icon: 'flame' as IoniconName, color: '#e07a20', bg: UI.surface.creamSoft, border: UI.border.base },
                  { label: 'Health',  val: '78 / 100', icon: 'heart' as IoniconName, color: '#e06060', bg: 'rgba(158,214,223,0.08)', border: pondBlue },
                ].map(item => (
                  <View key={item.label} style={{ flex: 1, backgroundColor: UI.surface.cream, borderRadius: cardRadius, borderWidth: 1, borderColor: UI.border.base, padding: 14, alignItems: 'center', gap: 6 }}>
                    <Ionicons name={item.icon} size={20} color={item.color} />
                    <Text style={{ fontFamily: 'PixelifySans_700Bold', fontSize: 18, color: '#E8E0D4', lineHeight: 20 }}>{item.val}</Text>
                    <Text style={{ fontFamily: 'PixelifySans_400Regular', fontSize: 10, color: UI.text.soft, textTransform: 'uppercase', letterSpacing: 1 }}>{item.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* World stats */}
          <SectionDivider label="Habitat" style={{ marginHorizontal: 20, marginTop: 22 }} />
          <View style={{ paddingHorizontal: 20, marginTop: 8 }}>
            <View style={{ paddingHorizontal: 14, marginBottom: 10 }}>
              <Eyebrow>Your world</Eyebrow>
            </View>
            <VQCard>
              <View style={{ gap: 10 }}>
                <View style={{ gap: 7, paddingHorizontal: 2, paddingBottom: 4 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ fontFamily: 'PixelifySans_700Bold', fontSize: 16, color: '#E8E0D4', lineHeight: 19 }}>Habitat Strength</Text>
                    <Text style={{ fontFamily: 'VT323_400Regular', fontSize: 25, color: 'rgba(110,212,163,0.95)', lineHeight: 25 }}>78%</Text>
                  </View>
                  <View style={{ height: 14, borderRadius: 7, backgroundColor: 'rgba(41,68,42,0.68)', overflow: 'hidden', borderWidth: 1, borderColor: UI.border.base }}>
                    <View style={{ width: '78%', height: '100%', flexDirection: 'row', backgroundColor: 'rgba(110,165,96,0.92)' }}>
                      {[0, 1, 2, 3, 4, 5].map(i => (
                        <View key={i} style={{ flex: 1, borderRightWidth: i === 5 ? 0 : 2, borderRightColor: 'rgba(44,91,50,0.42)' }}>
                          <View style={{ height: 3, marginTop: 2, marginHorizontal: 7, borderRadius: 2, backgroundColor: i % 2 === 0 ? 'rgba(210,238,180,0.34)' : UI.border.base }} />
                        </View>
                      ))}
                    </View>
                  </View>
                </View>

                {sampleHabits.map(h => (
                  <IslandStatCard key={h.type} h={h} />
                ))}
              </View>
            </VQCard>
          </View>

        </ScrollView>
      </SafeAreaView>
    </WorldBg>
  );
}
