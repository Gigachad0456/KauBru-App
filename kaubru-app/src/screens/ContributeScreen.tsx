import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert,
  KeyboardAvoidingView, Platform, TouchableOpacity,
  TextInput, Animated, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { contributionsAPI } from '../services/api';
import { COLORS, SPACING, RADIUS, SHADOW, FONTS } from '../config/theme';

const CATEGORIES = [
  { key: 'general',    label: 'General',    icon: 'globe-outline' },
  { key: 'greetings',  label: 'Greetings',  icon: 'hand-left-outline' },
  { key: 'family',     label: 'Family',     icon: 'people-outline' },
  { key: 'nature',     label: 'Nature',     icon: 'leaf-outline' },
  { key: 'food',       label: 'Food',       icon: 'restaurant-outline' },
  { key: 'verbs',      label: 'Verbs',      icon: 'flash-outline' },
];

export default function ContributeScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [english, setEnglish]       = useState('');
  const [kaubru, setKaubru]         = useState('');
  const [meaning, setMeaning]       = useState('');
  const [category, setCategory]     = useState('general');
  const [loading, setLoading]       = useState(false);
  const [submittedCount, setSubmittedCount] = useState(0);
  const [englishFocused, setEnglishFocused] = useState(false);
  const [kaubruFocused, setKaubruFocused]   = useState(false);
  const [meaningFocused, setMeaningFocused] = useState(false);
  const successAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      try {
        const res = await contributionsAPI.my();
        setSubmittedCount(res.data.length || 0);
      } catch {}
    })();
  }, []);

  const showSuccess = () => {
    Animated.sequence([
      Animated.timing(successAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(1800),
      Animated.timing(successAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  const handleSubmit = async () => {
    if (!english.trim() || !kaubru.trim()) {
      Alert.alert('Missing fields', 'Please fill in both the English word and KauBru translation.');
      return;
    }
    setLoading(true);
    try {
      await contributionsAPI.submit({
        english: english.trim(),
        kaubru: kaubru.trim(),
        meaning: meaning.trim() || undefined,
        category,
      });
      setEnglish(''); setKaubru(''); setMeaning('');
      setSubmittedCount(prev => prev + 1);
      showSuccess();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.detail || 'Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const successOpacity = successAnim;
  const successTranslate = successAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />

        {/* ── Success toast ─────────────────────────────────────────── */}
        <Animated.View style={[
          styles.successToast,
          { opacity: successOpacity, transform: [{ translateY: successTranslate }],
            top: insets.top + 12 }
        ]}>
          <Ionicons name="checkmark-circle" size={18} color="#fff" />
          <Text style={styles.successToastText}>Contribution submitted!</Text>
        </Animated.View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + SPACING.md }]}
        >
          {/* ── Header ──────────────────────────────────────────────── */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.pageTitle}>Contribute</Text>
              <Text style={styles.pageSubtitle}>Help preserve the KauBru language</Text>
            </View>
            <TouchableOpacity
              style={styles.historyBtn}
              onPress={() => navigation.navigate('MyContributions')}
            >
              <Ionicons name="time-outline" size={16} color={COLORS.primary} />
              <Text style={styles.historyBtnText}>History</Text>
            </TouchableOpacity>
          </View>

          {/* ── Hero banner ──────────────────────────────────────────── */}
          <LinearGradient
            colors={['#1A5A37', '#0F2819']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.heroBanner}
          >
            <View style={styles.heroLeft}>
              <Text style={styles.heroTitle}>Every word matters</Text>
              <Text style={styles.heroSub}>
                Your contributions help build the world's most complete KauBru dictionary.
              </Text>
            </View>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatNum}>{submittedCount}</Text>
              <Text style={styles.heroStatLabel}>submitted</Text>
            </View>
          </LinearGradient>

          {/* ── Category picker ──────────────────────────────────────── */}
          <Text style={styles.sectionLabel}>Category</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryRow}
          >
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.key}
                style={[styles.categoryChip, category === cat.key && styles.categoryChipActive]}
                onPress={() => setCategory(cat.key)}
                activeOpacity={0.75}
              >
                <Ionicons
                  name={cat.icon as any}
                  size={14}
                  color={category === cat.key ? COLORS.white : COLORS.textMuted}
                />
                <Text style={[styles.categoryChipText, category === cat.key && styles.categoryChipTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* ── Form ─────────────────────────────────────────────────── */}
          <View style={styles.formCard}>

            {/* English field */}
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>English Word or Phrase</Text>
              <View style={[styles.inputBox, englishFocused && styles.inputBoxFocused]}>
                <View style={styles.inputIconWrap}>
                  <Text style={styles.flagEmoji}>🇬🇧</Text>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Mountain"
                  placeholderTextColor={COLORS.textMuted}
                  value={english}
                  onChangeText={setEnglish}
                  onFocus={() => setEnglishFocused(true)}
                  onBlur={() => setEnglishFocused(false)}
                  autoCapitalize="words"
                />
                {english.length > 0 && (
                  <TouchableOpacity onPress={() => setEnglish('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="close-circle" size={16} color={COLORS.textMuted} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Arrow divider */}
            <View style={styles.arrowDivider}>
              <View style={styles.arrowLine} />
              <View style={styles.arrowCircle}>
                <Ionicons name="arrow-down" size={14} color={COLORS.primary} />
              </View>
              <View style={styles.arrowLine} />
            </View>

            {/* KauBru field */}
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>KauBru Translation</Text>
              <View style={[styles.inputBox, kaubruFocused && styles.inputBoxFocused]}>
                <View style={styles.inputIconWrap}>
                  <Text style={styles.flagEmoji}>🌿</Text>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Hahphung"
                  placeholderTextColor={COLORS.textMuted}
                  value={kaubru}
                  onChangeText={setKaubru}
                  onFocus={() => setKaubruFocused(true)}
                  onBlur={() => setKaubruFocused(false)}
                />
                {kaubru.length > 0 && (
                  <TouchableOpacity onPress={() => setKaubru('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="close-circle" size={16} color={COLORS.textMuted} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Optional meaning */}
            <View style={[styles.fieldWrap, { marginTop: SPACING.sm }]}>
              <Text style={styles.fieldLabel}>
                Meaning / Context <Text style={styles.optionalTag}>(optional)</Text>
              </Text>
              <View style={[styles.inputBox, styles.inputBoxMulti, meaningFocused && styles.inputBoxFocused]}>
                <TextInput
                  style={[styles.input, styles.inputMulti]}
                  placeholder="Add context, example sentence, or notes..."
                  placeholderTextColor={COLORS.textMuted}
                  value={meaning}
                  onChangeText={setMeaning}
                  onFocus={() => setMeaningFocused(true)}
                  onBlur={() => setMeaningFocused(false)}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            </View>

            {/* Submit button */}
            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[COLORS.primaryLight || '#2D7A4F', COLORS.primary]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.submitBtnGradient}
              >
                {loading ? (
                  <Text style={styles.submitBtnText}>Submitting...</Text>
                ) : (
                  <>
                    <Ionicons name="send" size={16} color="#fff" />
                    <Text style={styles.submitBtnText}>Submit Contribution</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Review note */}
            <View style={styles.reviewNote}>
              <Ionicons name="shield-checkmark-outline" size={13} color={COLORS.textMuted} />
              <Text style={styles.reviewNoteText}>
                Reviewed by our team before being added to the dictionary
              </Text>
            </View>
          </View>

          {/* ── How it works ─────────────────────────────────────────── */}
          <Text style={styles.sectionLabel}>How it works</Text>
          <View style={styles.stepsCard}>
            {[
              { icon: 'pencil-outline',          step: '1', title: 'Submit a word',    desc: 'Enter the English word and its KauBru translation' },
              { icon: 'eye-outline',             step: '2', title: 'Expert review',    desc: 'Our language experts verify the translation' },
              { icon: 'checkmark-circle-outline', step: '3', title: 'Added to dictionary', desc: 'Approved words appear in the app for everyone' },
            ].map((item, i) => (
              <View key={i} style={[styles.stepRow, i > 0 && styles.stepRowBorder]}>
                <View style={styles.stepIconWrap}>
                  <Ionicons name={item.icon as any} size={18} color={COLORS.primary} />
                </View>
                <View style={styles.stepBody}>
                  <Text style={styles.stepTitle}>{item.title}</Text>
                  <Text style={styles.stepDesc}>{item.desc}</Text>
                </View>
                <View style={styles.stepNum}>
                  <Text style={styles.stepNumText}>{item.step}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={{ height: SPACING.tabBar + SPACING.lg }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { paddingBottom: 20 },

  // Success toast
  successToast: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: RADIUS.full,
    zIndex: 100,
    ...SHADOW.premium,
  },
  successToastText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Header
  headerRow: {
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
  historyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.bgGreenLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    marginTop: 6,
  },
  historyBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },

  // Hero banner
  heroBanner: {
    marginHorizontal: SPACING.lg,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
    ...SHADOW.premium,
  },
  heroLeft: { flex: 1, paddingRight: SPACING.md },
  heroTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    fontFamily: FONTS.serif,
    marginBottom: 6,
  },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 19 },
  heroStat: { alignItems: 'center' },
  heroStatNum: {
    fontSize: 42,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -1,
  },
  heroStatLabel: { fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: '600', letterSpacing: 1 },

  // Section label
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },

  // Category chips
  categoryRow: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryChipText: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted },
  categoryChipTextActive: { color: COLORS.white },

  // Form card
  formCard: {
    marginHorizontal: SPACING.lg,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.xl,
    ...SHADOW.md,
  },

  // Fields
  fieldWrap: { marginBottom: SPACING.sm },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  optionalTag: { fontSize: 12, fontWeight: '500', color: COLORS.textMuted },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    height: 52,
    gap: SPACING.sm,
  },
  inputBoxFocused: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.bgGreenLight,
  },
  inputBoxMulti: {
    height: 90,
    alignItems: 'flex-start',
    paddingVertical: SPACING.md,
  },
  inputIconWrap: { width: 28, alignItems: 'center' },
  flagEmoji: { fontSize: 18 },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  inputMulti: {
    height: 70,
    textAlignVertical: 'top',
    paddingTop: 2,
  },

  // Arrow divider
  arrowDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.md,
    gap: SPACING.sm,
  },
  arrowLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.bgGreenLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  // Submit button
  submitBtn: {
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
    ...SHADOW.premium,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: 16,
  },
  submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 0.3 },

  // Review note
  reviewNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
    marginTop: SPACING.xs,
  },
  reviewNoteText: { fontSize: 12, color: COLORS.textMuted, fontWeight: '500' },

  // Steps card
  stepsCard: {
    marginHorizontal: SPACING.lg,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    ...SHADOW.sm,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  stepRowBorder: { borderTopWidth: 1, borderTopColor: COLORS.bg },
  stepIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.bgGreenLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stepBody: { flex: 1 },
  stepTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 2 },
  stepDesc: { fontSize: 12, color: COLORS.textMuted, lineHeight: 17 },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.bgCardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: { fontSize: 12, fontWeight: '800', color: COLORS.textMuted },
});
