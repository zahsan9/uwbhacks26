import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Blob from './Blob';
import { Body, Eyebrow, H1, H2, H3, Small, VQButton, VQCard, WorldBg } from './Components';
import { AVATAR_NAMES, STARTER_HABITS } from './models';
import { AvatarState, VQ } from './theme';

// ─── Signup ──────────────────────────────────────────────────────────
function SignupScreen({ onNext }: { onNext: () => void }) {
  return (
    <View style={{ flex: 1, backgroundColor: '#0a2656' }}>
      {/* Reflected ocean at top (flipped scaleY) */}
      <Image
        source={require('../assets/login_bg.png')}
        style={loginStyles.bgReflection}
        resizeMode="cover"
      />
      {/* Ocean scene in lower portion */}
      <Image
        source={require('../assets/login_bg.png')}
        style={loginStyles.bgOcean}
        resizeMode="cover"
      />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ transform: [{ rotate: '-8.61deg' }] }}>
            <Image
              source={require('../assets/login_logo.png')}
              style={loginStyles.logo}
              resizeMode="contain"
            />
          </View>
          <View style={{ transform: [{ rotate: '-8.63deg' }], marginTop: -8 }}>
            <Text style={loginStyles.tagline}>your habits, your world.</Text>
          </View>
        </View>
        <View style={loginStyles.buttonSection}>
          <TouchableOpacity style={loginStyles.btn} onPress={onNext} activeOpacity={0.8}>
            <Image source={require('../assets/icon_apple.png')} style={{ width: 16, height: 20 }} resizeMode="contain" />
            <Text style={loginStyles.btnText}>Continue with Apple</Text>
          </TouchableOpacity>
          <TouchableOpacity style={loginStyles.btn} onPress={onNext} activeOpacity={0.8}>
            <Image source={require('../assets/icon_google.png')} style={{ width: 20, height: 20 }} resizeMode="contain" />
            <Text style={loginStyles.btnText}>Continue with Google</Text>
          </TouchableOpacity>
          <View style={loginStyles.divider} />
          <TouchableOpacity style={loginStyles.btn} onPress={onNext} activeOpacity={0.8}>
            <Text style={loginStyles.btnText}>Sign up with Email</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
      {/* Character — panda sitting on the ocean floor, lower-left */}
      <Image
        source={require('../assets/login_character.png')}
        style={loginStyles.character}
        resizeMode="contain"
      />
    </View>
  );
}

const loginStyles = StyleSheet.create({
  bgReflection: {
    position: 'absolute',
    width: '100%',
    top: 0,
    height: '30%',
    opacity: 0.4,
    transform: [{ scaleY: -1 }],
  },
  bgOcean: {
    position: 'absolute',
    width: '100%',
    top: '28%',
    bottom: 0,
    height: '72%',
    opacity: 0.4,
  },
  logo: {
    width: 320,
    height: 334,
  },
  tagline: {
    fontFamily: 'PixelifySans_500Medium',
    fontSize: 18,
    color: '#ffffff',
  },
  buttonSection: {
    paddingHorizontal: 28,
    paddingBottom: 40,
    gap: 10,
  },
  btn: {
    backgroundColor: '#E8E0D4',
    borderWidth: 1,
    borderColor: 'rgba(232,224,212,0.6)',
    height: 47,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  btnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2a2a2a',
    letterSpacing: -0.48,
  },
  divider: {
    height: 1,
    backgroundColor: '#e1e1e1',
    marginHorizontal: 16,
  },
  character: {
    position: 'absolute',
    left: '-7.5%',
    top: '33%',
    width: '53%',
    aspectRatio: 1,
  },
});

// ─── HealthKit ───────────────────────────────────────────────────────
function HealthScreen({ onNext }: { onNext: () => void }) {
  const items = [
    { label: 'Steps & walks', sub: 'Daily step count & distance', icon: 'walk-outline'  as const },
    { label: 'Sleep',         sub: 'Bedtime & sleep duration',    icon: 'moon-outline'  as const },
    { label: 'Activity',      sub: 'Exercise minutes & calories', icon: 'flash-outline' as const },
  ];
  return (
    <WorldBg>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 48 }}>
          <Eyebrow style={{ marginBottom: 14, textAlign: 'center' }}>02 / 04</Eyebrow>
          <H1 style={{ marginBottom: 8, textAlign: 'center' }}>Connect Apple Health</H1>
          <Body style={{ marginBottom: 28, textAlign: 'center' }}>We read health data silently — no logging.</Body>

          {/* Icon */}
          <View style={{ alignItems: 'center', marginBottom: 28 }}>
            <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: 'rgba(220,60,60,0.12)', borderWidth: 1.5, borderColor: 'rgba(220,80,80,0.28)', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="heart" size={30} color="#e06060" />
            </View>
          </View>

          <VQCard>
            {items.map((item, idx) => (
              <View key={item.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, borderBottomWidth: idx < items.length - 1 ? 1 : 0, borderBottomColor: 'rgba(232,224,212,0.12)' }}>
                <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(232,224,212,0.08)', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={item.icon} size={17} color="rgba(232,224,212,0.75)" />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <H3>{item.label}</H3>
                  <Small>{item.sub}</Small>
                </View>
                <Ionicons name="checkmark" size={16} color="rgba(110,212,163,0.9)" />
              </View>
            ))}
          </VQCard>

          <View style={{ height: 28 }} />
          <VQButton label="Allow HealthKit access" onPress={onNext} />
          <View style={{ height: 10 }} />
          <VQButton label="Maybe later" style="ghost" onPress={onNext} />
        </ScrollView>
      </SafeAreaView>
    </WorldBg>
  );
}

