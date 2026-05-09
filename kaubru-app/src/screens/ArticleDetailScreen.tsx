import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, ImageBackground, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cultureAPI } from '../services/api';
import { CultureArticlePreview } from '../navigation/AppNavigator';
import { API_BASE_URL } from '../config/api';
import { COLORS, SPACING, RADIUS, SHADOW, FONTS } from '../config/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CultureVocabWord {
  id: number;
  english: string;
  kaubru: string;
  audio_url?: string;
}

interface CultureArticleFull extends CultureArticlePreview {
  content: string;
  vocabulary?: CultureVocabWord[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const FALLBACK_IMAGES = [
  require('../../assets/culture1.jpg'),
  require('../../assets/culture2.png'),
  require('../../assets/culture3.png'),
  require('../../assets/culture1.jpg'),
  require('../../assets/culture2.png'),
];

const CATEGORY_COLORS: Record<string, string> = {
  history:    '#8B4513',
  dance:      '#C9A84C',
  music:      '#4A7C59',
  traditions: '#7C4A3A',
  language:   '#3A4A7C',
  festivals:  '#C0392B',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fullUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${API_BASE_URL}${path}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ArticleDetailScreen({ route, navigation }: any) {
  const { article: initialArticle } = route.params as { article: CultureArticlePreview };

  const [article, setArticle] = useState<CultureArticleFull>({
    ...initialArticle,
    content: '',
  });
  const [loading, setLoading] = useState(false);
  const [showVocab, setShowVocab] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await cultureAPI.getById(initialArticle.id);
        if (res.data) {
          setArticle(res.data);
        }
      } catch (err: any) {
        console.error('Failed to load article details', err);
        Alert.alert(
          'Connection Issue',
          'Could not load article content. Please check your connection.'
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const coverUrl = fullUrl(article.cover_image_url);
  const fallback = FALLBACK_IMAGES[article.id % FALLBACK_IMAGES.length];
  const catColor = CATEGORY_COLORS[article.category?.toLowerCase()] || COLORS.primary;

  // Parse tags from comma-separated string
  const tags = article.tags
    ? article.tags.split(',').map(t => t.trim()).filter(Boolean)
    : [];

  const vocabulary = article.vocabulary ?? [];

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <ImageBackground
          source={coverUrl ? { uri: coverUrl } : fallback}
          style={styles.hero}
          resizeMode="cover"
        >
          <View style={styles.heroOverlay} />

          {/* Top bar */}
          <View style={styles.heroTopBar}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backBtn}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="arrow-back" size={22} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          {/* Hero content */}
          <View style={styles.heroContent}>
            <View style={[styles.catBadge, { backgroundColor: catColor }]}>
              <Text style={styles.catBadgeText}>
                {article.category?.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.heroTitle}>{article.title}</Text>
            <View style={styles.heroMeta}>
              <Ionicons name="time-outline" size={13} color="rgba(255,255,255,0.8)" />
              <Text style={styles.heroMetaText}>
                {article.read_time_minutes} min read
              </Text>
            </View>
          </View>
        </ImageBackground>

        {/* ── Body ─────────────────────────────────────────────────────────── */}
        {loading ? (
          <ActivityIndicator
            color={COLORS.primary}
            style={{ marginTop: SPACING.xl }}
          />
        ) : (
          <View style={styles.contentSection}>

            {/* Summary */}
            {article.summary ? (
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>SUMMARY</Text>
                <Text style={styles.summaryText}>{article.summary}</Text>
              </View>
            ) : null}

            {/* Article content card */}
            {article.content ? (
              <View style={styles.articleCard}>
                {/* Card header */}
                <View style={styles.articleCardHeader}>
                  <View style={styles.articleHeaderDot} />
                  <Text style={styles.articleHeaderLabel}>ARTICLE</Text>
                  <View style={styles.articleHeaderDot} />
                </View>

                {/* Decorative top border */}
                <View style={styles.articleBorder} />

                {/* Article body text */}
                <Text style={styles.articleText}>{article.content}</Text>

                {/* Decorative bottom border */}
                <View style={styles.articleBorder} />

                {/* Footer */}
                <View style={styles.articleFooter}>
                  <Ionicons name="leaf-outline" size={12} color={COLORS.primary} />
                  <Text style={styles.articleFooterText}>{article.title}</Text>
                  <Ionicons name="leaf-outline" size={12} color={COLORS.primary} />
                </View>
              </View>
            ) : (
              <View style={styles.noContent}>
                <Ionicons
                  name="document-text-outline"
                  size={40}
                  color={COLORS.textMuted}
                />
                <Text style={styles.noContentText}>Article content coming soon.</Text>
              </View>
            )}

            {/* Tags */}
            {tags.length > 0 && (
              <View style={styles.tagsRow}>
                {tags.map((tag, idx) => (
                  <View key={idx} style={styles.tagPill}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Vocabulary panel */}
            {vocabulary.length > 0 && (
              <View style={styles.vocabSection}>
                <TouchableOpacity
                  style={styles.vocabHeader}
                  onPress={() => setShowVocab(!showVocab)}
                  accessibilityRole="button"
                  accessibilityLabel={showVocab ? 'Collapse vocabulary' : 'Expand vocabulary'}
                >
                  <View>
                    <Text style={styles.vocabTitle}>Vocabulary</Text>
                    <Text style={styles.vocabSubtitle}>
                      {vocabulary.length} word{vocabulary.length !== 1 ? 's' : ''} from this article
                    </Text>
                  </View>
                  <Ionicons
                    name={showVocab ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={COLORS.textMuted}
                  />
                </TouchableOpacity>

                {showVocab &&
                  vocabulary.map(word => (
                    <View key={word.id} style={styles.vocabCard}>
                      <View style={styles.vocabWords}>
                        <Text style={styles.vocabEnglish}>{word.english}</Text>
                        <Text style={styles.vocabKaubru}>{word.kaubru}</Text>
                      </View>
                    </View>
                  ))}
              </View>
            )}

          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { paddingBottom: 100 },

  // Hero
  hero: { height: 300, justifyContent: 'space-between' },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  heroTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xxl,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroContent: { padding: SPACING.lg, paddingBottom: SPACING.xl },
  catBadge: {
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginBottom: SPACING.sm,
  },
  catBadgeText: {
    fontSize: 10, fontWeight: '800', color: COLORS.white, letterSpacing: 1,
  },
  heroTitle: {
    fontSize: 26, fontWeight: '800', color: COLORS.white,
    fontFamily: FONTS.serif,
    marginBottom: SPACING.sm,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  heroMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroMetaText: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },

  // Content section
  contentSection: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg },

  // Summary card
  summaryCard: {
    backgroundColor: COLORS.bgGreenLight,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  summaryLabel: {
    fontSize: 10, fontWeight: '700', color: COLORS.textMuted,
    letterSpacing: 1, marginBottom: SPACING.xs,
  },
  summaryText: {
    fontSize: 14, color: COLORS.textSecondary, lineHeight: 22, fontStyle: 'italic',
  },

  // Article card (parchment/book style)
  articleCard: {
    backgroundColor: '#FDFAF4',
    borderRadius: RADIUS.xl,
    borderWidth: 1.5,
    borderColor: '#D4C5A0',
    marginBottom: SPACING.lg,
    overflow: 'hidden',
    ...SHADOW.md,
  },
  articleCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.bgGreen,
  },
  articleHeaderDot: {
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: COLORS.gold,
  },
  articleHeaderLabel: {
    fontSize: 11, fontWeight: '800', color: COLORS.white, letterSpacing: 3,
  },
  articleBorder: {
    height: 2,
    backgroundColor: '#D4C5A0',
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.sm,
    opacity: 0.5,
  },
  articleText: {
    fontSize: 16,
    color: '#3A2E1E',
    lineHeight: 30,
    fontFamily: FONTS.serif,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
    letterSpacing: 0.2,
  },
  articleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: '#D4C5A0',
    marginTop: SPACING.sm,
  },
  articleFooterText: {
    fontSize: 12, color: COLORS.primary, fontWeight: '600',
    fontStyle: 'italic', letterSpacing: 0.5,
  },

  // No content
  noContent: { alignItems: 'center', padding: SPACING.xl },
  noContentText: { fontSize: 14, color: COLORS.textMuted, marginTop: SPACING.md },

  // Tags
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  tagPill: {
    backgroundColor: COLORS.bgGreenLight,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  tagText: {
    fontSize: 12, fontWeight: '600', color: COLORS.textGreen,
  },

  // Vocabulary
  vocabSection: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: SPACING.md,
    overflow: 'hidden',
    ...SHADOW.sm,
  },
  vocabHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  vocabTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  vocabSubtitle: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  vocabCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  vocabWords: { flex: 1 },
  vocabEnglish: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 2 },
  vocabKaubru: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
});
