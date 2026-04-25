import React, { useState } from 'react';
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
    fontSize: 20,
    color: '#ffffff',
  },
  buttonSection: {
    paddingHorizontal: 28,
    paddingBottom: 40,
    gap: 10,
  },
  btn: {
    backgroundColor: '#d9d9d9',
    borderWidth: 1,
    borderColor: '#e1e1e1',
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
    left: '13.7%',
    top: '58%',
    width: '28.9%',
    aspectRatio: 116 / 151,
  },
});

// ─── HealthKit ───────────────────────────────────────────────────────
function HealthScreen({ onNext }: { onNext: () => void }) {
  const rows = [
    { label: 'Steps & walks' }, { label: 'Sleep' }, { label: 'Activity' },
  ];
  return (
    <WorldBg>
      <ScrollView contentContainerStyle={{ padding: 28, paddingTop: 76 }}>
        <Eyebrow style={{ marginBottom: 12 }}>02 / 04</Eyebrow>
        <H1 style={{ marginBottom: 10 }}>Connect Apple Health</H1>
        <Body style={{ marginBottom: 28 }}>We read health data silently — no logging.</Body>
        {rows.map(r => (
          <View key={r.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: VQ.border }}>
            <View style={{ flex: 1 }}><H3>{r.label}</H3></View>
            <Text style={{ color: VQ.tea, fontSize: 16 }}>✓</Text>
          </View>
        ))}
        <View style={{ height: 32 }} />
        <VQButton label="Allow HealthKit access" onPress={onNext} />
        <View style={{ height: 8 }} />
        <VQButton label="Maybe later" style="ghost" onPress={onNext} />
      </ScrollView>
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
      <ScrollView contentContainerStyle={{ padding: 28, paddingTop: 76 }}>
        <Eyebrow style={{ marginBottom: 12 }}>04 / 04</Eyebrow>
        <H1 style={{ marginBottom: 10 }}>Pick your islands</H1>
        <Body style={{ marginBottom: 24 }}>Each habit grows its own island.</Body>
        {STARTER_HABITS.map(h => {
          const on = sel.has(h.id);
          return (
            <Pressable key={h.id} onPress={() => toggle(h.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: VQ.border }}>
              <View style={{ flex: 1, gap: 2 }}>
                <H3 style={{ color: on ? VQ.ink : VQ.inkSoft }}>{h.label}</H3>
                <Small>{h.hint}</Small>
              </View>
              <View style={{ width: 20, height: 20, borderRadius: 3, backgroundColor: on ? VQ.ink : 'transparent', borderWidth: 2, borderColor: on ? VQ.ink : VQ.borderStrong, alignItems: 'center', justifyContent: 'center' }}>
                {on && <Text style={{ color: VQ.seashell, fontSize: 11, fontWeight: 'bold' }}>✓</Text>}
              </View>
            </Pressable>
          );
        })}
        <View style={{ height: 28 }} />
        <VQButton label={`Begin quest · ${sel.size}`} onPress={onDone} />
      </ScrollView>
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
