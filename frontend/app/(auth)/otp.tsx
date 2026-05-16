import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AuthCard } from '../../src/components/ui/AuthCard';
import { AuthButton } from '../../src/components/ui/AuthButton';
import { colors } from '../../src/constants/colors';
import { verifyOtp, resendOtp } from '../../src/api/auth/authApi';
import { saveTokens } from '../../src/api/axiosClient';

const OTP_LENGTH = 6;

export default function OtpScreen() {
  const { email, mode } = useLocalSearchParams<{ email: string; mode?: string }>();
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const { width } = useWindowDimensions();
  const isMobile = width < 400;
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
    if (!email) {
      alert('Không tìm thấy thông tin email để xác thực.');
      return;
    }

    setLoading(true);
    try {
      const isResetMode = mode === 'reset';

      const response = await verifyOtp({
        email: email,
        otp: code,
        purpose: isResetMode ? 'reset_password' : 'register',
      });

      if (isResetMode) {
        // Trường hợp khôi phục mật khẩu: chuyển sang màn reset kèm single-use token
        router.push({
          pathname: '/(auth)/reset-password',
          params: { reset_token: response.data.reset_token }
        });
      } else {
        // Trường hợp Đăng ký thành công (Status 201)
        if (Platform.OS !== 'web') {
          // Mobile: Bắt buộc lấy access_token và refresh_token từ JSON body để lưu trữ
          const accessToken = response.data?.access_token;
          const refreshToken = response.data?.refresh_token;

          if (accessToken && refreshToken) {
            await saveTokens(accessToken, refreshToken);
          } else {
            throw new Error('Không nhận được token hợp lệ từ hệ thống.');
          }
        } else {
          // Web: Đã được backend tự động xử lý qua httpOnly cookie nên không cần lưu bằng tay
        }

        // Điều hướng vào thẳng bên trong ứng dụng
        router.replace('/(main)');
      }
    } catch (e: any) {
      console.error(e);
      const errorStatus = e.response?.status;
      // Bắt lỗi mã OTP_INVALID hoặc OTP_EXPIRED (Status 400)
      if (errorStatus === 400) {
        alert('Mã OTP không chính xác hoặc đã hết hạn.');
      } else {
        alert('Xác thực thất bại. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      alert('Không tìm thấy thông tin email để gửi lại mã.');
      return;
    }

    try {
      const purpose = mode === 'reset' ? 'reset_password' : 'register';
      await resendOtp(email, purpose);

      alert('Mã OTP mới đã được gửi vào hòm thư của bạn.');
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } catch (e: any) {
      console.error(e);
      if (e.response?.status === 404) {
        alert('Email không tồn tại trên hệ thống.');
      } else {
        alert('Không thể gửi lại mã OTP lúc này. Vui lòng thử lại sau.');
      }
    }
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
      web: {
        lineHeight: '48px',
      } as any,
      ios: {
        lineHeight: 48,   // iOS cần số, không phải string
        paddingVertical: 0, // fix iOS TextInput tự thêm padding
      },
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