// ─── Avatar picker ───────────────────────────────────────────────────
const AVATAR_STATES: AvatarState[] = ['thriving', 'healthy', 'sick', 'critical'];
const AVATAR_EMOTIONS = ['happy', 'calm', 'sleepy', 'sad'];

function AvatarScreen({ onNext }: { onNext: () => void }) {
  const [sel, setSel] = useState(0);
  return (
    <WorldBg>
      <SafeAreaView style={{ flex: 1, paddingHorizontal: 28 }}>
        <View style={{ paddingTop: 16, paddingBottom: 8 }}>
          <Eyebrow style={{ marginBottom: 8 }}>03 / 04</Eyebrow>
          <H1>Meet your companion</H1>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Blob state={AVATAR_STATES[sel]} scale={8} />
          <H2 style={{ marginTop: 12 }}>Mochi</H2>
          <Body>{AVATAR_EMOTIONS[sel]}</Body>
        </View>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
          {AVATAR_STATES.map((state, i) => (
            <Pressable key={i} onPress={() => setSel(i)} style={{ flex: 1, aspectRatio: 1, borderRadius: 6, backgroundColor: i === sel ? VQ.skySoft : VQ.surface, borderWidth: 2, borderColor: i === sel ? VQ.water3 : VQ.borderStrong, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              <Blob state={state} scale={3} />
            </Pressable>
          ))}
        </View>
        <View style={{ marginBottom: 24 }}>
          <VQButton label="Continue" onPress={onNext} />
        </View>
      </SafeAreaView>
    </WorldBg>
  );
}

const HABIT_ICON: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  sleep:    'moon-outline',
  steps:    'walk-outline',
  screen:   'phone-portrait-outline',
  gym:      'barbell-outline',
  read:     'book-outline',
  meditate: 'leaf-outline',
};

// ─── Habit picker ────────────────────────────────────────────────────
function HabitsScreen({ onDone }: { onDone: () => void }) {
  const [sel, setSel] = useState<Set<string>>(new Set(['sleep', 'steps', 'screen']));
  const toggle = (id: string) => {
    setSel(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  return (
    <WorldBg>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 48 }}>
          <Eyebrow style={{ marginBottom: 14 }}>04 / 04</Eyebrow>
          <H1 style={{ marginBottom: 8 }}>Pick your islands</H1>
          <Body style={{ marginBottom: 28 }}>Each habit grows its own island.</Body>

          <VQCard>
            {STARTER_HABITS.map((h, idx) => {
              const on = sel.has(h.id);
              return (
                <Pressable key={h.id} onPress={() => toggle(h.id)}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, borderBottomWidth: idx < STARTER_HABITS.length - 1 ? 1 : 0, borderBottomColor: 'rgba(232,224,212,0.12)' }}>
                    <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: on ? 'rgba(110,212,163,0.12)' : 'rgba(232,224,212,0.06)', borderWidth: 1, borderColor: on ? 'rgba(110,212,163,0.3)' : 'rgba(232,224,212,0.12)', alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name={HABIT_ICON[h.id]} size={17} color={on ? 'rgba(110,212,163,0.9)' : 'rgba(232,224,212,0.35)'} />
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <H3 style={{ color: on ? '#E8E0D4' : 'rgba(232,224,212,0.4)' }}>{h.label}</H3>
                      <Small>{h.hint}</Small>
                    </View>
                    <View style={{ width: 22, height: 22, borderRadius: 6, backgroundColor: on ? 'rgba(110,212,163,0.15)' : 'transparent', borderWidth: 1.5, borderColor: on ? 'rgba(110,212,163,0.5)' : 'rgba(232,224,212,0.2)', alignItems: 'center', justifyContent: 'center' }}>
                      {on && <Ionicons name="checkmark" size={13} color="rgba(110,212,163,0.9)" />}
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </VQCard>

          <View style={{ height: 28 }} />
          <VQButton label="Continue to habitats" onPress={onDone} />
        </ScrollView>
      </SafeAreaView>
    </WorldBg>
  );
}

// ─── Onboarding flow ─────────────────────────────────────────────────
export default function OnboardingView({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const next = () => setStep(s => s + 1);
  if (step === 0) return <SignupScreen onNext={next} />;
  if (step === 1) return <HealthScreen onNext={next} />;
  if (step === 2) return <AvatarScreen onNext={next} />;
  return <HabitsScreen onDone={onDone} />;
}
