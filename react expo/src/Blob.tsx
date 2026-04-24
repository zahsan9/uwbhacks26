import { Image } from 'expo-image';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { AvatarState, VQ, bobAmount, bobDuration } from './theme';

const GIF_MAP: Record<AvatarState, any> = {
  thriving: require('../assets/cute_chubby_fat_blue_panda_round_roly-poly_body_si_happy_south.gif'),
  healthy:  require('../assets/cute_chubby_fat_blue_panda_round_roly-poly_body_si_standing_south.gif'),
  sick:     require('../assets/cute_chubby_fat_blue_panda_round_roly-poly_body_si_sleepy_south.gif'),
  critical: require('../assets/cute_chubby_fat_blue_panda_round_roly-poly_body_si_crying_south.gif'),
};

interface Props {
  state?: AvatarState;
  scale?: number;
  glow?: boolean;
  sparkle?: boolean;
}

export default function Blob({ state = 'healthy', scale = 4, glow = false, sparkle = false }: Props) {
  const bobAnim     = useRef(new Animated.Value(0)).current;
  const twinkleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const dur = bobDuration[state];
    const amt = bobAmount[state];
    Animated.loop(
      Animated.sequence([
        Animated.timing(bobAnim, { toValue: -amt, duration: dur / 2, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(bobAnim, { toValue: 0,    duration: dur / 2, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ])
    ).start();
    return () => bobAnim.stopAnimation();
  }, [state]);

  useEffect(() => {
    if (!glow && !sparkle) return;
    Animated.loop(
      Animated.sequence([
        Animated.timing(twinkleAnim, { toValue: 0.3, duration: 1000, useNativeDriver: true }),
        Animated.timing(twinkleAnim, { toValue: 1,   duration: 1000, useNativeDriver: true }),
      ])
    ).start();
    return () => twinkleAnim.stopAnimation();
  }, [glow, sparkle]);

  const size = scale * 20;

  return (
    <Animated.View style={{ transform: [{ translateY: bobAnim }], alignItems: 'center' }}>
      {glow && state === 'thriving' && (
        <Animated.View style={{
          position: 'absolute', width: size * 1.2, height: size * 1.2,
          borderRadius: size * 0.6,
          backgroundColor: '#EAC119', opacity: twinkleAnim,
          transform: [{ scale: 0.6 }],
        }} />
      )}
      <Image
        source={GIF_MAP[state]}
        style={{ width: size, height: size }}
        contentFit="contain"
      />
      {sparkle && state === 'thriving' && (
        <>
          <Animated.Text style={{ position: 'absolute', top: -8, left: 10, fontSize: 14, color: VQ.mustard, opacity: twinkleAnim }}>✦</Animated.Text>
          <Animated.Text style={{ position: 'absolute', top: 6, right: -6, fontSize: 10, color: VQ.tea, opacity: Animated.subtract(1.3, twinkleAnim) as any }}>✦</Animated.Text>
        </>
      )}
    </Animated.View>
  );
}
