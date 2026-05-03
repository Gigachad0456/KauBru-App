import AsyncStorage from '@react-native-async-storage/async-storage';

export const CACHE_KEY = 'offline_dictionary';
export const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface Word {
  id: number;
  english: string;
  kaubru: string;
  category: string;
  example_english?: string;
  example_kaubru?: string;
  audio_url?: string;
  created_at?: string;
}

export interface DictionaryCache {
  words: Word[];
  timestamp: number;
}

/**
 * Retrieve the cached dictionary from AsyncStorage.
 * Returns null if no cache exists or on read failure.
 */
export async function getCachedDictionary(): Promise<DictionaryCache | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DictionaryCache;
    if (!parsed || !Array.isArray(parsed.words) || typeof parsed.timestamp !== 'number') {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Store the dictionary word list in AsyncStorage with the current timestamp.
 */
export async function setCachedDictionary(words: Word[]): Promise<void> {
  const cache: DictionaryCache = {
    words,
    timestamp: Date.now(),
  };
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}

/**
 * Returns true if the given timestamp is older than CACHE_TTL_MS (24 hours).
 */
export function isCacheStale(timestamp: number): boolean {
  return Date.now() - timestamp >= CACHE_TTL_MS;
}

/**
 * Filter words by a search query (case-insensitive substring match on english or kaubru).
 */
export function filterWords(words: Word[], query: string): Word[] {
  if (!query.trim()) return words;
  const q = query.toLowerCase();
  return words.filter(
    (w) =>
      w.english.toLowerCase().includes(q) ||
      w.kaubru.toLowerCase().includes(q)
  );
}
