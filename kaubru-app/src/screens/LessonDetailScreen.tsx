import Header from '../components/Header';
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { lessonsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import SpeakButton from '../components/SpeakButton';
import { COLORS, SPACING, RADIUS, SHADOW } from '../config/theme';

interface LessonWord {
  id: number;
  english: string;
  kaubru: string;
  audio_url?: string;
}

interface Lesson {
  id: number;
  title: string;
  description?: string;
  category: string;
  progress: number;
  is_premium: boolean;
  words?: LessonWord[];
  created_at: string;
}

export default function LessonDetailScreen({ route, navigation }: any) {
  const { lesson: initialLesson } = route.params as { lesson: Lesson };
  const { user } = useAuth();
  const [lesson, setLesson] = useState<Lesson>(initialLesson);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadLesson();
  }, []);

  const loadLesson = async () => {
    setLoading(true);
    try {
      const res = await lessonsAPI.getById(initialLesson.id);
      setLesson(res.data);
    } catch {
      // Keep initial lesson data on failure
    } finally {
      setLoading(false);
    }
  };

  // Premium lock check
  const isLocked = lesson.is_premium && !user?.is_premium;

  if (isLocked) {
    return (
      <View style={styles.container}>
        <Header title="{lesson.title}" showBack={true} />
        <View style={styles.lockedContainer}>
          <View style={styles.lockIcon}>
            <Ionicons name="lock-closed" size={48} color={COLORS.gold} />
          </View>
          <Text style={styles.lockedTitle}>Premium Content</Text>
          <Text style={styles.lockedText}>
            This lesson is available to Premium members. Upgrade to unlock all lessons and features.
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Premium')}
            style={styles.upgradeBtn}
            accessibilityRole="button"
            accessibilityLabel="Upgrade to Premium"
          >
            <Text style={styles.upgradeBtnText}>Upgrade to Premium</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title={lesson.title} showBack={true} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Lesson info */}
        <View style={styles.infoCard}>
          <Text style={styles.lessonCategory}>{lesson.category?.toUpperCase()}</Text>
          <Text style={styles.lessonTitle}>{lesson.title}</Text>
          {lesson.description && (
            <Text style={styles.lessonDesc}>{lesson.description}</Text>
          )}
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Progress</Text>
            <Text style={styles.progressValue}>{Math.round(lesson.progress * 100)}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${lesson.progress * 100}%` }]} />
          </View>
        </View>

        {/* Vocabulary list */}
        <Text style={styles.sectionTitle}>Vocabulary</Text>

        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginVertical: SPACING.lg }} />
        ) : lesson.words && lesson.words.length > 0 ? (
          lesson.words.map((word) => (
            <View key={word.id} style={styles.wordCard}>
              <View style={styles.wordRow}>
                <View style={styles.wordMain}>
                  <Text style={styles.wordEnglish}>{word.english}</Text>
                  <Text style={styles.wordKaubru}>{word.kaubru}</Text>
                </View>
                <SpeakButton
                  text={word.kaubru}
                  language="kb"
                  size="sm"
                />
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No vocabulary words for this lesson yet.</Text>
        )}

        {/* Start Quiz button */}
        {lesson.words && lesson.words.length >= 4 && (
          <TouchableOpacity
            onPress={() => navigation.navigate('Quiz', { lesson })}
            style={styles.quizBtn}
            accessibilityRole="button"
            accessibilityLabel="Start Quiz"
          >
            <Ionicons name="school-outline" size={20} color={COLORS.white} />
            <Text style={styles.quizBtnText}>Start Quiz</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.lg, paddingTop: SPACING.xxl, paddingBottom: SPACING.md,
    gap: SPACING.md,
  },
  backBtn: { padding: SPACING.xs },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  scroll: { paddingHorizontal: SPACING.lg, paddingBottom: 100 },

  infoCard: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING.lg, marginBottom: SPACING.lg, ...SHADOW.sm,
  },
  lessonCategory: { fontSize: 10, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 1, marginBottom: SPACING.xs },
  lessonTitle: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary, fontFamily: 'Georgia', marginBottom: SPACING.sm },
  lessonDesc: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 22, marginBottom: SPACING.md },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.xs },
  progressLabel: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600' },
  progressValue: { fontSize: 12, color: COLORS.primary, fontWeight: '700' },
  progressBar: {
    height: 6, backgroundColor: COLORS.border, borderRadius: RADIUS.full, overflow: 'hidden',
  },
  progressFill: {
    height: '100%', backgroundColor: COLORS.primary, borderRadius: RADIUS.full,
  },

  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.md },

  wordCard: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING.md, marginBottom: SPACING.sm, ...SHADOW.sm,
  },
  wordRow: { flexDirection: 'row', alignItems: 'center' },
  wordMain: { flex: 1 },
  wordEnglish: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 2, fontFamily: 'Georgia' },
  wordKaubru: { fontSize: 14, color: COLORS.primary, fontWeight: '600' },

  quizBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.primary, borderRadius: RADIUS.full,
    paddingVertical: SPACING.md + 2, marginTop: SPACING.lg,
    ...SHADOW.md,
  },
  quizBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },

  emptyText: { color: COLORS.textMuted, textAlign: 'center', marginTop: SPACING.lg },

  // Locked state
  lockedContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  lockIcon: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: COLORS.goldLight,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.lg, ...SHADOW.md,
  },
  lockedTitle: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary, marginBottom: SPACING.sm, fontFamily: 'Georgia' },
  lockedText: { fontSize: 15, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: SPACING.xl },
  upgradeBtn: {
    backgroundColor: COLORS.gold, borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md,
    ...SHADOW.md,
  },
  upgradeBtnText: { color: COLORS.primary, fontSize: 16, fontWeight: '800' },
});





