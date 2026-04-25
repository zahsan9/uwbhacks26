import { useSyncExternalStore } from 'react';

export type TabAccentMode = 'green' | 'blue';

let currentMode: TabAccentMode = 'green';
const listeners = new Set<() => void>();

export function setTabAccentMode(mode: TabAccentMode) {
  if (currentMode === mode) return;
  currentMode = mode;
  listeners.forEach(listener => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return currentMode;
}

export function useTabAccentMode() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
