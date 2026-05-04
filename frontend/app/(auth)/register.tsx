import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { AuthCard } from '../../src/components/ui/AuthCard';
import { Input } from '../../src/components/ui/Input';
import { AuthButton } from '../../src/components/ui/AuthButton';
import { colors } from '../../src/constants/colors';
import { apiRequest } from '../../src/api/api';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const passwordRef = useRef<any>(null);
  const confirmRef = useRef<any>(null);
  const nicknameRef = useRef<any>(null);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!email) e.email = 'Email is required';
    if (password.length < 8) e.password = 'Must be at least 8 characters';
    if (password !== confirmPassword) e.confirm = 'Passwords do not match';
    if (!nickname.trim()) e.nickname = 'Nickname is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

const handleSignUp = async () => {
  if (!validate()) return;
  setLoading(true);
  try {
    // 🚀 PHÁT LỆNH: Gọi Backend để tạo User và gửi OTP
    await apiRequest('/auth/register/', {
      method: 'POST',
      body: JSON.stringify({ 
        email, 
        password, 
        nickname 
      }),
    });

    // CHỈ KHI THÀNH CÔNG MỚI SANG TRANG OTP
    // Truyền thêm email sang để trang OTP biết là gửi cho ai
    router.push({ 
      pathname: '/(auth)/otp', 
      params: { email } 
    });

  } catch (e: any) {
    console.error("Lỗi đăng ký:", e);
    // Nếu email đã tồn tại hoặc lỗi gì đó, nó sẽ hiện ở đây
    alert(e.message || "Đăng ký không thành công rồi ông Anh!");
  } finally {
    setLoading(false);
  }
};

  return (
    <AuthCard topLabel="Mindraft Note">
      <Text style={styles.title}>Create account</Text>

      <View style={{ height: 24 }} />

      <Input
        label="Email address"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
        error={errors.email}
      />

      <Input
        ref={passwordRef}
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        returnKeyType="next"
        onSubmitEditing={() => confirmRef.current?.focus()}
        hint="Must be at least 8 characters"
        error={errors.password}
      />

      <Input
        ref={confirmRef}
        label="Confirm password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        returnKeyType="next"
        onSubmitEditing={() => nicknameRef.current?.focus()}
        error={errors.confirm}
      />

      <Input
        ref={nicknameRef}
        label="Nickname"
        value={nickname}
        onChangeText={setNickname}
        returnKeyType="done"
        onSubmitEditing={handleSignUp}
        error={errors.nickname}
      />

      <View style={{ height: 8 }} />

      <AuthButton label="Sign Up" onPress={handleSignUp} loading={loading} />

      {/* OR Divider */}
      <View style={styles.divider}>
        <View style={styles.line} />
        <Text style={styles.orText}>OR</Text>
        <View style={styles.line} />
      </View>

      <AuthButton
        label="Continue with Google"
        onPress={() => {}}
        variant="secondary"
      />

      <View style={styles.footer}>
        <Text style={styles.footerText}>Already have an account? </Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.footerLink}>Sign in</Text>
        </TouchableOpacity>
      </View>
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
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
    gap: 12,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: colors.borderDefault,
  },
  orText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: colors.textTertiary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
  },
  footerLink: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
});