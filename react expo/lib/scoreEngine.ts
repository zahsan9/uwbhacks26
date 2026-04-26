/**
 * VitaQuest Score Engine
 * Computes per-habit scores, composite scores, avatar states,
 * streaks, and XP level progression from Supabase habit_logs.
 */

import { AvatarState } from '../src/theme';
import { supabase } from './supabase';

// ── XP / Level ────────────────────────────────────────────────────────────────

const XP_PER_LEVEL = 100;
const CACHE_TTL_MS = 20 * 1000;
const cache = new Map<string, { expiresAt: number; value: number }>();

/** Level 1 starts at 0 XP. Each level costs 100 XP flat. */
export function getLevel(totalXp: number): number {
    return Math.floor(totalXp / XP_PER_LEVEL) + 1;
}

/** XP earned within the current level (0–99). */
export function getLevelXpCurrent(totalXp: number): number {
    return totalXp % XP_PER_LEVEL;
}

/** XP required to complete the current level (always 100). */
export function getLevelXpRequired(): number {
    return XP_PER_LEVEL;
}

// ── Avatar state ──────────────────────────────────────────────────────────────

export function getAvatarState(score: number): AvatarState {
    if (score >= 80) return 'thriving';
    if (score >= 50) return 'healthy';
    if (score >= 20) return 'sick';
    return 'critical';
}

function startOfLocalDay(date: Date): Date {
    const day = new Date(date);
    day.setHours(0, 0, 0, 0);
    return day;
}

function cacheGet(key: string): number | null {
    const hit = cache.get(key);
    if (!hit) return null;
    if (Date.now() > hit.expiresAt) {
        cache.delete(key);
        return null;
    }
    return hit.value;
}

function cacheSet(key: string, value: number): number {
    cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
    return value;
}

function daysSinceLocalDate(input: string | Date): number {
    const start = startOfLocalDay(typeof input === 'string' ? new Date(input) : input);
    const today = startOfLocalDay(new Date());
    return Math.max(
        1,
        Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    );
}

