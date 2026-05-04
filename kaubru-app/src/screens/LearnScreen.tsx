import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, FlatList, ImageBackground, Image, SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { lessonsAPI, storiesAPI, pictureWordsAPI } from '../services/api';
import { COLORS, SPACING, RADIUS, SHADOW, FONTS, GRADIENTS } from '../config/theme';
import { API_BASE_URL } from '../config/api';

interface Lesson { id: number; title: string; description: string; category: string; progress: number; is_premium: boolean; }
interface Story { id: number; title: string; title_kaubru?: string; summary?: string; cover_image_url?: string; category: string; is_premium: boolean; read_time_minutes: number; }
interface PictureWord { id: number; english: string; kaubru: string; category: string; image_url?: string; }

const FALLBACK_VOCAB = [
  { id: 'cat', english: 'Cat', kaubru: 'Mao', category: 'Animals' },
  { id: 'dog', english: 'Dog', kaubru: 'Kuri', category: 'Animals' },
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

export default function LearnScreen({ navigation }: any) {
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

  const handleLessonPress = (lesson: Lesson) => navigation.navigate('LessonDetail', { lesson });

  const progressPct = lessons.length > 0 ? Math.round((lessons.filter(l => l.progress > 0).length / lessons.length) * 100) : 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Learn</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        
        {/* Progress Section */}
        <View style={styles.progressSection}>
          <Text style={styles.sectionSubtitle}>YOUR PROGRESS</Text>
          <View style={styles.progressCard}>
            <View style={styles.progressInfo}>
              <Text style={styles.progressTitle}>Cultural Journey</Text>
              <Text style={styles.progressDesc}>{lessons.filter(l => l.progress > 0).length} lessons started</Text>
            </View>
            <View style={styles.progressCircle}>
              <Text style={styles.progressPct}>{progressPct}%</Text>
            </View>
          </View>
        </View>

        {/* Daily Insight */}
        {lessons[0] && (
          <View style={styles.insightWrapper}>
            <LinearGradient colors={GRADIENTS.premium as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.insightCard}>
              <View style={styles.insightTag}>
                <Text style={styles.insightTagText}>DAILY INSIGHT</Text>
              </View>
              <Text style={styles.insightWord}>{lessons[0].title}</Text>
              <Text style={styles.insightDesc} numberOfLines={2}>{lessons[0].description}</Text>
            </LinearGradient>
          </View>
        )}

        {/* Picture Vocabulary */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Visual Vocabulary</Text>
        </View>
        <View style={styles.pictureGrid}>
          {(pictureWords.length > 0 ? pictureWords : FALLBACK_VOCAB).map(item => {
            const imgUrl = coverUrl((item as PictureWord).image_url);
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.pictureCard}
                activeOpacity={0.8}
              >
                <View style={styles.pictureImageBox}>
                  {imgUrl ? (
                    <Image source={{ uri: imgUrl }} style={styles.pictureImage} resizeMode="cover" />
                  ) : (
                    <Ionicons name="image-outline" size={32} color={COLORS.textMuted} />
                  )}
                </View>
                <Text style={styles.pictureEnglish}>{item.english}</Text>
                <Text style={styles.pictureKaubru}>{item.kaubru}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Core Lessons */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Core Curriculum</Text>
        </View>
        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginVertical: SPACING.lg }} />
        ) : (
          <FlatList
            data={lessons}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.hList}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.lessonCard} onPress={() => handleLessonPress(item)}>
                <View style={styles.lessonIconBox}>
                  <Ionicons name="book-outline" size={24} color={COLORS.primary} />
                </View>
                <Text style={styles.lessonTitle} numberOfLines={2}>{item.title}</Text>
                <View style={styles.lessonProgressBar}>
                  <View style={[styles.lessonProgressFill, { width: `${item.progress * 100}%` as any }]} />
                </View>
              </TouchableOpacity>
            )}
          />
        )}

        {/* Folktales */}
        <View style={[styles.sectionHeader, { marginTop: SPACING.lg }]}>
          <Text style={styles.sectionTitle}>Folktales</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Stories')}>
            <Text style={styles.viewAllText}>View all</Text>
          </TouchableOpacity>
        </View>
        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginVertical: SPACING.md }} />
        ) : stories.length === 0 ? (
          <TouchableOpacity style={styles.storiesTeaser} onPress={() => navigation.navigate('Stories')} activeOpacity={0.9}>
            <ImageBackground source={require('../../assets/culture2.png')} style={styles.storiesTeaserBg} resizeMode="cover" imageStyle={{ borderRadius: RADIUS.xl }}>
              <View style={styles.storyOverlay} />
              <View style={styles.storiesTeaserContent}>
                <Text style={styles.storiesTeaserTitle}>Explore Legends</Text>
                <Text style={styles.storiesTeaserSub}>Traditional KauBru stories</Text>
              </View>
            </ImageBackground>
          </TouchableOpacity>
        ) : (
          <FlatList
            data={stories}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.hList}
            renderItem={({ item, index }) => {
              const url = coverUrl(item.cover_image_url);
              const fallback = FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
              return (
                <TouchableOpacity style={styles.storyCard} onPress={() => navigation.navigate('StoryDetail', { story: item })} activeOpacity={0.9}>
                  <ImageBackground source={url ? { uri: url } : fallback} style={styles.storyCardBg} resizeMode="cover" imageStyle={{ borderRadius: RADIUS.xl }}>
                    <View style={styles.storyOverlay} />
                    <View style={styles.storyCardContent}>
                      <Text style={styles.storyCardTitle} numberOfLines={2}>{item.title}</Text>
                      <Text style={styles.storyCardMetaText}>{item.read_time_minutes} min read</Text>
                    </View>
                  </ImageBackground>
                </TouchableOpacity>
              );
            }}
          />
        )}

        <View style={{ height: SPACING.xxl * 2 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.xl, paddingBottom: SPACING.md },
  headerTitle: { fontSize: 40, fontWeight: '400', color: COLORS.textPrimary, fontFamily: FONTS.serif, letterSpacing: -1 },
  scroll: { paddingHorizontal: SPACING.lg, paddingBottom: 100 },

  progressSection: { marginBottom: SPACING.xl },
  sectionSubtitle: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 1.5, marginBottom: SPACING.sm },
  progressCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: SPACING.lg,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    ...SHADOW.sm,
  },
  progressInfo: { flex: 1 },
  progressTitle: { fontSize: 18, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 4 },
  progressDesc: { fontSize: 13, color: COLORS.textMuted },
  progressCircle: { width: 48, height: 48, borderRadius: 24, borderWidth: 3, borderColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' },
  progressPct: { fontSize: 12, fontWeight: '700', color: COLORS.primary },

  insightWrapper: { marginBottom: SPACING.xxl },
  insightCard: { padding: SPACING.xl, borderRadius: RADIUS.xl, ...SHADOW.md },
  insightTag: { backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.full, marginBottom: SPACING.lg },
  insightTagText: { fontSize: 10, fontWeight: '700', color: COLORS.white, letterSpacing: 1.5 },
  insightWord: { fontSize: 32, fontWeight: '400', color: COLORS.white, fontFamily: FONTS.serif, marginBottom: SPACING.xs },
  insightDesc: { fontSize: 15, color: 'rgba(255,255,255,0.85)', marginBottom: SPACING.lg, lineHeight: 22 },
  listenBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.white, alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 8, borderRadius: RADIUS.full },
  listenBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.primary },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: SPACING.md, marginTop: SPACING.lg },
  sectionTitle: { fontSize: 22, fontWeight: '400', color: COLORS.textPrimary, fontFamily: FONTS.serif },
  viewAllText: { fontSize: 14, fontWeight: '600', color: COLORS.primary, marginBottom: 4 },

  pictureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md, marginBottom: SPACING.xl },
  pictureCard: { width: '47%', backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: SPACING.md, alignItems: 'center', ...SHADOW.sm },
  pictureCardActive: { borderColor: COLORS.primaryLight, borderWidth: 1 },
  pictureImageBox: { width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.bgCardAlt, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md, overflow: 'hidden' },
  pictureImage: { width: 64, height: 64, borderRadius: 32 },
  pictureEnglish: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 2 },
  pictureKaubru: { fontSize: 13, color: COLORS.primaryLight, fontWeight: '500' },

  hList: { gap: SPACING.md },
  lessonCard: { width: 140, backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: SPACING.lg, ...SHADOW.sm },
  lessonIconBox: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.bgCardAlt, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md },
  lessonTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, height: 40, marginBottom: SPACING.sm },
  lessonProgressBar: { height: 4, backgroundColor: COLORS.bgCardAlt, borderRadius: 2, overflow: 'hidden' },
  lessonProgressFill: { height: '100%', backgroundColor: COLORS.primary },

  storiesTeaser: { borderRadius: RADIUS.xl, ...SHADOW.sm, marginBottom: SPACING.xl },
  storiesTeaserBg: { height: 180, justifyContent: 'flex-end' },
  storyOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: RADIUS.xl },
  storiesTeaserContent: { padding: SPACING.xl },
  storiesTeaserTitle: { fontSize: 24, fontWeight: '400', color: COLORS.white, fontFamily: FONTS.serif, marginBottom: 4 },
  storiesTeaserSub: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },

  storyCard: { width: 180, borderRadius: RADIUS.xl, ...SHADOW.sm },
  storyCardBg: { height: 220, justifyContent: 'flex-end' },
  storyCardContent: { padding: SPACING.lg },
  storyCardTitle: { fontSize: 16, fontWeight: '400', color: COLORS.white, fontFamily: FONTS.serif, marginBottom: 6 },
  storyCardMetaText: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
});
