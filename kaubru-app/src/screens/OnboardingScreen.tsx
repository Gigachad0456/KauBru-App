import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Dimensions, TouchableOpacity,
  FlatList, NativeSyntheticEvent, NativeScrollEvent, ImageBackground,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SPACING, RADIUS, SHADOW } from '../config/theme';

const { width, height } = Dimensions.get('window');
type Props = { navigation: NativeStackNavigationProp<any> };

const ONBOARDING_KEY = 'onboarding_complete';

interface Slide {
  id: string;
  image: any;
  tag: string;
  title: string;
  subtitle: string;
}

const SLIDES: Slide[] = [
  {
    id: '1',
    image: require('../../assets/culture1.jpg'),
    tag: 'PRESERVE',
    title: 'Living Heritage',
    subtitle: 'The KauBru/Reang people carry centuries of culture through dance, music, and language.',
  },
  {
    id: '2',
    image: require('../../assets/culture2.png'),
    tag: 'CELEBRATE',
    title: 'Traditional Dance',
    subtitle: 'Hozagiri and other sacred dances tell stories passed down through generations.',
  },
  {
    id: '3',
    image: require('../../assets/culture3.png'),
    tag: 'LEARN',
    title: 'Speak KauBru',
    subtitle: 'Translate, explore the dictionary, and contribute words to keep the language alive.',
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
        if (done === 'true') {
          navigation.replace('Login');
          return;
        }
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
    <ImageBackground
      source={item.image}
      style={[styles.slide, { width }]}
      resizeMode="cover"
    >
      {/* Dark gradient overlay — more cinematic */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.95)']}
        locations={[0, 0.3, 0.6, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Content pinned to bottom */}
      <View style={styles.slideContent}>
        <View style={styles.tagPill}>
          <Text style={styles.tagText}>{item.tag}</Text>
        </View>
        <Text style={styles.slideTitle}>{item.title}</Text>
        <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
      </View>
    </ImageBackground>
  );

  return (
    <View style={styles.container}>
      {/* Full-screen slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={StyleSheet.absoluteFill}
      />

      {/* Top logo bar */}
      <View style={styles.topBar}>
        <View style={styles.logoRow}>
          <Text style={styles.logoLeaf}>🌿</Text>
          <Text style={styles.logoText}>KauBru</Text>
        </View>
        {!isLastSlide && (
          <TouchableOpacity
            onPress={() => completeOnboarding('Signup')}
            style={styles.skipBtn}
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Bottom controls */}
      <View style={styles.bottomBar}>
        {/* Dot indicators */}
        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, i === currentIndex && styles.dotActive]} />
          ))}
        </View>

        {isLastSlide ? (
          <View style={styles.ctaCol}>
            <TouchableOpacity
              onPress={() => completeOnboarding('Signup')}
              style={styles.getStartedBtnWrapper}
            >
              <LinearGradient
                colors={['#FFFFFF', '#F0E4B8']}
                style={styles.getStartedBtn}
              >
                <Text style={styles.getStartedText}>Get Started</Text>
                <Ionicons name="arrow-forward" size={20} color={COLORS.primary} />
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.replace('Login')}
              style={styles.loginLink}
            >
              <Text style={styles.loginLinkText}>I already have an account</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => {
              const next = currentIndex + 1;
              flatListRef.current?.scrollToIndex({ index: next, animated: true });
              setCurrentIndex(next);
            }}
            style={styles.nextBtnWrapper}
          >
            <LinearGradient
              colors={[COLORS.primaryLight, COLORS.primary] as const}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.nextBtn}
            >
              <Text style={styles.nextText}>Next</Text>
              <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  slide: {
    height,
    justifyContent: 'flex-end',
  },
  slideContent: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: 200,  // leave room for bottom controls
  },
  tagPill: {
    backgroundColor: COLORS.gold,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 5,
    alignSelf: 'flex-start',
    marginBottom: SPACING.md,
    ...SHADOW.md,
  },
  tagText: {
    fontSize: 12, fontWeight: '900', color: COLORS.primary, letterSpacing: 2,
  },
  slideTitle: {
    fontSize: 42, fontWeight: '900', color: COLORS.white,
    fontFamily: 'Georgia', marginBottom: SPACING.md,
    textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 4 }, textShadowRadius: 12,
    letterSpacing: -0.5,
  },
  slideSubtitle: {
    fontSize: 17, color: 'rgba(255,255,255,0.9)', lineHeight: 28,
    textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6,
    fontWeight: '500',
  },

  // Top bar
  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xxl,
    paddingBottom: SPACING.md,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoLeaf: { fontSize: 26 },
  logoText: {
    fontSize: 22, fontWeight: '900', color: COLORS.white,
    textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
  },
  skipBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  skipText: { fontSize: 14, fontWeight: '700', color: COLORS.white },

  // Bottom bar
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxl,
    paddingTop: SPACING.xl,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
  },
  dotsRow: {
    flexDirection: 'row', justifyContent: 'center',
    gap: 10, marginBottom: SPACING.xl,
  },
  dot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dotActive: {
    width: 32, height: 10, borderRadius: 5,
    backgroundColor: COLORS.gold,
  },

  // CTA
  ctaCol: { gap: SPACING.md },
  getStartedBtnWrapper: {
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    ...SHADOW.premium,
  },
  getStartedBtn: {
    paddingVertical: SPACING.lg,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
  },
  getStartedText: {
    fontSize: 18, fontWeight: '900', color: COLORS.primary, letterSpacing: 0.5,
  },
  loginLink: {
    alignItems: 'center', paddingVertical: SPACING.sm,
  },
  loginLinkText: {
    fontSize: 15, color: 'rgba(255,255,255,0.7)', fontWeight: '700',
  },
  nextBtnWrapper: {
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    ...SHADOW.premium,
  },
  nextBtn: {
    paddingVertical: SPACING.lg,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
  },
  nextText: { fontSize: 18, fontWeight: '800', color: COLORS.white },
});


