import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Body, Eyebrow, H1, H2, H3, StreakNum, VQButton, VQCard, WeekDashes, WorldBg } from '../../src/Components';
import { sampleHabits } from '../../src/models';
import { AvatarState, IslandType, VQ, avatarMessage } from '../../src/theme';

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

function HabitRow({ h, idx, total }: { h: typeof sampleHabits[0]; idx: number; total: number }) {
  const [checked, setChecked] = useState(false);
  const popAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setChecked(c => !c);
    Animated.sequence([
      Animated.spring(popAnim, { toValue: 1.35, useNativeDriver: true, speed: 40, bounciness: 18 }),
      Animated.spring(popAnim, { toValue: 1,    useNativeDriver: true, speed: 30, bounciness: 6  }),
    ]).start();
  };

  return (
    <Pressable onPress={handlePress}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 17, borderBottomWidth: idx < total - 1 ? 1 : 0, borderBottomColor: 'rgba(232,224,212,0.12)' }}>
        <Animated.View style={{ transform: [{ scale: popAnim }], width: 32, height: 32, borderRadius: 8, backgroundColor: checked ? 'rgba(110,212,163,0.15)' : 'rgba(232,224,212,0.08)', borderWidth: 1, borderColor: checked ? 'rgba(110,212,163,0.4)' : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name={checked ? 'checkmark' : HABIT_ICON[h.type]} size={16} color={checked ? 'rgba(110,212,163,0.9)' : 'rgba(232,224,212,0.75)'} />
        </Animated.View>
        <Text style={{ flex: 1, fontFamily: 'PixelifySans_500Medium', fontSize: 13, color: checked ? 'rgba(232,224,212,0.45)' : '#E8E0D4', textDecorationLine: checked ? 'line-through' : 'none' }}>
          {h.type === 'screen' ? 'Screen time' : h.type.charAt(0).toUpperCase() + h.type.slice(1)}
        </Text>
        <WeekDashes state={h.state} />
        <View style={{ width: 36, alignItems: 'flex-end' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
            <Ionicons name="flame" size={11} color="rgba(232,224,212,0.5)" />
            <StreakNum value={h.streak} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export default function LandingScreen() {
  const router = useRouter();
  const glowAnim = useRef(new Animated.Value(0.25)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 0.55, duration: 1800, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.25, duration: 1800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

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
              <Text style={{ fontFamily: 'PixelifySans_400Regular', fontSize: 10, color: 'rgba(232,224,212,0.55)' }}>320 / 440 xp</Text>
            </View>
          </View>

          {/* Avatar card */}
          <View style={{ marginHorizontal: 20, marginVertical: 12, backgroundColor: 'rgba(10,26,14,0.88)', borderRadius: 16, borderWidth: 1.5, borderColor: 'rgba(232,224,212,0.35)', overflow: 'hidden' }}>
            <View style={{ alignItems: 'center', paddingTop: 24, paddingBottom: 8 }}>
              <View style={{ width: 110, height: 110, borderRadius: 55, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(10,30,18,0.8)', overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(232,224,212,0.38)' }}>
                <Image source={PANDA_GIF[AVATAR_STATE]} style={{ width: 200, height: 200, marginTop: 80 }} contentFit="contain" />
              </View>
            </View>
            <View style={{ paddingHorizontal: 20, paddingBottom: 20, alignItems: 'center', gap: 8 }}>
              <Text style={{ fontFamily: 'PixelifySans_400Regular', fontSize: 15, letterSpacing: 0.2, lineHeight: 22, color: '#E8E0D4', textAlign: 'center' }}>
                {'"'}{avatarMessage[AVATAR_STATE]}{'"'}
              </Text>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 8, width: '100%' }}>
                {[
                  { label: 'streak', val: '12 days', icon: 'flame' as IoniconName, color: '#e07a20' },
                  { label: 'health',  val: '78 / 100', icon: 'heart' as IoniconName, color: '#e06060' },
                ].map(item => (
                  <View key={item.label} style={{ flex: 1, backgroundColor: 'rgba(10,26,14,0.60)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(232,224,212,0.38)', padding: 14, alignItems: 'center', gap: 6 }}>
                    <Ionicons name={item.icon} size={20} color={item.color} />
                    <Text style={{ fontFamily: 'PixelifySans_700Bold', fontSize: 18, color: '#E8E0D4', lineHeight: 20 }}>{item.val}</Text>
                    <Text style={{ fontFamily: 'PixelifySans_400Regular', fontSize: 10, color: 'rgba(232,224,212,0.5)', textTransform: 'uppercase', letterSpacing: 1 }}>{item.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Habit rows */}
          <View style={{ paddingHorizontal: 20, marginTop: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
              <Eyebrow>Your world</Eyebrow>
              <Text style={{ fontFamily: 'PixelifySans_400Regular', fontSize: 11, color: 'rgba(232,224,212,0.55)' }}>3 islands</Text>
            </View>
            <VQCard>
              {sampleHabits.map((h, idx) => (
                <HabitRow key={h.type} h={h} idx={idx} total={sampleHabits.length} />
              ))}
            </VQCard>
          </View>

          <Pressable onPress={() => router.push('/map')} style={{ marginHorizontal: 20, marginTop: 16 }}>
            <View style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
              backgroundColor: '#E8E0D4', borderRadius: 16,
              borderWidth: 0,
              paddingVertical: 16, paddingHorizontal: 24,
              shadowColor: 'rgba(10,26,14,0.6)', shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0,
            }}>
              <Ionicons name="map-outline" size={18} color="#0a1a0e" />
              <Text style={{ fontFamily: 'PixelifySans_600SemiBold', fontSize: 15, color: '#0a1a0e', letterSpacing: 0.5 }}>
                My Habit Islands
              </Text>
              <Ionicons name="chevron-forward" size={15} color="rgba(10,26,14,0.5)" />
            </View>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </WorldBg>
  );
}
