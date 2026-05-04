import Header from '../components/Header';
import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TextInput, StyleSheet,
  TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { dictionaryAPI } from '../services/api';
import { getCachedDictionary, setCachedDictionary, filterWords, Word } from '../services/offlineCache';
import { COLORS, SPACING, RADIUS, SHADOW, FONTS, GRADIENTS } from '../config/theme';

const FILTER_TABS = ['All', 'Phrases', 'Greetings', 'Nature', 'Family', 'Numbers'];

export default function DictionaryScreen() {
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
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

  const handleSearch = (text: string) => setSearchQuery(text);

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
      'All': '', 'Phrases': 'phrases', 'Greetings': 'greetings',
      'Nature': 'nature', 'Family': 'family', 'Numbers': 'numbers',
    };
    return map[tab] || '';
  };

  const searchFiltered = searchQuery.trim() ? filterWords(words, searchQuery) : words;
  const filtered = activeTab === 'All' ? searchFiltered : searchFiltered.filter(w => w.category === tabCategory(activeTab));
  const wordOfDay = words.length > 0 ? words[0] : null;

  const renderWord = ({ item }: { item: Word }) => (
    <View style={styles.wordCard}>
      <View style={styles.wordHeaderRow}>
        <View style={styles.wordTitles}>
          <Text style={styles.wordKaubru}>{item.kaubru}</Text>
          <Text style={styles.wordEnglish}>{item.english}</Text>
        </View>
        <TouchableOpacity onPress={() => handleSave(item.id)} style={styles.saveBtn}>
          <Ionicons name="bookmark-outline" size={22} color={COLORS.primaryLight} />
        </TouchableOpacity>
      </View>
      
      {item.example_english && (
        <View style={styles.exampleBox}>
          <Text style={styles.wordDesc}>"{item.example_english}"</Text>
        </View>
      )}
      
      <View style={styles.wordFooter}>
        <View style={styles.categoryBadge}>
          <Text style={styles.wordCategory}>{item.category?.toUpperCase() || 'GENERAL'}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header />

      {isOffline && (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline-outline" size={14} color={COLORS.white} />
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
            <View style={styles.titleSection}>
              <Text style={styles.title}>Dictionary</Text>
              <Text style={styles.subtitle}>Explore the KauBru language</Text>
            </View>

            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={20} color={COLORS.textMuted} style={{ marginRight: SPACING.sm }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search words..."
                placeholderTextColor={COLORS.textMuted}
                value={searchQuery}
                onChangeText={handleSearch}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color={COLORS.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            <FlatList
              data={FILTER_TABS}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={i => i}
              style={styles.tabs}
              contentContainerStyle={{ gap: SPACING.md, paddingHorizontal: SPACING.lg }}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => setActiveTab(item)} style={[styles.tab, activeTab === item && styles.tabActive]}>
                  <Text style={[styles.tabText, activeTab === item && styles.tabTextActive]}>{item}</Text>
                </TouchableOpacity>
              )}
            />

            {!searchQuery && wordOfDay && activeTab === 'All' && (
              <View style={styles.wotdWrapper}>
                <LinearGradient colors={GRADIENTS.premium as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.wotdCard}>
                  <View style={styles.wotdBadge}>
                    <Text style={styles.wotdLabel}>WORD OF THE DAY</Text>
                  </View>
                  <Text style={styles.wotdWord}>{wordOfDay.kaubru}</Text>
                  <Text style={styles.wotdMeaning}>{wordOfDay.english}</Text>
                </LinearGradient>
              </View>
            )}

            {loading && <ActivityIndicator color={COLORS.primary} size="large" style={{ marginVertical: SPACING.xl }} />}

            {isOffline && emptyCache && !loading && (
              <View style={styles.emptyCacheCard}>
                <Ionicons name="wifi-outline" size={48} color={COLORS.borderDark} />
                <Text style={styles.emptyCacheTitle}>No Connection</Text>
                <Text style={styles.emptyCacheText}>Connect to the internet to load the dictionary.</Text>
              </View>
            )}
          </View>
        }
        ListFooterComponent={<View style={{ height: SPACING.xxl * 2 }} />}
        ListEmptyComponent={
          !loading && !emptyCache ? <Text style={styles.emptyText}>No results found.</Text> : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  offlineBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: COLORS.warning, paddingVertical: 6,
  },
  offlineBannerText: { color: COLORS.white, fontSize: 12, fontWeight: '600' },
  list: { paddingBottom: 100 },
  titleSection: { paddingHorizontal: SPACING.lg, marginTop: SPACING.md, marginBottom: SPACING.xl },
  title: { fontSize: 36, fontWeight: '700', color: COLORS.textPrimary, fontFamily: FONTS.serif, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: COLORS.textSecondary, marginTop: 4 },
  
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white, borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.lg, marginHorizontal: SPACING.lg, marginBottom: SPACING.xl,
    borderWidth: 1, borderColor: COLORS.border,
    ...SHADOW.sm, height: 56,
  },
  searchInput: { flex: 1, color: COLORS.textPrimary, fontSize: 16, height: '100%' },

  tabs: { marginBottom: SPACING.xl },
  tab: { paddingVertical: 8, paddingHorizontal: 20, borderRadius: RADIUS.full, backgroundColor: COLORS.bgCardAlt, borderWidth: 1, borderColor: COLORS.border },
  tabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabText: { fontSize: 14, fontWeight: '700', color: COLORS.textSecondary },
  tabTextActive: { color: COLORS.white },

  wotdWrapper: { paddingHorizontal: SPACING.lg, marginBottom: SPACING.xl },
  wotdCard: { padding: SPACING.xxl, borderRadius: RADIUS.xl, ...SHADOW.premium },
  wotdBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.full, marginBottom: SPACING.md },
  wotdLabel: { fontSize: 11, fontWeight: '800', color: COLORS.white, letterSpacing: 1.5 },
  wotdWord: { fontSize: 42, fontWeight: '400', color: COLORS.white, fontFamily: FONTS.serif, marginBottom: 8, textShadowColor: 'rgba(0,0,0,0.1)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
  wotdMeaning: { color: 'rgba(255,255,255,0.9)', fontSize: 18, fontWeight: '500' },

  wordCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    marginHorizontal: SPACING.lg, marginBottom: SPACING.md, padding: SPACING.xl,
    borderWidth: 1, borderColor: COLORS.border,
    ...SHADOW.sm,
  },
  wordHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.md },
  wordTitles: { flex: 1, paddingRight: SPACING.md },
  wordKaubru: { fontSize: 26, fontWeight: '400', color: COLORS.primary, fontFamily: FONTS.serif, marginBottom: 4 },
  wordEnglish: { fontSize: 15, fontWeight: '600', color: COLORS.textSecondary },
  
  exampleBox: {
    backgroundColor: COLORS.bgGreenLight,
    padding: SPACING.md, borderRadius: RADIUS.sm,
    marginBottom: SPACING.md, borderLeftWidth: 3, borderLeftColor: COLORS.primaryLight,
  },
  wordDesc: { fontSize: 15, color: COLORS.textPrimary, fontStyle: 'italic', lineHeight: 22 },
  
  wordFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  categoryBadge: { alignSelf: 'flex-start', backgroundColor: COLORS.bgCardAlt, paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: COLORS.border },
  wordCategory: { fontSize: 10, fontWeight: '800', color: COLORS.textMuted, letterSpacing: 1 },
  saveBtn: { padding: 4, backgroundColor: COLORS.bgCardAlt, borderRadius: 20 },

  emptyCacheCard: { alignItems: 'center', padding: SPACING.xxl, marginTop: SPACING.xl },
  emptyCacheTitle: { fontSize: 18, fontWeight: '600', color: COLORS.textPrimary, marginTop: SPACING.md, marginBottom: 4 },
  emptyCacheText: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center' },
  emptyText: { color: COLORS.textMuted, textAlign: 'center', marginTop: SPACING.xxl, fontSize: 15 },
});


