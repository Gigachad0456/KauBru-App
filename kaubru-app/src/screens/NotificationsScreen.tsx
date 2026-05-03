import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import { notificationsAPI } from '../services/api';
import { COLORS, SPACING, RADIUS, SHADOW } from '../config/theme';
import { timeAgo } from '../utils/date';

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const res = await notificationsAPI.get();
      setNotifications(res.data);
    } catch (e) {
      console.log('Error loading notifications', e);
    } finally {
      setLoading(false);
    }
  };

  const markRead = async (id: number) => {
    try {
      await notificationsAPI.markRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (e) {}
  };

  const renderNotification = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={[styles.notifCard, !item.is_read && styles.unreadCard]} 
      onPress={() => markRead(item.id)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconBox, { backgroundColor: item.type === 'success' ? '#E8F5E9' : '#FFF3E0' }]}>
        <Ionicons 
          name={item.type === 'success' ? 'checkmark-circle' : 'information-circle'} 
          size={24} 
          color={item.type === 'success' ? COLORS.primary : COLORS.warning} 
        />
      </View>
      <View style={styles.notifContent}>
        <Text style={[styles.notifTitle, !item.is_read && styles.boldText]}>{item.title}</Text>
        <Text style={styles.notifMessage}>{item.message}</Text>
        <Text style={styles.notifTime}>
          {timeAgo(item.created_at)}
        </Text>
      </View>
      {!item.is_read && <View style={styles.dot} />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Header title="Notifications" showBack />
      
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 100 }} />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item.id.toString()}
          renderItem={renderNotification}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="notifications-off-outline" size={64} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No notifications yet</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  list: { padding: SPACING.lg },
  notifCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    ...SHADOW.sm,
  },
  unreadCard: {
    borderColor: COLORS.primaryLight,
    backgroundColor: '#F1F8E9',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  notifContent: { flex: 1 },
  notifTitle: { fontSize: 16, color: COLORS.textPrimary, marginBottom: 2 },
  boldText: { fontWeight: '700' },
  notifMessage: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 },
  notifTime: { fontSize: 11, color: COLORS.textMuted, marginTop: 4, fontWeight: '500' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary, marginLeft: 8 },
  empty: { alignItems: 'center', marginTop: 100 },
  emptyText: { fontSize: 16, color: COLORS.textMuted, marginTop: SPACING.md, fontWeight: '600' },
});
