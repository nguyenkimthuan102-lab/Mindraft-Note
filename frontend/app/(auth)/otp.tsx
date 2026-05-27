import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AuthCard } from '../../src/components/ui/AuthCard';
import { AuthButton } from '../../src/components/ui/AuthButton';
import { colors } from '../../src/constants/colors';
import { verifyOtp, resendOtp } from '../../src/api/auth/authApi';
import { saveTokens } from '../../src/api/axiosClient';
import type { VerifyOtpRegisterResponse, VerifyOtpResetResponse } from '../../src/api/auth/authApi';

const OTP_LENGTH = 6;

export default function OtpScreen() {
  const { email, mode } = useLocalSearchParams<{ email: string; mode?: string }>();
  const isResetMode = mode === 'reset';

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const { width } = useWindowDimensions();
  const isMobile = width < 400;
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // ─── Xử lý nhập OTP ────────────────────────────────────────────────────────
  const handleChange = (text: string, index: number) => {
    const digit = text.replace(/[^0-9]/g, '').slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);

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

  // ─── Xác thực OTP ──────────────────────────────────────────────────────────
  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < OTP_LENGTH) return;

    if (!email) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin email để xác thực.');
      return;
    }

    setLoading(true);
    try {
      const responseData = await verifyOtp({
        email,
        otp: code,
        purpose: isResetMode ? 'reset_password' : 'register',
      });

      if (isResetMode) {
        // ── Luồng quên mật khẩu: backend trả reset_token ──────────────────
        const { reset_token } = responseData as VerifyOtpResetResponse;
        router.push({
          pathname: '/(auth)/reset-password',
          params: { reset_token, email },
        });
      } else {
        // ── Luồng đăng ký: backend trả access_token + user ────────────────
        const tokenData = responseData as VerifyOtpRegisterResponse;

        if (Platform.OS !== 'web') {
          const { access_token, refresh_token } = tokenData;
          if (access_token && refresh_token) {
            await saveTokens(access_token, refresh_token);
          } else {
            throw new Error('Không nhận được token hợp lệ từ hệ thống.');
          }
        }
        // Web: backend set HttpOnly cookie tự động

        router.replace('/(main)');
      }
    } catch (e: any) {
      const code = e.response?.data?.error?.code;
      if (code === 'OTP_INVALID') {
        Alert.alert('Sai mã OTP', 'Mã OTP không chính xác. Vui lòng kiểm tra lại.');
      } else if (code === 'OTP_EXPIRED') {
        Alert.alert('Mã OTP hết hạn', 'Mã đã hết hạn. Vui lòng yêu cầu gửi lại mã mới.');
      } else if (code === 'SESSION_EXPIRED') {
        Alert.alert('Phiên hết hạn', 'Phiên đăng ký đã hết hạn. Vui lòng đăng ký lại.');
        router.replace('/(auth)/register');
      } else {
        Alert.alert('Xác thực thất bại', 'Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ─── Gửi lại OTP ───────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (!email) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin email để gửi lại mã.');
      return;
    }

    try {
      const purpose = isResetMode ? 'reset_password' : 'register';
      await resendOtp(email, purpose);

      Alert.alert('Đã gửi', 'Mã OTP mới đã được gửi vào hòm thư của bạn.');
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } catch (e: any) {
      const status = e.response?.status;
      const code = e.response?.data?.error?.code;
      if (code === 'EMAIL_NOT_FOUND' || status === 404) {
        Alert.alert('Không tìm thấy', 'Email không tồn tại trên hệ thống.');
      } else if (status === 429) {
        Alert.alert('Thử lại sau', 'Bạn gửi quá nhiều yêu cầu. Vui lòng đợi một lúc.');
      } else {
        Alert.alert('Lỗi', 'Không thể gửi lại mã OTP lúc này. Vui lòng thử lại sau.');
      }
    }
  };

  return (
    <AuthCard topLabel="Mindraft Note">
      <Text style={styles.title}>Verify your Email</Text>

      <View style={{ height: 24 }} />

      <Text style={styles.description}>
        {isResetMode
          ? 'A 6-digit code has been sent to your inbox. Enter it below to continue recovering your account.'
          : 'A 6-digit code has been sent to your inbox. Enter it below to complete registration.'}
      </Text>

      <View style={{ height: 28 }} />

      {/* OTP Boxes */}
      <View style={[styles.otpRow, isMobile && { gap: 6 }]}>
        {Array(OTP_LENGTH).fill(null).map((_, i) => (
          <TextInput
            key={i}
            ref={(r) => { inputRefs.current[i] = r; }}
            style={[
              styles.otpBox,
              isMobile && styles.otpBoxMobile,
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
  otpBoxMobile: {
    width: 42,
    height: 48,
    fontSize: 20,
    ...Platform.select({
      web: { lineHeight: '48px' } as any,
      ios: { lineHeight: 48, paddingVertical: 0 },
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
