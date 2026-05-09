import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert,
  KeyboardAvoidingView, Platform, TouchableOpacity,
  TextInput, Animated, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { contributionsAPI } from '../services/api';
import { COLORS, SPACING, RADIUS, SHADOW, FONTS } from '../config/theme';

const CATEGORIES = [
  { key: 'general',   label: 'General' },
  { key: 'greetings', label: 'Greetings' },
  { key: 'family',    label: 'Family' },
  { key: 'nature',    label: 'Nature' },
  { key: 'food',      label: 'Food' },
  { key: 'verbs',     label: 'Verbs' },
  { key: 'places',    label: 'Places' },
  { key: 'time',      label: 'Time' },
];

export default function ContributeScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [english, setEnglish]   = useState('');
  const [kaubru, setKaubru]     = useState('');
  const [meaning, setMeaning]   = useState('');
  const [category, setCategory] = useState('general');
  const [loading, setLoading]   = useState(false);
  const [count, setCount]       = useState(0);
  const [engFocus, setEngFocus] = useState(false);
  const [kbFocus, setKbFocus]   = useState(false);
  const [mFocus, setMFocus]     = useState(false);
  const toastAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    contributionsAPI.my().then(r => setCount(r.data.length || 0)).catch(() => {});
  }, []);

  const showToast = () => {
    Animated.sequence([
      Animated.spring(toastAnim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }),
      Animated.delay(2000),
      Animated.timing(toastAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start();
  };

  const handleSubmit = async () => {
    if (!english.trim() || !kaubru.trim()) {
      Alert.alert('Required', 'Please fill in both fields.');
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
      setCount(p => p + 1);
      showToast();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.detail || 'Submission failed.');
    } finally {
      setLoading(false);
    }
  };

  const toastY = toastAnim.interpolate({ inputRange: [0, 1], outputRange: [-60, 0] });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: COLORS.bg }}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <StatusBar barStyle="dark-content" />

      {/* Toast */}
      <Animated.View style={[
        styles.toast,
        { top: insets.top + 12, opacity: toastAnim, transform: [{ translateY: toastY }] }
      ]}>
        <Ionicons name="checkmark-circle" size={16} color="#fff" />
        <Text style={styles.toastText}>Submitted for review</Text>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + SPACING.lg }]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Contribute</Text>
            <Text style={styles.subtitle}>Add words to the KauBru dictionary</Text>
          </View>
          <TouchableOpacity
            style={styles.countBadge}
            onPress={() => navigation.navigate('MyContributions')}
          >
            <Text style={styles.countNum}>{count}</Text>
            <Text style={styles.countLabel}>submitted</Text>
          </TouchableOpacity>
        </View>

        {/* Category */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {CATEGORIES.map(c => (
            <TouchableOpacity
              key={c.key}
              onPress={() => setCategory(c.key)}
              style={[styles.chip, category === c.key && styles.chipActive]}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, category === c.key && styles.chipTextActive]}>
                {c.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Input pair */}
        <View style={styles.card}>

          {/* English */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLang}>English</Text>
            <View style={[styles.inputWrap, engFocus && styles.inputWrapFocus]}>
              <TextInput
                style={styles.inputText}
                placeholder="Word or phrase"
                placeholderTextColor={COLORS.textMuted}
                value={english}
                onChangeText={setEnglish}
                onFocus={() => setEngFocus(true)}
                onBlur={() => setEngFocus(false)}
                autoCapitalize="words"
              />
              {english.length > 0 && (
                <TouchableOpacity onPress={() => setEnglish('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close-circle" size={16} color={COLORS.textMuted} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <View style={styles.dividerIcon}>
              <Ionicons name="swap-vertical" size={14} color={COLORS.primaryLight} />
            </View>
            <View style={styles.dividerLine} />
          </View>

          {/* KauBru */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLang}>KauBru</Text>
            <View style={[styles.inputWrap, kbFocus && styles.inputWrapFocus]}>
              <TextInput
                style={styles.inputText}
                placeholder="Translation"
                placeholderTextColor={COLORS.textMuted}
                value={kaubru}
                onChangeText={setKaubru}
                onFocus={() => setKbFocus(true)}
                onBlur={() => setKbFocus(false)}
              />
              {kaubru.length > 0 && (
                <TouchableOpacity onPress={() => setKaubru('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close-circle" size={16} color={COLORS.textMuted} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Context */}
          <View style={[styles.inputGroup, { marginTop: SPACING.sm }]}>
            <Text style={styles.inputLang}>
              Context <Text style={styles.optional}>· optional</Text>
            </Text>
            <View style={[styles.inputWrap, styles.inputWrapTall, mFocus && styles.inputWrapFocus]}>
              <TextInput
                style={[styles.inputText, { height: 72, textAlignVertical: 'top', paddingTop: 2 }]}
                placeholder="Example sentence or usage notes"
                placeholderTextColor={COLORS.textMuted}
                value={meaning}
                onChangeText={setMeaning}
                onFocus={() => setMFocus(true)}
                onBlur={() => setMFocus(false)}
                multiline
              />
            </View>
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, (!english.trim() || !kaubru.trim() || loading) && styles.submitBtnOff]}
            onPress={handleSubmit}
            disabled={loading || !english.trim() || !kaubru.trim()}
            activeOpacity={0.85}
          >
            <Text style={styles.submitText}>
              {loading ? 'Submitting…' : 'Submit'}
            </Text>
            {!loading && <Ionicons name="arrow-forward" size={16} color="#fff" />}
          </TouchableOpacity>

          <View style={styles.reviewRow}>
            <Ionicons name="shield-checkmark-outline" size={12} color={COLORS.textMuted} />
            <Text style={styles.reviewText}>Reviewed before being added to the dictionary</Text>
          </View>
        </View>

        {/* Info strip */}
        <View style={styles.infoStrip}>
          {[
            { icon: 'pencil-outline',           text: 'Submit a word' },
            { icon: 'checkmark-done-outline',   text: 'Expert review' },
            { icon: 'book-outline',             text: 'Added to dictionary' },
          ].map((item, i) => (
            <React.Fragment key={i}>
              <View style={styles.infoItem}>
                <View style={styles.infoIconWrap}>
                  <Ionicons name={item.icon as any} size={15} color={COLORS.primary} />
                </View>
                <Text style={styles.infoText}>{item.text}</Text>
              </View>
              {i < 2 && <Ionicons name="chevron-forward" size={12} color={COLORS.border} />}
            </React.Fragment>
          ))}
        </View>

        <View style={{ height: SPACING.tabBar + SPACING.lg }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: SPACING.lg },

  // Toast
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
    zIndex: 99,
    ...SHADOW.lg,
  },
  toastText: { color: '#fff', fontSize: 13, fontWeight: '600' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontFamily: FONTS.serif,
    letterSpacing: -0.5,
  },
  subtitle: { fontSize: 14, color: COLORS.textMuted, marginTop: 3, fontWeight: '500' },
  countBadge: {
    alignItems: 'center',
    backgroundColor: COLORS.bgGreenLight,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 4,
  },
  countNum: { fontSize: 22, fontWeight: '800', color: COLORS.primary, letterSpacing: -0.5 },
  countLabel: { fontSize: 10, color: COLORS.textMuted, fontWeight: '600', letterSpacing: 0.5, marginTop: 1 },

  // Chips
  chips: { gap: SPACING.sm, paddingBottom: SPACING.xl },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted },
  chipTextActive: { color: '#fff' },

  // Card
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
    ...SHADOW.md,
  },

  // Input group
  inputGroup: { marginBottom: SPACING.xs },
  inputLang: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  optional: { fontWeight: '500', textTransform: 'none', letterSpacing: 0 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    height: 50,
    gap: SPACING.sm,
  },
  inputWrapFocus: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.bgGreenLight,
  },
  inputWrapTall: { height: 90, alignItems: 'flex-start', paddingVertical: SPACING.md },
  inputText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.md,
    gap: SPACING.sm,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.bgGreenLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  // Submit
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingVertical: 15,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
    ...SHADOW.premium,
  },
  submitBtnOff: { opacity: 0.45 },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 0.2 },

  // Review note
  reviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  reviewText: { fontSize: 11, color: COLORS.textMuted, fontWeight: '500' },

  // Info strip
  infoStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm,
    ...SHADOW.sm,
  },
  infoItem: { alignItems: 'center', gap: 6, flex: 1 },
  infoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.bgGreenLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary, textAlign: 'center' },
});
