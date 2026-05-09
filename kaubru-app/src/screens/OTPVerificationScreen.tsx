import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import PrimaryButton from '../components/PrimaryButton';
import { COLORS, SPACING, RADIUS, SHADOW } from '../config/theme';

export default function OTPVerificationScreen() {
  const { user, verifyOtp, resendOtp } = useAuth();

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [resendSuccess, setResendSuccess] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [expired, setExpired] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start countdown timer on mount
  useEffect(() => {
    startTimer();
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const startTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setSecondsLeft(60);
    setExpired(false);

    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const formatTime = (secs: number): string => {
    const mm = String(Math.floor(secs / 60)).padStart(2, '0');
    const ss = String(secs % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  };

  const handleVerify = async () => {
    if (otp.length < 6 || expired) return;
    setLoading(true);
    setErrorMsg('');
    try {
      await verifyOtp(otp);
      // Navigation handled automatically by AppNavigator when pendingVerification becomes false
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setErrorMsg(
        typeof detail === 'string'
          ? detail
          : 'Verification failed. Please try again.'
      );
      // Do NOT clear otp state on error
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (secondsLeft > 0 && !expired) return;
    setResendLoading(true);
    setErrorMsg('');
    setResendSuccess(false);
    try {
      await resendOtp();
      setResendSuccess(true);
      startTimer();
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setErrorMsg(
        typeof detail === 'string' ? detail : 'Failed to resend OTP. Please try again.'
      );
    } finally {
      setResendLoading(false);
    }
  };

  const isResendDisabled = secondsLeft > 0 && !expired;
  const isVerifyDisabled = otp.length < 6 || expired;

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
        {/* Logo row */}
        <View style={styles.logoRow}>
          <MaterialCommunityIcons name="translate" size={22} color={COLORS.primary} />
          <Text style={styles.logoText}>KauBru</Text>
        </View>

        {/* Heading */}
        <Text style={styles.heading}>Verify Your Email</Text>

        {/* Sub-heading */}
        <Text style={styles.subheading}>
          Enter the 6-digit code sent to {user?.email ?? 'your email'}
        </Text>

        {/* OTP Input */}
        <View style={styles.otpCard}>
          <TextInput
            style={styles.otpInput}
            value={otp}
            onChangeText={(text) => {
              setOtp(text.replace(/[^0-9]/g, ''));
              if (errorMsg) setErrorMsg('');
            }}
            keyboardType="number-pad"
            maxLength={6}
            placeholder="000000"
            placeholderTextColor={COLORS.textMuted}
            autoFocus
          />
        </View>

        {/* Inline error message */}
        {errorMsg !== '' && (
          <Text style={styles.errorText}>{errorMsg}</Text>
        )}

        {/* Verify button */}
        <PrimaryButton
          title="Verify"
          onPress={handleVerify}
          loading={loading}
          disabled={isVerifyDisabled}
          style={styles.verifyBtn}
        />

        {/* Countdown timer / expired message */}
        {!expired ? (
          <Text style={styles.timerText}>
            Code expires in {formatTime(secondsLeft)}
          </Text>
        ) : (
          <Text style={styles.expiredText}>
            OTP expired. Please request a new one.
          </Text>
        )}

        {/* Resend OTP link */}
        <TouchableOpacity
          onPress={handleResend}
          disabled={isResendDisabled || resendLoading}
          style={styles.resendRow}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.resendText,
              (isResendDisabled || resendLoading) && styles.resendTextDisabled,
            ]}
          >
            {resendLoading ? 'Sending…' : 'Resend OTP'}
          </Text>
        </TouchableOpacity>

        {/* Resend success message */}
        {resendSuccess && (
          <Text style={styles.successText}>
            OTP resent to {user?.email ?? 'your email'}
          </Text>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: COLORS.bgCard,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xxl + 8,
    paddingBottom: SPACING.xxl,
    backgroundColor: COLORS.bgCard,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: SPACING.xl,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
  },
  heading: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    fontFamily: 'Georgia',
  },
  subheading: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  otpCard: {
    backgroundColor: COLORS.bgCardAlt,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: SPACING.sm,
    ...SHADOW.sm,
  },
  otpInput: {
    fontSize: 36,
    letterSpacing: 8,
    textAlign: 'center',
    color: COLORS.textPrimary,
    fontWeight: '700',
    paddingVertical: SPACING.sm,
  },
  errorText: {
    fontSize: 13,
    color: COLORS.error,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  verifyBtn: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
  timerText: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  expiredText: {
    fontSize: 13,
    color: COLORS.warning,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  resendRow: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  resendText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  resendTextDisabled: {
    color: COLORS.textMuted,
  },
  successText: {
    fontSize: 13,
    color: COLORS.success,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
});
