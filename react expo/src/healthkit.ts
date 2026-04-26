import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import type {
  AppleHealthKit,
  HealthInputOptions,
  HealthKitPermissions,
  HealthValue,
} from "react-native-health";
import { supabase } from "../lib/supabase";

const HEALTHKIT_PERMISSION_KEY = "healthkit.permission.requested";
const HEALTHKIT_SNAPSHOT_PREFIX = "healthkit.snapshot";
const STEP_GOAL = 10_000;
const SLEEP_GOAL_HOURS = 8;
const HEALTHKIT_XP_AWARD = 50;

type HealthKitSnapshot = {
  stepsToday: number;
  sleepHoursLastNight: number;
  syncedAt: string;
};

type HealthKitSummary = {
  available: boolean;
  authorized: boolean;
  stepsToday: number;
  sleepHoursLastNight: number;
};

type HabitRow = {
  id: string;
  user_id: string;
  healthkit_type: string | null;
  tier: number | null;
};

let cachedHealthKit: AppleHealthKit | null | undefined;

function normalizeSnapshot(input: {
  stepsToday: number;
  sleepHoursLastNight: number;
  syncedAt?: string;
}): HealthKitSnapshot {
  return {
    stepsToday: Math.max(0, Math.round(input.stepsToday)),
    sleepHoursLastNight: Number(Math.max(0, input.sleepHoursLastNight).toFixed(2)),
    syncedAt: input.syncedAt ?? new Date().toISOString(),
  };
}

function startOfLocalDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfLocalDay(date: Date): Date {
  const next = startOfLocalDay(date);
  next.setDate(next.getDate() + 1);
  next.setMilliseconds(next.getMilliseconds() - 1);
  return next;
}

