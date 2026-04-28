import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { AuthCard } from '../../src/components/ui/AuthCard';
import { Input } from '../../src/components/ui/Input';
import { AuthButton } from '../../src/components/ui/AuthButton';
import { colors } from '../../src/constants/colors';

export default function ResetPasswordScreen() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const confirmRef = useRef<any>(null);

  const validate = () => {
    const e: Record<string, string> = {};
    if (password.length < 8) e.password = 'Must have at least 8 characters';
    if (password !== confirmPassword) e.confirm = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleUpdate = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      // TODO: apiRequest('/auth/reset-password', { method: 'POST', body: JSON.stringify({ password }) })
      router.replace('/(auth)/login');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
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
        onChangeText={setPassword}
        secureTextEntry
        returnKeyType="next"
        onSubmitEditing={() => confirmRef.current?.focus()}
        error={errors.password}
      />

      <Input
        ref={confirmRef}
        label="Confirm password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
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