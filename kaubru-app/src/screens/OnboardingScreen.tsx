import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Dimensions, TouchableOpacity,
  FlatList, NativeSyntheticEvent, NativeScrollEvent,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SPACING, RADIUS, SHADOW } from '../config/theme';

const { width, height } = Dimensions.get('window');
type Props = { navigation: NativeStackNavigationProp<any> };

const ONBOARDING_KEY = 'onboarding_complete';

interface Slide {
  id: string;
  icon: string;
  iconLib: 'ion' | 'mci';
  tag: string;
  title: string;
  subtitle: string;
  bgColor: string;
}

const SLIDES: Slide[] = [
  {
    id: '1',
    icon: 'leaf',
    iconLib: 'mci',
    tag: 'PRESERVE',
    title: 'Living Heritage',
    subtitle: 'Digitizing the KauBru/Reang language for future generations. Explore a rich dictionary of verified words.',
    bgColor: COLORS.bgGreenLight,
  },
  {
    id: '2',
    icon: 'swap-horizontal',
    iconLib: 'ion',
    tag: 'TRANSLATE',
    title: 'Translate Instantly',
    subtitle: 'Translate between English and KauBru with accuracy.',
    bgColor: COLORS.goldLight,
  },
  {
    id: '3',
    icon: 'school-outline',
    iconLib: 'ion',
    tag: 'LEARN',
    title: 'Learn & Contribute',
    subtitle: 'Take structured lessons, quiz yourself, and contribute new words to help grow the community dictionary.',
    bgColor: COLORS.bgGreenLight,
  },
];

export default function OnboardingScreen({ navigation }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [checked, setChecked] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    (async () => {
      try {
        const done = await AsyncStorage.getItem(ONBOARDING_KEY);
        if (done === 'true') { navigation.replace('Login'); return; }
      } catch {}
      setChecked(true);
    })();
  }, []);

  if (!checked) return null;

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setCurrentIndex(index);
  };

  const completeOnboarding = async (dest: 'Signup' | 'Login') => {
    try { await AsyncStorage.setItem(ONBOARDING_KEY, 'true'); } catch {}
    navigation.replace(dest);
  };

  const isLastSlide = currentIndex === SLIDES.length - 1;

  const renderSlide = ({ item }: { item: Slide }) => (
    <View style={[styles.slide, { width }]}>
      {/* Icon illustration */}
      <View style={[styles.iconContainer, { backgroundColor: item.bgColor }]}>
        {item.iconLib === 'mci' ? (
          <MaterialCommunityIcons name={item.icon as any} size={72} color={COLORS.primary} />
        ) : (
          <Ionicons name={item.icon as any} size={72} color={COLORS.primary} />
        )}
      </View>

      {/* Tag */}
      <View style={styles.tagPill}>
        <Text style={styles.tagText}>{item.tag}</Text>
      </View>

      <Text style={styles.slideTitle}>{item.title}</Text>
      <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Decorative blobs */}
      <View style={styles.blob1} />
      <View style={styles.blob2} />

      {/* Logo */}
      <View style={styles.logoArea}>
        <View style={styles.logoIcon}>
          <MaterialCommunityIcons name="leaf" size={36} color={COLORS.primary} />
        </View>
        <Text style={styles.appName}>KauBru</Text>
        <Text style={styles.appSubName}>AI TRANSLATOR</Text>
      </View>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={item => item.id}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.flatList}
      />

      {/* Dot indicators */}
      <View style={styles.dotsRow}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, i === currentIndex && styles.dotActive]} />
        ))}
      </View>

      {/* CTA */}
      <View style={styles.cta}>
        {isLastSlide ? (
          <>
            <TouchableOpacity
              onPress={() => completeOnboarding('Signup')}
              style={styles.getStartedBtn}
              accessibilityRole="button"
              accessibilityLabel="Get Started"
            >
              <Text style={styles.getStartedText}>Get Started</Text>
              <Ionicons name="arrow-forward" size={18} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.replace('Login')}
              style={styles.loginLink}
              accessibilityRole="button"
              accessibilityLabel="I already have an account"
            >
              <Text style={styles.loginLinkText}>I already have an account</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.skipRow}>
            <TouchableOpacity
              onPress={() => completeOnboarding('Signup')}
              style={styles.skipBtn}
              accessibilityRole="button"
            >
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                const next = currentIndex + 1;
                flatListRef.current?.scrollToIndex({ index: next, animated: true });
                setCurrentIndex(next);
              }}
              style={styles.nextBtn}
              accessibilityRole="button"
            >
              <Text style={styles.nextText}>Next</Text>
              <Ionicons name="arrow-forward" size={16} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingBottom: SPACING.xxl,
  },
  blob1: {
    position: 'absolute', width: 280, height: 280, borderRadius: 140,
    backgroundColor: COLORS.primary, opacity: 0.05, top: -60, right: -80,
  },
  blob2: {
    position: 'absolute', width: 220, height: 220, borderRadius: 110,
    backgroundColor: COLORS.gold, opacity: 0.07, bottom: 120, left: -60,
  },
  logoArea: {
    alignItems: 'center',
    paddingTop: height * 0.07,
    paddingBottom: SPACING.md,
  },
  logoIcon: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: COLORS.bgGreenLight,
    borderWidth: 1.5, borderColor: COLORS.primary + '30',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.sm, ...SHADOW.sm,
  },
  appName: {
    fontSize: 30, fontWeight: '800', color: COLORS.primary,
    letterSpacing: 1, fontFamily: 'Georgia',
  },
  appSubName: {
    fontSize: 11, color: COLORS.textMuted, fontWeight: '600',
    letterSpacing: 4, marginTop: 2,
  },
  flatList: { flexGrow: 0 },
  slide: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    alignItems: 'center',
  },
  iconContainer: {
    width: 130, height: 130, borderRadius: 65,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.lg, ...SHADOW.md,
  },
  tagPill: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md, paddingVertical: 4,
    marginBottom: SPACING.sm,
  },
  tagText: { fontSize: 10, fontWeight: '800', color: COLORS.white, letterSpacing: 1.5 },
  slideTitle: {
    fontSize: 24, fontWeight: '800', color: COLORS.textPrimary,
    textAlign: 'center', marginBottom: SPACING.sm, fontFamily: 'Georgia',
  },
  slideSubtitle: {
    fontSize: 14, color: COLORS.textSecondary,
    textAlign: 'center', lineHeight: 22,
  },
  dotsRow: {
    flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', marginTop: SPACING.lg,
    marginBottom: SPACING.md, gap: SPACING.sm,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.border },
  dotActive: { width: 24, height: 8, borderRadius: 4, backgroundColor: COLORS.primary },
  cta: { paddingHorizontal: SPACING.lg, marginTop: SPACING.sm },
  getStartedBtn: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.full,
    paddingVertical: SPACING.md + 2,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 10,
    borderWidth: 1.5, borderColor: COLORS.primary,
    marginBottom: SPACING.md, ...SHADOW.sm,
  },
  getStartedText: { fontSize: 16, fontWeight: '800', color: COLORS.primary },
  loginLink: { alignItems: 'center', paddingVertical: SPACING.sm },
  loginLinkText: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '600' },
  skipRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  skipBtn: { paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg },
  skipText: { fontSize: 15, color: COLORS.textMuted, fontWeight: '600' },
  nextBtn: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.primary, borderRadius: RADIUS.full,
    paddingVertical: SPACING.md, paddingHorizontal: SPACING.xl, ...SHADOW.sm,
  },
  nextText: { fontSize: 15, color: COLORS.white, fontWeight: '700' },
});
