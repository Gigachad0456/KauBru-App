import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Linking,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { jobsAPI } from '../services/api';
import { COLORS, SPACING, FONTS, SHADOW } from '../config/theme';

export default function JobsScreen() {
  const insets = useSafeAreaInsets();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  
  const [qualifications, setQualifications] = useState<string[]>([]);
  const [selectedQual, setSelectedQual] = useState('All');
  
  const [sort, setSort] = useState('latest');
  const [showFilterModal, setShowFilterModal] = useState(false);

  const loadJobs = useCallback(async () => {
    try {
      const res = await jobsAPI.getAll({
        search,
        qualification: selectedQual === 'All' ? undefined : selectedQual,
        sort,
      });
      setJobs(res.data);
    } catch (e) {
      console.log('Jobs error', e);
    }
  }, [search, selectedQual, sort]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const qRes = await jobsAPI.getQualifications();
      setQualifications(['All', ...qRes.data]);
      await loadJobs();
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  }, [loadJobs]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadJobs();
    setRefreshing(false);
  };

  const renderJobCard = ({ item }: { item: any }) => {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <View style={[styles.badge, item.is_open ? styles.badgeOpen : styles.badgeClosed]}>
              <Text style={styles.badgeText}>{item.job_status}</Text>
            </View>
          </View>
          <Text style={styles.orgText}>{item.organization} • {item.location}</Text>
          <Text style={styles.typeText}>{item.job_type}</Text>
        </View>

        <View style={styles.cardBody}>
          {item.qualification_tags?.length > 0 && (
            <View style={styles.row}>
              <Ionicons name="school-outline" size={16} color={COLORS.textSecondary} />
              <Text style={styles.detailText}>{item.qualification_tags.join(', ')}</Text>
            </View>
          )}
          {item.last_date && (
            <View style={styles.row}>
              <Ionicons name="calendar-outline" size={16} color={COLORS.textSecondary} />
              <Text style={styles.detailText}>Last Date: {item.last_date}</Text>
            </View>
          )}
        </View>

        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={styles.sourceBtn}
            onPress={() => Linking.openURL(item.source_link)}
          >
            <Text style={styles.sourceBtnText}>Official Notice</Text>
          </TouchableOpacity>
          
          {item.apply_link && item.is_open && (
            <TouchableOpacity
              style={styles.applyBtn}
              onPress={() => Linking.openURL(item.apply_link)}
            >
              <Text style={styles.applyBtnText}>Apply Now</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tripura Jobs</Text>
        <Text style={styles.headerSub}>Govt & Private Job Notices</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color={COLORS.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search jobs..."
            placeholderTextColor={COLORS.textTertiary}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={loadJobs}
          />
        </View>
        <TouchableOpacity style={styles.filterBtn} onPress={() => setShowFilterModal(true)}>
          <Ionicons name="options-outline" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderJobCard}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No jobs found matching your criteria.</Text>
          }
          ListFooterComponent={
            jobs.length > 0 ? (
              <Text style={styles.disclaimerText}>
                Please verify all details from the official website before applying.
              </Text>
            ) : null
          }
        />
      )}

      {/* Filter Modal */}
      <Modal visible={showFilterModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + SPACING.lg }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters & Sorting</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Sort By</Text>
            <View style={styles.chipRow}>
              {[
                { label: 'Latest', val: 'latest' },
                { label: 'Closing Soon', val: 'closing' },
                { label: 'Qualification', val: 'qualification' },
              ].map((s) => (
                <TouchableOpacity
                  key={s.val}
                  style={[styles.chip, sort === s.val && styles.chipActive]}
                  onPress={() => setSort(s.val)}
                >
                  <Text style={[styles.chipText, sort === s.val && styles.chipTextActive]}>
                    {s.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.sectionTitle, { marginTop: SPACING.lg }]}>Qualification</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
              <View style={styles.chipRowWrap}>
                {qualifications.map((q) => (
                  <TouchableOpacity
                    key={q}
                    style={[styles.chip, selectedQual === q && styles.chipActive]}
                    onPress={() => setSelectedQual(q)}
                  >
                    <Text style={[styles.chipText, selectedQual === q && styles.chipTextActive]}>
                      {q}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.applyFilterBtn}
              onPress={() => {
                setShowFilterModal(false);
                loadJobs();
              }}
            >
              <Text style={styles.applyFilterBtnText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { padding: SPACING.lg, paddingBottom: SPACING.md },
  headerTitle: { fontSize: 28, fontFamily: FONTS.bold, color: COLORS.text },
  headerSub: { fontSize: 14, fontFamily: FONTS.medium, color: COLORS.textSecondary },
  
  searchContainer: { flexDirection: 'row', paddingHorizontal: SPACING.lg, marginBottom: SPACING.md, gap: SPACING.sm },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white, borderRadius: 12, paddingHorizontal: SPACING.md,
    height: 48, ...SHADOW.sm,
  },
  searchInput: { flex: 1, marginLeft: SPACING.sm, fontFamily: FONTS.medium, color: COLORS.text, fontSize: 16 },
  filterBtn: { width: 48, height: 48, backgroundColor: COLORS.white, borderRadius: 12, alignItems: 'center', justifyContent: 'center', ...SHADOW.sm },

  listContent: { padding: SPACING.lg, paddingBottom: 100 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { textAlign: 'center', color: COLORS.textSecondary, fontFamily: FONTS.medium, marginTop: SPACING.xl },
  disclaimerText: { textAlign: 'center', color: COLORS.textTertiary, fontFamily: FONTS.regular, fontSize: 12, marginTop: SPACING.xl, paddingHorizontal: SPACING.md },

  card: { backgroundColor: COLORS.white, borderRadius: 16, padding: SPACING.lg, marginBottom: SPACING.md, ...SHADOW.md },
  cardHeader: { marginBottom: SPACING.md },
  cardTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  cardTitle: { flex: 1, fontSize: 18, fontFamily: FONTS.bold, color: COLORS.text, marginRight: SPACING.sm },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeOpen: { backgroundColor: 'rgba(34, 197, 94, 0.1)' },
  badgeClosed: { backgroundColor: 'rgba(239, 68, 68, 0.1)' },
  badgeText: { fontSize: 12, fontFamily: FONTS.bold, color: COLORS.text },
  orgText: { fontSize: 14, fontFamily: FONTS.medium, color: COLORS.textSecondary },
  typeText: { fontSize: 12, fontFamily: FONTS.bold, color: COLORS.primary, marginTop: 4 },

  cardBody: { gap: 6, marginBottom: SPACING.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { fontSize: 14, fontFamily: FONTS.medium, color: COLORS.textSecondary },

  cardFooter: { flexDirection: 'row', gap: SPACING.sm },
  sourceBtn: { flex: 1, height: 40, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  sourceBtnText: { color: COLORS.textSecondary, fontFamily: FONTS.bold, fontSize: 14 },
  applyBtn: { flex: 1, height: 40, borderRadius: 8, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  applyBtnText: { color: COLORS.white, fontFamily: FONTS.bold, fontSize: 14 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SPACING.xl },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xl },
  modalTitle: { fontSize: 20, fontFamily: FONTS.bold, color: COLORS.text },
  sectionTitle: { fontSize: 16, fontFamily: FONTS.bold, color: COLORS.text, marginBottom: SPACING.sm },
  
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  chipRowWrap: { flexDirection: 'row', gap: SPACING.sm },
  chip: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: 20, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontFamily: FONTS.medium, color: COLORS.textSecondary },
  chipTextActive: { color: COLORS.white },

  applyFilterBtn: { marginTop: SPACING.xl, height: 50, borderRadius: 12, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  applyFilterBtnText: { color: COLORS.white, fontFamily: FONTS.bold, fontSize: 16 },
});
