import { Slot, useRouter } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import React, { useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { PaperProvider } from 'react-native-paper';
import * as WebBrowser from 'expo-web-browser';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, View, Platform } from 'react-native';

// 🔥 THƯ VIỆN & STORE ĐÃ ĐƯỢC TÍCH HỢP
import * as Notifications from 'expo-notifications';
import { useAuthStore } from '../src/store/useAuthStore'; 
import { useNotificationStore } from '../src/store/useNotificationStore';

WebBrowser.maybeCompleteAuthSession();

const queryClient = new QueryClient();

SplashScreen.preventAutoHideAsync();

// 🔔 CẤU HÌNH THÔNG BÁO HIỂN THỊ KHI APP ĐANG MỞ (Đã sửa lỗi thiếu trường cho phiên bản mới)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true, // 👈 Bổ sung bắt buộc cho API mới
    shouldShowList: true,   // 👈 Bổ sung bắt buộc cho API mới
  }),
});

export default function RootLayout() {
  const router = useRouter();
  const { loadNotifications } = useNotificationStore();
  const { initialize } = useAuthStore();

  const [fontsLoaded] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  // 🔥 KHIÊN BĂNG TỐI CAO: Khóa chặt toàn bộ router khi vừa F5 Web
  const [isRestoringAuth, setIsRestoringAuth] = useState(true);

  useEffect(() => {
    // Luồng 1: Khôi phục phiên làm việc và ẩn SplashScreen
    async function checkPersistedAuth() {
      try {
        // Ép app âm thầm đi gọi API /users/me để cứu phiên trước khi Router kịp nhảy bậy
        await initialize(); 
      } catch (err) {
        console.error('[Root Layout] Lỗi khôi phục phiên ngầm:', err);
      } finally {
        setIsRestoringAuth(false); // Xác minh xong xuôi mới nhả phanh ra
        if (fontsLoaded) {
          SplashScreen.hideAsync();
        }
      }
    }
    checkPersistedAuth();

    // Luồng 2: Tải dữ liệu thông báo từ server & Đăng ký bộ lắng nghe sự kiện Click Notification
    loadNotifications();

    if (Platform.OS === 'web') return;

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      if (data && data.note_id) {
        // Tự động nhảy sang trang chi tiết ghi chú 
        router.push(`/note/${data.note_id}` as any);
      }
    });

    return () => {
      // 👈 SỬA LỖI: Sử dụng phương thức .remove() trực tiếp trên subscription object thay cho hàm cũ
      responseListener.remove();
    };
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