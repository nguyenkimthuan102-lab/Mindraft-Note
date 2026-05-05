import { Slot } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useFonts, Inter_400Regular, Inter_500Medium,
  Inter_600SemiBold, Inter_700Bold
} from '@expo-google-fonts/inter';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { PaperProvider } from 'react-native-paper';

const queryClient = new QueryClient();

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <PaperProvider>
      <QueryClientProvider client={queryClient}>
        <Slot />
      </QueryClientProvider>
    </PaperProvider>
  );
}