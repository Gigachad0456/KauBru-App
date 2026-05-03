import Header from '../components/Header';
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { premiumAPI } from '../services/api';
import { COLORS, SPACING, RADIUS, SHADOW } from '../config/theme';

interface Plan {
  id: string; name: string; price: string;
  period: string; is_best_value: boolean; benefits: string[];
}

export default function PremiumScreen({ navigation }: any) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string>('annual');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try { const res = await premiumAPI.plans(); setPlans(res.data); }
      catch {} finally { setLoading(false); }
    })();
  }, []);

  const handleSubscribe = () => {
    Alert.alert('Coming Soon', 'Payment integration will be available in the next release.');
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Header title="Premium Plans" subtitle="Unlock the full KauBru experience" showBack={true} />

        {/* Hero */}
        <View style={styles.hero}>
          <MaterialCommunityIcons name="star-circle" size={52} color={COLORS.gold} style={{ marginBottom: SPACING.sm }} />
          <Text style={styles.heroTitle}>Go Premium</Text>
          <Text style={styles.heroDesc}>
            Support language preservation while unlocking exclusive features.
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: SPACING.xl }} />
        ) : (
          plans.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              onPress={() => setSelected(plan.id)}
              activeOpacity={0.85}
            >
              <View style={[
                styles.planCard,
                selected === plan.id && styles.planCardSelected,
                plan.is_best_value && styles.planCardBest,
              ]}>
                {plan.is_best_value && (
                  <View style={styles.bestBadge}>
                    <Ionicons name="trophy" size={11} color={COLORS.primary} />
                    <Text style={styles.bestText}>Best Value</Text>
                  </View>
                )}
                <View style={styles.planHeader}>
                  <View>
                    <Text style={styles.planName}>{plan.name}</Text>
                    <View style={styles.priceRow}>
                      <Text style={styles.planPrice}>{plan.price}</Text>
                      <Text style={styles.planPeriod}>/{plan.period}</Text>
                    </View>
                  </View>
                  <View style={[styles.radio, selected === plan.id && styles.radioSelected]}>
                    {selected === plan.id && <View style={styles.radioDot} />}
                  </View>
                </View>
                <View style={styles.benefitsList}>
                  {plan.benefits.map((b) => (
                    <View key={b} style={styles.benefitRow}>
                      <Ionicons name="checkmark" size={14} color={COLORS.success} />
                      <Text style={styles.benefitText}>{b}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}

        {/* CTA */}
        <TouchableOpacity onPress={handleSubscribe} activeOpacity={0.85} style={styles.ctaBtn}>
          <Text style={styles.ctaText}>Subscribe Now</Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          Cancel anytime. Supports KauBru language preservation.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.xxl, paddingBottom: 100 },
  header: { marginBottom: SPACING.lg },
  backBtn: { marginBottom: SPACING.md, alignSelf: 'flex-start' },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.textPrimary, fontFamily: 'Georgia' },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  hero: {
    backgroundColor: COLORS.bgGreen, borderRadius: RADIUS.lg,
    padding: SPACING.xl, alignItems: 'center', marginBottom: SPACING.lg,
  },
  heroTitle: { fontSize: 22, fontWeight: '800', color: COLORS.white, marginBottom: 6 },
  heroDesc: { color: 'rgba(255,255,255,0.75)', fontSize: 13, textAlign: 'center', lineHeight: 20 },
  planCard: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    borderWidth: 1.5, borderColor: COLORS.border,
    padding: SPACING.lg, marginBottom: SPACING.md, ...SHADOW.sm,
  },
  planCardSelected: { borderColor: COLORS.primary },
  planCardBest: { borderColor: COLORS.gold },
  bestBadge: {
    position: 'absolute', top: -12, right: SPACING.md,
    backgroundColor: COLORS.gold, borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm, paddingVertical: 3,
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  bestText: { color: COLORS.primary, fontSize: 11, fontWeight: '800' },
  planHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: SPACING.md,
  },
  planName: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  planPrice: { fontSize: 28, fontWeight: '800', color: COLORS.primary },
  planPeriod: { fontSize: 13, color: COLORS.textMuted },
  radio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
  },
  radioSelected: { borderColor: COLORS.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary },
  benefitsList: { gap: SPACING.xs },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  benefitText: { color: COLORS.textSecondary, fontSize: 13 },
  ctaBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.full,
    paddingVertical: SPACING.md + 2, alignItems: 'center', marginTop: SPACING.sm,
  },
  ctaText: { color: COLORS.white, fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
  disclaimer: { color: COLORS.textMuted, fontSize: 11, textAlign: 'center', marginTop: SPACING.md },
});
