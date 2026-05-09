import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Image, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { lessonsAPI, storiesAPI, pictureWordsAPI } from '../services/api';
import { COLORS, SPACING, RADIUS, SHADOW, FONTS } from '../config/theme';
import { API_BASE_URL } from '../config/api';

interface Lesson {
  id: number; title: string; description: string;
  category: string; progress: number; is_premium: boolean;
}
interface Story {
  id: number; title: string; title_kaubru?: string; summary?: string;
  cover_image_url?: string; category: string; is_premium: boolean;
  read_time_minutes: number;
}
interface PictureWord {
  id: number; english: string; kaubru: string;
  category: string; image_url?: string;
}

function coverUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${API_BASE_URL}${path}`;
}

// ─── Category icon map ────────────────────────────────────────────────────────
const CATEGORY_ICONS: Record<string, { icon: string; bg: string; color: string }> = {
  greetings:   { icon: 'hand-left-outline',   bg: '#EBF2EC', color: COLORS.primary },
  numbers:     { icon: 'calculator-outline',   bg: '#E8F0FE', color: '#3B6FD4' },
  family:      { icon: 'people-outline',       bg: '#FEF3E2', color: '#C9A84C' },
  food:        { icon: 'restaurant-outline',   bg: '#FEE2E2', color: '#C0392B' },
  nature:      { icon: 'leaf-outline',         bg: '#D1FAE5', color: '#059669' },
  animals:     { icon: 'paw-outline',          bg: '#FEF3E2', color: '#C9A84C' },
  general:     { icon: 'book-outline',         bg: '#EBF2EC', color: COLORS.primary },
};

function lessonMeta(cat: string) {
  return CATEGORY_ICONS[cat?.toLowerCase()] ?? CATEGORY_ICONS.general;
}

// ─── Story category badge colors ─────────────────────────────────────────────
const STORY_BADGE: Record<string, { bg: string; color: string }> = {
  folktale: { bg: '#EBF2EC', color: COLORS.primary },
  legend:   { bg: '#F0E4B8', color: '#92400E' },
  proverb:  { bg: '#E8F0FE', color: '#3B6FD4' },
  poem:     { bg: '#FEE2E2', color: '#C0392B' },
};
function storyBadge(cat: string) {
  return STORY_BADGE[cat?.toLowerCase()] ?? STORY_BADGE.folktale;
}

// ─── Culture highlight cards ──────────────────────────────────────────────────
const CULTURE_HIGHLIGHTS = [
  {
    category: 'traditions',
    title: 'Traditions',
    desc: 'Rituals, customs & way of life',
    emoji: '🪔',
    placeholderBg: '#5C3317',
    accentColor: '#C9A84C',
  },
  {
    category: 'dance',
    title: 'Dance',
    desc: 'Hojagiri & performing arts',
    emoji: '💃',
    placeholderBg: '#1C3A2A',
    accentColor: '#4A7C59',
  },
  {
    category: 'music',
    title: 'Music',
    desc: 'Instruments & folk songs',
    emoji: '🥁',
    placeholderBg: '#3D1F6B',
    accentColor: '#9B59B6',
  },
  {
    category: 'festivals',
    title: 'Festivals',
    desc: 'Buisu, Kojagiri & celebrations',
    emoji: '🎉',
    placeholderBg: '#7B1A1A',
    accentColor: '#E74C3C',
  },
  {
    category: 'history',
    title: 'History',
    desc: 'Origins & migration stories',
    emoji: '📜',
    placeholderBg: '#1A2D4A',
    accentColor: '#3498DB',
  },
  {
    category: 'language',
    title: 'Language',
    desc: 'Script, structure & preservation',
    emoji: '🗣️',
    placeholderBg: '#1A3A2A',
    accentColor: '#27AE60',
  },
];

export default function LearnScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [pictureWords, setPictureWords] = useState<PictureWord[]>([]);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [lr, sr, pr] = await Promise.all([
        lessonsAPI.getAll(),
        storiesAPI.getAll({ limit: 10 }),
        pictureWordsAPI.getAll(),
      ]);
      setLessons(lr.data);
      setStories(sr.data);
      setPictureWords(pr.data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);
  useEffect(() => {
    const unsub = navigation.addListener('focus', loadData);
    return unsub;
  }, [navigation]);

  const completedLessons = lessons.filter(l => l.progress >= 1).length;
  const progressPct = lessons.length > 0
    ? Math.round((completedLessons / lessons.length) * 100)
    : 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + SPACING.md }]}
      >

        {/* ── Header ──────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.pageTitle}>Learn</Text>
            <Text style={styles.pageSubtitle}>KauBru language & culture</Text>
          </View>
          <View style={styles.progressPill}>
            <Ionicons name="trophy-outline" size={14} color={COLORS.gold} />
            <Text style={styles.progressPillText}>{progressPct}% done</Text>
          </View>
        </View>

        {/* ── Games section ───────────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Games</Text>

        {/* Word Rush card */}
        <TouchableOpacity
          style={styles.gameCard}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('WordRush')}
        >
          {/* Dark space background */}
          <View style={styles.spaceCard}>
            {/* Star dots */}
            {[
              {top:12,left:30,size:2,opacity:0.8},{top:25,left:80,size:1.5,opacity:0.5},
              {top:8,left:140,size:1,opacity:0.7},{top:35,left:200,size:2,opacity:0.6},
              {top:18,left:260,size:1.5,opacity:0.9},{top:40,left:310,size:1,opacity:0.4},
              {top:10,left:350,size:2,opacity:0.7},{top:50,left:50,size:1,opacity:0.6},
              {top:60,left:120,size:1.5,opacity:0.5},{top:55,left:230,size:1,opacity:0.8},
              {top:70,left:290,size:2,opacity:0.4},{top:65,left:370,size:1.5,opacity:0.7},
              {top:80,left:20,size:1,opacity:0.6},{top:90,left:160,size:2,opacity:0.5},
              {top:85,left:340,size:1,opacity:0.9},{top:100,left:70,size:1.5,opacity:0.4},
              {top:95,left:250,size:1,opacity:0.7},{top:110,left:380,size:2,opacity:0.6},
            ].map((s, i) => (
              <View key={i} style={{
                position: 'absolute', top: s.top, left: s.left,
                width: s.size, height: s.size, borderRadius: s.size / 2,
                backgroundColor: `rgba(180,210,255,${s.opacity})`,
              }} />
            ))}

            {/* Enemy ships decorative */}
            <View style={styles.spaceShip1} />
            <View style={styles.spaceShip2} />
            <View style={styles.spaceShip3} />

            {/* Content */}
            <View style={styles.spaceCardContent}>
              <Text style={styles.spaceTitle}>WORD RUSH</Text>
              <Text style={styles.spaceSubtitle}>TYPE TO DESTROY</Text>
              <View style={styles.spacePlayBtn}>
                <Text style={styles.spacePlayText}>▶  PLAY NOW</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Flash Quiz card */}
        <TouchableOpacity
          style={styles.quizCard}
          activeOpacity={0.88}
          onPress={() => lessons[0] && navigation.navigate('Quiz', { lesson: lessons[0] })}
        >
          <View style={styles.quizCardInner}>
            <View style={[styles.quizIconWrap, { backgroundColor: '#FFF8E7' }]}>
              <Text style={{ fontSize: 22 }}>🧠</Text>
            </View>
            <View style={styles.quizTextWrap}>
              <Text style={styles.quizTitle}>Lesson Quiz</Text>
              <Text style={styles.quizDesc}>Test your knowledge from the lessons</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
          </View>
        </TouchableOpacity>

        {/* ── Lessons section ─────────────────────────────────────────── */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Lessons</Text>
          {lessons.length > 0 && (
            <Text style={styles.sectionCount}>{lessons.length} total</Text>
          )}
        </View>

        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginVertical: SPACING.lg }} />
        ) : lessons.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="book-outline" size={28} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No lessons yet</Text>
          </View>
        ) : (
          lessons.map((item, index) => {
            const meta = lessonMeta(item.category);
            const pct = Math.round(item.progress * 100);
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.lessonCard}
                onPress={() => navigation.navigate('LessonDetail', { lesson: item })}
                activeOpacity={0.85}
              >
                {/* Icon */}
                <View style={[styles.lessonIconBox, { backgroundColor: meta.bg }]}>
                  <Ionicons name={meta.icon as any} size={20} color={meta.color} />
                </View>

                {/* Text */}
                <View style={styles.lessonBody}>
                  <View style={styles.lessonTitleRow}>
                    <Text style={styles.lessonTitle} numberOfLines={1}>{item.title}</Text>
                    {item.is_premium && (
                      <View style={styles.premiumPill}>
                        <Ionicons name="star" size={9} color={COLORS.gold} />
                        <Text style={styles.premiumPillText}>PRO</Text>
                      </View>
                    )}
                  </View>
                  {item.description ? (
                    <Text style={styles.lessonDesc} numberOfLines={1}>{item.description}</Text>
                  ) : null}
                  {/* Progress bar */}
                  <View style={styles.lessonProgressRow}>
                    <View style={styles.lessonProgressTrack}>
                      <View style={[styles.lessonProgressFill, { width: `${pct}%` as any, backgroundColor: meta.color }]} />
                    </View>
                    <Text style={[styles.lessonPct, { color: meta.color }]}>{pct}%</Text>
                  </View>
                </View>

                <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
              </TouchableOpacity>
            );
          })
        )}

        {/* ── Visual Vocabulary ───────────────────────────────────────── */}
        {pictureWords.length > 0 && (
          <>
            <View style={[styles.sectionRow, { marginTop: SPACING.lg }]}>
              <Text style={styles.sectionTitle}>Picture Words</Text>
              <Text style={styles.sectionCount}>{pictureWords.length} words</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hListContent}
            >
              {pictureWords.slice(0, 10).map(item => {
                const imgUrl = coverUrl(item.image_url);
                return (
                  <View key={item.id} style={styles.vocabCard}>
                    <View style={styles.vocabImageBox}>
                      {imgUrl ? (
                        <Image source={{ uri: imgUrl }} style={styles.vocabImage} resizeMode="cover" />
                      ) : (
                        <Ionicons name="image-outline" size={22} color={COLORS.textMuted} />
                      )}
                    </View>
                    <Text style={styles.vocabKaubru} numberOfLines={1}>{item.kaubru}</Text>
                    <Text style={styles.vocabEnglish} numberOfLines={1}>{item.english}</Text>
                  </View>
                );
              })}
            </ScrollView>
          </>
        )}

        {/* ── Folktales & Stories section ─────────────────────────────── */}
        <TouchableOpacity
          style={[styles.storiesEmptyCard, { marginTop: SPACING.lg }]}
          onPress={() => navigation.navigate('Stories')}
          activeOpacity={0.88}
        >
          <LinearGradient
            colors={['#1C3A2A', '#2D5A3D']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.storiesEmptyGradient}
          >
            <Text style={styles.storiesEmptyTitle}>Folktales & Stories</Text>
            <Text style={styles.storiesEmptySub}>
              {stories.length > 0
                ? `${stories.length} traditional KauBru stor${stories.length === 1 ? 'y' : 'ies'}`
                : 'Traditional KauBru folktales & legends'}
            </Text>
            <View style={styles.storiesEmptyBtn}>
              <Text style={styles.storiesEmptyBtnText}>Browse stories</Text>
              <Ionicons name="arrow-forward" size={13} color={COLORS.primary} />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* ── Culture Highlights ───────────────────────────────────── */}
        <View style={[styles.sectionRow, { marginTop: SPACING.lg }]}>
          <Text style={styles.sectionTitle}>Culture & Heritage</Text>
          <TouchableOpacity onPress={() => navigation.navigate('CultureBrowse')}>
            <Text style={styles.viewAll}>View all</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cultureHListContent}
        >
          {CULTURE_HIGHLIGHTS.map(item => (
            <TouchableOpacity
              key={item.category}
              style={styles.cultureCard}
              activeOpacity={0.88}
              onPress={() => navigation.navigate('CultureBrowse', { category: item.category })}
            >
              {/* Image placeholder */}
              <View style={[styles.cultureCardImage, { backgroundColor: item.placeholderBg }]}>
                <Text style={styles.cultureCardEmoji}>{item.emoji}</Text>
                <View style={styles.cultureCardImageOverlay} />
              </View>
              {/* Accent bar + text */}
              <View style={[styles.cultureCardAccentBar, { backgroundColor: item.accentColor }]} />
              <View style={styles.cultureCardBody}>
                <Text style={styles.cultureCardTitle}>{item.title}</Text>
                <Text style={styles.cultureCardDesc} numberOfLines={2}>{item.desc}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={{ height: SPACING.tabBar + SPACING.lg }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { paddingBottom: 20 },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  pageTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontFamily: FONTS.serif,
    letterSpacing: -0.5,
  },
  pageSubtitle: { fontSize: 14, color: COLORS.textMuted, fontWeight: '500', marginTop: 2 },
  progressPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFF8E7',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: '#F0E4B8',
    marginTop: 6,
  },
  progressPillText: { fontSize: 13, fontWeight: '700', color: COLORS.gold },

  // ── Section headers ──────────────────────────────────────────────────────────
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontFamily: FONTS.serif,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    marginTop: SPACING.xs,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  sectionCount: { fontSize: 13, color: COLORS.textMuted, fontWeight: '500' },
  viewAll: { fontSize: 13, fontWeight: '700', color: COLORS.primary },

  // ── Game cards ───────────────────────────────────────────────────────────────
  gameCard: {
    marginHorizontal: SPACING.lg,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    marginBottom: SPACING.md,
    ...SHADOW.premium,
  },

  // Space-themed Word Rush card
  spaceCard: {
    backgroundColor: '#08081a',
    borderRadius: RADIUS.xl,
    height: 140,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1a1a3a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spaceCardContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  spaceTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#7bbfff',
    letterSpacing: 8,
    textShadowColor: 'rgba(119,187,255,0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  spaceSubtitle: {
    fontSize: 10,
    color: '#334466',
    letterSpacing: 4,
    fontWeight: '600',
    marginBottom: 12,
  },
  spacePlayBtn: {
    borderWidth: 1,
    borderColor: '#7bbfff',
    borderRadius: 6,
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  spacePlayText: {
    color: '#7bbfff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 3,
  },
  // Decorative enemy ship triangles
  spaceShip1: {
    position: 'absolute',
    top: 20, left: 30,
    width: 0, height: 0,
    borderLeftWidth: 10, borderRightWidth: 10, borderBottomWidth: 18,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    borderBottomColor: 'rgba(221,85,85,0.6)',
    transform: [{ rotate: '180deg' }],
  },
  spaceShip2: {
    position: 'absolute',
    top: 15, right: 50,
    width: 0, height: 0,
    borderLeftWidth: 8, borderRightWidth: 8, borderBottomWidth: 14,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    borderBottomColor: 'rgba(180,100,220,0.6)',
    transform: [{ rotate: '180deg' }],
  },
  spaceShip3: {
    position: 'absolute',
    bottom: 25, left: 60,
    width: 0, height: 0,
    borderLeftWidth: 7, borderRightWidth: 7, borderBottomWidth: 12,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    borderBottomColor: 'rgba(200,160,50,0.5)',
    transform: [{ rotate: '180deg' }],
  },

  quizCard: {
    marginHorizontal: SPACING.lg,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.xl,
    ...SHADOW.sm,
  },
  quizCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  quizIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  quizTextWrap: { flex: 1 },
  quizTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 2 },
  quizDesc: { fontSize: 13, color: COLORS.textMuted, fontWeight: '500' },

  // ── Lesson cards ─────────────────────────────────────────────────────────────
  lessonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.lg,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.md,
    ...SHADOW.sm,
  },
  lessonIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  lessonBody: { flex: 1 },
  lessonTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: 2,
  },
  lessonTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    flex: 1,
  },
  lessonDesc: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '500',
    marginBottom: SPACING.sm,
  },
  lessonProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  lessonProgressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: COLORS.bgCardAlt,
    borderRadius: 2,
    overflow: 'hidden',
  },
  lessonProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  lessonPct: {
    fontSize: 11,
    fontWeight: '700',
    minWidth: 28,
    textAlign: 'right',
  },
  premiumPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFF8E7',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: '#F0E4B8',
  },
  premiumPillText: { fontSize: 9, fontWeight: '800', color: COLORS.gold, letterSpacing: 0.5 },

  emptyCard: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    gap: SPACING.sm,
  },
  emptyText: { fontSize: 14, color: COLORS.textMuted, fontWeight: '500' },

  // ── Picture words ────────────────────────────────────────────────────────────
  hListContent: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
    paddingBottom: SPACING.md,
  },
  vocabCard: {
    width: 90,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.sm,
  },
  vocabImageBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.bgCardAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
    overflow: 'hidden',
  },
  vocabImage: { width: 52, height: 52, borderRadius: 26 },
  vocabKaubru: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 2,
  },
  vocabEnglish: {
    fontSize: 10,
    color: COLORS.textMuted,
    textAlign: 'center',
    fontWeight: '500',
  },

  // ── Story cards ──────────────────────────────────────────────────────────────
  storiesEmptyCard: {
    marginHorizontal: SPACING.lg,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    marginBottom: SPACING.md,
    ...SHADOW.md,
  },
  storiesEmptyGradient: {
    padding: SPACING.xl,
  },
  storiesEmptyTitle: {
    fontSize: 22,
    fontWeight: '400',
    color: COLORS.white,
    fontFamily: FONTS.serif,
    marginBottom: 4,
  },
  storiesEmptySub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: SPACING.lg,
  },
  storiesEmptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.white,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
  },
  storiesEmptyBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },

  storyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.lg,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.md,
    ...SHADOW.sm,
  },
  storyCover: {
    width: 72,
    height: 72,
    borderRadius: RADIUS.lg,
    flexShrink: 0,
  },
  storyCoverFallback: {
    backgroundColor: COLORS.bgGreenLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyBody: { flex: 1 },
  storyTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: 4,
  },
  storyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  storyBadgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
  storyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    lineHeight: 20,
    marginBottom: 3,
  },
  storySummary: {
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 17,
    marginBottom: 5,
  },
  storyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  storyMetaText: { fontSize: 11, color: COLORS.textMuted, fontWeight: '500' },

  // ── Culture highlight cards ───────────────────────────────────────────────
  cultureHListContent: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
    paddingBottom: SPACING.md,
  },
  cultureCard: {
    width: 150,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.md,
  },
  cultureCardImage: {
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cultureCardImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  cultureCardEmoji: {
    fontSize: 36,
  },
  cultureCardAccentBar: {
    height: 3,
    width: '100%',
  },
  cultureCardBody: {
    padding: SPACING.sm + 2,
  },
  cultureCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontFamily: FONTS.serif,
    marginBottom: 3,
  },
  cultureCardDesc: {
    fontSize: 11,
    color: COLORS.textMuted,
    lineHeight: 16,
    fontWeight: '500',
  },
});