function localDayKey(input: string | Date): string {
  const date = typeof input === "string" ? new Date(input) : input;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function healthKitPermissions(kit: AppleHealthKit): HealthKitPermissions {
  return {
    permissions: {
      read: [
        kit.Constants.Permissions.StepCount,
        kit.Constants.Permissions.SleepAnalysis,
      ],
      write: [],
    },
  };
}

async function loadHealthKit(): Promise<AppleHealthKit | null> {
  if (Platform.OS !== "ios") return null;
  if (cachedHealthKit !== undefined) return cachedHealthKit;

  try {
    const mod = await import("react-native-health");
    const candidate = (mod.default ?? mod) as Partial<AppleHealthKit>;
    if (
      typeof candidate?.initHealthKit !== "function" ||
      typeof candidate?.getDailyStepCountSamples !== "function" ||
      typeof candidate?.getSleepSamples !== "function"
    ) {
      cachedHealthKit = null;
      return null;
    }
    cachedHealthKit = candidate as AppleHealthKit;
    return cachedHealthKit;
  } catch (err) {
    console.warn("[healthkit] native module unavailable:", err);
    cachedHealthKit = null;
    return null;
  }
}

function callKit<T>(
  run: (callback: (error: string | object | null, value: T) => void) => void,
): Promise<T> {
  return new Promise((resolve, reject) => {
    run((error, value) => {
      if (error) {
        reject(typeof error === "string" ? new Error(error) : error);
        return;
      }
      resolve(value);
    });
  });
}

async function isHealthKitAvailable(kit: AppleHealthKit): Promise<boolean> {
  try {
    return await callKit<boolean>((callback) => kit.isAvailable(callback));
  } catch (err) {
    console.warn("[healthkit] availability check failed:", err);
    return false;
  }
}

async function initHealthKit(kit: AppleHealthKit): Promise<boolean> {
  try {
    await callKit<HealthValue>((callback) =>
      kit.initHealthKit(healthKitPermissions(kit), callback),
    );
    await AsyncStorage.setItem(HEALTHKIT_PERMISSION_KEY, "true");
    return true;
  } catch (err) {
    console.warn("[healthkit] init failed:", err);
    return false;
  }
}

async function getDailySteps(kit: AppleHealthKit): Promise<number> {
  const start = startOfLocalDay(new Date());
  const options: HealthInputOptions = {
    startDate: start.toISOString(),
    endDate: new Date().toISOString(),
    includeManuallyAdded: true,
  };

  const results = await callKit<HealthValue[]>((callback) =>
    kit.getDailyStepCountSamples(options, callback),
  );

  const todayKey = localDayKey(new Date());
  const todaySample = results.find(
    (sample) => localDayKey(sample.startDate) === todayKey,
  );
  return Math.max(0, Math.round(todaySample?.value ?? 0));
}

function isAsleepSampleValue(value: unknown): boolean {
  const normalized = String(value).toUpperCase();
  if (normalized.includes("ASLEEP")) return true;
  return ["1", "3", "4", "5"].includes(normalized);
}

async function getSleepHoursLastNight(kit: AppleHealthKit): Promise<number> {
  const end = new Date();
  const start = new Date(end);
  start.setHours(start.getHours() - 36);

  const options: HealthInputOptions = {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    ascending: false,
  };

  const samples = await callKit<Array<HealthValue & { value: unknown }>>(
    (callback) => kit.getSleepSamples(options, callback as never),
  );

  const asleepSamples = samples.filter((sample) =>
    isAsleepSampleValue(sample.value),
  );
  if (asleepSamples.length === 0) return 0;

  const durationByDay = new Map<string, number>();
  for (const sample of asleepSamples) {
    const startAt = new Date(sample.startDate).getTime();
    const endAt = new Date(sample.endDate).getTime();
    if (!Number.isFinite(startAt) || !Number.isFinite(endAt) || endAt <= startAt)
      continue;
    const key = localDayKey(sample.endDate);
    const hours = (endAt - startAt) / (1000 * 60 * 60);
    durationByDay.set(key, (durationByDay.get(key) ?? 0) + hours);
  }

  const sorted = Array.from(durationByDay.entries()).sort(([left], [right]) =>
    left < right ? 1 : left > right ? -1 : 0,
  );
  return Number((sorted[0]?.[1] ?? 0).toFixed(2));
}

async function writeSnapshot(userId: string, snapshot: HealthKitSnapshot) {
  await AsyncStorage.setItem(
    `${HEALTHKIT_SNAPSHOT_PREFIX}.${userId}`,
    JSON.stringify(snapshot),
  );
}

async function applySnapshotToCurrentUser(
  snapshotInput: HealthKitSnapshot,
): Promise<HealthKitSummary | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) return null;
  const userId = session.user.id;
  const snapshot = normalizeSnapshot(snapshotInput);

  const { data: habits, error } = await supabase
    .from("habits")
    .select("id, user_id, healthkit_type, tier")
    .eq("user_id", userId)
    .eq("is_healthkit", true);

  if (error) {
    console.warn("[healthkit] failed loading habits:", error.message);
    return null;
  }

  await writeSnapshot(userId, snapshot);

  let insertedAny = false;
  for (const habit of (habits ?? []) as HabitRow[]) {
    if ((habit.tier ?? 1) >= 2) continue;

    if (habit.healthkit_type === "steps" && snapshot.stepsToday >= STEP_GOAL) {
      insertedAny =
        (await insertHealthKitLogIfNeeded(habit, new Date(snapshot.syncedAt))) ||
        insertedAny;
    }

    if (
      habit.healthkit_type === "sleep" &&
      snapshot.sleepHoursLastNight >= SLEEP_GOAL_HOURS
    ) {
      insertedAny =
        (await insertHealthKitLogIfNeeded(habit, new Date(snapshot.syncedAt))) ||
        insertedAny;
    }
  }

  if (insertedAny) {
    await syncUserXp(userId);
  }

  return {
    available: true,
    authorized: true,
    stepsToday: snapshot.stepsToday,
    sleepHoursLastNight: snapshot.sleepHoursLastNight,
  };
}

async function fetchRemoteSnapshotForCurrentUser(): Promise<HealthKitSnapshot | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const email = session?.user?.email?.trim().toLowerCase();
  if (!email) return null;

  const { data, error } = await supabase
    .from("healthkit_snapshots")
    .select("steps_today, sleep_hours_last_night, synced_at")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    console.warn("[healthkit] failed loading remote snapshot:", error.message);
    return null;
  }

  if (!data) return null;

  return normalizeSnapshot({
    stepsToday: Number(data.steps_today ?? 0),
    sleepHoursLastNight: Number(data.sleep_hours_last_night ?? 0),
    syncedAt:
      typeof data.synced_at === "string" && data.synced_at.length > 0
        ? data.synced_at
        : new Date().toISOString(),
  });
}

export async function readHealthKitSnapshot(
  userId: string,
): Promise<HealthKitSnapshot | null> {
  const raw = await AsyncStorage.getItem(`${HEALTHKIT_SNAPSHOT_PREFIX}.${userId}`);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as HealthKitSnapshot;
  } catch (err) {
    console.warn("[healthkit] invalid cached snapshot:", err);
    return null;
  }
}

export async function readHealthKitSnapshotForCurrentUser(): Promise<HealthKitSummary | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) return null;
  const remoteSnapshot = await fetchRemoteSnapshotForCurrentUser();
  if (remoteSnapshot) {
    const applied = await applySnapshotToCurrentUser(remoteSnapshot);
    if (applied) return applied;
  }

  const snapshot = await readHealthKitSnapshot(session.user.id);
  if (!snapshot) return null;

  return {
    available: true,
    authorized: true,
    stepsToday: snapshot.stepsToday,
    sleepHoursLastNight: snapshot.sleepHoursLastNight,
  };
}

