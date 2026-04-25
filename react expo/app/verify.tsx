import PhotoVerifyScreen, { VerifyResult } from "@/PhotoVerifyScreen";
import { supabase } from "../lib/supabase";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback } from "react";

export default function VerifyRoute() {
  const router = useRouter();
  // habitIds may be passed as a comma-separated string from index.tsx
  const { habitIds: habitIdsParam } = useLocalSearchParams<{ habitIds?: string }>();
  const habitIds = habitIdsParam ? habitIdsParam.split(",").filter(Boolean) : undefined;

  const handleComplete = useCallback(async (result: VerifyResult) => {
    // Navigate away immediately so the user isn't stuck on the camera screen
    router.replace("/(tabs)");

    if (!result.verified) return;

    try {
      // 1. Get current user
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        console.warn("[verify] No session — cannot write habit log");
        return;
      }
      const userId = session.user.id;

      // 2. Find the matching habit row for this user
      let habitRowId: string | null = null;
      if (result.habitId) {
        const { data: habits, error: habitsErr } = await supabase
          .from("habits")
          .select("id, habit_id_key")
          .eq("user_id", userId);

        if (habitsErr) {
          console.warn("[verify] Could not fetch habits:", habitsErr.message);
        } else if (habits) {
          // Match backend habit key to the user's habit rows
          const match = habits.find((h: { id: string; habit_id_key: string }) => h.habit_id_key === result.habitId);
          if (match) habitRowId = match.id;
        }
      }

      // 3. Determine XP and verified_by
      const xpAwarded = result.isManual ? 25 : 50;
      const verifiedBy = result.isManual ? "manual" : "photo";

      // 4. Insert habit_logs row
      if (habitRowId) {
        const { error: logErr } = await supabase.from("habit_logs").insert({
          habit_id: habitRowId,
          user_id: userId,
          verified_by: verifiedBy,
          confidence: Math.round(result.confidence * 100),
          xp_awarded: xpAwarded,
        });
        if (logErr) {
          console.warn("[verify] habit_logs insert error:", logErr.message);
        } else {
          console.log("[verify] habit_log inserted — xp:", xpAwarded, "habit:", result.habitId);
        }
      } else {
        console.warn("[verify] No matching habit row found for habit_id_key:", result.habitId);
      }

      // 5. Increment total_xp on the users row (read-then-write)
      const { data: userRow, error: userErr } = await supabase
        .from("users")
        .select("total_xp")
        .eq("id", userId)
        .single();

      if (userErr) {
        console.warn("[verify] Could not fetch users row:", userErr.message);
      } else {
        const newXp = (userRow?.total_xp ?? 0) + xpAwarded;
        const { error: xpErr } = await supabase
          .from("users")
          .update({ total_xp: newXp })
          .eq("id", userId);
        if (xpErr) {
          console.warn("[verify] total_xp update error:", xpErr.message);
        } else {
          console.log("[verify] total_xp updated to", newXp);
        }
      }
    } catch (err) {
      console.warn("[verify] Unexpected error in handleComplete:", err);
    }
  }, [router]);

  return (
    <PhotoVerifyScreen
      habitIds={habitIds}
      onComplete={handleComplete}
    />
  );
}
