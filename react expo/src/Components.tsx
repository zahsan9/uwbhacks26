import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AvatarState, VQ, stateColor, stateSoftColor } from './theme';

export const UI = {
  radius: {
    card: 16,
    control: 12,
    pill: 20,
    avatar: 55,
  },
  surface: {
    base:      'rgba(6,24,61,0.86)',
    raised:    'rgba(11,37,82,0.90)',
    warm:      'rgba(18,54,106,0.92)',
    cream:     'rgba(232,224,212,0.10)',
    creamSoft: 'rgba(232,224,212,0.08)',
  },
  border: {
    soft:        'rgba(214,211,198,0.14)',
    base:        'rgba(214,211,198,0.22)',
    strong:      'rgba(214,211,198,0.30)',
    sky:         'rgba(158,214,223,0.22)',
    skyStrong:   'rgba(158,214,223,0.30)',
    care:        'rgba(235,130,120,0.28)',
    careStrong:  'rgba(235,130,120,0.34)',
    good:        'rgba(110,212,163,0.24)',
    goodStrong:  'rgba(110,212,163,0.34)',
  },
  text: {
    cream: '#E8E0D4',
    muted: 'rgba(232,224,212,0.58)',
    soft:  'rgba(232,224,212,0.48)',
  },
} as const;

// ─── WorldBg ────────────────────────────────────────────────────────
export function WorldBg({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ flex: 1, backgroundColor: VQ.midnight }}>
      <LinearGradient
        colors={[VQ.midnight, VQ.midnightSoft, VQ.midnightLift]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
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
        colors={['#081d44', '#10335d', '#1a4e79', '#276a92', '#3f8ead']}
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
const btnFg:     Record<BtnStyle, string> = { primary: VQ.seashell, ghost: '#E8E0D4', oauthApple: '#fff', oauthGoogle: VQ.ink };
const btnBorder: Record<BtnStyle, string> = { primary: 'transparent', ghost: 'rgba(232,224,212,0.5)', oauthApple: 'transparent', oauthGoogle: VQ.borderStrong };
const btnShadow: Record<BtnStyle, string> = { primary: 'rgba(29,29,27,0.55)', ghost: 'rgba(29,29,27,0.25)', oauthApple: 'rgba(0,0,0,0.5)', oauthGoogle: 'rgba(29,29,27,0.15)' };

export function VQButton({ label, style = 'primary', onPress, disabled = false }: { label: string; style?: BtnStyle; onPress?: () => void; disabled?: boolean }) {
  const pressAnim = useRef(new Animated.Value(0)).current;

  const onPressIn  = () => { if (!disabled) Animated.timing(pressAnim, { toValue: 1, duration: 60, useNativeDriver: true }).start(); };
  const onPressOut = () => Animated.timing(pressAnim, { toValue: 0, duration: 60, useNativeDriver: true }).start();

  const translate = pressAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 3] });

  return (
    <Pressable onPress={disabled ? undefined : onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View style={{
        backgroundColor: btnBg[style], borderRadius: UI.radius.card, borderWidth: 2,
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
      backgroundColor: soft ? UI.surface.raised : warm ? UI.surface.warm : UI.surface.base,
      borderRadius: UI.radius.card, padding: 14,
      borderWidth: 1, borderColor: UI.border.base,
    }}>
      {children}
    </View>
  );
}

// ─── StatePill ────────────────────────────────────────────────────────
export function StatePill({ state }: { state: AvatarState }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: UI.radius.pill, borderWidth: 1.5, borderColor: stateSoftColor[state] }}>
      <View style={{ width: 5, height: 5, borderRadius: 1, backgroundColor: stateColor[state] }} />
      <Text style={{ fontFamily: 'PixelifySans_600SemiBold', fontSize: 9, letterSpacing: 1, color: stateColor[state], textTransform: 'uppercase' }}>{state}</Text>
    </View>
  );
}

