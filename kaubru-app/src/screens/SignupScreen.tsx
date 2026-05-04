import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import InputField from '../components/InputField';
import PrimaryButton from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';
import { COLORS, SPACING, RADIUS, SHADOW } from '../config/theme';

type Props = { navigation: NativeStackNavigationProp<any> };

export default function SignupScreen({ navigation }: Props) {
  const { signup } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      await signup(name.trim(), email.trim(), password);
    } catch (err: any) {
      Alert.alert('Signup Error', err?.response?.data?.detail || 'Signup failed.');
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.flex}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        automaticallyAdjustKeyboardInsets={true}
      >
        {/* Logo */}
        <View style={styles.logoRow}>
          <MaterialCommunityIcons name="translate" size={22} color={COLORS.primary} />
          <Text style={styles.logoText}>KauBru</Text>
        </View>

        {/* Heading */}
        <Text style={styles.heading}>Create Account</Text>
        <Text style={styles.subheading}>
          Join the KauBru language community and help preserve a heritage.
        </Text>

        {/* Tab switcher */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={styles.tabBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.tabText}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabBtn, styles.tabBtnActive]}>
            <Text style={styles.tabTextActive}>Sign Up</Text>
          </TouchableOpacity>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <InputField
            label="Full Name"
            placeholder="Your full name"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
          <InputField
            label="Email Address"
            placeholder="name@company.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <InputField
            label="Password"
            placeholder="Min. 6 characters"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <PrimaryButton
            title="Create Account"
            onPress={handleSignup}
            loading={loading}
            style={styles.signInBtn}
          />
        </View>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR SIGN UP WITH</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Social buttons — Google only per user request */}
        <View style={styles.socialRow}>
          <TouchableOpacity
            style={styles.socialBtn}
            onPress={() => Alert.alert('Google Auth', 'Use the Login tab to sign in with Google.')}
          >
            <MaterialCommunityIcons name="google" size={18} color="#DB4437" />
            <Text style={styles.socialText}>Continue with Google</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.terms}>
          By continuing, you agree to KauBru's{' '}
          <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
          <Text style={styles.termsLink}>Privacy Policy</Text>.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.bgCard },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xxl + 8,
    paddingBottom: SPACING.xxl,
    backgroundColor: COLORS.bgCard,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: SPACING.xl },
  logoText: { fontSize: 20, fontWeight: '700', color: COLORS.primary },
  heading: {
    fontSize: 32, fontWeight: '800', color: COLORS.textPrimary,
    marginBottom: SPACING.sm, fontFamily: 'Georgia',
  },
  subheading: {
    fontSize: 14, color: COLORS.textSecondary, lineHeight: 22, marginBottom: SPACING.xl,
  },
  tabRow: {
    flexDirection: 'row', backgroundColor: COLORS.bgCardAlt,
    borderRadius: RADIUS.full, padding: 4, marginBottom: SPACING.xl,
  },
  tabBtn: { flex: 1, paddingVertical: SPACING.sm + 2, alignItems: 'center', borderRadius: RADIUS.full },
  tabBtnActive: { backgroundColor: COLORS.bgCard, ...SHADOW.sm },
  tabText: { fontSize: 14, fontWeight: '600', color: COLORS.textMuted },
  tabTextActive: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  form: { gap: 0 },
  signInBtn: { marginTop: SPACING.sm, marginBottom: SPACING.lg },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.lg },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { fontSize: 11, color: COLORS.textMuted, letterSpacing: 0.5 },
  socialRow: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.xl },
  socialBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: SPACING.md,
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.md, backgroundColor: COLORS.bgCard,
  },
  socialText: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  terms: { fontSize: 11, color: COLORS.textMuted, textAlign: 'center', lineHeight: 18 },
  termsLink: { color: COLORS.textPrimary, fontWeight: '600' },
});
