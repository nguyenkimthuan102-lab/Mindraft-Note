import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { AuthCard } from '../../src/components/ui/AuthCard';
import { Input } from '../../src/components/ui/Input';
import { AuthButton } from '../../src/components/ui/AuthButton';
import { colors } from '../../src/constants/colors';
//import { useGoogleAuth } from '../../src/lib/googleAuth';
import * as SecureStore from 'expo-secure-store';
import { apiRequest, storage} from '../../src/api/api';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const passwordRef = useRef<any>(null);

  const handleLogin = async () => {
    // 1. Kiểm tra đầu vào cơ bản
    if (!email || !password) {
      alert("Chưa nhập Email hoặc Mật khẩu !");
      return;
    }

    setLoading(true);
    try {
      // 2. GỌI API THẬT SỰ (Đấu dây với Django)
      // Tên biến gửi lên là 'email' và 'password' khớp với Serializer của ông
      const response = await apiRequest<{ access: string; refresh: string }>('/auth/login/', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      // 3. NẾU CÓ TOKEN (Thành công) -> LƯU VÀO MÁY & VÀO APP
      // 3. NẾU CÓ TOKEN (Thành công) -> LƯU VÀO MÁY & VÀO APP
      if (response && response.access) {
        // THAY THẾ 2 DÒNG CŨ BẰNG 2 DÒNG DƯỚI ĐÂY:
        await storage.setItem('access_token', response.access);
        await storage.setItem('refresh_token', response.refresh);
        
        // Chỉ khi có Token xịn mới cho vào Main
        router.replace('/(main)');
      }
    } catch (e: any) {
      // 4. BẮT LỖI (Ví dụ: 401 Unauthorized từ Backend)
      console.error("Lỗi đăng nhập:", e);
      // Backend trả về lỗi gì thì hiện cái đó lên cho người dùng biết
      alert(e.message || "Sai Email hoặc mật khẩu rồi!");
    } finally {
      setLoading(false);
    }
  };
  
  // Phần return bên dưới giữ nguyên...

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

      {/* Sign In */}
      <AuthButton
        label="Sign In"
        onPress={handleLogin}
        loading={loading}
      />

      {/* OR Divider */}
      <View style={styles.divider}>
        <View style={styles.line} />
        <Text style={styles.orText}>OR</Text>
        <View style={styles.line} />
      </View>

      {/* Google */}
      <AuthButton
        label="Continue with Google"
        onPress={() => {}}
        variant="secondary"
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