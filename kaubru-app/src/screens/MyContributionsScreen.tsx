import Header from '../components/Header';
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { contributionsAPI } from '../services/api';
import { COLORS, SPACING, RADIUS, SHADOW } from '../config/theme';

interface Contribution {
  id: number;
  english: string;
  kaubru: string;
  meaning?: string;
  category: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'approved': return '#22C55E';
    case 'rejected': return '#EF4444';
    case 'pending':
    default:         return '#F59E0B';
  }
}

export default function MyContributionsScreen({ navigation }: any) {
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await contributionsAPI.my();
      setContributions(res.data);
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to load contributions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      const res = await contributionsAPI.my();
      setContributions(res.data);
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to refresh.');
    } finally {
      setRefreshing(false);
    }
  }, []);

  const total = contributions.length;
  const approved = contributions.filter(c => c.status === 'approved').length;
  const pending = contributions.filter(c => c.status === 'pending').length;

  const renderItem = ({ item }: { item: Contribution }) => {
    const statusColor = getStatusColor(item.status);
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardWords}>
            <Text style={styles.cardEnglish}>{item.english}</Text>
            <Text style={styles.cardKaubru}>{item.kaubru}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20', borderColor: statusColor }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>
        <Text style={styles.cardCategory}>{item.category?.toUpperCase()}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header title="My Contributions" showBack={true} />

      {/* Summary counts */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNum}>{total}</Text>
          <Text style={styles.summaryLabel}>TOTAL</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={[styles.summaryNum, { color: '#22C55E' }]}>{approved}</Text>
          <Text style={styles.summaryLabel}>APPROVED</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={[styles.summaryNum, { color: '#F59E0B' }]}>{pending}</Text>
          <Text style={styles.summaryLabel}>PENDING</Text>
        </View>
      </View>

      {loading && !refreshing && (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: SPACING.xl }} />
      )}

      {error && !loading && (
        <View style={styles.errorCard}>
          <Ionicons name="alert-circle-outline" size={32} color={COLORS.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            onPress={load}
            style={styles.retryBtn}
            accessibilityRole="button"
            accessibilityLabel="Retry loading contributions"
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && !error && (
        <FlatList
          data={contributions}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="pencil-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>No contributions yet</Text>
              <Text style={styles.emptyText}>
                Head to the Contribute tab to submit your first word.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.lg, paddingTop: SPACING.xxl, paddingBottom: SPACING.md,
    gap: SPACING.md,
  },
  backBtn: { padding: SPACING.xs },
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary },
  summaryRow: {
    flexDirection: 'row', gap: SPACING.sm,
    paddingHorizontal: SPACING.lg, marginBottom: SPACING.md,
  },
  summaryCard: {
    flex: 1, backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING.md, alignItems: 'center', ...SHADOW.sm,
  },
  summaryNum: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary },
  summaryLabel: { fontSize: 10, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 0.5, marginTop: 2 },
  list: { paddingHorizontal: SPACING.lg, paddingBottom: 100 },
  card: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING.md, marginBottom: SPACING.sm, ...SHADOW.sm,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  cardWords: { flex: 1, marginRight: SPACING.md },
  cardEnglish: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 2, fontFamily: 'Georgia' },
  cardKaubru: { fontSize: 14, color: COLORS.primary, fontWeight: '600', marginBottom: 4 },
  cardCategory: { fontSize: 10, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 1 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: RADIUS.full, borderWidth: 1,
    paddingHorizontal: SPACING.sm, paddingVertical: 3,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '700' },
  errorCard: {
    alignItems: 'center', padding: SPACING.xl,
    marginHorizontal: SPACING.lg,
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border, marginTop: SPACING.md,
  },
  errorText: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.md, marginBottom: SPACING.md },
  retryBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.xl, paddingVertical: SPACING.sm,
  },
  retryText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
  emptyState: {
    alignItems: 'center', padding: SPACING.xl, marginTop: SPACING.xl,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginTop: SPACING.md, marginBottom: SPACING.sm },
  emptyText: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22 },
});