function localDayKey(input: string | Date): string {
    const date = typeof input === 'string' ? new Date(input) : input;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function dayKeysEndingToday(numDays: number): string[] {
    const today = startOfLocalDay(new Date());
    return Array.from({ length: numDays }, (_, index) => {
        const day = new Date(today);
        day.setDate(today.getDate() - index);
        return localDayKey(day);
    });
}

// ── Per-habit state ───────────────────────────────────────────────────────────
// State based on consecutive missed days from today, bounded by habit creation.
// 0 missed → thriving, 1 → healthy, 2 → sick, 3+ → critical.

export async function getHabitDaysMissed(habitId: string, habitCreatedAt: string): Promise<number> {
    const cacheKey = `habit-missed:${habitId}`;
    const cached = cacheGet(cacheKey);
    if (cached !== null) return cached;

    const createdDayKey = localDayKey(new Date(habitCreatedAt));
    const since = startOfLocalDay(new Date());
    since.setDate(since.getDate() - 6);

    const { data, error } = await supabase
        .from('habit_logs')
        .select('completed_at')
        .eq('habit_id', habitId)
        .gte('completed_at', since.toISOString());

    const loggedDays = new Set(
        (error || !data ? [] : data).map((log: { completed_at: string }) =>
            localDayKey(log.completed_at)
        )
    );

    let missed = 0;
    for (let i = 0; i <= 6; i++) {
        const day = startOfLocalDay(new Date());
        day.setDate(day.getDate() - i);
        const key = localDayKey(day);
        if (key < createdDayKey) break;
        if (loggedDays.has(key)) break;
        missed++;
    }

    return cacheSet(cacheKey, missed);
}

export function getHabitStateFromMisses(daysMissed: number): AvatarState {
    if (daysMissed <= 0) return 'thriving';
    if (daysMissed === 1) return 'healthy';
    if (daysMissed === 2) return 'sick';
    return 'critical';
}

// ── Per-habit score ───────────────────────────────────────────────────────────
// Score = fraction of the last 3 days that had at least one log, × 100.

export async function getHabitScore(habitId: string): Promise<number> {
    const cacheKey = `habit-score:${habitId}`;
    const cached = cacheGet(cacheKey);
    if (cached !== null) return cached;

    const since = startOfLocalDay(new Date());
    since.setDate(since.getDate() - 2);
    const recentDayKeys = new Set(dayKeysEndingToday(3));

    const { data, error } = await supabase
        .from('habit_logs')
        .select('completed_at')
        .eq('habit_id', habitId)
        .gte('completed_at', since.toISOString());

    if (error || !data) return cacheSet(cacheKey, 0);

    const distinctDays = new Set(
        data.map((log: { completed_at: string }) =>
            localDayKey(log.completed_at)
        )
    );

    const completedRecentDays = Array.from(distinctDays).filter((dayKey) =>
        recentDayKeys.has(dayKey)
    ).length;

    return cacheSet(cacheKey, Math.round((Math.min(completedRecentDays, 3) / 3) * 100));
}

// ── Composite score ───────────────────────────────────────────────────────────

export async function getCompositeScore(userId: string): Promise<number> {
    const cacheKey = `composite:${userId}`;
    const cached = cacheGet(cacheKey);
    if (cached !== null) return cached;

    const { data: habits, error } = await supabase
        .from('habits')
        .select('id, tier, habit_id_key')
        .eq('user_id', userId);

    if (error || !habits || habits.length === 0) return cacheSet(cacheKey, 50); // neutral default

    const activeHabits = Array.from(
        new Map(
            habits
                .filter((habit: { tier: number | null; habit_id_key: string }) =>
                    (habit.tier ?? 1) < 2 && Boolean(habit.habit_id_key)
                )
                .map((habit: { id: string; tier: number | null; habit_id_key: string }) => [
                    habit.habit_id_key,
                    habit,
                ])
        ).values()
    );

    if (activeHabits.length === 0) return cacheSet(cacheKey, 50);

    const since = startOfLocalDay(new Date());
    since.setDate(since.getDate() - 2);
    const activeIds = activeHabits.map((h: { id: string }) => h.id);
    const recentDayKeys = new Set(dayKeysEndingToday(3));

    const { data: logs, error: logsError } = await supabase
        .from('habit_logs')
        .select('habit_id, completed_at')
        .in('habit_id', activeIds)
        .gte('completed_at', since.toISOString());

    if (logsError || !logs) return cacheSet(cacheKey, 50);

    const byHabit = new Map<string, Set<string>>();
    activeIds.forEach((id) => byHabit.set(id, new Set<string>()));
    logs.forEach((log: { habit_id: string; completed_at: string }) => {
        const existing = byHabit.get(log.habit_id);
        if (existing) existing.add(localDayKey(log.completed_at));
    });

    const scores = activeIds.map((habitId) => {
        const distinctDays = byHabit.get(habitId) ?? new Set<string>();
        const completedRecentDays = Array.from(distinctDays).filter((dayKey) =>
            recentDayKeys.has(dayKey)
        ).length;
        return Math.round((Math.min(completedRecentDays, 3) / 3) * 100);
    });
    const avg = scores.reduce((a: number, b: number) => a + b, 0) / scores.length;
    return cacheSet(cacheKey, Math.round(avg));
}

// ── Per-habit streak ──────────────────────────────────────────────────────────
// Count consecutive days (ending today) where the habit has at least one log.

export async function getHabitStreak(habitId: string): Promise<number> {
    const cacheKey = `habit-streak:${habitId}`;
    const cached = cacheGet(cacheKey);
    if (cached !== null) return cached;

    const { data, error } = await supabase
        .from('habit_logs')
        .select('completed_at')
        .eq('habit_id', habitId)
        .order('completed_at', { ascending: false });

    if (error || !data || data.length === 0) return cacheSet(cacheKey, 0);

    const logDays = new Set(
        data.map((log: { completed_at: string }) =>
            localDayKey(log.completed_at)
        )
    );

    let streak = 0;
    const today = startOfLocalDay(new Date());
    for (let i = 0; i < 365; i++) {
        const day = new Date(today);
        day.setDate(day.getDate() - i);
        if (logDays.has(localDayKey(day))) {
            streak++;
        } else {
            break;
        }
    }
    return cacheSet(cacheKey, streak);
}

// ── Overall streak ────────────────────────────────────────────────────────────
// Count consecutive days where at least one habit (any habit) was logged.

export async function getOverallStreak(userId: string): Promise<number> {
    const cacheKey = `overall-streak:${userId}`;
    const cached = cacheGet(cacheKey);
    if (cached !== null) return cached;

    const [{ data: firstHabit }, { data: userRow }] = await Promise.all([
        supabase
            .from('habits')
            .select('created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: true })
            .limit(1)
            .maybeSingle(),
        supabase
            .from('users')
            .select('created_at')
            .eq('id', userId)
            .maybeSingle(),
    ]);

    const startAt = firstHabit?.created_at ?? userRow?.created_at;
    if (!startAt) return cacheSet(cacheKey, 0);
    return cacheSet(cacheKey, daysSinceLocalDate(startAt));
}

// ── Days since account creation ───────────────────────────────────────────────

export function getDaySince(createdAt: string): number {
    return daysSinceLocalDate(createdAt);
}
