import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { AuthCard } from '../../src/components/ui/AuthCard';
import { Input } from '../../src/components/ui/Input';
import { AuthButton } from '../../src/components/ui/AuthButton';
import { colors } from '../../src/constants/colors';
import { apiRequest } from '../../src/api/api';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendCode = async () => {
  if (!email) {
    alert("Vui lòng nhập Email để nhận mã hồi sinh mật khẩu!");
    return;
  }

  setLoading(true); // Lúc này cái vòng quay quay mới bắt đầu xuất hiện
  try {
    // 🚀 THỰC THI: Gọi API gửi mail thật
    // Nhớ có dấu gạch chéo '/' ở cuối để khớp với Django nhé
    await apiRequest('/auth/forgot-password/', { 
      method: 'POST', 
      body: JSON.stringify({ email }) 
    });

    // CHỈ KHI API CHẠY XONG (Thành công) -> Mới đẩy sang trang OTP
    alert("Mã xác thực đã được gửi vào hòm thư!");
    router.push({ 
      pathname: '/(auth)/otp', 
      params: { email, mode: 'reset' } 
    });

  } catch (e: any) {
    console.error("Lỗi gửi mail reset:", e);
    // Hiện lỗi nếu email không tồn tại hoặc lỗi server
    alert(e.message || "Không gửi được mã, check lại email hoặc mạng nhé!");
  } finally {
    setLoading(false); // Xong xuôi thì tắt quay quay
  }
};

  return (
    <AuthCard topLabel="Mindraft Note">
      <Text style={styles.title}>Forgot Password?</Text>

      <View style={{ height: 24 }} />

      <Text style={styles.description}>
        Enter your gmail address to receive a 6-digit verification code
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