import Header from '../components/Header';
import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { lessonsAPI } from '../services/api';
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
  words?: LessonWord[];
}

interface QuizQuestion {
  id: string;
  prompt: string;
  correctAnswer: string;
  options: string[];
}

/**
 * Generate quiz questions from a list of lesson words.
 * For each word, pick 3 random distractors from other words' KauBru values, shuffle all 4 options.
 */
export function generateQuizQuestions(words: LessonWord[]): QuizQuestion[] {
  if (words.length < 4) return [];
  return words.map((word, idx) => {
    const distractors = words
      .filter((_, i) => i !== idx)
      .map(w => w.kaubru)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    const options = [word.kaubru, ...distractors].sort(() => Math.random() - 0.5);

    return {
      id: `q_${word.id}`,
      prompt: word.english,
      correctAnswer: word.kaubru,
      options,
    };
  });
}

export default function QuizScreen({ route, navigation }: any) {
  const { lesson } = route.params as { lesson: Lesson };
  const words = lesson.words || [];

  const questions = useMemo(() => generateQuizQuestions(words), [words]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answers, setAnswers] = useState<{ question: QuizQuestion; selected: string }[]>([]);
  const [quizComplete, setQuizComplete] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;

  const correctCount = answers.filter(a => a.selected === a.question.correctAnswer).length;
  const score = totalQuestions > 0 ? correctCount / totalQuestions : 0;

  const handleSelectAnswer = (answer: string) => {
    if (selectedAnswer !== null) return; // Already answered
    setSelectedAnswer(answer);
  };

  const handleNext = () => {
    if (selectedAnswer === null) return;

    const newAnswers = [...answers, { question: currentQuestion, selected: selectedAnswer }];
    setAnswers(newAnswers);
    setSelectedAnswer(null);

    if (currentIndex + 1 >= totalQuestions) {
      // Quiz complete
      setQuizComplete(true);
      submitScore(newAnswers);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const submitScore = async (finalAnswers: { question: QuizQuestion; selected: string }[]) => {
    const correct = finalAnswers.filter(a => a.selected === a.question.correctAnswer).length;
    const finalScore = totalQuestions > 0 ? correct / totalQuestions : 0;
    setSubmitting(true);
    try {
      await lessonsAPI.updateProgress(lesson.id, finalScore, finalScore);
    } catch {
      setSubmitError('Could not save your score. Your local result is still shown.');
    } finally {
      setSubmitting(false);
    }
  };

  const getOptionStyle = (option: string) => {
    if (selectedAnswer === null) return styles.optionBtn;
    if (option === currentQuestion.correctAnswer) return [styles.optionBtn, styles.optionCorrect];
    if (option === selectedAnswer && option !== currentQuestion.correctAnswer) return [styles.optionBtn, styles.optionIncorrect];
    return [styles.optionBtn, styles.optionDimmed];
  };

  const getOptionTextStyle = (option: string) => {
    if (selectedAnswer === null) return styles.optionText;
    if (option === currentQuestion.correctAnswer) return [styles.optionText, styles.optionTextCorrect];
    if (option === selectedAnswer && option !== currentQuestion.correctAnswer) return [styles.optionText, styles.optionTextIncorrect];
    return [styles.optionText, styles.optionTextDimmed];
  };

  if (words.length < 4) {
    return (
      <View style={styles.container}>
        <Header title="Quiz" showBack={true} />
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Not enough vocabulary words to generate a quiz (need at least 4).</Text>
        </View>
      </View>
    );
  }

  if (quizComplete) {
    const percentage = Math.round(score * 100);
    return (
      <View style={styles.container}>
        <Header title="Results" showBack={true} />
        <ScrollView contentContainerStyle={styles.resultsScroll}>
          <View style={styles.resultsCard}>
            <View style={styles.scoreCircle}>
              <Text style={styles.scorePercent}>{percentage}%</Text>
            </View>
            <Text style={styles.resultsTitle}>
              {percentage >= 80 ? '🎉 Excellent!' : percentage >= 60 ? '👍 Good job!' : '📚 Keep practicing!'}
            </Text>
            <Text style={styles.resultsScore}>
              {correctCount} / {totalQuestions} correct
            </Text>
            {submitError && (
              <Text style={styles.submitError}>{submitError}</Text>
            )}
          </View>

          <TouchableOpacity
            onPress={() => navigation.navigate('Learn')}
            style={styles.backToLessonsBtn}
            accessibilityRole="button"
            accessibilityLabel="Back to Lessons"
          >
            <Text style={styles.backToLessonsBtnText}>Back to Lessons</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  const progressPct = ((currentIndex) / totalQuestions) * 100;

  return (
    <View style={styles.container}>
      <Header title="{lesson.title}" showBack={true} />

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Progress */}
        <View style={styles.progressSection}>
          <Text style={styles.questionCounter}>Question {currentIndex + 1} of {totalQuestions}</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
          </View>
        </View>

        {/* Question */}
        <View style={styles.questionCard}>
          <Text style={styles.questionLabel}>Translate to KauBru:</Text>
          <Text style={styles.questionText}>{currentQuestion.prompt}</Text>
        </View>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {currentQuestion.options.map((option, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => handleSelectAnswer(option)}
              style={getOptionStyle(option)}
              disabled={selectedAnswer !== null}
              accessibilityRole="radio"
              accessibilityLabel={`Option: ${option}`}
              accessibilityState={{
                selected: selectedAnswer === option,
                checked: selectedAnswer !== null && option === currentQuestion.correctAnswer,
              }}
            >
              <Text style={getOptionTextStyle(option)}>{option}</Text>
              {selectedAnswer !== null && option === currentQuestion.correctAnswer && (
                <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
              )}
              {selectedAnswer === option && option !== currentQuestion.correctAnswer && (
                <Ionicons name="close-circle" size={20} color="#EF4444" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Next button */}
        {selectedAnswer !== null && (
          <TouchableOpacity
            onPress={handleNext}
            style={styles.nextBtn}
            accessibilityRole="button"
            accessibilityLabel={currentIndex + 1 >= totalQuestions ? 'See Results' : 'Next Question'}
          >
            <Text style={styles.nextBtnText}>
              {currentIndex + 1 >= totalQuestions ? 'See Results' : 'Next Question'}
            </Text>
            <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
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
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl },
  emptyText: { fontSize: 15, color: COLORS.textSecondary, textAlign: 'center' },

  progressSection: { marginBottom: SPACING.lg },
  questionCounter: { fontSize: 13, color: COLORS.textMuted, fontWeight: '600', marginBottom: SPACING.sm },
  progressBar: {
    height: 6, backgroundColor: COLORS.border, borderRadius: RADIUS.full, overflow: 'hidden',
  },
  progressFill: {
    height: '100%', backgroundColor: COLORS.primary, borderRadius: RADIUS.full,
  },

  questionCard: {
    backgroundColor: COLORS.bgGreenLight, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING.xl, marginBottom: SPACING.lg, ...SHADOW.sm,
  },
  questionLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 0.5, marginBottom: SPACING.sm },
  questionText: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary, fontFamily: 'Georgia' },

  optionsContainer: { gap: SPACING.sm, marginBottom: SPACING.lg },
  optionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    borderWidth: 1.5, borderColor: COLORS.border,
    padding: SPACING.md, ...SHADOW.sm,
  },
  optionCorrect: {
    backgroundColor: '#F0FDF4', borderColor: '#22C55E',
  },
  optionIncorrect: {
    backgroundColor: '#FEF2F2', borderColor: '#EF4444',
  },
  optionDimmed: {
    opacity: 0.5,
  },
  optionText: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary, flex: 1 },
  optionTextCorrect: { color: '#16A34A' },
  optionTextIncorrect: { color: '#DC2626' },
  optionTextDimmed: { color: COLORS.textMuted },

  nextBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.primary, borderRadius: RADIUS.full,
    paddingVertical: SPACING.md + 2, ...SHADOW.md,
  },
  nextBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },

  // Results
  resultsScroll: { paddingHorizontal: SPACING.lg, paddingBottom: 100, paddingTop: SPACING.lg },
  resultsCard: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.xl,
    borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING.xl, alignItems: 'center', marginBottom: SPACING.xl, ...SHADOW.md,
  },
  scoreCircle: {
    width: 120, height: 120, borderRadius: 60,
    borderWidth: 4, borderColor: COLORS.gold,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  scorePercent: { fontSize: 32, fontWeight: '800', color: COLORS.textPrimary },
  resultsTitle: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary, marginBottom: SPACING.sm, fontFamily: 'Georgia' },
  resultsScore: { fontSize: 16, color: COLORS.textSecondary },
  submitError: { fontSize: 12, color: COLORS.warning, marginTop: SPACING.md, textAlign: 'center' },
  backToLessonsBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.full,
    paddingVertical: SPACING.md + 2, alignItems: 'center', ...SHADOW.md,
  },
  backToLessonsBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
});





