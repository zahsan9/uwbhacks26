import AsyncStorage from "@react-native-async-storage/async-storage";
import * as WebBrowser from "expo-web-browser";
import React, { useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";
import Blob from "./Blob";
import {
  Body,
  Eyebrow,
  H1,
  H2,
  H3,
  Small,
  VQButton,
  VQCard,
  WorldBg,
} from "./Components";
import { AVATAR_NAMES, STARTER_HABITS } from "./models";
import { AvatarState, VQ } from "./theme";

WebBrowser.maybeCompleteAuthSession();

// ─── Signup ──────────────────────────────────────────────────────────
function SignupScreen({ onNext, onDone }: { onNext: () => void; onDone: () => void }) {
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: "vitaquest://",
          skipBrowserRedirect: true,
        },
      });
      if (error || !data.url) throw error ?? new Error("No OAuth URL returned");

      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        "vitaquest://",
      );
      if (result.type !== "success") return;

      // Try PKCE code exchange first, fall back to implicit token parsing
      const hasCode = result.url.includes("code=");
      const hasToken = result.url.includes("access_token=");

      if (hasCode) {
        const { error: sessionError } =
          await supabase.auth.exchangeCodeForSession(result.url);
        if (sessionError) throw sessionError;
      } else if (hasToken) {
        const fragment = result.url.split("#")[1] ?? result.url.split("?")[1] ?? "";
        const params = new URLSearchParams(fragment);
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token") ?? "";
        if (!accessToken) throw new Error("No access token in redirect URL");
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (sessionError) throw sessionError;
      } else {
        throw new Error(`Unexpected redirect URL: ${result.url}`);
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        const { data: existing } = await supabase
          .from("users")
          .select("id")
          .eq("id", session.user.id)
          .single();

        if (!existing) {
          const fallbackUsername = `user_${session.user.id.slice(0, 8)}`;
          await supabase.from("users").insert({
            id: session.user.id,
            google_id: session.user.user_metadata?.sub ?? null,
            username:
              session.user.user_metadata?.full_name ?? fallbackUsername,
            avatar_id: 1,
            total_xp: 0,
          });
        }

        // Returning user who already has habits — skip onboarding entirely
        const { data: habits } = await supabase
          .from("habits")
          .select("id")
          .eq("user_id", session.user.id)
          .limit(1);
        if (habits && habits.length > 0) {
          onDone();
          return;
        }
      }

      onNext();
    } catch (err) {
      console.warn("[SignupScreen] OAuth error:", err);
      Alert.alert("Sign-in failed", String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#071d4a" }}>
      <Image
        source={require("../assets/login_screen_ref.png")}
        style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0 }}
        resizeMode="stretch"
      />
      <View
        style={[
          loginStyles.buttonSection,
          { position: "absolute", bottom: 0, left: 0, right: 0 },
        ]}
      >
        <TouchableOpacity
          style={loginStyles.btn}
          onPress={onNext}
          activeOpacity={0.8}
        >
          <Image
            source={require("../assets/icon_apple.png")}
            style={{ width: 16, height: 20 }}
            resizeMode="contain"
          />
          <Text style={loginStyles.btnText}>Continue with Apple</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[loginStyles.btn, loading && { opacity: 0.6 }]}
          onPress={handleGoogleSignIn}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Image
            source={require("../assets/icon_google.png")}
            style={{ width: 20, height: 20 }}
            resizeMode="contain"
          />
          <Text style={loginStyles.btnText}>
            {loading ? "Signing in…" : "Continue with Google"}
          </Text>
        </TouchableOpacity>
        <View style={loginStyles.divider} />
        <TouchableOpacity
          style={loginStyles.btn}
          onPress={onNext}
          activeOpacity={0.8}
        >
          <Text style={loginStyles.btnText}>Sign up with Email</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const loginStyles = StyleSheet.create({
  logo: {
    width: 250,
    height: 260,
  },
  character: {
    width: 210,
    height: 210,
    marginLeft: -30,
  },
  tagline: {
    fontFamily: "PixelifySans_500Medium",
    fontSize: 18,
    color: "#ffffff",
  },
  buttonSection: {
    paddingHorizontal: 28,
    paddingBottom: 40,
    gap: 10,
  },
  btn: {
    backgroundColor: "#d9d9d9",
    borderWidth: 1,
    borderColor: "#e1e1e1",
    height: 47,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  btnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2a2a2a",
    letterSpacing: -0.48,
  },
  divider: {
    height: 1,
    backgroundColor: "#e1e1e1",
    marginHorizontal: 16,
  },
});

