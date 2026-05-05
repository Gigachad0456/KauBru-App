import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, FlatList, TextInput, StyleSheet,
  TouchableOpacity, ActivityIndicator, Alert, Animated,
  StatusBar, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { dictionaryAPI } from '../services/api';
import { getCachedDictionary, setCachedDictionary, filterWords, Word } from '../services/offlineCache';
import { COLORS, SPACING, RADIUS, SHADOW, FONTS, GRADIENTS } from '../config/theme';

const FILTER_TABS = ['All', 'Phrases', 'Greetings', 'Nature', 'Family', 'Numbers'];

const TAB_CATEGORY: Record<string, string> = {
  All: '', Phrases: 'phrases', Greetings: 'greetings',
  Nature: 'nature', Family: 'family', Numbers: 'numbers',
};

export default function DictionaryScreen() {
  const insets = useSafeAreaInsets();
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [isOffline, setIsOffline] = useState(false);
  const [emptyCache, setEmptyCache] = useState(false);
  const searchAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => { loadDictionary(); }, []);

  const loadDictionary = async () => {
    setLoading(true);
    setEmptyCache(false);
    try {
      const res = await dictionaryAPI.getAll(0, 500);
      setWords(res.data);
      setIsOffline(false);
      await setCachedDictionary(res.data);
    } catch {
      const cached = await getCachedDictionary();
      if (cached && cached.words.length > 0) {
        setWords(cached.words);
        setIsOffline(true);
      } else {
        setIsOffline(true);
        setEmptyCache(true);
        setWords([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (wordId: number) => {
    try {
      await dictionaryAPI.saveWord(wordId);
      Alert.alert('Saved', 'Word added to your saved list.');
    } catch (err: any) {
      Alert.alert('Info', err?.response?.data?.detail || 'Could not save word.');
    }
  };

  const searchFiltered = searchQuery.trim() ? filterWords(words, searchQuery) : words;
  const filtered = activeTab === 'All'
    ? searchFiltered
    : searchFiltered.filter(w => w.category === TAB_CATEGORY[activeTab]);
  const wordOfDay = words.length > 0 ? words[0] : null;

  const renderWord = ({ item, index }: { item: Word; index: number }) => (
    <View style={[styles.wordCard, index === 0 && { marginTop: 0 }]}>
      <View style={styles.wordRow}>
        <View style={styles.wordLeft}>
          <Text style={styles.wordKaubru}>{item.kaubru}</Text>
          <Text style={styles.wordEnglish}>{item.english}</Text>
          {item.example_english ? (
            <Text style={styles.wordExample} numberOfLines={2}>
              "{item.example_english}"
            </Text>
          ) : null}
        </View>
        <View style={styles.wordRight}>
          <TouchableOpacity onPress={() => handleSave(item.id)} style={styles.saveBtn} accessibilityLabel="Save word">
            <Ionicons name="bookmark-outline" size={18} color={COLORS.primary} />
          </TouchableOpacity>
          {item.category ? (
            <View style={styles.categoryPill}>
              <Text style={styles.categoryText}>{item.category.toUpperCase()}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );

  const ListHeader = (
    <View>
      {/* Page title */}
      <View style={[styles.titleSection, { paddingTop: insets.top + SPACING.md }]}>
        <Text style={styles.pageTitle}>Dictionary</Text>
        <Text style={styles.pageSubtitle}>
          {words.length > 0 ? `${words.length} words` : 'Explore the KauBru language'}
        </Text>
      </View>

      {/* Search bar */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search words..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter tabs */}
      <FlatList
        data={FILTER_TABS}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={i => i}
        style={styles.tabsRow}
        contentContainerStyle={styles.tabsContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => setActiveTab(item)}
            style={[styles.tab, activeTab === item && styles.tabActive]}
            accessibilityRole="button"
          >
            <Text style={[styles.tabText, activeTab === item && styles.tabTextActive]}>
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Word of the Day */}
      {!searchQuery && wordOfDay && activeTab === 'All' && (
        <View style={styles.wotdWrap}>
          <LinearGradient
            colors={GRADIENTS.premium as any}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.wotdCard}
          >
            <View style={styles.wotdTopRow}>
              <View style={styles.wotdBadge}>
                <Ionicons name="star" size={10} color={COLORS.gold} />
                <Text style={styles.wotdBadgeText}>WORD OF THE DAY</Text>
              </View>
            </View>
            <Text style={styles.wotdWord}>{wordOfDay.kaubru}</Text>
            <Text style={styles.wotdMeaning}>{wordOfDay.english}</Text>
            {wordOfDay.example_english ? (
              <Text style={styles.wotdExample} numberOfLines={2}>
                "{wordOfDay.example_english}"
              </Text>
            ) : null}
          </LinearGradient>
        </View>
      )}

      {/* Offline banner */}
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline-outline" size={13} color={COLORS.warning} />
          <Text style={styles.offlineBannerText}>Showing cached results</Text>
        </View>
      )}

      {loading && (
        <ActivityIndicator color={COLORS.primary} size="large" style={{ marginVertical: SPACING.xl }} />
      )}

      {isOffline && emptyCache && !loading && (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="wifi-outline" size={32} color={COLORS.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>No Connection</Text>
          <Text style={styles.emptyText}>Connect to the internet to load the dictionary.</Text>
        </View>
      )}

      {/* Section label */}
      {!loading && filtered.length > 0 && (
        <View style={styles.sectionLabel}>
          <Text style={styles.sectionLabelText}>
            {filtered.length} {activeTab === 'All' ? 'words' : activeTab.toLowerCase()}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <FlatList
        data={filtered}
        keyExtractor={item => item.id.toString()}
        renderItem={renderWord}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={<View style={{ height: SPACING.tabBar + SPACING.lg }} />}
        ListEmptyComponent={
          !loading && !emptyCache ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No results</Text>
              <Text style={styles.emptyText}>Try a different search or category.</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  listContent: { paddingBottom: 20 },

  titleSection: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  pageTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontFamily: FONTS.serif,
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  pageSubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '500',
  },

  searchWrap: { paddingHorizontal: SPACING.lg, marginBottom: SPACING.md },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.sm,
  },
  searchInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '500',
  },

  tabsRow: { marginBottom: SPACING.lg },
  tabsContent: { paddingHorizontal: SPACING.lg, gap: SPACING.sm },
  tab: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  tabTextActive: { color: COLORS.white },

  wotdWrap: { paddingHorizontal: SPACING.lg, marginBottom: SPACING.lg },
  wotdCard: {
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    ...SHADOW.premium,
  },
  wotdTopRow: { marginBottom: SPACING.md },
  wotdBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(201,168,76,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.35)',
  },
  wotdBadgeText: { fontSize: 10, fontWeight: '800', color: COLORS.gold, letterSpacing: 1.2 },
  wotdWord: {
    fontSize: 40,
    fontWeight: '400',
    color: COLORS.white,
    fontFamily: FONTS.serif,
    marginBottom: 4,
  },
  wotdMeaning: { fontSize: 17, color: 'rgba(255,255,255,0.85)', fontWeight: '500', marginBottom: 8 },
  wotdExample: { fontSize: 13, color: 'rgba(255,255,255,0.65)', fontStyle: 'italic', lineHeight: 20 },

  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    backgroundColor: '#FFF8E7',
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#F0E4B8',
  },
  offlineBannerText: { fontSize: 12, fontWeight: '600', color: COLORS.warning },

  sectionLabel: { paddingHorizontal: SPACING.lg, marginBottom: SPACING.sm },
  sectionLabelText: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 0.5, textTransform: 'uppercase' },

  // Word cards
  wordCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.lg,
    marginBottom: 10,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.sm,
  },
  wordRow: { flexDirection: 'row', alignItems: 'flex-start' },
  wordLeft: { flex: 1, paddingRight: SPACING.sm },
  wordKaubru: {
    fontSize: 22,
    fontWeight: '400',
    color: COLORS.primary,
    fontFamily: FONTS.serif,
    marginBottom: 2,
  },
  wordEnglish: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  wordExample: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    lineHeight: 19,
  },
  wordRight: { alignItems: 'flex-end', gap: SPACING.sm },
  saveBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.bgGreenLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryPill: {
    backgroundColor: COLORS.bgCardAlt,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryText: { fontSize: 9, fontWeight: '800', color: COLORS.textMuted, letterSpacing: 0.8 },

  emptyState: { alignItems: 'center', paddingVertical: SPACING.xxl, paddingHorizontal: SPACING.xl },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: COLORS.bgCardAlt,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 6 },
  emptyText: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', lineHeight: 20 },
});
