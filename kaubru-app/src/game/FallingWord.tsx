import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, View, Dimensions } from 'react-native';
import { COLORS, RADIUS } from '../config/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SLOT_WIDTH = Math.floor((SCREEN_WIDTH - 48) / 3);

interface FallingWordProps {
  displayText: string;
  typedCount: number;
  isTargeted: boolean;
  isCorrect: boolean;
  animValue: Animated.Value;
  xSlot: number;        // 0, 1, 2
  onFlashComplete: () => void;
}

export default function FallingWord({
  displayText,
  typedCount,
  isTargeted,
  isCorrect,
  animValue,
  xSlot,
  onFlashComplete,
}: FallingWordProps) {
  const bgAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isCorrect) {
      Animated.parallel([
        Animated.timing(bgAnim, { toValue: 1, duration: 100, useNativeDriver: false }),
        Animated.sequence([
          Animated.timing(scaleAnim, { toValue: 1.2, duration: 100, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
        ]),
        Animated.timing(opacityAnim, { toValue: 0, duration: 350, useNativeDriver: false }),
      ]).start(() => onFlashComplete());
    }
  }, [isCorrect]);

  const backgroundColor = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      isTargeted ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.10)',
      '#22C55E',
    ],
  });

  const borderColor = isTargeted ? 'rgba(255,220,50,0.8)' : 'rgba(255,255,255,0.2)';

  const typed = displayText.slice(0, typedCount);
  const remaining = displayText.slice(typedCount);

  // X position based on slot
  const xPos = 16 + xSlot * (SLOT_WIDTH + 8);

  return (
    <Animated.View
      style={[
        styles.tile,
        {
          left: xPos,
          transform: [{ translateY: animValue }, { scale: scaleAnim }],
          backgroundColor,
          borderColor,
          opacity: opacityAnim,
        },
      ]}
    >
      <Text style={styles.wordText} numberOfLines={1}>
        {typed.length > 0 && (
          <Text style={styles.typedText}>{typed}</Text>
        )}
        <Text style={styles.remainingText}>{remaining}</Text>
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tile: {
    position: 'absolute',
    top: 0,
    width: SLOT_WIDTH,
    borderWidth: 1.5,
    borderRadius: RADIUS.lg,
    paddingHorizontal: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordText: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  typedText: {
    color: '#4ADE80',   // bright green — typed letters
    fontWeight: '800',
  },
  remainingText: {
    color: COLORS.white,  // white — remaining letters
    fontWeight: '700',
  },
});
