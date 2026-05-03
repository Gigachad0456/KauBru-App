import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, View } from 'react-native';
import { COLORS, RADIUS, SPACING, SHADOW } from '../config/theme';

interface Props {
  title: string; onPress: () => void; loading?: boolean;
  disabled?: boolean; style?: ViewStyle; variant?: 'primary' | 'outline' | 'gold'; icon?: string;
}

export default function PrimaryButton({ title, onPress, loading = false, disabled = false, style, variant = 'primary', icon }: Props) {
  if (variant === 'outline') {
    return (
      <TouchableOpacity onPress={onPress} disabled={disabled || loading} style={[styles.outline, style]} activeOpacity={0.75}>
        <Text style={styles.outlineText}>{title}</Text>
      </TouchableOpacity>
    );
  }
  if (variant === 'gold') {
    return (
      <TouchableOpacity onPress={onPress} disabled={disabled || loading} style={[styles.goldBtn, style]} activeOpacity={0.8}>
        {loading ? <ActivityIndicator color={COLORS.primary} /> : <Text style={styles.goldText}>{title}</Text>}
      </TouchableOpacity>
    );
  }
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled || loading} activeOpacity={0.8} style={[styles.primary, (disabled || loading) && styles.disabled, style]}>
      {loading ? <ActivityIndicator color={COLORS.white} /> : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={styles.primaryText}>{title}</Text>
          {icon && <Text style={{ fontSize: 16 }}>{icon}</Text>}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  primary: { backgroundColor: COLORS.primary, borderRadius: RADIUS.full, paddingVertical: SPACING.md, paddingHorizontal: SPACING.xl, alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.5 },
  primaryText: { color: COLORS.white, fontSize: 15, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  outline: { borderRadius: RADIUS.full, borderWidth: 1.5, borderColor: COLORS.border, paddingVertical: SPACING.md, paddingHorizontal: SPACING.xl, alignItems: 'center', backgroundColor: COLORS.bgCard },
  outlineText: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '600' },
  goldBtn: { backgroundColor: COLORS.gold, borderRadius: RADIUS.full, paddingVertical: SPACING.sm + 4, paddingHorizontal: SPACING.lg, alignItems: 'center' },
  goldText: { color: COLORS.primary, fontSize: 14, fontWeight: '700', letterSpacing: 0.5 },
});
