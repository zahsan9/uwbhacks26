/**
 * seedDemoState.ts
 * ----------------
 * Seeds AsyncStorage with two pre-baked VitaQuest demo states for hackathon
 * demo day. Call either function from a dev settings screen or a __DEV__ block.
 *
 * State shape mirrors the fields displayed in index.tsx, profile.tsx, and
 * the models.ts / theme.ts types — so nothing needs to change in those files.
 *
 * Storage keys:
 *   'onboarded'   — 'true' (string) to skip onboarding flow
 *   'vq_state'    — JSON-serialised VQAppState
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AvatarState, IslandType } from './theme';

// ---------------------------------------------------------------------------
// Types  (matches what index.tsx, profile.tsx, and models.ts already render)
// ---------------------------------------------------------------------------

export interface HabitEntry {
    /** Habit ID — matches IslandType for built-in habits, or STARTER_HABITS ids */
    id: string;
    /** Display label */
    label: string;
    /** Completion flags for the last 3 days, index 0 = today, 2 = 2 days ago */
    completedDays: [boolean, boolean, boolean];
    /** Active streak in days */
    streak: number;
    /** Health state of this island */
    state: AvatarState;
}

export interface VQAppState {
    /** User's continuous daily streak */
    streak: number;
    /** Per-habit history */
    habitHistory: HabitEntry[];
    /** Overall health score 0-100 */
    healthScore: number;
    /** Aggregate avatar state */
    avatarState: AvatarState;
    /** Total XP accumulated */
    xp: number;
    /** Current player level */
    level: number;
    /** Display name */
    username: string;
    /** Avatar name (from AVATAR_NAMES) */
    avatarName: string;
}

// ---------------------------------------------------------------------------
// Storage keys
// ---------------------------------------------------------------------------

export const STORAGE_KEY_ONBOARDED = 'onboarded';
export const STORAGE_KEY_STATE = 'vq_state';

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

/**
 * Phone A — thriving avatar.
 * streak 12 · healthScore 94 · level 8 · xp 2400
 * All 5 habits completed every day for the last 3 days.
 */
const STATE_PHONE_A: VQAppState = {
    streak: 12,
    healthScore: 94,
    avatarState: 'thriving',
    xp: 2400,
    level: 8,
    username: 'ayaan',
    avatarName: 'Mochi',
    habitHistory: [
        { id: 'gym', label: 'Workout', completedDays: [true, true, true], streak: 12, state: 'thriving' },
        { id: 'running', label: 'Running', completedDays: [true, true, true], streak: 10, state: 'thriving' },
        { id: 'reading', label: 'Reading', completedDays: [true, true, true], streak: 12, state: 'thriving' },
        { id: 'cooking', label: 'Cooking', completedDays: [true, true, true], streak: 8, state: 'healthy' },
        { id: 'meditate', label: 'Meditation', completedDays: [true, true, true], streak: 12, state: 'thriving' },
    ],
};

/**
 * Phone B — sick avatar.
 * streak 3 · healthScore 31 · level 3 · xp 800
 * 4 of 5 habits missed most days for the last 3 days.
 */
const STATE_PHONE_B: VQAppState = {
    streak: 3,
    healthScore: 31,
    avatarState: 'sick',
    xp: 800,
    level: 3,
    username: 'demo_b',
    avatarName: 'Pebble',
    habitHistory: [
        { id: 'gym', label: 'Workout', completedDays: [false, false, false], streak: 0, state: 'critical' },
        { id: 'running', label: 'Running', completedDays: [false, true, false], streak: 0, state: 'sick' },
        { id: 'reading', label: 'Reading', completedDays: [false, false, false], streak: 0, state: 'critical' },
        { id: 'cooking', label: 'Cooking', completedDays: [true, false, false], streak: 1, state: 'sick' },
        { id: 'meditate', label: 'Meditation', completedDays: [false, false, false], streak: 0, state: 'critical' },
    ],
};

// ---------------------------------------------------------------------------
// Seed helpers
// ---------------------------------------------------------------------------

async function writeState(state: VQAppState): Promise<void> {
    // Clear all existing state first so nothing stale bleeds through
    await AsyncStorage.multiRemove([STORAGE_KEY_ONBOARDED, STORAGE_KEY_STATE]);

    await AsyncStorage.multiSet([
        [STORAGE_KEY_ONBOARDED, 'true'],
        [STORAGE_KEY_STATE, JSON.stringify(state)],
    ]);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Seed Phone A — thriving avatar (streak 12, all habits done, level 8, 2400 XP).
 * Call this on device A before the demo.
 */
export async function seedPhoneA(): Promise<void> {
    await writeState(STATE_PHONE_A);
    console.log('[seedDemoState] Phone A (thriving) seeded ✓');
}

/**
 * Seed Phone B — sick avatar (streak 3, habits mostly missed, level 3, 800 XP).
 * Call this on device B (or the same device) before the demo.
 */
export async function seedPhoneB(): Promise<void> {
    await writeState(STATE_PHONE_B);
    console.log('[seedDemoState] Phone B (sick) seeded ✓');
}

/**
 * Read back the currently stored VQAppState, useful for verifying seed.
 * Returns null if nothing has been seeded yet.
 */
export async function readState(): Promise<VQAppState | null> {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_STATE);
    if (!raw) return null;
    try {
        return JSON.parse(raw) as VQAppState;
    } catch {
        return null;
    }
}
