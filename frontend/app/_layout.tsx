// app/_layout.tsx
import { Slot, useRouter } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import React, { useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { PaperProvider } from 'react-native-paper';
import * as WebBrowser from 'expo-web-browser';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, View, Platform } from 'react-native';

import * as Notifications from 'expo-notifications';
import { useAuthStore } from '../src/store/useAuthStore';
import { useNotificationStore } from '../src/store/useNotificationStore';
import { requestNotificationPermission } from '../src/utils/notificationScheduler';
import { useLocalNotification } from '../src/hooks/useLocalNotification';

WebBrowser.maybeCompleteAuthSession();
const queryClient = new QueryClient();
SplashScreen.preventAutoHideAsync();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function RootLayout() {
  const router = useRouter();
  const { loadNotifications } = useNotificationStore();
  const { initialize } = useAuthStore();
  const { handleNotificationReceived } = useLocalNotification(); // ← THÊM

  const [fontsLoaded] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  const [isRestoringAuth, setIsRestoringAuth] = useState(true);

  useEffect(() => {
    // Luồng 1: Khôi phục phiên
    async function checkPersistedAuth() {
      try {
        await initialize();
      } catch (err) {
        console.error('[RootLayout] Lỗi khôi phục phiên:', err);
      } finally {
        setIsRestoringAuth(false);
        if (fontsLoaded) SplashScreen.hideAsync();
      }
    }
    checkPersistedAuth();

    // Luồng 2: Tải notifications từ server
    loadNotifications();

    // Luồng 3: Xin quyền thông báo
    if (Platform.OS !== 'web') {
      requestNotificationPermission();
    }

    if (Platform.OS === 'web') return;

    // Luồng 4: Nhận thông báo khi app đang mở → tạo server notification
    const receivedListener = Notifications.addNotificationReceivedListener(
      notification => {
        handleNotificationReceived(notification);
      }
    );

    // Luồng 5: Bấm vào thông báo → nhảy sang note
    const responseListener = Notifications.addNotificationResponseReceivedListener(
      response => {
        const data = response.notification.request.content.data;
        if (data?.note_id) {
          router.push(`/note/${data.note_id}` as any);
        }
      }
    );

    return () => {
      receivedListener.remove();
      responseListener.remove();
    };
  }, [fontsLoaded]);

  if (!fontsLoaded || isRestoringAuth) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' }}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <PaperProvider>
        <QueryClientProvider client={queryClient}>
          <Slot />
        </QueryClientProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}