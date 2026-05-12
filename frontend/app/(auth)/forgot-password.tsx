import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { AuthCard } from '../../src/components/ui/AuthCard';
import { Input } from '../../src/components/ui/Input';
import { AuthButton } from '../../src/components/ui/AuthButton';
import { colors } from '../../src/constants/colors';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendCode = async () => {
    if (!email) return;
    setLoading(true);
    try {
      // TODO: apiRequest('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) })
      router.push({ pathname: '/(auth)/otp', params: { email, mode: 'reset' } });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
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