import Header from '../components/Header';
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { dictionaryAPI } from '../services/api';
import { COLORS, SPACING, RADIUS, SHADOW } from '../config/theme';

interface Word { id: number; english: string; kaubru: string; category: string; }

const CATEGORIES = ['all', 'greetings', 'family', 'numbers', 'phrases', 'nature', 'food'];

export default function PronunciationScreen({ navigation }: any) {
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCat, setSelectedCat] = useState('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mode, setMode] = useState<'list' | 'flashcard'>('list');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try { const res = await dictionaryAPI.getAll(0, 100); setWords(res.data); }
      catch {} finally { setLoading(false); }
    })();
  }, []);

  const filtered = selectedCat === 'all' ? words : words.filter(w => w.category === selectedCat);
  const current = filtered[currentIndex];

  const renderFlashcard = () => {
    if (!current) return null;
    return (
      <View style={styles.flashcardContainer}>
        <Text style={styles.flashcardCounter}>{currentIndex + 1} / {filtered.length}</Text>
        <View style={styles.flashcard}>
          <View style={styles.flashcardSection}>
            <Text style={styles.flashcardLang}>ENGLISH</Text>
            <Text style={styles.flashcardWord}>{current.english}</Text>
            {/* Audio disabled for translation per user request */}
          </View>
          <View style={styles.divider} />
          <View style={styles.flashcardSection}>
            <Text style={styles.flashcardLangKb}>KAUBRU</Text>
            <Text style={styles.flashcardWordKb}>{current.kaubru}</Text>
            {/* Audio disabled for translation per user request */}
          </View>
        </View>
        <View style={styles.navRow}>
          <TouchableOpacity
            style={[styles.navBtn, currentIndex === 0 && styles.navBtnDisabled]}
            onPress={() => setCurrentIndex(i => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
          >
            <Ionicons name="arrow-back" size={18} color={COLORS.textSecondary} />
            <Text style={styles.navBtnText}>Prev</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.navBtn, currentIndex === filtered.length - 1 && styles.navBtnDisabled]}
            onPress={() => setCurrentIndex(i => Math.min(filtered.length - 1, i + 1))}
            disabled={currentIndex === filtered.length - 1}
          >
            <Text style={styles.navBtnText}>Next</Text>
            <Ionicons name="arrow-forward" size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderWordRow = ({ item }: { item: Word }) => (
    <View style={styles.wordRow}>
      <View style={styles.wordTexts}>
        <Text style={styles.wordEn}>{item.english}</Text>
        <Text style={styles.wordKb}>{item.kaubru}</Text>
      </View>
      <View style={styles.wordBtns}>
        {/* Audio disabled for translation per user request */}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header title="Pronunciation" subtitle="Master the sounds of KauBru" showBack={true} />

      {/* Mode toggle */}
      <View style={styles.modeRow}>
        {(['list', 'flashcard'] as const).map((m) => (
          <TouchableOpacity
            key={m}
            onPress={() => { setMode(m); setCurrentIndex(0); }}
            style={[styles.modeBtn, mode === m && styles.modeBtnActive]}
          >
            {m === 'list'
              ? <Ionicons name="list-outline" size={16} color={mode === m ? COLORS.primary : COLORS.textMuted} />
              : <Ionicons name="albums-outline" size={16} color={mode === m ? COLORS.primary : COLORS.textMuted} />
            }
            <Text style={[styles.modeBtnText, mode === m && styles.modeBtnTextActive]}>
              {m === 'list' ? 'List' : 'Flashcard'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Category chips */}
      <FlatList
        data={CATEGORIES}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={i => i}
        style={styles.chips}
        contentContainerStyle={{ paddingHorizontal: SPACING.lg, gap: SPACING.sm }}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => { setSelectedCat(item); setCurrentIndex(0); }}
            style={[styles.chip, selectedCat === item && styles.chipActive]}
          >
            <Text style={[styles.chipText, selectedCat === item && styles.chipTextActive]}>
              {item.charAt(0).toUpperCase() + item.slice(1)}
            </Text>
          </TouchableOpacity>
        )}
      />

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: SPACING.xl }} />
      ) : mode === 'flashcard' ? (
        renderFlashcard()
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id.toString()}
          renderItem={renderWordRow}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  modeRow: {
    flexDirection: 'row', marginHorizontal: SPACING.lg, marginBottom: SPACING.sm,
    backgroundColor: COLORS.bgCardAlt, borderRadius: RADIUS.full,
    padding: 3, borderWidth: 1, borderColor: COLORS.border,
  },
  modeBtn: {
    flex: 1, paddingVertical: SPACING.sm, alignItems: 'center',
    borderRadius: RADIUS.full, flexDirection: 'row', justifyContent: 'center', gap: 6,
  },
  modeBtnActive: { backgroundColor: COLORS.bgCard, ...SHADOW.sm },
  modeBtnText: { color: COLORS.textMuted, fontSize: 13, fontWeight: '600' },
  modeBtnTextActive: { color: COLORS.primary },
  chips: { marginBottom: SPACING.sm },
  chip: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs + 2,
    borderWidth: 1, borderColor: COLORS.border,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { color: COLORS.textSecondary, fontSize: 12 },
  chipTextActive: { color: COLORS.white, fontWeight: '700' },
  list: { paddingHorizontal: SPACING.lg, paddingBottom: 100 },
  wordRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING.md, marginBottom: SPACING.sm, ...SHADOW.sm,
  },
  wordTexts: { flex: 1 },
  wordEn: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '700' },
  wordKb: { color: COLORS.primary, fontSize: 14, marginTop: 2 },
  wordBtns: { flexDirection: 'row', gap: SPACING.sm },
  flashcardContainer: { flex: 1, paddingHorizontal: SPACING.lg, paddingBottom: 100 },
  flashcardCounter: { color: COLORS.textMuted, fontSize: 13, textAlign: 'center', marginBottom: SPACING.md },
  flashcard: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.xl,
    padding: SPACING.xl, borderWidth: 1, borderColor: COLORS.border,
    marginBottom: SPACING.lg, ...SHADOW.md,
  },
  flashcardSection: { alignItems: 'center', paddingVertical: SPACING.md },
  flashcardLang: {
    color: COLORS.textMuted, fontSize: 11, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: SPACING.sm,
  },
  flashcardLangKb: {
    color: COLORS.primary, fontSize: 11, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: SPACING.sm,
  },
  flashcardWord: {
    color: COLORS.textPrimary, fontSize: 32, fontWeight: '800',
    textAlign: 'center', marginBottom: SPACING.lg, fontFamily: 'Georgia',
  },
  flashcardWordKb: {
    color: COLORS.primary, fontSize: 32, fontWeight: '800',
    textAlign: 'center', marginBottom: SPACING.lg, fontFamily: 'Georgia',
  },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.sm },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', gap: SPACING.md },
  navBtn: {
    flex: 1, backgroundColor: COLORS.bgCard, borderRadius: RADIUS.full,
    paddingVertical: SPACING.md, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.border, flexDirection: 'row', gap: 6, ...SHADOW.sm,
  },
  navBtnDisabled: { opacity: 0.3 },
  navBtnText: { color: COLORS.textSecondary, fontWeight: '700', fontSize: 14 },
});
