import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, FlatList, ImageBackground, Image, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { lessonsAPI, storiesAPI, pictureWordsAPI } from '../services/api';
import { COLORS, SPACING, RADIUS, SHADOW, FONTS, GRADIENTS } from '../config/theme';
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

const FALLBACK_VOCAB = [
  { id: 'cat', english: 'Cat', kaubru: 'Mao', category: 'Animals' },
  { id: 'dog', english: 'Dog', kaubru: 'Kuri', category: 'Animals' },
  { id: 'tree', english: 'Tree', kaubru: 'Mphang', category: 'Nature' },
  { id: 'water', english: 'Water', kaubru: 'Tui', category: 'Nature' },
];

const FALLBACK_IMAGES = [
  require('../../assets/culture1.jpg'),
  require('../../assets/culture2.png'),
  require('../../assets/culture3.png'),
];

function coverUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${API_BASE_URL}${path}`;
}

const LESSON_COLORS = [
  { bg: '#EBF2EC', icon: COLORS.primary },
  { bg: '#F0E4B8', icon: COLORS.gold },
  { bg: '#E8F0FE', icon: '#4A7C59' },
  { bg: '#FEF3E2', icon: '#C9A84C' },
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
        storiesAPI.getAll({ limit: 6 }),
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
  const startedLessons = lessons.filter(l => l.progress > 0).length;
  const progressPct = lessons.length > 0
    ? Math.round((completedLessons / lessons.length) * 100)
    : 0;

  const vocabItems = pictureWords.length > 0 ? pictureWords : FALLBACK_VOCAB;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + SPACING.md }]}
      >
        {/* ── Header ─────────────────────────────────────────────────── */}
        <View style={styles.pageHeader}>
          <View>
            <Text style={styles.pageTitle}>Learn</Text>
            <Text style={styles.pageSubtitle}>KauBru language & culture</Text>
          </View>
          <TouchableOpacity style={styles.streakBadge}>
            <Ionicons name="flame" size={16} color={COLORS.gold} />
            <Text style={styles.streakText}>7</Text>
          </TouchableOpacity>
        </View>

        {/* ── Progress card ───────────────────────────────────────────── */}
        <View style={styles.progressCard}>
          <View style={styles.progressLeft}>
            <Text style={styles.progressLabel}>YOUR PROGRESS</Text>
            <Text style={styles.progressTitle}>Cultural Journey</Text>
            <Text style={styles.progressSub}>
              {startedLessons} of {lessons.length} lessons started
            </Text>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${progressPct}%` as any }]} />
            </View>
          </View>
          <View style={styles.progressCircleWrap}>
            <View style={styles.progressCircle}>
              <Text style={styles.progressPct}>{progressPct}</Text>
              <Text style={styles.progressPctSymbol}>%</Text>
            </View>
          </View>
        </View>

        {/* ── Daily Insight ───────────────────────────────────────────── */}
        {lessons[0] && (
          <LinearGradient
            colors={GRADIENTS.premium as any}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.insightCard}
          >
            <View style={styles.insightBadge}>
              <Ionicons name="sparkles" size={10} color={COLORS.gold} />
              <Text style={styles.insightBadgeText}>DAILY LESSON</Text>
            </View>
            <Text style={styles.insightTitle} numberOfLines={2}>{lessons[0].title}</Text>
            <Text style={styles.insightDesc} numberOfLines={2}>{lessons[0].description}</Text>
            <TouchableOpacity
              style={styles.insightBtn}
              onPress={() => navigation.navigate('LessonDetail', { lesson: lessons[0] })}
            >
              <Text style={styles.insightBtnText}>Start lesson</Text>
              <Ionicons name="arrow-forward" size={14} color={COLORS.primary} />
            </TouchableOpacity>
          </LinearGradient>
        )}

        {/* ── Visual Vocabulary ───────────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Visual Vocabulary</Text>
        </View>
        <FlatList
          data={vocabItems.slice(0, 8)}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.hListContent}
          renderItem={({ item }) => {
            const imgUrl = coverUrl((item as PictureWord).image_url);
            return (
              <TouchableOpacity style={styles.vocabCard} activeOpacity={0.8}>
                <View style={styles.vocabImageBox}>
                  {imgUrl ? (
                    <Image source={{ uri: imgUrl }} style={styles.vocabImage} resizeMode="cover" />
                  ) : (
                    <Ionicons name="image-outline" size={24} color={COLORS.textMuted} />
                  )}
                </View>
                <Text style={styles.vocabKaubru}>{item.kaubru}</Text>
                <Text style={styles.vocabEnglish}>{item.english}</Text>
              </TouchableOpacity>
            );
          }}
        />

        {/* ── Core Lessons ────────────────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Core Curriculum</Text>
          {lessons.length > 0 && (
            <Text style={styles.sectionCount}>{lessons.length} lessons</Text>
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
          <FlatList
            data={lessons}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.hListContent}
            renderItem={({ item, index }) => {
              const colors = LESSON_COLORS[index % LESSON_COLORS.length];
              return (
                <TouchableOpacity
                  style={styles.lessonCard}
                  onPress={() => navigation.navigate('LessonDetail', { lesson: item })}
                  activeOpacity={0.85}
                >
                  <View style={[styles.lessonIconBox, { backgroundColor: colors.bg }]}>
                    <Ionicons name="book-outline" size={22} color={colors.icon} />
                  </View>
                  <Text style={styles.lessonTitle} numberOfLines={2}>{item.title}</Text>
                  <View style={styles.lessonMeta}>
                    {item.is_premium && (
                      <View style={styles.premiumPill}>
                        <Ionicons name="star" size={9} color={COLORS.gold} />
                        <Text style={styles.premiumPillText}>PRO</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.lessonProgressTrack}>
                    <View style={[styles.lessonProgressFill, { width: `${item.progress * 100}%` as any }]} />
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}

        {/* ── Folktales ───────────────────────────────────────────────── */}
        <View style={[styles.sectionHeader, { marginTop: SPACING.lg }]}>
          <Text style={styles.sectionTitle}>Folktales</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Stories')}>
            <Text style={styles.viewAll}>View all</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginVertical: SPACING.md }} />
        ) : stories.length === 0 ? (
          <TouchableOpacity
            style={styles.storiesTeaser}
            onPress={() => navigation.navigate('Stories')}
            activeOpacity={0.9}
          >
            <ImageBackground
              source={require('../../assets/culture2.png')}
              style={styles.storiesTeaserBg}
              resizeMode="cover"
              imageStyle={{ borderRadius: RADIUS.xl }}
            >
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.65)']}
                style={styles.storyGradient}
              >
                <Text style={styles.storiesTeaserTitle}>Explore Legends</Text>
                <Text style={styles.storiesTeaserSub}>Traditional KauBru stories</Text>
              </LinearGradient>
            </ImageBackground>
          </TouchableOpacity>
        ) : (
          <FlatList
            data={stories}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.hListContent}
            renderItem={({ item, index }) => {
              const url = coverUrl(item.cover_image_url);
              const fallback = FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
              return (
                <TouchableOpacity
                  style={styles.storyCard}
                  onPress={() => navigation.navigate('StoryDetail', { story: item })}
                  activeOpacity={0.9}
                >
                  <ImageBackground
                    source={url ? { uri: url } : fallback}
                    style={styles.storyCardBg}
                    resizeMode="cover"
                    imageStyle={{ borderRadius: RADIUS.xl }}
                  >
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.7)']}
                      style={styles.storyGradient}
                    >
                      <View style={styles.storyMeta}>
                        <Ionicons name="time-outline" size={11} color="rgba(255,255,255,0.8)" />
                        <Text style={styles.storyMetaText}>{item.read_time_minutes} min</Text>
                      </View>
                      <Text style={styles.storyTitle} numberOfLines={2}>{item.title}</Text>
                    </LinearGradient>
                  </ImageBackground>
                </TouchableOpacity>
              );
            }}
          />
        )}

        <View style={{ height: SPACING.tabBar + SPACING.lg }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { paddingBottom: 20 },

  pageHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  pageTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontFamily: FONTS.serif,
    letterSpacing: -0.5,
  },
  pageSubtitle: { fontSize: 14, color: COLORS.textMuted, fontWeight: '500', marginTop: 2 },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF8E7',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: '#F0E4B8',
    marginTop: 4,
  },
  streakText: { fontSize: 14, fontWeight: '800', color: COLORS.gold },

  // Progress card
  progressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.lg,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.sm,
  },
  progressLeft: { flex: 1, paddingRight: SPACING.md },
  progressLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  progressTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 2 },
  progressSub: { fontSize: 12, color: COLORS.textMuted, marginBottom: SPACING.sm },
  progressBarTrack: {
    height: 5,
    backgroundColor: COLORS.bgCardAlt,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  progressCircleWrap: { alignItems: 'center', justifyContent: 'center' },
  progressCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 1,
  },
  progressPct: { fontSize: 16, fontWeight: '800', color: COLORS.primary },
  progressPctSymbol: { fontSize: 10, fontWeight: '700', color: COLORS.primaryLight, marginTop: 4 },

  // Daily insight
  insightCard: {
    marginHorizontal: SPACING.lg,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.xl,
    ...SHADOW.premium,
  },
  insightBadge: {
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
    marginBottom: SPACING.md,
  },
  insightBadgeText: { fontSize: 10, fontWeight: '800', color: COLORS.gold, letterSpacing: 1.2 },
  insightTitle: {
    fontSize: 26,
    fontWeight: '400',
    color: COLORS.white,
    fontFamily: FONTS.serif,
    marginBottom: 6,
  },
  insightDesc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 21,
    marginBottom: SPACING.lg,
  },
  insightBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: RADIUS.full,
  },
  insightBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },

  // Section headers
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontFamily: FONTS.serif,
  },
  sectionCount: { fontSize: 13, color: COLORS.textMuted, fontWeight: '500' },
  viewAll: { fontSize: 13, fontWeight: '700', color: COLORS.primary },

  hListContent: { paddingHorizontal: SPACING.lg, gap: SPACING.md, paddingBottom: SPACING.md },

  // Vocab cards
  vocabCard: {
    width: 100,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
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
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 2,
  },
  vocabEnglish: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
    fontWeight: '500',
  },

  // Lesson cards
  lessonCard: {
    width: 148,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.sm,
  },
  lessonIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  lessonTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    lineHeight: 18,
    marginBottom: SPACING.sm,
    minHeight: 36,
  },
  lessonMeta: { flexDirection: 'row', marginBottom: SPACING.sm },
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
  lessonProgressTrack: {
    height: 4,
    backgroundColor: COLORS.bgCardAlt,
    borderRadius: 2,
    overflow: 'hidden',
  },
  lessonProgressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },

  emptyCard: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    gap: SPACING.sm,
  },
  emptyText: { fontSize: 14, color: COLORS.textMuted, fontWeight: '500' },

  // Stories
  storiesTeaser: {
    marginHorizontal: SPACING.lg,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    marginBottom: SPACING.xl,
    ...SHADOW.md,
  },
  storiesTeaserBg: { height: 160, justifyContent: 'flex-end' },
  storyGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: SPACING.lg,
    borderRadius: RADIUS.xl,
  },
  storiesTeaserTitle: {
    fontSize: 22,
    fontWeight: '400',
    color: COLORS.white,
    fontFamily: FONTS.serif,
    marginBottom: 3,
  },
  storiesTeaserSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)' },

  storyCard: {
    width: 170,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    ...SHADOW.sm,
  },
  storyCardBg: { height: 210, justifyContent: 'flex-end' },
  storyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 5,
  },
  storyMetaText: { fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  storyTitle: {
    fontSize: 15,
    fontWeight: '400',
    color: COLORS.white,
    fontFamily: FONTS.serif,
    lineHeight: 21,
  },
});
