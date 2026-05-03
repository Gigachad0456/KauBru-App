import Header from '../components/Header';
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Image, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
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
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  const avatarUrl = fullUrl(user?.avatar_url);

  const MENU_ITEMS = [
    { icon: 'person-outline' as const,        label: 'Edit Profile',             onPress: () => navigation.navigate('EditProfile') },
    { icon: 'bookmark-outline' as const,      label: 'Saved Words',              onPress: () => navigation.navigate('SavedWords') },
    { icon: 'pencil-outline' as const,        label: 'My Contributions',         onPress: () => navigation.navigate('MyContributions') },
    { icon: 'notifications-outline' as const, label: 'Notification Preferences', onPress: () => Alert.alert('Coming Soon', 'Notification settings will be available soon.') },
    { icon: 'help-circle-outline' as const,   label: 'Help & Support',           onPress: () => Alert.alert('Coming Soon', 'Help center will be available soon.') },
  ];

  return (
    <View style={styles.container}>
      <Header />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            )}
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedIcon}>✓</Text>
            </View>
          </View>
          <Text style={styles.userName}>{user?.name || 'User'}</Text>
          <Text style={styles.userRole}>{user?.is_premium ? 'Premium Member' : 'Community Member'}</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="folder-outline" size={22} color={COLORS.primary} style={{ marginBottom: SPACING.sm }} />
            <Text style={styles.statNum}>{savedCount}</Text>
            <Text style={styles.statLabel}>WORDS SAVED</Text>
          </View>
          <View style={[styles.statCard, styles.statCardGreen]}>
            <MaterialCommunityIcons name="handshake-outline" size={22} color={COLORS.white} style={{ marginBottom: SPACING.sm }} />
            <Text style={[styles.statNum, styles.statNumLight]}>{contribCount}</Text>
            <Text style={[styles.statLabel, styles.statLabelLight]}>CONTRIBUTIONS</Text>
          </View>
        </View>

        {/* Menu */}
        <View style={styles.menuCard}>
          {MENU_ITEMS.map((item, idx) => (
            <TouchableOpacity
              key={item.label}
              onPress={item.onPress}
              style={[styles.menuItem, idx < MENU_ITEMS.length - 1 && styles.menuItemBorder]}
              accessibilityRole="button"
              accessibilityLabel={item.label}
            >
              <Ionicons name={item.icon} size={20} color={COLORS.textSecondary} style={{ marginRight: SPACING.md }} />
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} accessibilityRole="button" accessibilityLabel="Logout">
          <Ionicons name="log-out-outline" size={18} color={COLORS.error} />
          <Text style={styles.logoutText}>LOGOUT</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingTop: SPACING.xxl, paddingBottom: SPACING.sm },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginLeft: 8 },
  scroll: { paddingHorizontal: SPACING.lg, paddingBottom: 100 },
  avatarSection: { alignItems: 'center', marginBottom: SPACING.lg },
  avatarWrapper: { position: 'relative', marginBottom: SPACING.sm },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.bgGreen, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: COLORS.bgCard, ...SHADOW.md },
  avatarImage: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: COLORS.bgCard },
  avatarText: { fontSize: 28, fontWeight: '800', color: COLORS.white },
  verifiedBadge: { position: 'absolute', bottom: 0, right: 0, width: 22, height: 22, borderRadius: 11, backgroundColor: COLORS.gold, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLORS.bgCard },
  verifiedIcon: { fontSize: 10, color: COLORS.primary, fontWeight: '800' },
  userName: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 4 },
  userRole: { fontSize: 13, color: COLORS.textMuted },
  statsGrid: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
  statCard: { flex: 1, backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, ...SHADOW.sm },
  statCardGreen: { backgroundColor: COLORS.bgGreen, borderColor: COLORS.bgGreen },
  statNum: { fontSize: 28, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 4 },
  statNumLight: { color: COLORS.white },
  statLabel: { fontSize: 10, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 0.5 },
  statLabelLight: { color: 'rgba(255,255,255,0.7)' },
  menuCard: { backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.lg, overflow: 'hidden', ...SHADOW.sm },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingVertical: SPACING.md + 2 },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  menuLabel: { flex: 1, fontSize: 15, color: COLORS.textPrimary },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, paddingVertical: SPACING.md, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.full, backgroundColor: COLORS.bgCard },
  logoutText: { fontSize: 13, fontWeight: '700', color: COLORS.error, letterSpacing: 1 },
});
