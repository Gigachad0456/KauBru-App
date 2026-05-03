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
import { storiesAPI } from '../services/api';
import { COLORS, SPACING, RADIUS, SHADOW } from '../config/theme';
import { API_BASE_URL } from '../config/api';

interface Story {
  id: number;
  title: string;
  title_kaubru?: string;
  summary?: string;
  cover_image_url?: string;
  category: string;
  is_premium: boolean;
  read_time_minutes: number;
  created_at: string;
}

const CATEGORY_TABS = ['All', 'Folktale', 'Legend', 'Proverb', 'Poem'];

const CATEGORY_COLORS: Record<string, string> = {
  folktale: '#C9A84C',
  legend: '#4A7C59',
  proverb: '#7C4A3A',
  poem: '#3A4A7C',
};

function coverUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${API_BASE_URL}${path}`;
}

const FALLBACK_IMAGES = [
  require('../../assets/story_elder.png'),
  require('../../assets/story_forest.png'),
  require('../../assets/story_festival.png'),
  require('../../assets/culture1.jpg'),
  require('../../assets/culture2.png'),
];

export default function StoriesScreen({ navigation }: any) {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await storiesAPI.getAll({ limit: 50 });
      setStories(res.data);
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to load stories.');
    } finally {
      setLoading(false);
    }
  };

  const filtered =
    activeCategory === 'All'
      ? stories
      : stories.filter(
        s => s.category.toLowerCase() === activeCategory.toLowerCase()
      );

  const renderStory = ({ item, index }: { item: Story; index: number }) => {
    const url = coverUrl(item.cover_image_url);
    const fallback = FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
    const catColor =
      CATEGORY_COLORS[item.category.toLowerCase()] || COLORS.primary;

    return (
      <TouchableOpacity
        style={styles.cardWrapper}
        onPress={() => navigation.navigate('StoryDetail', { story: item })}
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

            {item.is_premium && (
              <View style={styles.premiumBadge}>
                <Ionicons name="star" size={10} color={COLORS.gold} />
                <Text style={styles.premiumBadgeText}>PREMIUM</Text>
              </View>
            )}

            {(item as any).audio_url && (
              <View style={styles.audioBadge}>
                <Ionicons name="volume-high" size={10} color={COLORS.white} />
                <Text style={styles.audioBadgeText}>LISTEN</Text>
              </View>
            )}
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
              <Text style={styles.readMoreText}>Read Story</Text>
            </View>
          </View>
        </ImageBackground>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Header title="Culture Stories" subtitle="Folktales, legends and ancestral wisdom" />

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
            <LinearGradient colors={[COLORS.primaryLight, COLORS.primary] as const} style={styles.retryBtn}>
              <Text style={styles.retryText}>Try Again</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id.toString()}
          renderItem={renderStory}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons
                name="book-outline"
                size={64}
                color={COLORS.textMuted}
                style={{ opacity: 0.3 }}
              />
              <Text style={styles.emptyTitle}>No stories yet</Text>
              <Text style={styles.emptyText}>
                Folktales and cultural stories will appear here once added by the community.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

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
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  premiumBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.gold,
    letterSpacing: 1,
  },
  audioBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(28, 58, 42, 0.7)',
    borderRadius: RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  audioBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 1,
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
