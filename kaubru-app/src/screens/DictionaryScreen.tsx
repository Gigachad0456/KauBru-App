import Header from '../components/Header';
import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TextInput, StyleSheet,
  TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { dictionaryAPI } from '../services/api';
import { getCachedDictionary, setCachedDictionary, filterWords, Word } from '../services/offlineCache';
import SpeakButton from '../components/SpeakButton';
import { COLORS, SPACING, RADIUS, SHADOW } from '../config/theme';

const FILTER_TABS = ['All Words', 'Common Phrases', 'Greetings', 'Nature', 'Family', 'Numbers'];

export default function DictionaryScreen() {
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All Words');
  const [isOffline, setIsOffline] = useState(false);
  const [emptyCache, setEmptyCache] = useState(false);

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
      // Offline fallback
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

  const handleSearch = (text: string) => {
    setSearchQuery(text);
  };

  const handleSave = async (wordId: number) => {
    try {
      await dictionaryAPI.saveWord(wordId);
      Alert.alert('Saved!', 'Word added to your saved list.');
    } catch (err: any) {
      Alert.alert('Info', err?.response?.data?.detail || 'Could not save word.');
    }
  };

  const tabCategory = (tab: string) => {
    const map: Record<string, string> = {
      'All Words': '', 'Common Phrases': 'phrases', 'Greetings': 'greetings',
      'Nature': 'nature', 'Family': 'family', 'Numbers': 'numbers',
    };
    return map[tab] || '';
  };

  // Apply search filter (local when offline, or just filter the loaded words)
  const searchFiltered = searchQuery.trim()
    ? filterWords(words, searchQuery)
    : words;

  const filtered = activeTab === 'All Words'
    ? searchFiltered
    : searchFiltered.filter(w => w.category === tabCategory(activeTab));

  const wordOfDay = words[0];

  const renderWord = ({ item }: { item: Word }) => (
    <View style={styles.wordCard}>
      <View style={styles.wordRow}>
        <View style={styles.wordMain}>
          <Text style={styles.wordEnglish}>{item.english}</Text>
          {item.example_english && (
            <Text style={styles.wordDesc} numberOfLines={2}>{item.example_english}</Text>
          )}
          <View style={styles.categoryBadge}>
            <Text style={styles.wordCategory}>{item.category?.toUpperCase()}</Text>
          </View>
        </View>
        <View style={styles.wordActions}>
          {/* Audio disabled for dictionary per user request */}
          <TouchableOpacity
            onPress={() => handleSave(item.id)}
            style={styles.saveBtn}
            accessibilityLabel={`Save word ${item.english}`}
            accessibilityRole="button"
          >
            <Ionicons name="bookmark-outline" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header />

      {/* Offline banner */}
      {isOffline && (
        <View style={styles.offlineBanner} accessibilityLabel="Offline Mode - showing cached data">
          <Ionicons name="cloud-offline-outline" size={16} color={COLORS.white} />
          <Text style={styles.offlineBannerText}>Offline Mode</Text>
        </View>
      )}

      <FlatList
        data={filtered}
        keyExtractor={item => item.id.toString()}
        renderItem={renderWord}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View>
            {/* Title */}
            <View style={styles.titleSection}>
              <Text style={styles.title}>Culture Dictionary</Text>
              <Text style={styles.subtitle}>
                Explore the linguistic heritage of KauBru through our verified digital lexicon.
              </Text>
            </View>

            {/* Search */}
            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={20} color={COLORS.primary} style={{ marginRight: SPACING.sm }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search for a word or phrase..."
                placeholderTextColor={COLORS.textMuted}
                value={searchQuery}
                onChangeText={handleSearch}
                accessibilityLabel="Search dictionary"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                  accessibilityLabel="Clear search"
                  accessibilityRole="button"
                >
                  <Ionicons name="close-circle" size={20} color={COLORS.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {/* Filter tabs */}
            <FlatList
              data={FILTER_TABS}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={i => i}
              style={styles.tabs}
              contentContainerStyle={{ gap: SPACING.sm, paddingRight: SPACING.lg }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => setActiveTab(item)}
                  style={styles.tabWrapper}
                >
                  {activeTab === item ? (
                    <LinearGradient
                      colors={[COLORS.primaryLight, COLORS.primary] as const}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.tabActive}
                    >
                      <Text style={styles.tabTextActive}>{item}</Text>
                    </LinearGradient>
                  ) : (
                    <View style={styles.tab}>
                      <Text style={styles.tabText}>{item}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
            />

            {/* Word of the Day */}
            {wordOfDay && (
              <View style={styles.wotdCardWrapper}>
                <LinearGradient
                  colors={['#1C3A2A', '#2D5016']}
                  style={styles.wotdCard}
                >
                  <View style={styles.wotdHeader}>
                    <View style={styles.wotdBadge}>
                      <Ionicons name="star" size={10} color={COLORS.gold} />
                      <Text style={styles.wotdLabel}>WORD OF THE DAY</Text>
                    </View>
                    {/* Audio disabled for dictionary per user request */}
                  </View>
                  <Text style={styles.wotdWord}>{wordOfDay.kaubru}</Text>
                  {wordOfDay.example_kaubru && (
                    <Text style={styles.wotdQuote}>"{wordOfDay.example_kaubru}"</Text>
                  )}
                  <View style={styles.wotdFooter}>
                    <Text style={styles.wotdMeaning}>Means: <Text style={{ fontWeight: '700' }}>{wordOfDay.english}</Text></Text>
                  </View>
                </LinearGradient>
              </View>
            )}

            {loading && <ActivityIndicator color={COLORS.primary} size="large" style={{ marginVertical: SPACING.xl }} />}

            {/* Empty cache message */}
            {isOffline && emptyCache && !loading && (
              <View style={styles.emptyCacheCard}>
                <Ionicons name="wifi-outline" size={48} color={COLORS.textMuted} />
                <Text style={styles.emptyCacheTitle}>No cached data</Text>
                <Text style={styles.emptyCacheText}>
                  Connect to the internet to load the dictionary for the first time.
                </Text>
              </View>
            )}
          </View>
        }
        ListFooterComponent={<View style={{ height: SPACING.xl }} />}
        ListEmptyComponent={
          !loading && !emptyCache ? <Text style={styles.emptyText}>No results found for "{searchQuery}"</Text> : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  offlineBanner: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.warning,
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm,
  },
  offlineBannerText: { color: COLORS.white, fontSize: 13, fontWeight: '700' },
  list: { paddingHorizontal: SPACING.lg, paddingBottom: 100 },
  titleSection: { marginBottom: SPACING.lg, paddingTop: SPACING.md },
  title: { fontSize: 32, fontWeight: '900', color: COLORS.textPrimary, marginBottom: SPACING.xs, fontFamily: 'Georgia', letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: COLORS.textSecondary, lineHeight: 22, fontWeight: '500' },

  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: SPACING.lg, marginBottom: SPACING.lg,
    ...SHADOW.md,
  },
  searchInput: { flex: 1, color: COLORS.textPrimary, fontSize: 16, paddingVertical: SPACING.lg, fontWeight: '500' },

  tabs: { marginBottom: SPACING.lg, marginHorizontal: -SPACING.lg, paddingLeft: SPACING.lg },
  tabWrapper: { marginBottom: 4 },
  tab: {
    paddingHorizontal: SPACING.lg, paddingVertical: 10,
    borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  tabActive: {
    paddingHorizontal: SPACING.lg, paddingVertical: 10,
    borderRadius: RADIUS.full,
    ...SHADOW.md,
  },
  tabText: { fontSize: 14, fontWeight: '700', color: COLORS.textMuted },
  tabTextActive: { color: COLORS.white, fontSize: 14, fontWeight: '800' },

  wotdCardWrapper: {
    marginBottom: SPACING.xl,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    ...SHADOW.premium,
  },
  wotdCard: {
    padding: SPACING.xl,
  },
  wotdHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  wotdBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.full,
  },
  wotdLabel: { fontSize: 10, fontWeight: '900', color: COLORS.gold, letterSpacing: 1.5 },
  wotdSpeak: { backgroundColor: 'rgba(255,255,255,0.2)', width: 36, height: 36, borderRadius: 18 },
  wotdWord: { fontSize: 44, fontWeight: '900', color: COLORS.white, fontFamily: 'Georgia', marginBottom: SPACING.sm },
  wotdQuote: { fontSize: 16, color: 'rgba(255,255,255,0.8)', fontStyle: 'italic', lineHeight: 24, marginBottom: SPACING.lg },
  wotdFooter: { paddingTop: SPACING.md, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  wotdMeaning: { color: COLORS.white, fontSize: 15, fontWeight: '500' },

  wordCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.xl,
    borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING.lg, marginBottom: SPACING.md, ...SHADOW.sm,
  },
  wordRow: { flexDirection: 'row', alignItems: 'center' },
  wordMain: { flex: 1 },
  wordEnglish: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 6, fontFamily: 'Georgia' },
  wordDesc: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 22, marginBottom: SPACING.sm },
  categoryBadge: { alignSelf: 'flex-start', backgroundColor: COLORS.bgGreenLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.sm },
  wordCategory: { fontSize: 10, fontWeight: '800', color: COLORS.primary, letterSpacing: 1 },
  wordActions: { flexDirection: 'row', gap: SPACING.md, alignItems: 'center' },
  actionBtn: { backgroundColor: COLORS.bgCardAlt, width: 44, height: 44, borderRadius: 22 },
  saveBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },

  emptyCacheCard: {
    alignItems: 'center', padding: SPACING.xxl,
    backgroundColor: COLORS.white, borderRadius: RADIUS.xl,
    borderWidth: 1, borderColor: COLORS.border, marginTop: SPACING.lg,
    ...SHADOW.md,
  },
  emptyCacheTitle: { fontSize: 20, fontWeight: '900', color: COLORS.textPrimary, marginTop: SPACING.lg, marginBottom: SPACING.sm },
  emptyCacheText: { fontSize: 15, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 24 },

  emptyText: { color: COLORS.textMuted, textAlign: 'center', marginTop: SPACING.xxl, fontSize: 16, fontWeight: '600' },
});

