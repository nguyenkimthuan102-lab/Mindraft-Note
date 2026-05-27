import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AuthButton } from '../../src/components/ui/AuthButton';
import { AuthCard } from '../../src/components/ui/AuthCard';
import { Input } from '../../src/components/ui/Input';
import { colors } from '../../src/constants/colors';
import { loginWithEmail } from '../../src/api/auth/authApi';
import { saveTokens } from '../../src/api/axiosClient';
import { useGoogleAuth } from '../../src/api/auth/googleAuth';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const passwordRef = useRef<any>(null);
  const { signIn: googleSignIn, request: googleRequest } = useGoogleAuth();

  // ─── Đăng nhập thường ──────────────────────────────────────────────────────
  const handleLogin = async () => {
    if (!email.trim() || !password) return;

    setLoading(true);
    try {
      const data = await loginWithEmail({ email: email.trim(), password });

      // Mobile: lưu token vào SecureStore
      if (Platform.OS !== 'web' && data.refresh_token) {
        await saveTokens(data.access_token, data.refresh_token);
      }
      // Web: access_token nằm trong response, refresh_token trong HttpOnly Cookie —
      //       axiosClient sẽ tự attach cookie cho mỗi request sau nhờ withCredentials.

      router.replace('/(main)');
    } catch (e: any) {
      const code = e.response?.data?.error?.code;
      if (code === 'INVALID_CREDENTIALS') {
        Alert.alert('Đăng nhập thất bại', 'Email hoặc mật khẩu không đúng.');
      } else if (code === 'ACCOUNT_NOT_VERIFIED') {
        Alert.alert('Tài khoản chưa xác thực', 'Vui lòng xác thực OTP trước khi đăng nhập.');
      } else {
        Alert.alert('Lỗi', 'Không thể đăng nhập lúc này. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ─── Đăng nhập Google ──────────────────────────────────────────────────────
  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const authData = await googleSignIn();
      if (authData) {
        router.replace('/(main)');
      }
    } catch (e) {
      Alert.alert('Lỗi', 'Đăng nhập Google thất bại. Vui lòng thử lại.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <AuthCard topLabel="Mindraft Note">
      {/* Header */}
      <Text style={styles.title}>Welcome back to{'\n'}Mindraft Note</Text>
      <Text style={styles.subtitle}>Your creative space is waiting</Text>

      <View style={styles.spacer} />

      {/* Inputs */}
      <Input
        label="Email address"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
      />

      <Input
        ref={passwordRef}
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        returnKeyType="done"
        onSubmitEditing={handleLogin}
        rightAction={{
          label: 'Forgot?',
          onPress: () => router.push('/(auth)/forgot-password'),
        }}
      />

      <View style={{ height: 8 }} />

      <AuthButton
        label="Sign In"
        onPress={handleLogin}
        loading={loading}
        disabled={googleLoading}
      />

      {/* OR Divider */}
      <View style={styles.divider}>
        <View style={styles.line} />
        <Text style={styles.orText}>OR</Text>
        <View style={styles.line} />
      </View>

      <AuthButton
        label="Continue with Google"
        onPress={() => handleGoogleLogin()}
        variant="secondary"
        loading={googleLoading}
        disabled={!googleRequest || loading}
      />

      {/* Sign up link */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Don't have an account? </Text>
        <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
          <Text style={styles.footerLink}>Sign up</Text>
        </TouchableOpacity>
      </View>
    </AuthCard>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    lineHeight: 36,
    color: colors.primary,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '600',
  },
  spacer: {
    height: 32,
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
