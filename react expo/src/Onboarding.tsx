import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Blob from './Blob';
import { Body, Eyebrow, H1, H2, H3, Small, VQButton, VQCard, WorldBg } from './Components';
import { AVATAR_NAMES, STARTER_HABITS } from './models';
import { AvatarState, VQ } from './theme';

// ─── Signup ──────────────────────────────────────────────────────────
function SignupScreen({ onNext }: { onNext: () => void }) {
  return (
    <WorldBg>
      <View style={{ flex: 1, paddingHorizontal: 28, paddingTop: 80, paddingBottom: 36 }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <Blob state="thriving" scale={8} />
          <View style={{ alignItems: 'center', gap: 6 }}>
            <Text style={{ fontFamily: 'PixelifySans_700Bold', fontSize: 36, letterSpacing: 1, color: VQ.ink }}>VitaQuest</Text>
            <Body>one world. every habit.</Body>
          </View>
        </View>
        <View style={{ gap: 10 }}>
          <VQButton label="Continue with Apple" style="oauthApple" onPress={onNext} />
          <VQButton label="Continue with Google" style="oauthGoogle" onPress={onNext} />
          <VQButton label="Sign up with email" style="ghost" onPress={onNext} />
        </View>
      </View>
    </WorldBg>
  );
}

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
