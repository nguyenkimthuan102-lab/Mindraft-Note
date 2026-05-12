import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AuthCard } from '../../src/components/ui/AuthCard';
import { AuthButton } from '../../src/components/ui/AuthButton';
import { colors } from '../../src/constants/colors';

const OTP_LENGTH = 6;

export default function OtpScreen() {
  const { email, mode } = useLocalSearchParams<{ email: string; mode?: string }>();
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleChange = (text: string, index: number) => {
    // Only accept digits
    const digit = text.replace(/[^0-9]/g, '').slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);

    // Auto advance
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const next = [...otp];
      next[index - 1] = '';
      setOtp(next);
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < OTP_LENGTH) return;
    setLoading(true);
    try {
      // TODO: apiRequest('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ email, code }) })
      if (mode === 'reset') {
        router.push('/(auth)/reset-password');
      } else {
        router.replace('/(main)');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    // TODO: apiRequest('/auth/resend-otp', ...)
    setOtp(Array(OTP_LENGTH).fill(''));
    inputRefs.current[0]?.focus();
  };

  return (
    <AuthCard topLabel="Mindraft Note">
      <Text style={styles.title}>Verify your Email</Text>

      <View style={{ height: 24 }} />

      <Text style={styles.description}>
        A 6-digit code has been sent to your inbox. Enter it below to continue recovering your account
      </Text>

      <View style={{ height: 28 }} />

      {/* OTP Boxes */}
      <View style={styles.otpRow}>
        {Array(OTP_LENGTH).fill(null).map((_, i) => (
          <TextInput
            key={i}
            ref={(r) => { inputRefs.current[i] = r; }}
            style={[
              styles.otpBox,
              otp[i] ? styles.otpBoxFilled : styles.otpBoxEmpty,
            ]}
            value={otp[i]}
            onChangeText={(t) => handleChange(t, i)}
            onKeyPress={(e) => handleKeyPress(e, i)}
            keyboardType="numeric"
            maxLength={1}
            selectTextOnFocus
            textAlign="center"
          />
        ))}
      </View>

      <View style={{ height: 24 }} />

      {/* Resend */}
      <View style={styles.resendRow}>
        <Text style={styles.resendText}>Didn't receive the code? </Text>
        <TouchableOpacity onPress={handleResend}>
          <Text style={styles.resendLink}>Resend code</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 12 }} />

      <AuthButton
        label="Verify"
        onPress={handleVerify}
        loading={loading}
        disabled={otp.join('').length < OTP_LENGTH}
      />
      <AuthButton
        label="Back to Login"
        onPress={() => router.replace('/(auth)/login')}
        variant="secondary"
      />
    </AuthCard>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 26,
    color: colors.primary,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  description: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  otpBox: {
    width: 52,
    height: 56,
    borderRadius: 12,
    fontSize: 22,
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
    backgroundColor: colors.primarySubtle,
    textAlign: 'center',
    textAlignVertical: 'center',
    ...Platform.select({
      web: {
        outlineColor: colors.primary,
        outlineWidth: 2,
        lineHeight: '56px',
      } as any,
    }),
  },
  otpBoxEmpty: {
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  otpBoxFilled: {
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resendText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
  },
  resendLink: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
});