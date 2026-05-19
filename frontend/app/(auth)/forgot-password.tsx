import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { AuthCard } from '../../src/components/ui/AuthCard';
import { Input } from '../../src/components/ui/Input';
import { AuthButton } from '../../src/components/ui/AuthButton';
import { colors } from '../../src/constants/colors';
import { forgotPassword } from '../../src/api/auth/authApi';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendCode = async () => {
    const trimmed = email.trim();
    if (!trimmed) return;

    setLoading(true);
    try {
      await forgotPassword({ email: trimmed });

      // Chuyển sang màn OTP, truyền email và mode='reset' qua router params
      router.push({
        pathname: '/(auth)/otp',
        params: { email: trimmed, mode: 'reset' },
      });
    } catch (e: any) {
      const code = e.response?.data?.error?.code;
      if (code === 'EMAIL_NOT_FOUND') {
        Alert.alert('Không tìm thấy email', 'Email này chưa được đăng ký trong hệ thống.');
      } else if (e.response?.status === 429) {
        Alert.alert('Thử lại sau', 'Bạn đã gửi quá nhiều yêu cầu. Vui lòng đợi một lúc.');
      } else {
        Alert.alert('Lỗi', 'Không thể gửi mã lúc này. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard topLabel="Mindraft Note">
      <Text style={styles.title}>Forgot Password?</Text>

      <View style={{ height: 24 }} />

      <Text style={styles.description}>
        Enter your email address to receive a 6-digit verification code
      </Text>

      <View style={{ height: 20 }} />

      <Input
        label="Email address"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        returnKeyType="done"
        onSubmitEditing={handleSendCode}
      />

      <View style={{ height: 8 }} />

      <AuthButton label="Send Code" onPress={handleSendCode} loading={loading} />
      <AuthButton label="Back to Login" onPress={() => router.back()} variant="secondary" />
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
});
