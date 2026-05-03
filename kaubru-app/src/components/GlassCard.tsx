import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, RADIUS, SPACING, SHADOW } from '../config/theme';

interface Props {
  children: ReactNode;
  style?: ViewStyle;
  padding?: number;
  variant?: 'white' | 'green' | 'cream';
}

export default function GlassCard({ children, style, padding = SPACING.md, variant = 'white' }: Props) {
  return (
    <View style={[
      styles.card,
      variant === 'green' && styles.cardGreen,
      variant === 'cream' && styles.cardCream,
      { padding },
      style,
    ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, ...SHADOW.sm },
  cardGreen: { backgroundColor: COLORS.bgGreen, borderColor: COLORS.bgGreen },
  cardCream: { backgroundColor: COLORS.bgCardAlt, borderColor: COLORS.border },
});
