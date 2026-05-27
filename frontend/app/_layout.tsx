import { Slot } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import React, { useEffect, useState } from 'react'; // 👈 Thêm useState để làm phanh xích
import * as SplashScreen from 'expo-splash-screen';
import { PaperProvider } from 'react-native-paper';
import * as WebBrowser from 'expo-web-browser';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, View } from 'react-native'; // 👈 Thêm Indicator để hiển thị vòng xoay loading

// 🔥 ĐƯA STORE XÁC THỰC LÊN TẦNG CAO NHẤT ĐỂ KHÔI PHỤC PHIÊN KHI F5
import { useAuthStore } from '../src/store/useAuthStore'; 

WebBrowser.maybeCompleteAuthSession();

const queryClient = new QueryClient();

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  // 🔥 KHIÊN BĂNG TỐI CAO: Khóa chặt toàn bộ router khi vừa F5 Web
  const [isRestoringAuth, setIsRestoringAuth] = useState(true);
  const { initialize } = useAuthStore();

  useEffect(() => {
    async function checkPersistedAuth() {
      try {
        // Ép app âm thầm đi gọi API /users/me để cứu phiên trước khi Router kịp nhảy bậy
        await initialize(); 
      } catch (err) {
        console.error('[Root Layout] Lỗi khôi phục phiên ngầm:', err);
      } finally {
        setIsRestoringAuth(false); // Xác minh xong xuôi (bất kể sống hay chết) mới nhả phanh ra
        if (fontsLoaded) {
          SplashScreen.hideAsync();
        }
      }
    }
    checkPersistedAuth();
  }, [fontsLoaded]);

  // 🔥 CHẶN DÒNG: Nếu chưa load xong font HOẶC chưa cứu phiên xong -> ĐỨNG IM hiển thị xoay loading!
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