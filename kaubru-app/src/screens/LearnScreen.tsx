import Header from '../components/Header';
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, FlatList, ImageBackground,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { lessonsAPI, storiesAPI } from '../services/api';
import { speak, stopSpeech } from '../services/speech';
import { COLORS, SPACING, RADIUS, SHADOW } from '../config/theme';
import { API_BASE_URL } from '../config/api';

interface Lesson {
  id: number; title: string; description: string;
  category: string; progress: number; is_premium: boolean;
}

interface Story {
  id: number; title: string; title_kaubru?: string;
  summary?: string; cover_image_url?: string;
  category: string; is_premium: boolean; read_time_minutes: number;
}

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

export default function LearnScreen({ navigation }: any) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [lessonsRes, storiesRes] = await Promise.all([
        lessonsAPI.getAll(),
        storiesAPI.getAll({ limit: 6 }),
      ]);
      setLessons(lessonsRes.data);
      setStories(storiesRes.data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadData);
    return unsubscribe;
  }, [navigation]);

  const handleLessonPress = (lesson: Lesson) => navigation.navigate('LessonDetail', { lesson });

  const progressPct = lessons.length > 0
    ? Math.round((lessons.filter(l => l.progress > 0).length / lessons.length) * 100)
    : 0;

  return (
    <View style={styles.container}>
      <Header />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Progress card */}
        <View style={styles.progressCardWrapper}>
          <LinearGradient
            colors={['#FFFFFF', '#FAFAF7']}
            style={styles.progressCard}
          >
            <View style={styles.progressCircle}>
              <Text style={styles.progressPctText}>{progressPct}%</Text>
            </View>
            <View style={styles.progressInfo}>
              <Text style={styles.progressLabel}>LEARNING JOURNEY</Text>
              <Text style={styles.progressTitle}>Cultural Mastery</Text>
              <View style={styles.streakRow}>
                <Ionicons name="flame" size={16} color={COLORS.gold} />
                <Text style={styles.streakText}>{lessons.filter(l => l.progress > 0).length} lessons active</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => {}} style={styles.progressAction}>
              <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Daily Insight */}
        {lessons[0] && (
          <View style={styles.sectionSection}>
            <Text style={styles.sectionTitle}>Daily Insight</Text>
            <View style={styles.insightCardWrapper}>
              <LinearGradient
                colors={[COLORS.primaryLight, COLORS.primary] as const}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.insightCard}
              >
                <View style={styles.wotdTag}>
                  <Ionicons name="sparkles" size={10} color={COLORS.primary} />
                  <Text style={styles.wotdTagText}>WORD OF THE DAY</Text>
                </View>
                <Text style={styles.insightWord}>{lessons[0].title}</Text>
                <Text style={styles.insightPhonetic}>{lessons[0].description}</Text>
                <View style={styles.practiceRow}>
                  <TouchableOpacity
                    style={styles.practiceBtn}
                    onPress={() => speak(lessons[0].title, 'kb')}
                  >
                    <Ionicons name="play" size={16} color={COLORS.primary} />
                    <Text style={styles.practiceBtnText}>Listen & Learn</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.stopPracticeBtn}
                    onPress={() => stopSpeech()}
                  >
                    <Ionicons name="stop" size={16} color={COLORS.error} />
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </View>
          </View>
        )}

        {/* Core Lessons */}
        <View style={styles.sectionSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Core Curriculum</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginVertical: SPACING.lg }} />
          ) : (
            <FlatList
              data={lessons}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={item => item.id.toString()}
              contentContainerStyle={{ gap: SPACING.md, paddingRight: SPACING.lg }}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.lessonCard} onPress={() => handleLessonPress(item)}>
                  <View style={styles.lessonIconBox}>
                    <MaterialCommunityIcons name="book-open-variant" size={24} color={COLORS.primary} />
                  </View>
                  <Text style={styles.lessonTitle} numberOfLines={2}>{item.title}</Text>
                  <View style={styles.lessonFooter}>
                    <View style={styles.lessonProgressBar}>
                      <View style={[styles.lessonProgressFill, { width: `${item.progress * 100}%` as any }]} />
                    </View>
                    <Text style={styles.lessonCount}>{Math.round(item.progress * 100)}%</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </View>

        {/* Ancestral Legends & Folktales */}
        <View style={styles.sectionSection}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Ancestral Legends</Text>
              <Text style={styles.sectionSubtitle}>Wisdom passed down through generations</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Stories')} style={styles.exploreBtn}>
              <Text style={styles.exploreBtnText}>Explore All</Text>
              <Ionicons name="arrow-forward" size={14} color={COLORS.primary} />
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
              >
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.8)']}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.storiesTeaserContent}>
                  <View style={styles.comingSoonBadge}>
                    <Text style={styles.comingSoonText}>COMING SOON</Text>
                  </View>
                  <Text style={styles.storiesTeaserTitle}>KauBru Folktales</Text>
                  <Text style={styles.storiesTeaserSub}>
                    Immortal legends of the Reang people
                  </Text>
                </View>
              </ImageBackground>
            </TouchableOpacity>
          ) : (
            <FlatList
              data={stories}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={item => item.id.toString()}
              contentContainerStyle={{ gap: SPACING.md, paddingRight: SPACING.lg }}
              renderItem={({ item, index }) => {
                const url = coverUrl(item.cover_image_url);
                const fallback = FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
                return (
                  <TouchableOpacity
                    style={styles.storyCardWrapper}
                    onPress={() => navigation.navigate('StoryDetail', { story: item })}
                    activeOpacity={0.9}
                  >
                    <ImageBackground
                      source={url ? { uri: url } : fallback}
                      style={styles.storyCardBg}
                      resizeMode="cover"
                    >
                      <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.7)']}
                        style={StyleSheet.absoluteFill}
                      />
                      {item.is_premium && (
                        <View style={styles.premiumBadge}>
                          <Ionicons name="star" size={8} color={COLORS.gold} />
                        </View>
                      )}
                      <View style={styles.storyCardContent}>
                        <Text style={styles.storyCardTitle} numberOfLines={2}>{item.title}</Text>
                        <View style={styles.storyCardMeta}>
                          <Ionicons name="time-outline" size={10} color="rgba(255,255,255,0.7)" />
                          <Text style={styles.storyCardMetaText}>{item.read_time_minutes} min</Text>
                        </View>
                      </View>
                    </ImageBackground>
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>

        {/* Cultural Heritage Photos */}
        <View style={styles.sectionSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Cultural Heritage</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -SPACING.lg, paddingLeft: SPACING.lg }}>
            {FALLBACK_IMAGES.map((img, i) => (
              <TouchableOpacity key={i} style={styles.culturePhotoWrapper}>
                <ImageBackground
                  source={img}
                  style={styles.culturePhoto}
                  resizeMode="cover"
                >
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.6)']}
                    style={StyleSheet.absoluteFill}
                  />
                  <Text style={styles.culturePhotoLabel}>
                    {i === 0 ? 'Hozagiri Dance' : i === 1 ? 'Ritual Crafts' : 'Festival Spirit'}
                  </Text>
                </ImageBackground>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { paddingHorizontal: SPACING.lg, paddingBottom: 120, paddingTop: SPACING.md },

  sectionSection: { marginBottom: SPACING.xl },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: SPACING.md,
  },
  sectionTitle: { fontSize: 22, fontWeight: '900', color: COLORS.textPrimary, letterSpacing: -0.5, fontFamily: 'Georgia' },
  sectionSubtitle: { fontSize: 13, color: COLORS.textMuted, fontWeight: '500' },
  viewAllText: { fontSize: 14, fontWeight: '700', color: COLORS.primary },

  progressCardWrapper: {
    marginBottom: SPACING.xl,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    ...SHADOW.md,
    borderWidth: 1, borderColor: COLORS.border,
  },
  progressCard: {
    padding: SPACING.lg, flexDirection: 'row', alignItems: 'center', gap: SPACING.lg,
  },
  progressCircle: {
    width: 64, height: 64, borderRadius: 32,
    borderWidth: 4, borderColor: COLORS.gold,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.white,
    ...SHADOW.sm,
  },
  progressPctText: { fontSize: 15, fontWeight: '900', color: COLORS.primary },
  progressInfo: { flex: 1 },
  progressLabel: { fontSize: 10, fontWeight: '900', color: COLORS.textMuted, letterSpacing: 1.5, marginBottom: 2 },
  progressTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 4 },
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  streakText: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600' },
  progressAction: { padding: 4 },

  insightCardWrapper: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    ...SHADOW.premium,
  },
  insightCard: {
    padding: SPACING.xl, minHeight: 180,
    justifyContent: 'flex-end',
  },
  wotdTag: {
    backgroundColor: COLORS.gold, borderRadius: RADIUS.full,
    paddingHorizontal: 12, paddingVertical: 5,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start', marginBottom: SPACING.md,
    ...SHADOW.sm,
  },
  wotdTagText: { fontSize: 10, fontWeight: '900', color: COLORS.primary, letterSpacing: 1 },
  insightWord: { fontSize: 42, fontWeight: '900', color: COLORS.white, fontFamily: 'Georgia', marginBottom: 4, letterSpacing: -1 },
  insightPhonetic: { fontSize: 15, color: 'rgba(255,255,255,0.8)', marginBottom: SPACING.xl, fontWeight: '500' },
  practiceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'flex-start' },
  practiceBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.white, borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.lg, paddingVertical: 10,
    ...SHADOW.md,
  },
  stopPracticeBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.white,
    alignItems: 'center', justifyContent: 'center',
    ...SHADOW.md,
  },
  practiceBtnText: { fontSize: 14, fontWeight: '800', color: COLORS.primary },

  lessonCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.xl,
    borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING.lg, width: 150, ...SHADOW.sm,
  },
  lessonIconBox: {
    width: 48, height: 48, borderRadius: RADIUS.lg,
    backgroundColor: COLORS.bgGreenLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md,
  },
  lessonTitle: { fontSize: 15, fontWeight: '800', color: COLORS.textPrimary, marginBottom: SPACING.md, height: 40 },
  lessonFooter: { gap: 6 },
  lessonProgressBar: {
    height: 6, backgroundColor: COLORS.bg, borderRadius: 3,
    overflow: 'hidden',
  },
  lessonProgressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 3 },
  lessonCount: { fontSize: 12, color: COLORS.textMuted, fontWeight: '700' },

  storiesTeaser: { borderRadius: RADIUS.xl, overflow: 'hidden', ...SHADOW.md },
  storiesTeaserBg: { height: 220, justifyContent: 'flex-end' },
  storiesTeaserContent: { padding: SPACING.xl },
  comingSoonBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full, alignSelf: 'flex-start', marginBottom: 8 },
  comingSoonText: { color: COLORS.white, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  storiesTeaserTitle: {
    fontSize: 28, fontWeight: '900', color: COLORS.white,
    fontFamily: 'Georgia', marginBottom: 6,
  },
  storiesTeaserSub: { fontSize: 15, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },

  storyCardWrapper: { width: 220, borderRadius: RADIUS.xl, overflow: 'hidden', ...SHADOW.md, borderWidth: 1, borderColor: COLORS.border },
  storyCardBg: { height: 280, justifyContent: 'flex-end' },
  premiumBadge: {
    position: 'absolute', top: 12, right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12,
    width: 24, height: 24, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.gold,
  },
  storyCardContent: { padding: SPACING.lg, backgroundColor: 'rgba(0,0,0,0.2)' },
  storyCardTitle: {
    fontSize: 18, fontWeight: '900', color: COLORS.white,
    fontFamily: 'Georgia', marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
  },
  storyCardMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  storyCardMetaText: { fontSize: 12, color: 'rgba(255,255,255,0.9)', fontWeight: '700' },
  exploreBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.bgGreenLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.full },
  exploreBtnText: { fontSize: 13, fontWeight: '800', color: COLORS.primary },

  culturePhotoWrapper: { borderRadius: RADIUS.xl, overflow: 'hidden', marginRight: SPACING.md, ...SHADOW.sm },
  culturePhoto: { width: 240, height: 160, justifyContent: 'flex-end' },
  culturePhotoLabel: {
    padding: SPACING.md, fontSize: 14, fontWeight: '900',
    color: COLORS.white,
    textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
  },
});

