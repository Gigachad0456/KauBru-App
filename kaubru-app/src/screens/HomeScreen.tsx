import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Share, TextInput, Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translationAPI } from '../services/api';
import Header from '../components/Header';
import { COLORS, SPACING, RADIUS, SHADOW } from '../config/theme';

const HISTORY_KEY = 'search_history';
const MAX_HISTORY = 20;
const DISPLAY_HISTORY = 8;

export function addToHistory(history: string[], query: string): string[] {
  const deduped = history.filter(h => h !== query);
  return [query, ...deduped].slice(0, MAX_HISTORY);
}

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const [direction, setDirection] = useState<'en_to_kb' | 'kb_to_en'>('en_to_kb');
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState<{ translated: string; unknown: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [history, setHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(HISTORY_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) setHistory(parsed);
        }
      } catch {}
    })();
  }, []);

  const persistHistory = async (h: string[]) => {
    try { await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(h)); } catch {}
  };

  const handleTranslate = async (text?: string) => {
    const query = (text ?? inputText).trim();
    if (!query) return;
    if (text) setInputText(text);
    setLoading(true);
    setResult(null);
    setShowHistory(false);
    try {
      const res = await translationAPI.translate(query, direction);
      setResult({ translated: res.data.translated_text, unknown: res.data.unknown_words });
      const newHistory = addToHistory(history, query);
      setHistory(newHistory);
      await persistHistory(newHistory);
    } catch (err: any) {
      Alert.alert('Translation Error', err?.response?.data?.detail || 'Could not translate. Check your connection.');
    } finally { setLoading(false); }
  };

  const swapDirection = () => {
    setDirection(d => d === 'en_to_kb' ? 'kb_to_en' : 'en_to_kb');
    setInputText(''); setResult(null); setCharCount(0);
  };

  const clearHistory = async () => {
    setHistory([]); setShowHistory(false);
    try { await AsyncStorage.removeItem(HISTORY_KEY); } catch {}
  };

  const fromLabel = direction === 'en_to_kb' ? 'English' : 'KauBru';
  const toLabel = direction === 'en_to_kb' ? 'KauBru' : 'English';

  return (
    <View style={styles.container}>
      <Header showProfile showNotifications />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Language selector ─────────────────────────────────────────── */}
        <View style={styles.langSelector}>
          <TouchableOpacity
            style={[styles.langBtn, direction === 'en_to_kb' && styles.langBtnActive]}
            onPress={() => direction !== 'en_to_kb' && swapDirection()}
          >
            <Text style={[styles.langBtnText, direction === 'en_to_kb' && styles.langBtnTextActive]}>
              English
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={swapDirection} style={styles.swapCircle}>
            <Ionicons name="swap-horizontal" size={20} color={COLORS.white} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.langBtn, direction === 'kb_to_en' && styles.langBtnActive]}
            onPress={() => direction !== 'kb_to_en' && swapDirection()}
          >
            <Text style={[styles.langBtnText, direction === 'kb_to_en' && styles.langBtnTextActive]}>
              KauBru
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Input area ────────────────────────────────────────────────── */}
        <View style={styles.inputCard}>
          <View style={styles.inputLangLabel}>
            <Text style={styles.inputLangText}>{fromLabel}</Text>
          </View>
          <TextInput
            style={styles.textInput}
            placeholder={`Enter ${fromLabel} text...`}
            placeholderTextColor={COLORS.textMuted}
            value={inputText}
            onChangeText={t => { setInputText(t); setCharCount(t.length); }}
            multiline
            textAlignVertical="top"
            onFocus={() => history.length > 0 && setShowHistory(true)}
          />
          <View style={styles.inputFooter}>
            <TouchableOpacity
              onPress={() => { setInputText(''); setResult(null); setCharCount(0); }}
              style={{ opacity: inputText ? 1 : 0 }}
            >
              <Ionicons name="close-circle" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
            <Text style={styles.charCount}>{charCount} / 2000</Text>
          </View>
        </View>

        {/* ── Translate button ──────────────────────────────────────────── */}
        <TouchableOpacity
          onPress={() => handleTranslate()}
          disabled={loading || !inputText.trim()}
          activeOpacity={0.85}
          style={[styles.translateBtnWrap, (!inputText.trim() || loading) && { opacity: 0.55 }]}
        >
          <LinearGradient
            colors={[COLORS.primaryLight, COLORS.primary] as const}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.translateBtn}
          >
            {loading ? (
              <Text style={styles.translateBtnText}>Translating...</Text>
            ) : (
              <>
                <Text style={styles.translateBtnText}>Translate</Text>
                <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* ── Result ───────────────────────────────────────────────────── */}
        {result && (
          <View style={styles.resultCard}>
            <View style={styles.resultTopRow}>
              <View style={styles.resultLangBadge}>
                <Text style={styles.resultLangText}>{toLabel}</Text>
              </View>
              <View style={styles.aiBadge}>
                <Ionicons name="sparkles" size={11} color={COLORS.gold} />
                <Text style={styles.aiBadgeText}>AI Verified</Text>
              </View>
            </View>

            <Text style={styles.resultText}>{result.translated}</Text>

            {result.unknown.length > 0 && (
              <View style={styles.unknownRow}>
                <Ionicons name="alert-circle-outline" size={14} color={COLORS.warning} />
                <Text style={styles.unknownText}>
                  Unknown words: {result.unknown.join(', ')}
                </Text>
              </View>
            )}

            <View style={styles.resultActions}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={async () => {
                  await Clipboard.setStringAsync(result.translated);
                  Alert.alert('Copied!', 'Translation copied to clipboard.');
                }}
              >
                <Ionicons name="copy-outline" size={18} color={COLORS.primary} />
                <Text style={styles.actionBtnText}>Copy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => Share.share({ message: `"${inputText}" → "${result.translated}" (KauBru)` })}
              >
                <Ionicons name="share-social-outline" size={18} color={COLORS.primary} />
                <Text style={styles.actionBtnText}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── Search history ────────────────────────────────────────────── */}
        {history.length > 0 && (
          <View style={styles.historyCard}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>Recent</Text>
              <TouchableOpacity onPress={clearHistory}>
                <Text style={styles.clearText}>Clear all</Text>
              </TouchableOpacity>
            </View>
            {history.slice(0, DISPLAY_HISTORY).map((item, idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.historyRow, idx > 0 && styles.historyRowBorder]}
                onPress={() => handleTranslate(item)}
              >
                <Ionicons name="time-outline" size={15} color={COLORS.textMuted} />
                <Text style={styles.historyText} numberOfLines={1}>{item}</Text>
                <Ionicons name="arrow-up-outline" size={14} color={COLORS.textMuted} style={{ transform: [{ rotate: '45deg' }] }} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* ── AI Chat FAB ────────────────────────────────────────────────── */}
      <TouchableOpacity 
        style={styles.chatFab}
        onPress={() => navigation.navigate('Chat')}
        activeOpacity={0.8}
      >
        <Ionicons name="chatbubbles-outline" size={24} color={COLORS.white} />
        <View style={styles.chatFabBadge}>
          <Ionicons name="sparkles" size={10} color={COLORS.gold} />
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { paddingHorizontal: SPACING.lg, paddingBottom: 120, paddingTop: SPACING.sm },

  langSelector: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.full, padding: 5,
    marginBottom: SPACING.lg,
    borderWidth: 1, borderColor: COLORS.border,
    ...SHADOW.sm,
  },
  langBtn: {
    flex: 1, paddingVertical: SPACING.sm + 4,
    alignItems: 'center', borderRadius: RADIUS.full,
  },
  langBtnActive: { backgroundColor: COLORS.primary, ...SHADOW.md },
  langBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.textMuted },
  langBtnTextActive: { color: COLORS.white },
  swapCircle: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    marginHorizontal: SPACING.xs,
    ...SHADOW.sm,
  },

  inputCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl,
    borderWidth: 1, borderColor: COLORS.border,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    ...SHADOW.md,
  },
  inputLangLabel: {
    paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, paddingBottom: SPACING.xs,
  },
  inputLangText: { fontSize: 11, fontWeight: '700', color: COLORS.primary, letterSpacing: 1, textTransform: 'uppercase' },
  textInput: {
    color: COLORS.textPrimary, fontSize: 18,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm, paddingBottom: SPACING.sm,
    minHeight: 120, lineHeight: 28, fontWeight: '500',
  },
  inputFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md,
  },
  charCount: { fontSize: 12, color: COLORS.textMuted },

  translateBtnWrap: { marginBottom: SPACING.lg, borderRadius: RADIUS.full, overflow: 'hidden', ...SHADOW.premium },
  translateBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.sm, paddingVertical: SPACING.md + 4,
  },
  translateBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },

  resultCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl,
    borderWidth: 1.5, borderColor: COLORS.bgGreenLight,
    padding: SPACING.lg, marginBottom: SPACING.lg,
    ...SHADOW.md,
  },
  resultTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  resultLangBadge: {
    backgroundColor: COLORS.bgGreenLight, borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md, paddingVertical: 4,
  },
  resultLangText: { fontSize: 11, fontWeight: '800', color: COLORS.primary, letterSpacing: 1 },
  aiBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.goldLight, borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm, paddingVertical: 3,
  },
  aiBadgeText: { fontSize: 10, fontWeight: '700', color: COLORS.gold },
  resultText: { fontSize: 26, fontWeight: '700', color: COLORS.textPrimary, lineHeight: 36, marginBottom: SPACING.md, fontFamily: 'Georgia' },
  unknownRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: SPACING.md, backgroundColor: '#FFF8E7', padding: SPACING.sm, borderRadius: RADIUS.sm },
  unknownText: { fontSize: 12, color: COLORS.warning, fontWeight: '600', flex: 1 },
  resultActions: {
    flexDirection: 'row', gap: SPACING.sm,
    paddingTop: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: SPACING.sm + 2,
    backgroundColor: COLORS.bgGreenLight, borderRadius: RADIUS.full,
    borderWidth: 1, borderColor: COLORS.bgGreenLight,
  },
  actionBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },

  historyCard: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.xl,
    borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING.lg, marginBottom: SPACING.lg, ...SHADOW.sm,
  },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  historyTitle: { fontSize: 15, fontWeight: '800', color: COLORS.textPrimary },
  clearText: { fontSize: 13, color: COLORS.error, fontWeight: '600' },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingVertical: SPACING.sm + 2 },
  historyRowBorder: { borderTopWidth: 1, borderTopColor: COLORS.bg },
  historyText: { flex: 1, fontSize: 14, color: COLORS.textSecondary, fontWeight: '500' },
  
  chatFab: {
    position: 'absolute',
    bottom: 100, // Above tab bar
    right: SPACING.lg,
    width: 60, height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    ...SHADOW.premium,
    borderWidth: 2, borderColor: COLORS.bgGreenLight,
  },
  chatFabBadge: {
    position: 'absolute', top: 12, right: 12,
    backgroundColor: COLORS.bgCardAlt,
    borderRadius: 8, width: 16, height: 16,
    alignItems: 'center', justifyContent: 'center',
  }
});
