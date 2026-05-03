import Header from '../components/Header';
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { dictionaryAPI } from '../services/api';
import { filterWords, Word } from '../services/offlineCache';
import { COLORS, SPACING, RADIUS, SHADOW } from '../config/theme';

export default function SavedWordsScreen({ navigation }: any) {
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await dictionaryAPI.saved();
      setWords(res.data);
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to load saved words. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (wordId: number) => {
    try {
      await dictionaryAPI.unsaveWord(wordId);
      setWords(prev => prev.filter(w => w.id !== wordId));
    } catch (e: any) {
      // Silently fail or show inline error
    }
  };

  const filtered = searchQuery.trim() ? filterWords(words, searchQuery) : words;

  const renderWord = ({ item }: { item: Word }) => (
    <View style={styles.wordCard}>
      <View style={styles.wordRow}>
        <View style={styles.wordMain}>
          <Text style={styles.wordEnglish}>{item.english}</Text>
          <Text style={styles.wordKaubru}>{item.kaubru}</Text>
          <Text style={styles.wordCategory}>{item.category?.toUpperCase()}</Text>
        </View>
        <View style={styles.wordActions}>
          {/* Audio disabled for translation per user request */}
          <TouchableOpacity
            onPress={() => handleRemove(item.id)}
            style={styles.removeBtn}
            accessibilityLabel={`Remove ${item.english} from saved words`}
            accessibilityRole="button"
          >
            <Ionicons name="bookmark" size={18} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header title="Saved Words" showBack={true} />

      {/* Search */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={16} color={COLORS.textMuted} style={{ marginRight: SPACING.sm }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search saved words..."
          placeholderTextColor={COLORS.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          accessibilityLabel="Search saved words"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
          >
            <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {loading && (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: SPACING.xl }} />
      )}

      {error && !loading && (
        <View style={styles.errorCard}>
          <Ionicons name="alert-circle-outline" size={32} color={COLORS.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            onPress={load}
            style={styles.retryBtn}
            accessibilityRole="button"
            accessibilityLabel="Retry loading saved words"
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && !error && (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id.toString()}
          renderItem={renderWord}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="bookmark-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>No saved words yet</Text>
              <Text style={styles.emptyText}>
                {searchQuery ? 'No words match your search.' : 'Explore the Dictionary and bookmark words to see them here.'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.lg, paddingTop: SPACING.xxl, paddingBottom: SPACING.md,
    gap: SPACING.md,
  },
  backBtn: { padding: SPACING.xs },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary },
  headerCount: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.full,
    borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOW.sm,
  },
  searchInput: { flex: 1, color: COLORS.textPrimary, fontSize: 14, paddingVertical: SPACING.md },
  list: { paddingHorizontal: SPACING.lg, paddingBottom: 100 },
  wordCard: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING.md, marginBottom: SPACING.sm, ...SHADOW.sm,
  },
  wordRow: { flexDirection: 'row', alignItems: 'flex-start' },
  wordMain: { flex: 1 },
  wordEnglish: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 2, fontFamily: 'Georgia' },
  wordKaubru: { fontSize: 15, color: COLORS.primary, fontWeight: '600', marginBottom: 4 },
  wordCategory: { fontSize: 10, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 1 },
  wordActions: { flexDirection: 'row', gap: SPACING.sm, alignItems: 'center' },
  removeBtn: { padding: 4 },
  errorCard: {
    alignItems: 'center', padding: SPACING.xl,
    marginHorizontal: SPACING.lg,
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border, marginTop: SPACING.md,
  },
  errorText: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.md, marginBottom: SPACING.md },
  retryBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.xl, paddingVertical: SPACING.sm,
  },
  retryText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
  emptyState: {
    alignItems: 'center', padding: SPACING.xl, marginTop: SPACING.xl,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginTop: SPACING.md, marginBottom: SPACING.sm },
  emptyText: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22 },
});
