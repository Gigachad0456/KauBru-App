import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../config/theme';

type Props = { navigation: NativeStackNavigationProp<any> };

export default function TermsScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Legal</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.sectionTitle}>Terms and Conditions</Text>
        <Text style={styles.text}>
          Welcome to KauBru! These terms and conditions outline the rules and regulations for the use of the KauBru App.
        </Text>
        <Text style={styles.text}>
          By accessing this app, we assume you accept these terms and conditions. Do not continue to use KauBru if you do not agree to take all of the terms and conditions stated on this page.
        </Text>

        <Text style={styles.sectionTitle}>Privacy Policy</Text>
        <Text style={styles.text}>
          Your privacy is important to us. It is KauBru's policy to respect your privacy regarding any information we may collect from you across our application.
        </Text>
        <Text style={styles.text}>
          We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent. We also let you know why we're collecting it and how it will be used.
        </Text>
        <Text style={styles.text}>
          We don't share any personally identifying information publicly or with third-parties, except when required to by law.
        </Text>
        
        <Text style={styles.sectionTitle}>User Content</Text>
        <Text style={styles.text}>
          Our Service allows you to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material. You are responsible for the Content that you post to the Service, including its legality, reliability, and appropriateness.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: 60,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 40, height: 40,
    borderRadius: RADIUS.full,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.bgCardAlt,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  scroll: { padding: SPACING.lg },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
    fontFamily: 'Georgia',
  },
  text: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 24,
    marginBottom: SPACING.md,
  },
});
