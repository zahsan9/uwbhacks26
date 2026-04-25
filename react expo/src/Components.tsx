import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AvatarState, VQ, stateColor, stateSoftColor } from './theme';

// ─── WorldBg ────────────────────────────────────────────────────────
export function WorldBg({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ flex: 1, backgroundColor: VQ.seashell }}>
      <LinearGradient
        colors={['#c8e8f0', '#d8eef2', VQ.seashell]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 0.7 }}
      />
      {children}
    </View>
  );
}

// ─── WaterBg ─────────────────────────────────────────────────────────
export function WaterBg({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={['#0d3d4d', '#1a5c70', '#2b7a8a', '#3d95a0', '#56b3bd']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
      />
      {children}
    </View>
  );
}

// ─── VQButton ────────────────────────────────────────────────────────
type BtnStyle = 'primary' | 'ghost' | 'oauthApple' | 'oauthGoogle';

const btnBg:     Record<BtnStyle, string> = { primary: VQ.ink, ghost: 'transparent', oauthApple: VQ.ink, oauthGoogle: '#fff' };
const btnFg:     Record<BtnStyle, string> = { primary: VQ.seashell, ghost: VQ.ink, oauthApple: '#fff', oauthGoogle: VQ.ink };
const btnBorder: Record<BtnStyle, string> = { primary: 'transparent', ghost: VQ.ink, oauthApple: 'transparent', oauthGoogle: VQ.borderStrong };
const btnShadow: Record<BtnStyle, string> = { primary: 'rgba(29,29,27,0.55)', ghost: 'rgba(29,29,27,0.25)', oauthApple: 'rgba(0,0,0,0.5)', oauthGoogle: 'rgba(29,29,27,0.15)' };

export function VQButton({ label, style = 'primary', onPress, disabled = false }: { label: string; style?: BtnStyle; onPress?: () => void; disabled?: boolean }) {
  const pressAnim = useRef(new Animated.Value(0)).current;

  const onPressIn  = () => { if (!disabled) Animated.timing(pressAnim, { toValue: 1, duration: 60, useNativeDriver: true }).start(); };
  const onPressOut = () => Animated.timing(pressAnim, { toValue: 0, duration: 60, useNativeDriver: true }).start();

  const translate = pressAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 3] });

  return (
    <Pressable onPress={disabled ? undefined : onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View style={{
        backgroundColor: btnBg[style], borderRadius: 4, borderWidth: 2,
        borderColor: btnBorder[style], paddingVertical: 13, paddingHorizontal: 22,
        alignItems: 'center',
        shadowColor: btnShadow[style], shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0,
        transform: [{ translateX: translate }, { translateY: translate }],
        opacity: disabled ? 0.4 : 1,
      }}>
        <Text style={{ fontFamily: 'PixelifySans_600SemiBold', fontSize: 14, letterSpacing: 0.5, color: btnFg[style] }}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

// ─── VQCard ───────────────────────────────────────────────────────────
export function VQCard({ children, warm, soft }: { children: React.ReactNode; warm?: boolean; soft?: boolean }) {
  return (
    <View style={{
      backgroundColor: soft ? VQ.skySoft : warm ? VQ.seashellSoft : VQ.surface,
      borderRadius: 6, padding: 14,
      borderWidth: soft ? 0 : 1.5, borderColor: VQ.border,
    }}>
      {children}
    </View>
  );
}

// ─── StatePill ────────────────────────────────────────────────────────
export function StatePill({ state }: { state: AvatarState }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 3, borderWidth: 1.5, borderColor: stateSoftColor[state] }}>
      <View style={{ width: 5, height: 5, borderRadius: 1, backgroundColor: stateColor[state] }} />
      <Text style={{ fontFamily: 'PixelifySans_600SemiBold', fontSize: 9, letterSpacing: 1, color: stateColor[state], textTransform: 'uppercase' }}>{state}</Text>
    </View>
  );
}

// ─── WeekDashes ───────────────────────────────────────────────────────
export function WeekDashes({ state }: { state: AvatarState }) {
  const dashes = [0,1,2,3,4,5,6].map(i => {
    if (state === 'thriving') return VQ.tea;
    if (state === 'healthy')  return i < 5 ? VQ.tea : VQ.borderStrong;
    if (state === 'sick')     return i < 2 ? VQ.mustard : VQ.borderStrong;
    return i < 1 ? VQ.red : VQ.borderStrong;
  });
  return (
    <View style={{ flexDirection: 'row', gap: 3, width: 70 }}>
      {dashes.map((c, i) => <View key={i} style={{ flex: 1, height: 4, backgroundColor: c }} />)}
    </View>
  );
}

// ─── Eyebrow / type helpers ───────────────────────────────────────────
export function Eyebrow({ children, style }: { children: string; style?: object }) {
  return <Text style={[{ fontFamily: 'PixelifySans_600SemiBold', fontSize: 9, letterSpacing: 2, color: VQ.inkDim, textTransform: 'uppercase' }, style]}>{children}</Text>;
}

export function H1({ children, style }: { children: string; style?: object }) {
  return <Text style={[{ fontFamily: 'PixelifySans_600SemiBold', fontSize: 28, letterSpacing: 0.5, color: VQ.ink, lineHeight: 33 }, style]}>{children}</Text>;
}

export function H2({ children, style }: { children: string; style?: object }) {
  return <Text style={[{ fontFamily: 'PixelifySans_600SemiBold', fontSize: 20, letterSpacing: 0.3, color: VQ.ink }, style]}>{children}</Text>;
}

export function H3({ children, style }: { children: React.ReactNode; style?: object }) {
  return <Text style={[{ fontFamily: 'PixelifySans_500Medium', fontSize: 14, letterSpacing: 0.2, color: VQ.ink }, style]}>{children as string}</Text>;
}

export function Body({ children, style }: { children: string; style?: object }) {
  return <Text style={[{ fontFamily: 'PixelifySans_400Regular', fontSize: 13, color: VQ.inkSoft, lineHeight: 19 }, style]}>{children}</Text>;
}

export function Small({ children, style }: { children: React.ReactNode; style?: object }) {
  return <Text style={[{ fontFamily: 'PixelifySans_400Regular', fontSize: 11, color: VQ.inkDim }, style]}>{children as string}</Text>;
}

export function StreakNum({ value }: { value: number }) {
  return <Text style={{ fontFamily: 'VT323_400Regular', fontSize: 24, color: VQ.tangerine, lineHeight: 26 }}>{value}</Text>;
}

// ─── SpeechBubble ─────────────────────────────────────────────────────
export function SpeechBubble({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ backgroundColor: VQ.surface, padding: 16, borderRadius: 5, borderWidth: 2, borderColor: VQ.borderStrong }}>
      {children}
    </View>
  );
}

// ─── BackButton ───────────────────────────────────────────────────────
export function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress}>
      <View style={{ width: 34, height: 34, backgroundColor: VQ.surface, borderRadius: 4, borderWidth: 2, borderColor: VQ.borderStrong, alignItems: 'center', justifyContent: 'center', shadowColor: 'rgba(29,29,27,0.2)', shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1, shadowRadius: 0 }}>
        <Text style={{ fontSize: 16, color: '#1f3a4a' }}>‹</Text>
      </View>
    </Pressable>
  );
}
