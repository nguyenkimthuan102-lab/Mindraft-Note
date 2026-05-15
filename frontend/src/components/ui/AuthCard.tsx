import React from 'react';
import { View, Text, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../constants/colors';

interface AuthCardProps {
  children: React.ReactNode;
  topLabel?: string;
  extraScrollHeight?: number;
}

export function AuthCard({ children, topLabel, extraScrollHeight }: AuthCardProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAwareScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: Math.max(insets.top, 48),
            paddingBottom: Math.max(insets.bottom, 48)
          }
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        enableOnAndroid={true}
        enableAutomaticScroll={true}
        extraScrollHeight={extraScrollHeight}
      >
        {topLabel && (
          <Text style={styles.appName}>{topLabel}</Text>
        )}
        <View style={[styles.card, isMobile && styles.cardMobile]}>
          {children}
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
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
  cardMobile: {
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
});