export async function requestHealthKitPermissions(): Promise<HealthKitSummary> {
  const kit = await loadHealthKit();
  if (!kit) {
    return {
      available: false,
      authorized: false,
      stepsToday: 0,
      sleepHoursLastNight: 0,
    };
  }

  const available = await isHealthKitAvailable(kit);
  if (!available) {
    return {
      available: false,
      authorized: false,
      stepsToday: 0,
      sleepHoursLastNight: 0,
    };
  }

  const authorized = await initHealthKit(kit);
  if (!authorized) {
    return {
      available: true,
      authorized: false,
      stepsToday: 0,
      sleepHoursLastNight: 0,
    };
  }

  const [stepsToday, sleepHoursLastNight] = await Promise.all([
    getDailySteps(kit).catch(() => 0),
    getSleepHoursLastNight(kit).catch(() => 0),
  ]);

  return { available: true, authorized: true, stepsToday, sleepHoursLastNight };
}

async function insertHealthKitLogIfNeeded(habit: HabitRow, completedAt: Date) {
  const dayStart = startOfLocalDay(completedAt);
  const dayEnd = endOfLocalDay(completedAt);

  const { data: existing, error: existingError } = await supabase
    .from("habit_logs")
    .select("id")
    .eq("habit_id", habit.id)
    .eq("verified_by", "healthkit")
    .gte("completed_at", dayStart.toISOString())
    .lte("completed_at", dayEnd.toISOString())
    .limit(1);

  if (existingError) {
    console.warn(
      "[healthkit] failed checking existing log:",
      existingError.message,
    );
    return false;
  }

  if (existing && existing.length > 0) return false;

  const { error } = await supabase.from("habit_logs").insert({
    habit_id: habit.id,
    user_id: habit.user_id,
    verified_by: "healthkit",
    confidence: 100,
    xp_awarded: HEALTHKIT_XP_AWARD,
    completed_at: completedAt.toISOString(),
  });

  if (error) {
    console.warn("[healthkit] failed inserting log:", error.message);
    return false;
  }

  return true;
}

async function syncUserXp(userId: string) {
  const { data: logs, error: logsError } = await supabase
    .from("habit_logs")
    .select("xp_awarded")
    .eq("user_id", userId);

  if (logsError) {
    console.warn(
      "[healthkit] failed loading logs for XP sync:",
      logsError.message,
    );
    return;
  }

  const totalXp = (logs ?? []).reduce(
    (sum: number, log: { xp_awarded: number | null }) =>
      sum + (log.xp_awarded ?? 0),
    0,
  );

  const { error } = await supabase
    .from("users")
    .update({ total_xp: totalXp })
    .eq("id", userId);
  if (error) {
    console.warn("[healthkit] failed updating total_xp:", error.message);
  }
}

export async function syncHealthKitHabitsForCurrentUser(): Promise<HealthKitSummary | null> {
  const kit = await loadHealthKit();
  if (!kit) {
    const remoteSnapshot = await fetchRemoteSnapshotForCurrentUser();
    if (!remoteSnapshot) return null;
    return applySnapshotToCurrentUser(remoteSnapshot);
  }

  const available = await isHealthKitAvailable(kit);
  if (!available) {
    const remoteSnapshot = await fetchRemoteSnapshotForCurrentUser();
    if (!remoteSnapshot) {
      return {
        available: false,
        authorized: false,
        stepsToday: 0,
        sleepHoursLastNight: 0,
      };
    }
    return applySnapshotToCurrentUser(remoteSnapshot);
  }

  const didRequest = await AsyncStorage.getItem(HEALTHKIT_PERMISSION_KEY);
  if (didRequest !== "true") {
    return {
      available: true,
      authorized: false,
      stepsToday: 0,
      sleepHoursLastNight: 0,
    };
  }

  const authorized = await initHealthKit(kit);
  if (!authorized) {
    return {
      available: true,
      authorized: false,
      stepsToday: 0,
      sleepHoursLastNight: 0,
    };
  }

  const [stepsToday, sleepHoursLastNight] = await Promise.all([
    getDailySteps(kit).catch((err) => {
      console.warn("[healthkit] steps read failed:", err);
      return 0;
    }),
    getSleepHoursLastNight(kit).catch((err) => {
      console.warn("[healthkit] sleep read failed:", err);
      return 0;
    }),
  ]);
  return applySnapshotToCurrentUser({
    stepsToday,
    sleepHoursLastNight,
    syncedAt: new Date().toISOString(),
  });
}