// ─── HealthKit ───────────────────────────────────────────────────────
function HealthScreen({ onNext }: { onNext: () => void }) {
  const rows = [
    { label: "Steps & walks" },
    { label: "Sleep" },
    { label: "Activity" },
  ];
  return (
    <WorldBg>
      <ScrollView contentContainerStyle={{ padding: 28, paddingTop: 76 }}>
        <Eyebrow style={{ marginBottom: 12 }}>02 / 04</Eyebrow>
        <H1 style={{ marginBottom: 10 }}>Connect Apple Health</H1>
        <Body style={{ marginBottom: 28 }}>
          We read health data silently — no logging.
        </Body>
        {rows.map((r) => (
          <View
            key={r.label}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 14,
              paddingVertical: 16,
              borderBottomWidth: 1,
              borderBottomColor: VQ.border,
            }}
          >
            <View style={{ flex: 1 }}>
              <H3>{r.label}</H3>
            </View>
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
const AVATAR_STATES: AvatarState[] = [
  "thriving",
  "healthy",
  "sick",
  "critical",
];
const AVATAR_EMOTIONS = ["happy", "calm", "sleepy", "sad"];

function AvatarScreen({ onNext }: { onNext: () => void }) {
  const [sel, setSel] = useState(0);
  return (
    <WorldBg>
      <SafeAreaView style={{ flex: 1, paddingHorizontal: 28 }}>
        <View style={{ paddingTop: 16, paddingBottom: 8 }}>
          <Eyebrow style={{ marginBottom: 8 }}>03 / 04</Eyebrow>
          <H1>Meet your companion</H1>
        </View>
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <Blob state={AVATAR_STATES[sel]} scale={8} />
          <H2 style={{ marginTop: 12 }}>Mochi</H2>
          <Body>{AVATAR_EMOTIONS[sel]}</Body>
        </View>
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
          {AVATAR_STATES.map((state, i) => (
            <Pressable
              key={i}
              onPress={() => setSel(i)}
              style={{
                flex: 1,
                aspectRatio: 1,
                borderRadius: 6,
                backgroundColor: i === sel ? VQ.skySoft : VQ.surface,
                borderWidth: 2,
                borderColor: i === sel ? VQ.water3 : VQ.borderStrong,
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
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

// Maps onboarding habit IDs → backend prototype keys (must match vitaquest-backend/prototypes/*.npy)
const HABIT_ID_KEY_MAP: Record<string, string> = {
  sleep: 'sleep',
  steps: 'walk',
  screen: 'screen',
  gym: 'gym',
  running: 'running',
  read: 'reading',
  cooking: 'cooking',
  meditate: 'meditation',
};

// Human-readable names for the habits table
const HABIT_NAME_MAP: Record<string, string> = {
  sleep: 'Sleep',
  steps: 'Walking',
  screen: 'Screen Time',
  gym: 'Workout',
  running: 'Running',
  read: 'Reading',
  cooking: 'Cooking',
  meditate: 'Meditation',
};

const MAX_TOTAL = 5;
const MAX_ACTIVE = 3;

function HabitsScreen({ onDone }: { onDone: () => void }) {
  const [selOrder, setSelOrder] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const toggle = (id: string) => {
    setSelOrder(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= MAX_TOTAL) return prev;
      return [...prev, id];
    });
  };

  const idxOf = (id: string) => selOrder.indexOf(id);
  const isSelected = (id: string) => selOrder.includes(id);
  const isLocked = (id: string) => idxOf(id) >= MAX_ACTIVE;

  const handleBeginQuest = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        Alert.alert('Not signed in', 'Please sign in first.');
        return;
      }
      const userId = session.user.id;

      const habitRows = selOrder.map((id, i) => {
        const isHealthKit = id === 'sleep' || id === 'steps' || id === 'screen';
        const hkType = id === 'sleep' ? 'sleep' : id === 'steps' ? 'steps' : id === 'screen' ? 'screentime' : null;
        return {
          user_id: userId,
          name: HABIT_NAME_MAP[id] ?? id,
          habit_id_key: HABIT_ID_KEY_MAP[id] ?? id,
          is_healthkit: isHealthKit,
          healthkit_type: hkType,
          tier: i < MAX_ACTIVE ? 1 : 2, // tier 2 = locked initially
        };
      });

      // Delete any existing habits for this user first (idempotent re-run)
      await supabase.from('habits').delete().eq('user_id', userId);

      const { error } = await supabase.from('habits').insert(habitRows);
      if (error) {
        console.warn('[HabitsScreen] habits insert error:', error.message);
        Alert.alert('Error', 'Failed to save habits. Please try again.');
        return;
      }

      console.log('[HabitsScreen] seeded', habitRows.length, 'habits for user', userId);

      // Persist selected habits so the map knows which 5 islands to show and which are locked
      const slots = selOrder.map((id, i) => ({
        habitId: id,
        key: HABIT_ID_KEY_MAP[id] ?? id,
        label: HABIT_NAME_MAP[id] ?? id,
        locked: i >= MAX_ACTIVE,
      }));
      await AsyncStorage.setItem('selectedHabitSlots', JSON.stringify(slots));

      onDone();
    } catch (err) {
      console.warn('[HabitsScreen] unexpected error:', err);
      Alert.alert('Error', String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <WorldBg>
      <ScrollView contentContainerStyle={{ padding: 28, paddingTop: 76 }}>
        <Eyebrow style={{ marginBottom: 12 }}>04 / 04</Eyebrow>
        <H1 style={{ marginBottom: 10 }}>Pick your islands</H1>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <Body>First 3 are active. Last 2 start locked.</Body>
        </View>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
          <View style={{ flex: 1, backgroundColor: VQ.skySoft, borderRadius: 6, paddingVertical: 8, alignItems: 'center' }}>
            <Small style={{ color: VQ.water3, fontFamily: 'PixelifySans_600SemiBold' }}>active</Small>
            <Text style={{ fontFamily: 'PixelifySans_700Bold', fontSize: 20, color: VQ.water3, lineHeight: 24 }}>{Math.min(selOrder.length, MAX_ACTIVE)} / {MAX_ACTIVE}</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: VQ.seashellDeep, borderRadius: 6, paddingVertical: 8, alignItems: 'center' }}>
            <Small style={{ color: VQ.inkDim, fontFamily: 'PixelifySans_600SemiBold' }}>locked</Small>
            <Text style={{ fontFamily: 'PixelifySans_700Bold', fontSize: 20, color: VQ.inkDim, lineHeight: 24 }}>{Math.max(0, selOrder.length - MAX_ACTIVE)} / {MAX_TOTAL - MAX_ACTIVE}</Text>
          </View>
        </View>
        {STARTER_HABITS.map((h) => {
          const on = isSelected(h.id);
          const locked = isLocked(h.id);
          const atMax = selOrder.length >= MAX_TOTAL && !on;
          return (
            <Pressable
              key={h.id}
              onPress={() => toggle(h.id)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
                paddingVertical: 14,
                borderBottomWidth: 1,
                borderBottomColor: VQ.border,
                opacity: atMax ? 0.3 : 1,
              }}
            >
              <View style={{ flex: 1, gap: 2 }}>
                <H3 style={{ color: on ? VQ.ink : VQ.inkSoft }}>{h.label}</H3>
                <Small>{h.hint}</Small>
              </View>
              {on && locked && (
                <Text style={{ fontSize: 13, color: VQ.inkDim }}>🔒</Text>
              )}
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 3,
                  backgroundColor: on && !locked ? VQ.ink : on && locked ? VQ.inkDim : 'transparent',
                  borderWidth: 2,
                  borderColor: on ? (locked ? VQ.inkDim : VQ.ink) : VQ.borderStrong,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {on && (
                  <Text style={{ color: VQ.seashell, fontSize: 11, fontWeight: 'bold' }}>✓</Text>
                )}
              </View>
            </Pressable>
          );
        })}
        <View style={{ height: 28 }} />
        <VQButton
          label={loading ? 'Saving…' : selOrder.length === 0 ? 'Pick 5 habits' : `Begin quest · ${selOrder.length} island${selOrder.length === 1 ? '' : 's'}`}
          onPress={handleBeginQuest}
          disabled={selOrder.length === 0}
        />
      </ScrollView>
    </WorldBg>
  );
}

// ─── Onboarding flow ─────────────────────────────────────────────────
export default function OnboardingView({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const next = () => setStep((s) => s + 1);
  if (step === 0) return <SignupScreen onNext={next} onDone={onDone} />;
  if (step === 1) return <HealthScreen onNext={next} />;
  if (step === 2) return <AvatarScreen onNext={next} />;
  return <HabitsScreen onDone={onDone} />;
}
