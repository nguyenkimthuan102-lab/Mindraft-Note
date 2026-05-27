import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Alert, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AuthCard } from '../../src/components/ui/AuthCard';
import { Input } from '../../src/components/ui/Input';
import { AuthButton } from '../../src/components/ui/AuthButton';
import { colors } from '../../src/constants/colors';
import { resetPassword } from '../../src/api/auth/authApi';

export default function ResetPasswordScreen() {
  // reset_token được truyền từ OTP screen qua router params
  const { reset_token } = useLocalSearchParams<{ reset_token: string }>();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const confirmRef = useRef<any>(null);

  // ─── Validate client-side ──────────────────────────────────────────────────
  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (password.length < 8) e.password = 'Must have at least 8 characters';
    if (password !== confirmPassword) e.confirm = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ─── Gọi API sau khi user chọn logout_all_devices ────────────────────────
  const callResetApi = async (logoutAll: boolean) => {
    setLoading(true);
    try {
      await resetPassword({
        reset_token,
        new_password: password,
        logout_all_devices: logoutAll,
      });

      // Web: window.alert rồi redirect; Mobile: Alert với callback
      if (Platform.OS === 'web') {
        window.alert('Đổi mật khẩu thành công!');
        router.replace('/(auth)/login');
      } else {
        Alert.alert('Thành công', 'Đổi mật khẩu thành công!', [
          { text: 'OK', onPress: () => router.replace('/(auth)/login') },
        ]);
      }
    } catch (e: any) {
      const code = e.response?.data?.error?.code;
      if (code === 'RESET_TOKEN_EXPIRED') {
        if (Platform.OS === 'web') {
          window.alert('Token đặt lại mật khẩu đã hết hạn. Vui lòng thực hiện lại.');
          router.replace('/(auth)/forgot-password');
        } else {
          Alert.alert(
            'Phiên hết hạn',
            'Token đặt lại mật khẩu đã hết hạn. Vui lòng thực hiện lại.',
            [{ text: 'OK', onPress: () => router.replace('/(auth)/forgot-password') }]
          );
        }
      } else if (code === 'SAME_PASSWORD') {
        setErrors({ password: 'New password must be different from the old one' });
      } else {
        if (Platform.OS === 'web') {
          window.alert('Không thể cập nhật mật khẩu. Vui lòng thử lại.');
        } else {
          Alert.alert('Lỗi', 'Không thể cập nhật mật khẩu. Vui lòng thử lại.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // ─── Validate → hỏi logout_all → gọi API ─────────────────────────────────
  const handleUpdate = () => {
    if (!validate()) return;

    if (!reset_token) {
      if (Platform.OS === 'web') {
        window.alert('Phiên đặt lại mật khẩu không hợp lệ. Vui lòng thực hiện lại từ đầu.');
      } else {
        Alert.alert('Lỗi', 'Phiên đặt lại mật khẩu không hợp lệ. Vui lòng thực hiện lại từ đầu.');
      }
      router.replace('/(auth)/forgot-password');
      return;
    }

    // Web dùng window.confirm (trả về boolean); Mobile dùng Alert 2 nút
    if (Platform.OS === 'web') {
      const logoutAll = window.confirm(
        'Bạn có muốn đăng xuất khỏi tất cả thiết bị đang đăng nhập không?\n\nOK = Tất cả thiết bị\nCancel = Chỉ thiết bị này'
      );
      callResetApi(logoutAll);
    } else {
      Alert.alert(
        'Đăng xuất các thiết bị khác?',
        'Bạn có muốn đăng xuất khỏi tất cả thiết bị đang đăng nhập không?',
        [
          {
            text: 'Chỉ thiết bị này',
            style: 'cancel',
            onPress: () => callResetApi(false),
          },
          {
            text: 'Tất cả thiết bị',
            style: 'destructive',
            onPress: () => callResetApi(true),
          },
        ]
      );
    }
  };

  return (
    <AuthCard topLabel="Mindraft Note">
      <Text style={styles.title}>Reset Password</Text>
      <Text style={styles.subtitle}>Choose a new, secure password for your account</Text>

      <View style={{ height: 24 }} />

      <Input
        label="New password"
        value={password}
        onChangeText={(t) => {
          setPassword(t);
          if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
        }}
        secureTextEntry
        returnKeyType="next"
        onSubmitEditing={() => confirmRef.current?.focus()}
        error={errors.password}
      />

      <Input
        ref={confirmRef}
        label="Confirm password"
        value={confirmPassword}
        onChangeText={(t) => {
          setConfirmPassword(t);
          if (errors.confirm) setErrors((prev) => ({ ...prev, confirm: '' }));
        }}
        secureTextEntry
        returnKeyType="done"
        onSubmitEditing={handleUpdate}
        hint="Must have at least 8 characters"
        error={errors.confirm}
      />

      <View style={{ height: 24 }} />

      <AuthButton label="Update Password" onPress={handleUpdate} loading={loading} />
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
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
});