// ─── WeekDashes ───────────────────────────────────────────────────────
export function WeekDashes({ state }: { state: AvatarState }) {
  const filled = state === 'thriving' ? 7 : state === 'healthy' ? 5 : state === 'sick' ? 2 : 1;
  const activeColor = state === 'thriving' || state === 'healthy' ? 'rgba(110,212,163,0.9)' : state === 'sick' ? 'rgba(237,183,80,0.9)' : 'rgba(199,80,80,0.9)';
  return (
    <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
      {[0,1,2,3,4,5,6].map(i => (
        <View key={i} style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: i < filled ? activeColor : 'rgba(232,224,212,0.15)' }} />
      ))}
    </View>
  );
}

// ─── Eyebrow / type helpers ───────────────────────────────────────────
export function Eyebrow({ children, style }: { children: string; style?: object }) {
  return <Text style={[{ fontFamily: 'PixelifySans_600SemiBold', fontSize: 9, letterSpacing: 2, color: UI.text.muted, textTransform: 'uppercase' }, style]}>{children}</Text>;
}

export function H1({ children, style }: { children: string; style?: object }) {
  return <Text style={[{ fontFamily: 'PixelifySans_600SemiBold', fontSize: 28, letterSpacing: 0.5, color: '#E8E0D4', lineHeight: 33 }, style]}>{children}</Text>;
}

export function H2({ children, style }: { children: string; style?: object }) {
  return <Text style={[{ fontFamily: 'PixelifySans_600SemiBold', fontSize: 20, letterSpacing: 0.3, color: '#E8E0D4' }, style]}>{children}</Text>;
}

export function H3({ children, style }: { children: React.ReactNode; style?: object }) {
  return <Text style={[{ fontFamily: 'PixelifySans_500Medium', fontSize: 14, letterSpacing: 0.2, color: '#E8E0D4' }, style]}>{children as string}</Text>;
}

export function Body({ children, style }: { children: string; style?: object }) {
  return <Text style={[{ fontFamily: 'PixelifySans_400Regular', fontSize: 13, color: UI.text.muted, lineHeight: 19 }, style]}>{children}</Text>;
}

export function Small({ children, style }: { children: React.ReactNode; style?: object }) {
  return <Text style={[{ fontFamily: 'PixelifySans_400Regular', fontSize: 11, color: UI.text.soft }, style]}>{children as string}</Text>;
}

export function StreakNum({ value }: { value: number }) {
  return <Text style={{ fontFamily: 'VT323_400Regular', fontSize: 24, color: VQ.tangerine, lineHeight: 26 }}>{value}</Text>;
}

// ─── SectionDivider ──────────────────────────────────────────────────
export function SectionDivider({ label, style }: { label: string; style?: object }) {
  return (
    <View style={[{ marginTop: 26, marginBottom: 2, flexDirection: 'row', alignItems: 'center', gap: 10 }, style]}>
      <View style={{ flex: 1, height: 1, backgroundColor: UI.border.sky }} />
      <Text style={{ fontFamily: 'PixelifySans_600SemiBold', fontSize: 10, color: UI.text.muted, textTransform: 'uppercase', letterSpacing: 1.8 }}>
        {label}
      </Text>
      <View style={{ flex: 1, height: 1, backgroundColor: UI.border.sky }} />
    </View>
  );
}

// ─── SpeechBubble ─────────────────────────────────────────────────────
export function SpeechBubble({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ backgroundColor: UI.surface.base, padding: 16, borderRadius: UI.radius.card, borderWidth: 1, borderColor: UI.border.soft }}>
      {children}
    </View>
  );
}

// ─── BackButton ───────────────────────────────────────────────────────
export function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress}>
      <View style={{ width: 34, height: 34, backgroundColor: UI.surface.base, borderRadius: UI.radius.control, borderWidth: 1, borderColor: UI.border.base, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 16, color: '#E8E0D4' }}>‹</Text>
      </View>
    </Pressable>
  );
}
