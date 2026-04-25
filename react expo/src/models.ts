import { AvatarState, IslandType } from './theme';

export const islandName: Record<IslandType, string> = {
  walk: 'Palm Cove', sleep: 'Mountain', screen: 'Volcano', learn: 'Bamboo', quest: 'Shrine',
};

export const islandMeta: Record<IslandType, { stat: string; unit: string; goal: string; streak: number }> = {
  walk: { stat: '8,240', unit: 'steps today', goal: '10,000', streak: 12 },
  sleep: { stat: '7h 42m', unit: 'last night', goal: '8h', streak: 7 },
  screen: { stat: '4h 18m', unit: 'today', goal: 'under 3h', streak: 2 },
  learn: { stat: '—', unit: '', goal: '—', streak: 0 },
  quest: { stat: '—', unit: '', goal: '—', streak: 0 },
};

export interface HabitRow { type: IslandType; streak: number; state: AvatarState }
export const sampleHabits: HabitRow[] = [
  { type: 'walk', streak: 12, state: 'thriving' },
  { type: 'sleep', streak: 7, state: 'healthy' },
  { type: 'screen', streak: 2, state: 'sick' },
];

export interface Friend { id: string; name: string; level: number; state: AvatarState; streak: number }
export const FRIENDS: Friend[] = [
  { id: 'a', name: 'Ayaan', level: 6, state: 'thriving', streak: 18 },
  { id: 'f', name: 'Flop', level: 4, state: 'healthy', streak: 9 },
  { id: 'y', name: 'Yatharth', level: 3, state: 'sick', streak: 1 },
  { id: 'm', name: 'Mira', level: 8, state: 'thriving', streak: 24 },
  { id: 'k', name: 'Kai', level: 2, state: 'critical', streak: 0 },
];

export const STARTER_HABITS = [
  { id: 'sleep', label: 'Sleep', hint: 'Auto · HealthKit' },
  { id: 'steps', label: 'Steps', hint: 'Auto · HealthKit' },
  { id: 'screen', label: 'Screen time', hint: 'Auto · Screen Time' },
  { id: 'gym', label: 'Workout', hint: 'Photo verified' },
  { id: 'running', label: 'Running', hint: 'Photo verified' },
  { id: 'read', label: 'Read', hint: 'Photo verified' },
  { id: 'cooking', label: 'Cooking', hint: 'Photo verified' },
  { id: 'meditate', label: 'Meditate', hint: 'Photo verified' },
];

export const AVATAR_NAMES = ['Mochi', 'Pebble', 'Puff', 'Dew'];

export const ISLAND_STATES: Record<IslandType, AvatarState> = {
  walk: 'thriving', sleep: 'healthy', screen: 'sick', learn: 'sick', quest: 'sick',
};
