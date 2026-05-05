import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Share, TextInput, StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { translationAPI } from '../services/api';
import { COLORS, SPACING, RADIUS, SHADOW, FONTS } from '../config/theme';

const HISTORY_KEY = 'search_history';
const MAX_HISTORY = 20;
const DISPLAY_HISTORY = 6;

export function addToHistory(history: string[], query: string): string[] {
  const deduped = history.filter(h => h !== query);
  return [query, ...deduped].slice(0, MAX_HISTORY);
}

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [direction, setDirection] = useState<'en_to_kb' | 'kb_to_en'>('en_to_kb');
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState<{ translated: string; unknown: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

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
    setInputText('');
    setResult(null);
  };

  const clearHistory = async () => {
    setHistory([]);
    try { await AsyncStorage.removeItem(HISTORY_KEY); } catch {}
  };

  const fromLabel = direction === 'en_to_kb' ? 'English' : 'KauBru';
  const toLabel   = direction === 'en_to_kb' ? 'KauBru'  : 'English';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* ── Top bar ──────────────────────────────────────────────────── */}
      <View style={[styles.topBar, { paddingTop: insets.top + SPACING.sm }]}>
        <View style={styles.logoRow}>
          <MaterialCommunityIcons name="translate" size={18} color={COLORS.primary} />
          <Text style={styles.logoText}>KauBru</Text>
        </View>
        <View style={styles.topActions}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => navigation.navigate('Notifications')}
            accessibilityLabel="Notifications"
          >
            <Ionicons name="notifications-outline" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => navigation.navigate('Profile')}
            accessibilityLabel="Profile"
          >
            <Ionicons name="person-circle-outline" size={22} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Language selector ─────────────────────────────────────── */}
        <View style={styles.langSelector}>
          <TouchableOpacity
            style={[styles.langBtn, direction === 'en_to_kb' && styles.langBtnActive]}
            onPress={() => direction !== 'en_to_kb' && swapDirection()}
          >
            <Text style={[styles.langBtnText, direction === 'en_to_kb' && styles.langBtnTextActive]}>
              English
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={swapDirection} style={styles.swapBtn} accessibilityLabel="Swap languages">
            <Ionicons name="swap-horizontal" size={18} color={COLORS.white} />
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

        {/* ── Input card ────────────────────────────────────────────── */}
        <View style={styles.inputCard}>
          <Text style={styles.inputLangLabel}>{fromLabel}</Text>
          <TextInput
            style={styles.textInput}
            placeholder={`Type ${fromLabel} text here...`}
            placeholderTextColor={COLORS.textMuted}
            value={inputText}
            onChangeText={setInputText}
            multiline
            textAlignVertical="top"
          />
          <View style={styles.inputFooter}>
            {inputText.length > 0 && (
              <TouchableOpacity
                onPress={() => { setInputText(''); setResult(null); }}
                style={styles.clearBtn}
              >
                <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
                <Text style={styles.clearBtnText}>Clear</Text>
              </TouchableOpacity>
            )}
            <Text style={styles.charCount}>{inputText.length} / 2000</Text>
          </View>
        </View>

        {/* ── Translate button ──────────────────────────────────────── */}
        <TouchableOpacity
          onPress={() => handleTranslate()}
          disabled={loading || !inputText.trim()}
          activeOpacity={0.85}
          style={[styles.translateBtnWrap, (!inputText.trim() || loading) && styles.translateBtnDisabled]}
        >
          <LinearGradient
            colors={[COLORS.primaryLight, COLORS.primary]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.translateBtn}
          >
            <Text style={styles.translateBtnText}>
              {loading ? 'Translating...' : 'Translate'}
            </Text>
            {!loading && <Ionicons name="arrow-forward" size={18} color={COLORS.white} />}
          </LinearGradient>
        </TouchableOpacity>

        {/* ── Result card ───────────────────────────────────────────── */}
        {result && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <View style={styles.resultLangBadge}>
                <Text style={styles.resultLangText}>{toLabel}</Text>
              </View>
              <View style={styles.aiBadge}>
                <Ionicons name="sparkles" size={10} color={COLORS.gold} />
                <Text style={styles.aiBadgeText}>AI Verified</Text>
              </View>
            </View>

            <Text style={styles.resultText}>{result.translated}</Text>

            {result.unknown.length > 0 && (
              <View style={styles.unknownRow}>
                <Ionicons name="alert-circle-outline" size={13} color={COLORS.warning} />
                <Text style={styles.unknownText}>
                  Unknown: {result.unknown.join(', ')}
                </Text>
              </View>
            )}

            <View style={styles.resultActions}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={async () => {
                  await Clipboard.setStringAsync(result.translated);
                  Alert.alert('Copied', 'Translation copied to clipboard.');
                }}
              >
                <Ionicons name="copy-outline" size={16} color={COLORS.primary} />
                <Text style={styles.actionBtnText}>Copy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => Share.share({ message: `"${inputText}" → "${result.translated}" (KauBru)` })}
              >
                <Ionicons name="share-social-outline" size={16} color={COLORS.primary} />
                <Text style={styles.actionBtnText}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── Recent history ────────────────────────────────────────── */}
        {history.length > 0 && (
          <View style={styles.historyCard}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>Recent</Text>
              <TouchableOpacity onPress={clearHistory}>
                <Text style={styles.clearAllText}>Clear</Text>
              </TouchableOpacity>
            </View>
            {history.slice(0, DISPLAY_HISTORY).map((item, idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.historyRow, idx > 0 && styles.historyRowBorder]}
                onPress={() => handleTranslate(item)}
              >
                <Ionicons name="time-outline" size={14} color={COLORS.textMuted} />
                <Text style={styles.historyText} numberOfLines={1}>{item}</Text>
                <Ionicons
                  name="arrow-up-outline"
                  size={13}
                  color={COLORS.textMuted}
                  style={{ transform: [{ rotate: '45deg' }] }}
                />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* ── AI Chat FAB ───────────────────────────────────────────────── */}
      <TouchableOpacity
        style={[styles.chatFab, { bottom: insets.bottom + 88 }]}
        onPress={() => navigation.navigate('Chat')}
        activeOpacity={0.85}
      >
        <Ionicons name="chatbubbles-outline" size={22} color={COLORS.white} />
        <View style={styles.fabBadge}>
          <Ionicons name="sparkles" size={9} color={COLORS.gold} />
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.bg,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  logoText: { fontSize: 17, fontWeight: '800', color: COLORS.primary, letterSpacing: -0.3 },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  iconBtn: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1, borderColor: COLORS.border,
    ...SHADOW.sm,
  },

  scroll: { paddingHorizontal: SPACING.lg, paddingBottom: 120, paddingTop: SPACING.xs },

  // Language selector
  langSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.full,
    padding: 4,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.sm,
  },
  langBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: RADIUS.full,
  },
  langBtnActive: { backgroundColor: COLORS.primary, ...SHADOW.sm },
  langBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.textMuted },
  langBtnTextActive: { color: COLORS.white },
  swapBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    marginHorizontal: 4,
  },

  // Input
  inputCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
    ...SHADOW.md,
    overflow: 'hidden',
  },
  inputLangLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: 4,
  },
  textInput: {
    color: COLORS.textPrimary,
    fontSize: 18,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
    minHeight: 110,
    lineHeight: 28,
    fontWeight: '500',
  },
  inputFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  clearBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  clearBtnText: { fontSize: 12, color: COLORS.textMuted, fontWeight: '500' },
  charCount: { fontSize: 11, color: COLORS.textMuted },

  // Translate button
  translateBtnWrap: {
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
    ...SHADOW.premium,
  },
  translateBtnDisabled: { opacity: 0.5 },
  translateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: 15,
  },
  translateBtnText: { color: COLORS.white, fontSize: 15, fontWeight: '800', letterSpacing: 0.3 },

  // Result
  resultCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    borderWidth: 1.5,
    borderColor: COLORS.bgGreenLight,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOW.md,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  resultLangBadge: {
    backgroundColor: COLORS.bgGreenLight,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
  },
  resultLangText: { fontSize: 10, fontWeight: '800', color: COLORS.primary, letterSpacing: 1 },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF8E7',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#F0E4B8',
  },
  aiBadgeText: { fontSize: 10, fontWeight: '700', color: COLORS.gold },
  resultText: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.textPrimary,
    lineHeight: 36,
    marginBottom: SPACING.md,
    fontFamily: FONTS.serif,
  },
  unknownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.md,
    backgroundColor: '#FFF8E7',
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
  },
  unknownText: { fontSize: 12, color: COLORS.warning, fontWeight: '600', flex: 1 },
  resultActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: COLORS.bgGreenLight,
    borderRadius: RADIUS.full,
  },
  actionBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },

  // History
  historyCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOW.sm,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  historyTitle: { fontSize: 14, fontWeight: '800', color: COLORS.textPrimary },
  clearAllText: { fontSize: 13, color: COLORS.error, fontWeight: '600' },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: 10,
  },
  historyRowBorder: { borderTopWidth: 1, borderTopColor: COLORS.bg },
  historyText: { flex: 1, fontSize: 14, color: COLORS.textSecondary, fontWeight: '500' },

  // FAB
  chatFab: {
    position: 'absolute',
    right: SPACING.lg,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.premium,
    borderWidth: 2,
    borderColor: COLORS.bgGreenLight,
  },
  fabBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
