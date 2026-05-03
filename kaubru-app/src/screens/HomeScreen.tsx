import Header from '../components/Header';
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Share, TextInput,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translationAPI } from '../services/api';
import SpeakButton from '../components/SpeakButton';
import { COLORS, SPACING, RADIUS, SHADOW } from '../config/theme';

const HISTORY_KEY = 'search_history';
const MAX_HISTORY = 20;
const DISPLAY_HISTORY = 10;

/**
 * Prepend query to history, deduplicate, cap at MAX_HISTORY.
 */
export function addToHistory(history: string[], query: string): string[] {
  const deduped = history.filter(h => h !== query);
  return [query, ...deduped].slice(0, MAX_HISTORY);
}

export default function HomeScreen() {
  const [direction, setDirection] = useState<'en_to_kb' | 'kb_to_en'>('en_to_kb');
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState<{ translated: string; unknown: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    // Load search history on mount
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(HISTORY_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) setHistory(parsed);
        }
      } catch {
        // Silently fail — use empty history (Requirement 9.7)
      }
    })();
  }, []);

  const persistHistory = async (newHistory: string[]) => {
    try {
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
    } catch {
      // Silently fail (Requirement 9.7)
    }
  };

  const handleTranslate = async (text?: string) => {
    const query = (text ?? inputText).trim();
    if (!query) return;
    if (text) setInputText(text);
    setLoading(true);
    setResult(null);
    try {
      const res = await translationAPI.translate(query, direction);
      setResult({
        translated: res.data.translated_text,
        unknown: res.data.unknown_words,
      });
      // Add to history after successful translation
      const newHistory = addToHistory(history, query);
      setHistory(newHistory);
      await persistHistory(newHistory);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.detail || 'Translation failed.');
    } finally {
      setLoading(false);
    }
  };

  const swapDirection = () => {
    setDirection(d => d === 'en_to_kb' ? 'kb_to_en' : 'en_to_kb');
    setInputText('');
    setResult(null);
    setCharCount(0);
  };

  const clearHistory = async () => {
    setHistory([]);
    try {
      await AsyncStorage.removeItem(HISTORY_KEY);
    } catch {}
  };

  const displayedHistory = history.slice(0, DISPLAY_HISTORY);

  return (
    <View style={styles.container}>
      <Header showProfile showNotifications />

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Direction selector */}
        <View style={styles.directionRow}>
          <TouchableOpacity
            style={[styles.langPill, direction === 'en_to_kb' && styles.langPillActive]}
            onPress={() => direction !== 'en_to_kb' && swapDirection()}
            accessibilityRole="button"
            accessibilityLabel="Translate from English"
          >
            <Text style={[styles.langText, direction === 'en_to_kb' && styles.langTextActive]}>English</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={swapDirection}
            style={styles.swapBtn}
            accessibilityRole="button"
            accessibilityLabel="Swap translation direction"
          >
            <Ionicons name="swap-horizontal" size={20} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.langPill, direction === 'kb_to_en' && styles.langPillActive]}
            onPress={() => direction !== 'kb_to_en' && swapDirection()}
            accessibilityRole="button"
            accessibilityLabel="Translate from KauBru"
          >
            <Text style={[styles.langText, direction === 'kb_to_en' && styles.langTextActive]}>KauBru</Text>
          </TouchableOpacity>
        </View>

        {/* Input card */}
        <View style={styles.inputCard}>
          <LinearGradient
            colors={['rgba(201, 168, 76, 0.1)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.inputGradientOverlay}
          />
          <View style={styles.inputAccent} />
          <TextInput
            style={styles.textInput}
            placeholder={`Type in ${direction === 'en_to_kb' ? 'English' : 'KauBru'}...`}
            placeholderTextColor={COLORS.textMuted}
            value={inputText}
            onChangeText={(t) => { setInputText(t); setCharCount(t.length); }}
            multiline numberOfLines={4} textAlignVertical="top"
            accessibilityLabel="Translation input"
          />
          <View style={styles.inputFooter}>
            <View style={{ flex: 1 }} />
            <Text style={styles.charCount}>{charCount} / 2000</Text>
          </View>
        </View>

        {/* Translate button */}
        <TouchableOpacity
          style={[styles.translateBtnWrapper, (loading || !inputText.trim()) && styles.translateBtnDisabled]}
          onPress={() => handleTranslate()}
          disabled={loading || !inputText.trim()}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Translate"
        >
          <LinearGradient
            colors={[COLORS.primaryLight, COLORS.primary] as const}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.translateBtn}
          >
            <Text style={styles.translateText}>{loading ? 'TRANSLATING...' : 'TRANSLATE'}</Text>
            <MaterialCommunityIcons name="auto-fix" size={20} color={COLORS.white} />
          </LinearGradient>
        </TouchableOpacity>

        {/* Result card */}
        {result && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultLang}>{direction === 'en_to_kb' ? 'KAUBRU' : 'ENGLISH'}</Text>
              <View style={styles.verifiedBadge}>
                <Ionicons name="sparkles" size={12} color={COLORS.gold} />
                <Text style={styles.verifiedText}>AI POWERED</Text>
              </View>
            </View>

            <Text style={styles.resultText}>{result.translated}</Text>

            {result.unknown.length > 0 && (
              <View style={styles.unknownContainer}>
                <Ionicons name="help-circle-outline" size={14} color={COLORS.error} />
                <Text style={styles.unknownText}>Unknown: {result.unknown.join(', ')}</Text>
              </View>
            )}

            <View style={styles.resultActions}>
              {/* Audio disabled for translation per user request */}
              <View style={{ flex: 1 }} />
              <View style={styles.secondaryActions}>
                <TouchableOpacity
                  style={styles.actionBtnSmall}
                  onPress={async () => {
                    await Clipboard.setStringAsync(result.translated);
                    Alert.alert('Copied', 'Translation copied to clipboard.');
                  }}
                >
                  <Ionicons name="copy-outline" size={18} color={COLORS.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionBtnSmall}
                  onPress={() => Share.share({
                    message: `"${inputText}" → "${result.translated}" (KauBru)`,
                  })}
                >
                  <Ionicons name="share-social-outline" size={18} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Recent Searches */}
        {displayedHistory.length > 0 && (
          <View style={styles.historySection}>
            <View style={styles.historyHeader}>
              <Text style={styles.historySectionTitle}>Recent Searches</Text>
              <TouchableOpacity onPress={clearHistory}>
                <Text style={styles.clearHistoryText}>Clear All</Text>
              </TouchableOpacity>
            </View>
            {displayedHistory.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.historyItem}
                onPress={() => handleTranslate(item)}
              >
                <View style={styles.historyIconCircle}>
                  <Ionicons name="time-outline" size={14} color={COLORS.primary} />
                </View>
                <Text style={styles.historyItemText} numberOfLines={1}>{item}</Text>
                <Ionicons name="chevron-forward" size={14} color={COLORS.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { paddingHorizontal: SPACING.lg, paddingBottom: 100, paddingTop: SPACING.md },
  directionRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.bgCardAlt, borderRadius: RADIUS.full,
    padding: 6, marginBottom: SPACING.lg,
    borderWidth: 1, borderColor: COLORS.border,
  },
  langPill: { flex: 1, paddingVertical: SPACING.sm + 4, alignItems: 'center', borderRadius: RADIUS.full },
  langPillActive: { backgroundColor: COLORS.primary, ...SHADOW.md },
  langText: { fontSize: 14, fontWeight: '700', color: COLORS.textMuted },
  langTextActive: { color: COLORS.white },
  swapBtn: { paddingHorizontal: SPACING.md },
  inputCard: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.xl,
    borderWidth: 1, borderColor: COLORS.border,
    marginBottom: SPACING.md, overflow: 'hidden', ...SHADOW.md,
  },
  inputGradientOverlay: { position: 'absolute', top: 0, left: 0, right: 0, height: 80 },
  inputAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 5, backgroundColor: COLORS.gold },
  textInput: {
    color: COLORS.textPrimary, fontSize: 18,
    paddingHorizontal: SPACING.lg, paddingTop: SPACING.xl,
    paddingBottom: SPACING.sm, minHeight: 140, lineHeight: 28,
  },
  inputFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md,
  },
  charCount: { fontSize: 12, color: COLORS.textMuted, fontWeight: '500' },
  translateBtnWrapper: {
    marginBottom: SPACING.xl,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    ...SHADOW.premium,
  },
  translateBtn: {
    paddingVertical: SPACING.md + 4, alignItems: 'center',
    flexDirection: 'row', justifyContent: 'center', gap: 10,
  },
  translateBtnDisabled: { opacity: 0.5 },
  translateText: { color: COLORS.white, fontSize: 16, fontWeight: '800', letterSpacing: 1.2 },
  resultCard: {
    backgroundColor: COLORS.bgGreenLight, borderRadius: RADIUS.xl,
    borderWidth: 1, borderColor: 'rgba(28, 58, 42, 0.1)',
    padding: SPACING.lg, marginBottom: SPACING.xl,
    ...SHADOW.md,
  },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  resultLang: { fontSize: 12, fontWeight: '800', color: COLORS.primary, letterSpacing: 1.5, opacity: 0.6 },
  verifiedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.white, borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md, paddingVertical: 4,
    borderWidth: 1, borderColor: COLORS.goldLight,
  },
  verifiedText: { fontSize: 10, fontWeight: '800', color: COLORS.gold },
  resultText: { fontSize: 24, fontWeight: '700', color: COLORS.textPrimary, lineHeight: 34, marginBottom: SPACING.md },
  unknownContainer: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: SPACING.md, backgroundColor: 'rgba(192, 57, 43, 0.05)', padding: 8, borderRadius: RADIUS.sm },
  unknownText: { fontSize: 12, color: COLORS.error, fontWeight: '600' },
  resultActions: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: SPACING.md, borderTopWidth: 1, borderTopColor: 'rgba(28, 58, 42, 0.1)',
  },
  speakActionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.primary, paddingHorizontal: SPACING.md,
    paddingVertical: 8, borderRadius: RADIUS.full,
  },
  speakActionText: { color: COLORS.white, fontSize: 14, fontWeight: '700' },
  actionBtnIcon: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'transparent' },
  secondaryActions: { flexDirection: 'row', gap: SPACING.sm },
  actionBtnSmall: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  historySection: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.xl,
    padding: SPACING.lg, marginBottom: SPACING.lg, ...SHADOW.sm,
    borderWidth: 1, borderColor: COLORS.border,
  },
  historyHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  historySectionTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary },
  clearHistoryText: { fontSize: 13, color: COLORS.error, fontWeight: '700' },
  historyItem: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    paddingVertical: SPACING.md,
    borderTopWidth: 1, borderTopColor: COLORS.bg,
  },
  historyIconCircle: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.bgGreenLight,
    alignItems: 'center', justifyContent: 'center',
  },
  historyItemText: { flex: 1, fontSize: 15, color: COLORS.textSecondary, fontWeight: '500' },
});

