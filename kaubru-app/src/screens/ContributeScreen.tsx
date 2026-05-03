import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import InputField from '../components/InputField';
import PrimaryButton from '../components/PrimaryButton';
import { contributionsAPI } from '../services/api';
import { COLORS, SPACING, RADIUS, SHADOW } from '../config/theme';

export default function ContributeScreen() {
  const [english, setEnglish] = useState('');
  const [kaubru, setKaubru] = useState('');
  const [loading, setLoading] = useState(false);
  const [submittedCount, setSubmittedCount] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const res = await contributionsAPI.my();
        setSubmittedCount(res.data.length || 0);
      } catch (e) {}
    })();
  }, []);

  const handleSubmit = async () => {
    if (!english.trim() || !kaubru.trim()) {
      Alert.alert('Required', 'Please fill in both fields.');
      return;
    }

    setLoading(true);
    try {
      await contributionsAPI.submit({ english: english.trim(), kaubru: kaubru.trim(), category: 'general' });
      Alert.alert('🎉 Success', 'Contribution submitted for review.');
      setEnglish(''); setKaubru('');
      setSubmittedCount(prev => prev + 1);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.detail || 'Submission failed.');
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <View style={styles.container}>
        <Header />

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Contribute</Text>
          <Text style={styles.subtitle}>
            Help us preserve the KauBru language with new translations.
          </Text>

          {/* Form card */}
          <View style={styles.formCard}>
            <InputField
              label="English Word"
              placeholder="e.g. Tree"
              value={english}
              onChangeText={setEnglish}
            />
            <InputField
              label="KauBru Translation"
              placeholder="e.g. Mphang"
              value={kaubru}
              onChangeText={setKaubru}
            />

            <PrimaryButton
              title="Submit Contribution"
              onPress={handleSubmit}
              loading={loading}
              icon="➤"
              style={styles.submitBtn}
            />

            <View style={styles.reviewNote}>
              <Ionicons name="checkmark-circle-outline" size={16} color={COLORS.primary} />
              <Text style={styles.reviewText}>Verified by the KauBru Council.</Text>
            </View>
          </View>

          {/* Impact stats */}
          <View style={styles.impactCard}>
            <Text style={styles.impactTitle}>Your Stats</Text>
            <View style={styles.impactStat}>
              <Text style={styles.impactNum}>{submittedCount}</Text>
              <Text style={styles.impactLabel}>SUBMISSIONS</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { paddingHorizontal: SPACING.lg, paddingBottom: 100 },
  title: { fontSize: 28, fontWeight: '900', color: COLORS.textPrimary, marginBottom: SPACING.xs, fontFamily: 'Georgia' },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginBottom: SPACING.xl, fontWeight: '500' },

  formCard: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.xl,
    borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING.xl, marginBottom: SPACING.xl, ...SHADOW.md,
  },
  submitBtn: { marginVertical: SPACING.md },
  reviewNote: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: SPACING.sm },
  reviewText: { fontSize: 12, color: COLORS.textMuted, fontWeight: '500' },

  impactCard: {
    backgroundColor: COLORS.bgCardAlt, borderRadius: RADIUS.xl,
    padding: SPACING.xl, ...SHADOW.sm,
    borderWidth: 1, borderColor: COLORS.border,
  },
  impactTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary, marginBottom: SPACING.md },
  impactStat: { alignItems: 'center' },
  impactNum: { fontSize: 48, fontWeight: '900', color: COLORS.primary, letterSpacing: -1 },
  impactLabel: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 2, marginTop: 4 },
});
