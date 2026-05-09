import React, { useState, useEffect, useRef } from 'react';
import {
  View, TextInput, TouchableOpacity, Text, StyleSheet, Animated,
} from 'react-native';
import { COLORS, RADIUS, SPACING, SHADOW } from '../config/theme';

interface AnswerInputProps {
  onSubmit: (text: string) => void;
  disabled: boolean;
  accessibilityHint: string;
  clearTrigger?: number;
  shakeTrigger?: number;
}

export default function AnswerInput({
  onSubmit,
  disabled,
  accessibilityHint,
  clearTrigger = 0,
  shakeTrigger = 0,
}: AnswerInputProps) {
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<TextInput>(null);

  // Clear input when a correct answer was submitted
  useEffect(() => {
    if (clearTrigger > 0) {
      setValue('');
      inputRef.current?.focus();
    }
  }, [clearTrigger]);

  // Shake input on wrong answer
  useEffect(() => {
    if (shakeTrigger > 0) {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 5, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -5, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
    }
  }, [shakeTrigger]);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed);
    // Don't clear here — parent decides via clearTrigger
  };

  return (
    <Animated.View style={[styles.container, { transform: [{ translateX: shakeAnim }] }]}>
      <TextInput
        ref={inputRef}
        style={[styles.input, focused && styles.inputFocused]}
        value={value}
        onChangeText={setValue}
        onSubmitEditing={handleSubmit}
        returnKeyType="done"
        blurOnSubmit={false}
        autoFocus
        editable={!disabled}
        placeholder="Type translation & press Enter..."
        placeholderTextColor={COLORS.textMuted}
        accessibilityLabel="Translation input"
        accessibilityHint={accessibilityHint}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoCorrect={false}
        autoCapitalize="none"
      />
      <TouchableOpacity
        style={[styles.fireBtn, disabled && styles.fireBtnDisabled]}
        onPress={handleSubmit}
        disabled={disabled}
        accessibilityLabel="Fire answer"
      >
        <Text style={styles.fireBtnText}>⚡</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.sm,
    ...SHADOW.md,
  },
  input: {
    flex: 1,
    height: 52,
    backgroundColor: COLORS.bgCardAlt,
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.md,
    fontSize: 18,
    color: COLORS.textPrimary,
    fontWeight: '600',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  inputFocused: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
  },
  fireBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.premium,
  },
  fireBtnDisabled: {
    opacity: 0.4,
  },
  fireBtnText: {
    fontSize: 22,
  },
});
