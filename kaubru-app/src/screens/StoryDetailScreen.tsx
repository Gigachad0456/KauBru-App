import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, ImageBackground, Image, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { storiesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { COLORS, SPACING, RADIUS, SHADOW, FONTS } from '../config/theme';
import { API_BASE_URL } from '../config/api';

interface VocabWord { id: number; english: string; kaubru: string; audio_url?: string; }

interface Story {
  id: number;
  title: string;
  title_kaubru?: string;
  summary?: string;
  content_english?: string;
  content_kaubru?: string;
  cover_image_url?: string;
  audio_url?: string;
  category: string;
  is_premium: boolean;
  read_time_minutes: number;
  vocabulary?: VocabWord[];
}

type ReadMode = 'english' | 'kaubru' | 'both';

const FALLBACK_IMAGES = [
  require('../../assets/culture2.png'),
  require('../../assets/culture3.png'),
  require('../../assets/culture2.png'),
  require('../../assets/culture1.jpg'),
  require('../../assets/culture2.png'),
];

function fullUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${API_BASE_URL}${path}`;
}

export default function StoryDetailScreen({ route, navigation }: any) {
  const { story: initialStory } = route.params as { story: Story };
  const { user } = useAuth();
  const [story, setStory] = useState<Story>(initialStory);
  const [loading, setLoading] = useState(false);
  const [showVocab, setShowVocab] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    // Load full story content
    (async () => {
      setLoading(true);
      try {
        const res = await storiesAPI.getById(initialStory.id);
        if (res.data) {
          setStory(res.data);
        }
      } catch (err: any) {
        console.error("Failed to load story details", err);
        Alert.alert(
          "Connection Issue", 
          "Could not sync the latest story content. Please check your internet or restart the app."
        );
      } finally { setLoading(false); }
    })();

    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
      }
    };
  }, []);

  const togglePlayback = async () => {
    if (soundRef.current) {
      if (isPlaying) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
      } else {
        await soundRef.current.playAsync();
        setIsPlaying(true);
      }
    } else {
      const url = fullUrl(story.audio_url);
      if (!url) {
        Alert.alert("Audio unavailable", "This story narration is being prepared.");
        return;
      }

      try {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: url },
          { shouldPlay: true }
        );
        soundRef.current = newSound;
        setIsPlaying(true);
        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            setIsPlaying(false);
            newSound.setPositionAsync(0);
          }
        });
      } catch (err) {
        console.error("Failed to play audio", err);
        Alert.alert("Playback error", "Could not load the story audio.");
      }
    }
  };

  const stopPlayback = async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.setPositionAsync(0);
        setIsPlaying(false);
      } catch (err) {
        console.error("Failed to stop audio", err);
      }
    }
  };

  const coverUrl = fullUrl(story.cover_image_url);
  const fallback = FALLBACK_IMAGES[story.id % FALLBACK_IMAGES.length];

  const CATEGORY_COLORS: Record<string, string> = {
    folktale: '#C9A84C', legend: '#4A7C59', proverb: '#7C4A3A', poem: '#3A4A7C',
  };
  const catColor = CATEGORY_COLORS[story.category?.toLowerCase()] || COLORS.primary;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Hero cover */}
        <ImageBackground
          source={coverUrl ? { uri: coverUrl } : fallback}
          style={styles.hero}
          resizeMode="cover"
        >
          <View style={styles.heroOverlay} />
          {/* Top Bar inside Hero */}
          <View style={styles.heroTopBar}>
            {/* Back button */}
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
              <Text style={styles.catBadgeText}>{story.category?.toUpperCase()}</Text>
            </View>
            <Text style={styles.heroTitle}>{story.title}</Text>
            <View style={styles.heroMetaRow}>
              <View style={styles.heroMeta}>
                <Ionicons name="time-outline" size={13} color="rgba(255,255,255,0.8)" />
                <Text style={styles.heroMetaText}>{story.read_time_minutes} min read</Text>
                {story.is_premium && (
                  <>
                    <Text style={styles.heroDot}>·</Text>
                    <Ionicons name="star" size={12} color={COLORS.gold} />
                    <Text style={[styles.heroMetaText, { color: COLORS.gold }]}>Premium</Text>
                  </>
                )}
              </View>

              {story.audio_url && (
                <View style={styles.audioControls}>
                  <TouchableOpacity
                    style={[styles.narrateBtn, isPlaying && styles.narrateBtnActive]}
                    onPress={togglePlayback}
                    activeOpacity={0.8}
                  >
                    <Ionicons 
                      name={isPlaying ? "pause" : "play"} 
                      size={18} 
                      color={COLORS.white} 
                    />
                    <Text style={styles.narrateBtnText}>
                      {isPlaying ? "PAUSE" : "START"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.stopBtn}
                    onPress={stopPlayback}
                    activeOpacity={0.8}
                    disabled={!soundRef.current && !isPlaying}
                  >
                    <Ionicons name="stop" size={16} color={COLORS.white} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </ImageBackground>

        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: SPACING.xl }} />
        ) : (
          <View style={styles.contentSection}>
            {/* Summary */}
            {story.summary && (
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>SUMMARY</Text>
                <Text style={styles.summaryText}>{story.summary}</Text>
              </View>
            )}



            {/* Story text */}
            {story.content_english && (
              <View style={styles.textBlock}>
                <View style={styles.textBlockHeader}>
                  <View style={styles.row}>
                    <View style={styles.langDot} />
                    <Text style={styles.textBlockLang}>STORY CONTENT</Text>
                  </View>
                </View>
                <Text style={styles.storyText}>{story.content_english}</Text>
              </View>
            )}

            {!story.content_english && !story.content_kaubru && (
              <View style={styles.noContent}>
                <Ionicons name="document-text-outline" size={40} color={COLORS.textMuted} />
                <Text style={styles.noContentText}>Story content coming soon.</Text>
              </View>
            )}

            {/* Vocabulary section */}
            {story.vocabulary && story.vocabulary.length > 0 && (
              <View style={styles.vocabSection}>
                <TouchableOpacity
                  style={styles.vocabHeader}
                  onPress={() => setShowVocab(!showVocab)}
                >
                  <View>
                    <Text style={styles.vocabTitle}>Vocabulary</Text>
                    <Text style={styles.vocabSubtitle}>{story.vocabulary.length} words from this story</Text>
                  </View>
                  <Ionicons
                    name={showVocab ? 'chevron-up' : 'chevron-down'}
                    size={20} color={COLORS.textMuted}
                  />
                </TouchableOpacity>

                {showVocab && story.vocabulary.map(word => (
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { paddingBottom: 100 },

  hero: { height: 300, justifyContent: 'space-between' },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  heroTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xxl,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  profileBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.bgCardAlt,
    borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', ...SHADOW.sm,
  },
  avatar: { width: '100%', height: '100%' },
  avatarFallback: {
    width: '100%', height: '100%', backgroundColor: COLORS.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
  heroContent: { padding: SPACING.lg, paddingBottom: SPACING.xl },
  catBadge: {
    borderRadius: RADIUS.full, paddingHorizontal: SPACING.sm, paddingVertical: 3,
    alignSelf: 'flex-start', marginBottom: SPACING.sm,
  },
  catBadgeText: { fontSize: 10, fontWeight: '800', color: COLORS.white, letterSpacing: 1 },
  heroTitleKb: {
    fontSize: 14, color: COLORS.gold, fontWeight: '600', marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3,
  },
  heroTitle: {
    fontSize: 26, fontWeight: '800', color: COLORS.white, fontFamily: 'Georgia', marginBottom: SPACING.sm,
    textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
  },
  heroMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroMetaText: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  heroDot: { color: 'rgba(255,255,255,0.5)', fontSize: 14 },
  heroMetaRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    marginTop: SPACING.sm 
  },
  audioControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  narrateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(28, 58, 42, 0.85)',
    paddingHorizontal: SPACING.lg,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    gap: 8,
    ...SHADOW.sm,
  },
  narrateBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.gold,
  },
  stopBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  narrateBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },

  modeRow: {
    flexDirection: 'row', marginHorizontal: SPACING.lg, marginTop: SPACING.md,
    backgroundColor: COLORS.bgCardAlt, borderRadius: RADIUS.full,
    padding: 3, borderWidth: 1, borderColor: COLORS.border,
  },
  modeBtn: { flex: 1, paddingVertical: SPACING.sm, alignItems: 'center', borderRadius: RADIUS.full },
  modeBtnActive: { backgroundColor: COLORS.bgCard, ...SHADOW.sm },
  modeBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted },
  modeBtnTextActive: { color: COLORS.primary },

  contentSection: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg },

  summaryCard: {
    backgroundColor: COLORS.bgGreenLight, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING.md, marginBottom: SPACING.lg,
  },
  summaryLabel: { fontSize: 10, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 1, marginBottom: SPACING.xs },
  summaryText: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 22, fontStyle: 'italic' },

  illustrationCard: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.md,
  },
  contentIllustration: {
    width: '100%',
    height: 180,
  },
  illustrationOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgGreen,
    paddingVertical: 8,
    paddingHorizontal: SPACING.md,
    gap: 8,
  },
  illustrationText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  textBlock: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING.lg, marginBottom: SPACING.md, ...SHADOW.sm,
  },
  textBlockHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  langDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary },
  textBlockLang: { fontSize: 11, fontWeight: '700', color: COLORS.primary, letterSpacing: 1 },
  storyText: { fontSize: 16, color: COLORS.textPrimary, lineHeight: 28 },
  storyTextKb: { fontFamily: 'Georgia' },

  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.md },

  noContent: { alignItems: 'center', padding: SPACING.xl },
  noContentText: { fontSize: 14, color: COLORS.textMuted, marginTop: SPACING.md },

  vocabSection: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border,
    marginTop: SPACING.md, overflow: 'hidden', ...SHADOW.sm,
  },
  vocabHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  vocabTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  vocabSubtitle: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  vocabCard: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm + 2,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  vocabWords: { flex: 1 },
  vocabEnglish: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 2 },
  vocabKaubru: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },

});
