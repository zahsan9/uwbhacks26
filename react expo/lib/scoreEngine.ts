/**
 * VitaQuest Score Engine
 * Computes per-habit scores, composite scores, avatar states,
 * streaks, and XP level progression from Supabase habit_logs.
 */

import { AvatarState } from '../src/theme';
import { supabase } from './supabase';

// ── XP / Level ────────────────────────────────────────────────────────────────

const XP_PER_LEVEL = 100;

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

// ── Per-habit score ───────────────────────────────────────────────────────────
// Score = fraction of the last 3 days that had at least one log, × 100.

export async function getHabitScore(habitId: string): Promise<number> {
    const since = new Date();
    since.setDate(since.getDate() - 3);

    const { data, error } = await supabase
        .from('habit_logs')
        .select('completed_at')
        .eq('habit_id', habitId)
        .gte('completed_at', since.toISOString());

    if (error || !data) return 0;

    const distinctDays = new Set(
        data.map((log: { completed_at: string }) =>
            new Date(log.completed_at).toDateString()
        )
    );

    return Math.round((distinctDays.size / 3) * 100);
}

// ── Composite score ───────────────────────────────────────────────────────────

export async function getCompositeScore(userId: string): Promise<number> {
    const { data: habits, error } = await supabase
        .from('habits')
        .select('id')
        .eq('user_id', userId);

    if (error || !habits || habits.length === 0) return 50; // neutral default

    const scores = await Promise.all(
        habits.map((h: { id: string }) => getHabitScore(h.id))
    );
    const avg = scores.reduce((a: number, b: number) => a + b, 0) / scores.length;
    return Math.round(avg);
}

// ── Per-habit streak ──────────────────────────────────────────────────────────
// Count consecutive days (ending today) where the habit has at least one log.

export async function getHabitStreak(habitId: string): Promise<number> {
    const { data, error } = await supabase
        .from('habit_logs')
        .select('completed_at')
        .eq('habit_id', habitId)
        .order('completed_at', { ascending: false });

    if (error || !data || data.length === 0) return 0;

    const logDays = new Set(
        data.map((log: { completed_at: string }) =>
            new Date(log.completed_at).toDateString()
        )
    );

    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
        const day = new Date(today);
        day.setDate(day.getDate() - i);
        if (logDays.has(day.toDateString())) {
            streak++;
        } else {
            break;
        }
    }
    return streak;
}

// ── Overall streak ────────────────────────────────────────────────────────────
// Count consecutive days where at least one habit (any habit) was logged.

export async function getOverallStreak(userId: string): Promise<number> {
    const { data, error } = await supabase
        .from('habit_logs')
        .select('completed_at')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false });

    if (error || !data || data.length === 0) return 0;

    const logDays = new Set(
        data.map((log: { completed_at: string }) =>
            new Date(log.completed_at).toDateString()
        )
    );

    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
        const day = new Date(today);
        day.setDate(day.getDate() - i);
        if (logDays.has(day.toDateString())) {
            streak++;
        } else {
            break;
        }
    }
    return streak;
}

// ── Days since account creation ───────────────────────────────────────────────

export function getDaySince(createdAt: string): number {
    const created = new Date(createdAt);
    const now = new Date();
    return Math.max(
        1,
        Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)) + 1
    );
}
