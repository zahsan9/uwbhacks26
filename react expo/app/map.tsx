import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Animated, Dimensions, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Line } from 'react-native-svg';
import Blob from '../src/Blob';
import { H2, WaterBg } from '../src/Components';
import Island from '../src/Island';
import { AvatarState, IslandType, VQ } from '../src/theme';

const { width: W, height: H } = Dimensions.get('window');

const ISLAND_STATES: Record<IslandType, AvatarState> = {
  walk: 'thriving', sleep: 'healthy', screen: 'sick', learn: 'sick', quest: 'sick',
};

const POSITIONS: Record<string, { x: number; y: number; scale: number }> = {
  home:   { x: W * 0.50, y: H * 0.42, scale: 2.8 },
  quest:  { x: W * 0.50, y: H * 0.10, scale: 2.0 },
  walk:   { x: W * 0.78, y: H * 0.24, scale: 2.3 },
  sleep:  { x: W * 0.22, y: H * 0.26, scale: 2.2 },
  screen: { x: W * 0.76, y: H * 0.60, scale: 2.1 },
  learn:  { x: W * 0.24, y: H * 0.62, scale: 2.1 },
};

const SATELLITES: IslandType[] = ['walk', 'sleep', 'screen', 'learn', 'quest'];

export default function MapScreen() {
  const router = useRouter();
  const [swimming, setSwimming] = useState<IslandType | null>(null);
  const swimAnim = useRef(new Animated.Value(0)).current;

  // Reset panda visibility when returning to this screen
  useFocusEffect(
    useCallback(() => {
      setSwimming(null);
      swimAnim.setValue(0);
    }, [])
  );

  const navigateTo = (type: IslandType) => {
    setSwimming(type);
    Animated.timing(swimAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start(() => {
      router.push({ pathname: '/island', params: { key: type, state: ISLAND_STATES[type] } });
    });
  };

  const home = POSITIONS.home;

  return (
    <WaterBg>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 8 }}>
          <View style={{ gap: 4 }}>
            <Text style={{ fontFamily: 'PixelifySans_600SemiBold', fontSize: 9, letterSpacing: 2, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase' }}>Your world</Text>
            <H2 style={{ color: '#fff' }}>Archipelago</H2>
          </View>
          <Pressable onPress={() => router.back()}>
            <View style={{ width: 36, height: 36, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 4, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#fff', fontSize: 14 }}>‹</Text>
            </View>
          </Pressable>
        </View>

        {/* Map canvas */}
        <View style={{ flex: 1, position: 'relative' }}>
          {/* Connecting lines */}
          <Svg style={{ position: 'absolute', width: '100%', height: '100%' }} width={W} height={H}>
            {SATELLITES.map(key => {
              const dest = POSITIONS[key];
              return (
                <Line key={key}
                  x1={home.x} y1={home.y} x2={dest.x} y2={dest.y}
                  stroke="rgba(255,255,255,0.22)" strokeWidth={1.5}
                  strokeDasharray="6,5"
                />
              );
            })}
          </Svg>

          {/* Satellite islands */}
          {SATELLITES.map(key => {
            const pos = POSITIONS[key];
            const locked = key === 'learn' || key === 'quest';
            return (
              <Pressable key={key} onPress={() => !locked && navigateTo(key)}
                style={{ position: 'absolute', left: pos.x - pos.scale * 16, top: pos.y - pos.scale * 11, alignItems: 'center' }}>
                <Island type={key} state={locked ? 'sick' : ISLAND_STATES[key]} scale={pos.scale} locked={locked} />
                <Text style={{ fontFamily: 'PixelifySans_500Medium', fontSize: 10, color: locked ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.85)', letterSpacing: 0.4, marginTop: 4 }}>{key}</Text>
              </Pressable>
            );
          })}

          {/* Home island — uses 'sleep' type so it looks different from walk satellite */}
          <View style={{ position: 'absolute', left: home.x - home.scale * 16, top: home.y - home.scale * 11, alignItems: 'center' }}>
            <View style={{ alignItems: 'center' }}>
              {!swimming && (
                <View style={{ marginBottom: -52, zIndex: 1, transform: [{ translateX: -28 }] }}>
                  <Blob state="healthy" scale={4} />
                </View>
              )}
              <Island type="learn" state="thriving" scale={home.scale} />
            </View>
            <Text style={{ fontFamily: 'PixelifySans_500Medium', fontSize: 10, color: 'rgba(255,255,255,0.85)', letterSpacing: 0.4, marginTop: 4 }}>home</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24, paddingBottom: 16 }}>
          <Text style={{ fontFamily: 'PixelifySans_400Regular', fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>Tap an island to visit</Text>
          <Text style={{ fontFamily: 'PixelifySans_400Regular', fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>Health 78</Text>
        </View>
      </SafeAreaView>
    </WaterBg>
  );
}
