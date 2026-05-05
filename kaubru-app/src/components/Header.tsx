import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, SHADOW } from '../config/theme';

interface Props {
  title?: string;
  showBack?: boolean;
  showProfile?: boolean;
  showNotifications?: boolean;
  onBack?: () => void;
}

export default function Header({
  title,
  showBack = false,
  showProfile = false,
  showNotifications = false,
  onBack,
}: Props) {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
      <View style={styles.left}>
        {showBack ? (
          <TouchableOpacity
            onPress={onBack ?? (() => navigation.goBack())}
            style={styles.iconBtn}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.logoRow}>
            <MaterialCommunityIcons name="translate" size={18} color={COLORS.primary} />
            <Text style={styles.logoText}>KauBru</Text>
          </View>
        )}
      </View>

      {title ? <Text style={styles.title} numberOfLines={1}>{title}</Text> : null}

      <View style={styles.right}>
        {showNotifications && (
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => navigation.navigate('Notifications')}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
          >
            <Ionicons name="notifications-outline" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}
        {showProfile && (
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => navigation.navigate('Profile')}
            accessibilityRole="button"
            accessibilityLabel="Profile"
          >
            <Ionicons name="person-circle-outline" size={22} color={COLORS.primary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.bg,
  },
  left: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  right: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  logoText: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: -0.3,
  },
  title: {
    flex: 2,
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.sm,
  },
});
