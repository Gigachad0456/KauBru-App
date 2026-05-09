import { Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { dictionaryAPI, gameAPI } from '../services/api';

export type Direction = 'en_to_kb' | 'kb_to_en';
export type GamePhase = 'idle' | 'playing' | 'paused' | 'game_over';

export interface WordEntry {
  id: number;
  english: string;
  kaubru: string;
}

export interface FallingWordState {
  instanceId: string;
  word: WordEntry;
  displayText: string;   // the text shown (english or kaubru depending on direction)
  animValue: Animated.Value;
  spawnTime: number;
  animation: Animated.CompositeAnimation;
  xSlot: number;         // 0, 1, or 2 — horizontal lane
  typedCount: number;    // how many letters have been correctly typed
  isTargeted: boolean;   // currently being typed
  isCorrect: boolean;    // just completed — flash green
}

export interface GameState {
  phase: GamePhase;
  lives: number;
  score: number;
  streak: number;
  level: number;
  correctCount: number;
  activeWords: FallingWordState[];
  wordPool: WordEntry[];
  poolIndex: number;
  direction: Direction;
  sessionId: string;
  personalBest: number;
  pointsAwarded: number;
  playAreaHeight: number;
  currentInput: string;  // what the player has typed so far
}

const PERSONAL_BEST_KEY = 'word_rush_personal_best';
const DIRECTION_KEY = 'word_rush_direction';
const WORD_POOL_CACHE_KEY = 'word_rush_word_pool_cache';
const PENDING_SCORE_KEY = 'word_rush_pending_score';

export function normalise(text: string): string {
  return text.trim().toLowerCase();
}

export function computeFallDuration(level: number): number {
  // Level 1 = 18s, decreases 1.5s per level, min 8s
  return Math.max(8000, 18000 - (level - 1) * 1500);
}

export function computeSpawnInterval(level: number): number {
  // Level 1 = 4s between spawns, decreases 300ms per level, min 1.5s
  return Math.max(1500, 4000 - (level - 1) * 300);
}

export function computeMultiplier(streak: number): number {
  if (streak >= 10) return 3;
  if (streak >= 5) return 2;
  return 1;
}

export function computeScore(answerTimeMs: number, streak: number): number {
  const base = 10;
  const speedBonus = answerTimeMs <= 5000 ? 5 : 0;
  return (base + speedBonus) * computeMultiplier(streak);
}

export function computeLevel(correctCount: number): number {
  return Math.floor(correctCount / 10) + 1;
}

export function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export class GameEngine {
  private state: GameState;
  private currentLevel: number = 1;
  private heightReady: boolean = false;
  private spawnTimer: ReturnType<typeof setInterval> | null = null;
  private usedSlots: Set<number> = new Set();

  onStateChange: (state: GameState) => void = () => {};
  onWordMissedCallback: () => void = () => {};
  onLevelUpCallback: (level: number) => void = () => {};
  onWordDestroyedCallback: () => void = () => {};

  constructor() {
    this.state = {
      phase: 'idle',
      lives: 3,
      score: 0,
      streak: 0,
      level: 1,
      correctCount: 0,
      activeWords: [],
      wordPool: [],
      poolIndex: 0,
      direction: 'en_to_kb',
      sessionId: '',
      personalBest: 0,
      pointsAwarded: 0,
      playAreaHeight: 600,
      currentInput: '',
    };
  }

  getState(): GameState {
    return { ...this.state, activeWords: [...this.state.activeWords] };
  }

  setPlayAreaHeight(height: number): void {
    if (height < 50) return;
    this.state.playAreaHeight = height;
    if (!this.heightReady && this.state.phase === 'playing') {
      this.heightReady = true;
      this.spawnWord();
      this.startSpawnTimer();
    }
  }

  async loadWordPool(): Promise<void> {
    try {
      const res = await dictionaryAPI.getAll(0, 200);
      const words: WordEntry[] = (res.data as any[]).map((w: any) => ({
        id: w.id,
        english: w.english,
        kaubru: w.kaubru,
      }));
      if (words.length < 5) throw new Error('Not enough words in dictionary.');
      const shuffled = shuffleArray(words);
      this.state.wordPool = shuffled;
      await AsyncStorage.setItem(WORD_POOL_CACHE_KEY, JSON.stringify(shuffled));
    } catch {
      const cached = await AsyncStorage.getItem(WORD_POOL_CACHE_KEY);
      if (cached) {
        this.state.wordPool = JSON.parse(cached);
      } else {
        throw new Error('No words available. Check your connection.');
      }
    }
    const pb = await AsyncStorage.getItem(PERSONAL_BEST_KEY);
    if (pb) this.state.personalBest = parseInt(pb, 10);
    const dir = (await AsyncStorage.getItem(DIRECTION_KEY)) as Direction | null;
    if (dir) this.state.direction = dir;
    this.notify();
  }

  startGame(direction: Direction): void {
    this.stopSpawnTimer();
    this.state.activeWords.forEach(w => w.animation.stop());
    this.state = {
      ...this.state,
      phase: 'playing',
      lives: 3,
      score: 0,
      streak: 0,
      level: 1,
      correctCount: 0,
      activeWords: [],
      poolIndex: 0,
      direction,
      sessionId: this.generateUUID(),
      pointsAwarded: 0,
      currentInput: '',
    };
    this.currentLevel = 1;
    this.heightReady = false;
    this.usedSlots.clear();
    AsyncStorage.setItem(DIRECTION_KEY, direction);
    if (this.state.playAreaHeight > 100) {
      this.heightReady = true;
      this.spawnWord();
      this.startSpawnTimer();
    }
    this.notify();
  }

  pauseGame(): void {
    if (this.state.phase !== 'playing') return;
    this.stopSpawnTimer();
    this.state.activeWords.forEach(w => w.animation.stop());
    this.state.phase = 'paused';
    this.notify();
  }

  resumeGame(): void {
    if (this.state.phase !== 'paused') return;
    this.state.phase = 'playing';
    this.state.activeWords.forEach(w => {
      const duration = computeFallDuration(this.state.level);
      w.animation = Animated.timing(w.animValue, {
        toValue: this.state.playAreaHeight,
        duration,
        useNativeDriver: true,
      });
      w.animation.start(({ finished }) => {
        if (finished) this.onWordMissed(w.instanceId);
      });
    });
    this.startSpawnTimer();
    this.notify();
  }

  resetGame(): void {
    this.stopSpawnTimer();
    this.state.activeWords.forEach(w => w.animation.stop());
    this.state = {
      ...this.state,
      phase: 'idle',
      lives: 3,
      score: 0,
      streak: 0,
      level: 1,
      correctCount: 0,
      activeWords: [],
      poolIndex: 0,
      sessionId: '',
      pointsAwarded: 0,
      currentInput: '',
    };
    this.currentLevel = 1;
    this.heightReady = false;
    this.usedSlots.clear();
    this.notify();
  }

  /**
   * Called on every keystroke. Handles ZType-style targeting:
   * - If no word is targeted, find one whose displayText starts with the typed char
   * - If a word is targeted, check if the next expected char matches
   * - On full match, destroy the word
   */
  typeChar(char: string): void {
    if (this.state.phase !== 'playing') return;
    if (!char || char.length !== 1) return;

    const c = char.toLowerCase();
    const targeted = this.state.activeWords.find(w => w.isTargeted);

    if (targeted) {
      // Continue typing the targeted word
      const expected = normalise(targeted.displayText)[targeted.typedCount];
      if (c === expected) {
        targeted.typedCount++;
        this.state.currentInput = normalise(targeted.displayText).slice(0, targeted.typedCount);

        if (targeted.typedCount >= normalise(targeted.displayText).length) {
          // Word complete!
          this.destroyWord(targeted);
        } else {
          this.state.activeWords = this.state.activeWords.map(w =>
            w.instanceId === targeted.instanceId ? { ...targeted } : w
          );
          this.notify();
        }
      }
      // Wrong char — do nothing (no penalty, just ignore)
    } else {
      // No target — find a word starting with this char
      const match = this.state.activeWords.find(
        w => !w.isCorrect && normalise(w.displayText).startsWith(c)
      );
      if (match) {
        match.isTargeted = true;
        match.typedCount = 1;
        this.state.currentInput = c;

        if (normalise(match.displayText).length === 1) {
          this.destroyWord(match);
        } else {
          this.state.activeWords = this.state.activeWords.map(w =>
            w.instanceId === match.instanceId ? { ...match } : w
          );
          this.notify();
        }
      }
      // No word starts with this char — ignore
    }
  }

  private destroyWord(word: FallingWordState): void {
    word.animation.stop();
    const answerTimeMs = Date.now() - word.spawnTime;
    const points = computeScore(answerTimeMs, this.state.streak);

    this.state.score += points;
    this.state.streak++;
    this.state.correctCount++;
    this.state.currentInput = '';
    this.usedSlots.delete(word.xSlot);

    const newLevel = computeLevel(this.state.correctCount);
    if (newLevel > this.currentLevel) {
      this.currentLevel = newLevel;
      this.state.level = newLevel;
      this.restartSpawnTimer();
      this.onLevelUpCallback(newLevel);
    }

    // Flash green
    word.isCorrect = true;
    word.isTargeted = false;
    this.state.activeWords = this.state.activeWords.map(w =>
      w.instanceId === word.instanceId ? { ...word } : w
    );
    this.notify();
    this.onWordDestroyedCallback();

    // Remove after flash
    setTimeout(() => {
      this.state.activeWords = this.state.activeWords.filter(w => w.instanceId !== word.instanceId);
      this.notify();
    }, 400);
  }

  onWordMissed(instanceId: string): void {
    const word = this.state.activeWords.find(w => w.instanceId === instanceId);
    if (!word) return;

    this.usedSlots.delete(word.xSlot);
    this.state.activeWords = this.state.activeWords.filter(w => w.instanceId !== instanceId);
    this.state.lives = Math.max(0, this.state.lives - 1);
    this.state.streak = 0;

    // If the missed word was targeted, clear input
    if (word.isTargeted) {
      this.state.currentInput = '';
    }

    this.onWordMissedCallback();

    if (this.state.lives === 0) {
      this.endGame();
      return;
    }

    this.notify();
  }

  spawnWord(): void {
    if (this.state.activeWords.filter(w => !w.isCorrect).length >= 4) return;
    if (this.state.wordPool.length === 0) return;
    if (this.state.phase !== 'playing') return;

    const word = this.state.wordPool[this.state.poolIndex % this.state.wordPool.length];
    this.state.poolIndex++;

    const displayText = this.state.direction === 'en_to_kb' ? word.english : word.kaubru;

    // Pick a free horizontal slot (0=left, 1=center, 2=right)
    const freeSlots = [0, 1, 2].filter(s => !this.usedSlots.has(s));
    if (freeSlots.length === 0) return;
    const xSlot = freeSlots[Math.floor(Math.random() * freeSlots.length)];
    this.usedSlots.add(xSlot);

    const animValue = new Animated.Value(0);
    const duration = computeFallDuration(this.state.level);

    const animation = Animated.timing(animValue, {
      toValue: this.state.playAreaHeight,
      duration,
      useNativeDriver: true,
    });

    const instanceId = this.generateUUID();
    const fallingWord: FallingWordState = {
      instanceId,
      word,
      displayText,
      animValue,
      spawnTime: Date.now(),
      animation,
      xSlot,
      typedCount: 0,
      isTargeted: false,
      isCorrect: false,
    };

    this.state.activeWords = [...this.state.activeWords, fallingWord];
    animation.start(({ finished }) => {
      if (finished) this.onWordMissed(instanceId);
    });
    this.notify();
  }

  private startSpawnTimer(): void {
    this.stopSpawnTimer();
    const interval = computeSpawnInterval(this.state.level);
    this.spawnTimer = setInterval(() => {
      if (this.state.phase === 'playing') this.spawnWord();
    }, interval);
  }

  private stopSpawnTimer(): void {
    if (this.spawnTimer !== null) {
      clearInterval(this.spawnTimer);
      this.spawnTimer = null;
    }
  }

  private restartSpawnTimer(): void {
    this.startSpawnTimer();
  }

  private endGame(): void {
    this.stopSpawnTimer();
    this.state.activeWords.forEach(w => w.animation.stop());
    this.state.activeWords = [];
    this.state.phase = 'game_over';
    this.state.pointsAwarded = this.state.score;
    this.notify();
    this.submitResults();
  }

  private async submitResults(): Promise<void> {
    if (this.state.score > this.state.personalBest) {
      this.state.personalBest = this.state.score;
      await AsyncStorage.setItem(PERSONAL_BEST_KEY, String(this.state.score));
    }
    const payload = {
      score: this.state.score,
      level_reached: this.state.level,
      direction: this.state.direction,
      correct_count: this.state.correctCount,
      session_id: this.state.sessionId,
    };
    try {
      await gameAPI.submitScore(payload);
      await gameAPI.awardPoints({ session_id: this.state.sessionId, points: this.state.score });
    } catch {
      await AsyncStorage.setItem(PENDING_SCORE_KEY, JSON.stringify(payload));
    }
  }

  private notify(): void {
    this.onStateChange(this.getState());
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
