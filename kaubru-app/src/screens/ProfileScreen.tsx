import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Image, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { dictionaryAPI, contributionsAPI } from '../services/api';
import { COLORS, SPACING, RADIUS, SHADOW } from '../config/theme';
import { API_BASE_URL } from '../config/api';

function fullUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${API_BASE_URL}${path}`;
}

export default function ProfileScreen({ navigation }: any) {
  const { user, logout } = useAuth();
  const [savedCount, setSavedCount] = useState(0);
  const [contribCount, setContribCount] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const [saved, contribs] = await Promise.all([dictionaryAPI.saved(), contributionsAPI.my()]);
        setSavedCount(saved.data.length);
        setContribCount(contribs.data.length);
      } catch {}
    })();
  }, []);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  const avatarUrl = fullUrl(user?.avatar_url);

  const STATS = [
    { icon: 'bookmark-outline' as const, value: savedCount, label: 'Saved', onPress: () => navigation.navigate('SavedWords') },
    { icon: 'pencil-outline' as const, value: contribCount, label: 'Contributed', onPress: () => navigation.navigate('MyContributions') },
    { icon: 'trophy-outline' as const, value: user?.points ?? 0, label: 'Points', onPress: () => {} },
  ];

  const MENU_SECTIONS = [
    {
      title: 'Account',
      items: [
        { icon: 'person-outline' as const, label: 'Edit Profile', onPress: () => navigation.navigate('EditProfile'), color: COLORS.primary },
        { icon: 'bookmark-outline' as const, label: 'Saved Words', onPress: () => navigation.navigate('SavedWords'), color: COLORS.primary },
        { icon: 'pencil-outline' as const, label: 'My Contributions', onPress: () => navigation.navigate('MyContributions'), color: COLORS.primary },
      ],
    },
    {
      title: 'Preferences',
      items: [
        { icon: 'notifications-outline' as const, label: 'Notifications', onPress: () => Alert.alert('Coming Soon', 'Notification settings coming soon.'), color: COLORS.primary },
        { icon: 'help-circle-outline' as const, label: 'Help & Support', onPress: () => Alert.alert('Support', 'Contact us at support@kaubru.app'), color: COLORS.primary },
      ],
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Hero header ───────────────────────────────────────────────── */}
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryLight] as const}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          {/* Settings button */}
          <TouchableOpacity style={styles.settingsBtn}>
            <Ionicons name="settings-outline" size={20} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>

          {/* Avatar */}
          <View style={styles.avatarWrapper}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            )}
            {user?.is_premium && (
              <View style={styles.premiumBadge}>
                <Ionicons name="star" size={10} color={COLORS.primary} />
              </View>
            )}
          </View>

          <Text style={styles.heroName}>{user?.name || 'User'}</Text>
          <Text style={styles.heroEmail}>{user?.email}</Text>

          {user?.is_premium && (
            <View style={styles.premiumTag}>
              <Ionicons name="star" size={12} color={COLORS.gold} />
              <Text style={styles.premiumTagText}>Premium Member</Text>
            </View>
          )}
        </LinearGradient>

        {/* ── Stats row ─────────────────────────────────────────────────── */}
        <View style={styles.statsRow}>
          {STATS.map((s, i) => (
            <TouchableOpacity key={s.label} style={styles.statCard} onPress={s.onPress}>
              <Ionicons name={s.icon} size={20} color={COLORS.primary} style={{ marginBottom: 6 }} />
              <Text style={styles.statNum}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Menu sections ─────────────────────────────────────────────── */}
        {MENU_SECTIONS.map(section => (
          <View key={section.title} style={styles.menuSection}>
            <Text style={styles.menuSectionTitle}>{section.title}</Text>
            <View style={styles.menuCard}>
              {section.items.map((item, idx) => (
                <TouchableOpacity
                  key={item.label}
                  onPress={item.onPress}
                  style={[styles.menuItem, idx < section.items.length - 1 && styles.menuItemBorder]}
                  accessibilityRole="button"
                >
                  <View style={[styles.menuIconWrap, { backgroundColor: COLORS.bgGreenLight }]}>
                    <Ionicons name={item.icon} size={18} color={item.color} />
                  </View>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* ── Sign out ──────────────────────────────────────────────────── */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color={COLORS.error} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>KauBru AI Translator v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { paddingBottom: 120 },

  hero: {
    paddingTop: SPACING.xxl + SPACING.lg,
    paddingBottom: SPACING.xxl,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    borderBottomLeftRadius: RADIUS.xxl,
    borderBottomRightRadius: RADIUS.xxl,
    marginBottom: -SPACING.xl,
  },
  settingsBtn: {
    position: 'absolute', top: SPACING.xxl, right: SPACING.lg,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarWrapper: { position: 'relative', marginBottom: SPACING.md },
  avatar: {
    width: 88, height: 88, borderRadius: 44,
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarFallback: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarText: { fontSize: 32, fontWeight: '800', color: COLORS.white },
  premiumBadge: {
    position: 'absolute', bottom: 2, right: 2,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: COLORS.gold,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: COLORS.white,
  },
  heroName: { fontSize: 22, fontWeight: '800', color: COLORS.white, marginBottom: 4 },
  heroEmail: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: SPACING.sm },
  premiumTag: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(201,168,76,0.2)',
    borderRadius: RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical: 5,
    borderWidth: 1, borderColor: 'rgba(201,168,76,0.4)',
  },
  premiumTagText: { fontSize: 12, fontWeight: '700', color: COLORS.gold },

  statsRow: {
    flexDirection: 'row', gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xxl + SPACING.sm,
    marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1, backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl, padding: SPACING.md,
    alignItems: 'center', borderWidth: 1, borderColor: COLORS.border,
    ...SHADOW.md,
  },
  statNum: { fontSize: 22, fontWeight: '900', color: COLORS.textPrimary, marginBottom: 2 },
  statLabel: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted },

  menuSection: { paddingHorizontal: SPACING.lg, marginBottom: SPACING.md },
  menuSectionTitle: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: SPACING.sm, marginLeft: SPACING.xs },
  menuCard: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.xl,
    borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden', ...SHADOW.sm,
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingVertical: SPACING.md + 2 },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.bg },
  menuIconWrap: { width: 36, height: 36, borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md },
  menuLabel: { flex: 1, fontSize: 15, color: COLORS.textPrimary, fontWeight: '500' },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.sm, marginHorizontal: SPACING.lg,
    paddingVertical: SPACING.md, borderRadius: RADIUS.full,
    backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA',
    marginBottom: SPACING.md,
  },
  logoutText: { fontSize: 14, fontWeight: '700', color: COLORS.error },
  version: { textAlign: 'center', fontSize: 11, color: COLORS.textMuted, marginBottom: SPACING.md },
});
