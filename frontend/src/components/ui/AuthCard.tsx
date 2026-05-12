import React from 'react';
import { View, Text, StyleSheet, Platform, ScrollView } from 'react-native';
import { colors } from '../../constants/colors';

interface AuthCardProps {
  children: React.ReactNode;
  topLabel?: string;
}

export function AuthCard({ children, topLabel }: AuthCardProps) {
  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {topLabel && (
          <Text style={styles.appName}>{topLabel}</Text>
        )}
        <View style={styles.card}>
          {children}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bgPage,
  },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 16,
  },
  appName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.primary,
    marginBottom: 20,
    letterSpacing: 0.2,
  },
  card: {
    backgroundColor: colors.bgSurface,
    borderRadius: 20,
    paddingHorizontal: 40,
    paddingVertical: 40,
    width: '100%',
    maxWidth: 480,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
        elevation: 4,
      },
    }),
  },
});