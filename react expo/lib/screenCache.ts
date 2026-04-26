import AsyncStorage from '@react-native-async-storage/async-storage';

type CacheEnvelope<T> = {
  savedAt: number;
  data: T;
};

const memory = new Map<string, CacheEnvelope<unknown>>();

function isFresh(savedAt: number, ttlMs: number): boolean {
  return Date.now() - savedAt <= ttlMs;
}

export async function readScreenCache<T>(key: string, ttlMs: number): Promise<T | null> {
  const mem = memory.get(key) as CacheEnvelope<T> | undefined;
  if (mem && isFresh(mem.savedAt, ttlMs)) return mem.data;

  const raw = await AsyncStorage.getItem(key);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as CacheEnvelope<T>;
    if (!parsed?.savedAt || !isFresh(parsed.savedAt, ttlMs)) return null;
    memory.set(key, parsed as CacheEnvelope<unknown>);
    return parsed.data;
  } catch {
    return null;
  }
}

export async function writeScreenCache<T>(key: string, data: T): Promise<void> {
  const envelope: CacheEnvelope<T> = { savedAt: Date.now(), data };
  memory.set(key, envelope as CacheEnvelope<unknown>);
  await AsyncStorage.setItem(key, JSON.stringify(envelope));
}
