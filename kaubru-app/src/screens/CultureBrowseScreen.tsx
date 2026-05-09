import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import Header from '../components/Header';
import { cultureAPI } from '../services/api';
import { COLORS, SPACING, RADIUS, SHADOW } from '../config/theme';
import { API_BASE_URL } from '../config/api';
import { CultureArticlePreview } from '../navigation/AppNavigator';

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_TABS = ['All', 'History', 'Dance', 'Music', 'Traditions', 'Language', 'Festivals'];

const CATEGORY_COLORS: Record<string, string> = {
  history:    '#8B4513',
  dance:      '#C9A84C',
  music:      '#4A7C59',
  traditions: '#7C4A3A',
  language:   '#3A4A7C',
  festivals:  '#C0392B',
};

const FALLBACK_IMAGES = [
  require('../../assets/culture1.jpg'),
  require('../../assets/culture2.png'),
  require('../../assets/culture3.png'),
  require('../../assets/culture2.png'),
  require('../../assets/culture1.jpg'),
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function coverUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${API_BASE_URL}${path}`;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function CultureBrowseScreen({ navigation, route }: any) {
  const [articles, setArticles] = useState<CultureArticlePreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pre-select category if navigated from a highlight card
  const initialCategory = route?.params?.category
    ? route.params.category.charAt(0).toUpperCase() + route.params.category.slice(1)
    : 'All';
  const [activeCategory, setActiveCategory] = useState(initialCategory);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await cultureAPI.getAll({ limit: 50 } as any);
      setArticles(res.data);
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to load articles.');
    } finally {
      setLoading(false);
    }
  };

  const filtered =
    activeCategory === 'All'
      ? articles
      : articles.filter(
          a => a.category.toLowerCase() === activeCategory.toLowerCase()
        );

  const renderArticle = ({ item, index }: { item: CultureArticlePreview; index: number }) => {
    const url = coverUrl(item.cover_image_url);
    const fallback = FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
    const catColor = CATEGORY_COLORS[item.category.toLowerCase()] || COLORS.primary;

    return (
      <TouchableOpacity
        style={styles.cardWrapper}
        onPress={() => navigation.navigate('ArticleDetail', { article: item })}
        activeOpacity={0.9}
      >
        <ImageBackground
          source={url ? { uri: url } : fallback}
          style={styles.cardImage}
          resizeMode="cover"
        >
          {/* Cinematic gradient overlay */}
          <LinearGradient
            colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.9)']}
            locations={[0, 0.4, 1]}
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.cardTop}>
            <View style={[styles.catBadge, { backgroundColor: catColor }]}>
              <Text style={styles.catBadgeText}>
                {item.category.toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.cardBottom}>
            <Text style={styles.cardTitle}>{item.title}</Text>

            {item.summary && (
              <Text style={styles.cardSummary} numberOfLines={2}>
                {item.summary}
              </Text>
            )}

            <View style={styles.cardMeta}>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.8)" />
                <Text style={styles.cardMetaText}>{item.read_time_minutes} min read</Text>
              </View>
              <View style={styles.metaDivider} />
              <Text style={styles.readMoreText}>Read Article</Text>
            </View>
          </View>
        </ImageBackground>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title="Culture & Heritage"
        subtitle="Explore KauBru history, dance, music & traditions"
      />

      {/* Category filter chips */}
      <View style={styles.tabsContainer}>
        <FlatList
          horizontal
          data={CATEGORY_TABS}
          keyExtractor={item => item}
          style={styles.tabs}
          contentContainerStyle={{
            paddingHorizontal: SPACING.lg,
            gap: 10,
          }}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setActiveCategory(item)}
              style={styles.tabItem}
            >
              {activeCategory === item ? (
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
      </View>

      {loading ? (
        <ActivityIndicator
          color={COLORS.primary}
          size="large"
          style={{ marginTop: SPACING.xxl }}
        />
      ) : error ? (
        <View style={styles.errorCard}>
          <Ionicons
            name="alert-circle-outline"
            size={48}
            color={COLORS.error}
          />
          <Text style={styles.errorText}>{error}</Text>

          <TouchableOpacity onPress={load} style={styles.retryBtnWrapper}>
            <LinearGradient
              colors={[COLORS.primaryLight, COLORS.primary] as const}
              style={styles.retryBtn}
            >
              <Text style={styles.retryText}>Try Again</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id.toString()}
          renderItem={renderArticle}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons
                name="library-outline"
                size={64}
                color={COLORS.textMuted}
                style={{ opacity: 0.3 }}
              />
              <Text style={styles.emptyTitle}>No articles yet</Text>
              <Text style={styles.emptyText}>
                Culture and heritage articles will appear here once added by the community.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  list: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 120,
    paddingTop: SPACING.md,
  },
  tabsContainer: {
    paddingVertical: SPACING.md,
  },
  tabs: {
    marginBottom: 0,
  },
  tabItem: {
    marginBottom: 4,
  },
  tab: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  tabActive: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    ...SHADOW.md,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  tabTextActive: {
    color: COLORS.white,
    fontWeight: '800',
  },
  cardWrapper: {
    marginBottom: SPACING.lg,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    ...SHADOW.premium,
  },
  cardImage: {
    height: 280,
    justifyContent: 'space-between',
  },
  cardTop: {
    flexDirection: 'row',
    gap: SPACING.sm,
    padding: SPACING.lg,
    alignItems: 'flex-start',
  },
  catBadge: {
    borderRadius: RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
    ...SHADOW.sm,
  },
  catBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 1.5,
  },
  cardBottom: {
    padding: SPACING.lg,
  },
  cardTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.white,
    fontFamily: 'Georgia',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    letterSpacing: -0.5,
  },
  cardSummary: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 22,
    marginBottom: SPACING.md,
    fontWeight: '500',
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardMetaText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '700',
  },
  metaDivider: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  readMoreText: {
    fontSize: 12,
    color: COLORS.gold,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  errorCard: {
    alignItems: 'center',
    padding: SPACING.xxl,
    marginHorizontal: SPACING.lg,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: SPACING.xl,
    ...SHADOW.md,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginVertical: SPACING.lg,
    lineHeight: 24,
    fontWeight: '500',
  },
  retryBtnWrapper: {
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    ...SHADOW.md,
  },
  retryBtn: {
    paddingHorizontal: 40,
    paddingVertical: 12,
  },
  retryText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 16,
  },
  emptyState: {
    alignItems: 'center',
    padding: SPACING.xxl,
    marginTop: SPACING.xxl,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.textPrimary,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
  },
});
