import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { AuthCard } from '../../src/components/ui/AuthCard';
import { Input } from '../../src/components/ui/Input';
import { AuthButton } from '../../src/components/ui/AuthButton';
import { colors } from '../../src/constants/colors';
import { useGoogleAuth } from '../../src/lib/googleAuth';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const passwordRef = useRef<any>(null);

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    try {
      // TODO: integrate apiRequest('/auth/login')
      router.replace('/(main)');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
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