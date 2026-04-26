import { BackButton, Body, H2, VQButton, WorldBg } from "@/Components";
import { supabase } from "../lib/supabase";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { UI } from "@/Components";
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

      const query = supabase
        .from("habits")
        .select("id, name, habit_id_key")
        .eq("user_id", session.user.id);

      if (habitIds.length > 0) query.in("habit_id_key", habitIds);

      const { data } = await query;
      setHabits(data ?? []);
      setLoading(false);
    }
    fetchHabits();
  }, []);

  async function handleLog() {
    if (!selected) return;
    setSaving(true);
    const habit = habits.find(h => h.id === selected);
    if (!habit) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.replace("/(tabs)"); return; }
    const userId = session.user.id;

    await supabase.from("habit_logs").insert({
      habit_id: habit.id,
      user_id: userId,
      verified_by: "manual",
      confidence: 0,
      xp_awarded: 25,
    });

    const { data: logs } = await supabase
      .from("habit_logs")
      .select("xp_awarded")
      .eq("user_id", userId);

    const newXp = (logs ?? []).reduce(
      (sum: number, l: { xp_awarded: number | null }) => sum + (l.xp_awarded ?? 0), 0
    );
    await supabase.from("users").update({ total_xp: newXp }).eq("id", userId);

    router.replace("/(tabs)");
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
