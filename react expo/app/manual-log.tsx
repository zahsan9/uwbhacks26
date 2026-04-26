import { BackButton, Body, H2, VQButton, WorldBg, UI } from "@/Components";
import { supabase } from "../lib/supabase";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { VQ } from "@/theme";

interface HabitOption {
  id: string;
  name: string;
  habit_id_key: string;
}

export default function ManualLogScreen() {
  const router = useRouter();
  const { habitIds: habitIdsParam } = useLocalSearchParams<{ habitIds?: string }>();
  const habitIds = habitIdsParam ? habitIdsParam.split(",").filter(Boolean) : [];

  const [habits, setHabits] = useState<HabitOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchHabits() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/(tabs)"); return; }

      let query = supabase
        .from("habits")
        .select("id, name, habit_id_key")
        .eq("user_id", session.user.id);

      if (habitIds.length > 0) {
        query = query.in("habit_id_key", habitIds);
      }

      const { data } = await query;
      setHabits(data ?? []);
      setLoading(false);
    }
    fetchHabits();
  }, []);

  async function handleLog() {
    if (!selected) return;
    setSaving(true);
    try {
      const habit = habits.find(h => h.id === selected);
      if (!habit) { setSaving(false); return; }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/(tabs)"); return; }
      const userId = session.user.id;

      const { data: userRow } = await supabase
        .from("users")
        .select("total_xp")
        .eq("id", userId)
        .single();

      const { error: logErr } = await supabase.from("habit_logs").insert({
        habit_id: habit.id,
        user_id: userId,
        verified_by: "manual",
        confidence: 0,
        xp_awarded: 25,
      });

      if (logErr) {
        console.warn("[manual-log] habit_logs insert error:", logErr.message);
        setSaving(false);
        return;
      }

      const newXp = (userRow?.total_xp ?? 0) + 25;
      const { error: xpErr } = await supabase
        .from("users")
        .update({ total_xp: newXp })
        .eq("id", userId);

      if (xpErr) {
        console.warn("[manual-log] total_xp update error:", xpErr.message);
      } else {
        console.log("[manual-log] logged", habit.habit_id_key, "total_xp →", newXp);
      }

      router.replace("/(tabs)");
    } catch (err) {
      console.warn("[manual-log] unexpected error:", err);
      setSaving(false);
    }
  }

  return (
    <WorldBg>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingTop: 12 }}>
          <BackButton onPress={() => router.back()} />
          <H2>Log manually</H2>
        </View>

        <Body style={{ paddingHorizontal: 20, marginTop: 8 }}>
          Which habit did you complete?
        </Body>

        {loading ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator color={VQ.lavender} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
            {habits.map(habit => {
              const isSelected = selected === habit.id;
              return (
                <Pressable key={habit.id} onPress={() => setSelected(habit.id)}>
                  <View style={{
                    backgroundColor: isSelected ? UI.surface.warm : UI.surface.base,
                    borderRadius: UI.radius.card,
                    borderWidth: 1.5,
                    borderColor: isSelected ? VQ.lavender : UI.border.base,
                    padding: 16,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}>
                    <Text style={{
                      fontFamily: "PixelifySans_600SemiBold",
                      fontSize: 16,
                      color: isSelected ? VQ.lavender : UI.text.cream,
                    }}>
                      {habit.name}
                    </Text>
                    {isSelected && (
                      <View style={{
                        width: 10, height: 10, borderRadius: 5,
                        backgroundColor: VQ.lavender,
                      }} />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        <View style={{ padding: 20, gap: 10 }}>
          <VQButton
            label={saving ? "Logging…" : "Log +25 XP"}
            onPress={handleLog}
            disabled={!selected || saving}
          />
          <VQButton label="Cancel" style="ghost" onPress={() => router.replace("/(tabs)")} />
        </View>
      </SafeAreaView>
    </WorldBg>
  );
}
