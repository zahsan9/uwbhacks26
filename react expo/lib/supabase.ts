import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
console.log("[supabase] URL:", SUPABASE_URL ?? "UNDEFINED — env vars not loaded");

export async function uploadHabitPhoto(userId: string, photoUri: string): Promise<string | null> {
  try {
    const response = await fetch(photoUri);
    const blob = await response.blob();
    const ext = photoUri.split(".").pop()?.split("?")[0] ?? "jpg";
    const path = `${userId}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from("habit-photos")
      .upload(path, blob, { contentType: `image/${ext}`, upsert: false });

    if (error) throw error;

    const { data } = supabase.storage.from("habit-photos").getPublicUrl(path);
    return data.publicUrl;
  } catch (err) {
    console.warn("[uploadHabitPhoto] failed:", err);
    return null;
  }
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: "implicit",
  },
});
