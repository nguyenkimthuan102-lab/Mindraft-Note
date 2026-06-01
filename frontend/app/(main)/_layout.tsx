// app/main/_layout.tsx
import React from 'react';
import { View, StyleSheet, TouchableOpacity, PanResponder, useWindowDimensions, ActivityIndicator } from 'react-native';
import { Slot, useRouter } from 'expo-router';
import { Platform } from 'react-native';

import { Sidebar } from '../../src/components/layout/Sidebar';
import { Topbar }  from '../../src/components/layout/Topbar';
import { colors }  from '../../src/constants/colors';
import { useLayoutStore }   from '../../src/store/useLayoutStore';
import { useSettingsStore } from '../../src/store/useSettingsStore';
import { useAuthStore }     from '../../src/store/useAuthStore'; // Nạp Store Auth 
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';

async function getStoredAccessToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return localStorage.getItem('access_token');
  }
  return SecureStore.getItemAsync('access_token');
}

function isTokenValid(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    
    let jsonPayload = '';
    if (Platform.OS === 'web') {
      jsonPayload = atob(base64);
    } else {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
      let str = base64.replace(/=+$/, '');
      let output = '';
      if (str.length % 4 === 1) return false;
      
      for (let bc = 0, bs = 0, buffer = 0, idx = 0; idx < str.length; idx++) {
        const char = str.charAt(idx);
        const pos = chars.indexOf(char);
        if (pos === -1) continue;
        
        buffer = bc % 4 ? buffer * 64 + pos : pos;
        if (bc++ % 4) {
          output += String.fromCharCode(255 & (buffer >> ((-2 * bc) & 6)));
        }
      }
      jsonPayload = decodeURIComponent(escape(output));
    }

    const payload = JSON.parse(jsonPayload) as { exp?: number };
    if (!payload.exp) return false;

    return payload.exp * 1000 > Date.now() + 30_000;
  } catch (error) {
    console.error('[Layout] Lỗi phân tích JWT Token:', error);
    return false;
  }
}

export default function MainLayout() {
  const router                                = useRouter();
  const { isSidebarOpen, toggleSidebar } = useLayoutStore();
  const { loadSettings }                      = useSettingsStore();
  const { width }                             = useWindowDimensions();
  const isMobile                              = width < 720;

// 🔥 Thêm lại biến kiểm soát local bảo vệ luồng không bị Loop chuyển trang [_layout.tsx]
  const [isBootstrapping, setIsBootstrapping] = React.useState(true);
  const { isAuthenticated, isLoading, initialize } = useAuthStore(); // Chỉ lấy 2 món này từ Store

  // Giữ nguyên logic sidebar của bạn [_layout.tsx]
  React.useEffect(() => {
    if (isMobile && isSidebarOpen) {
      toggleSidebar();
    }
  }, [isMobile]);

  // Luồng chạy khởi tạo an toàn tuyệt đối
  React.useEffect(() => {
    async function bootstrap() {
      try {
        setIsBootstrapping(true); // Bật khiên băng, khóa chặt con app lại [_layout.tsx]
        await initialize();       // Gọi Store đi verify danh tính ngầm dưới Backend
        await loadSettings();     // Load nốt cấu hình UI cài đặt [_layout.tsx]
      } catch (err) {
        console.error('[Layout] Bootstrap auth thất bại:', err);
      } finally {
        setIsBootstrapping(false); // Xác minh xong xuôi mới mở xích ra [_layout.tsx]
      }
    }

    bootstrap();
  }, []);

  // Điều hướng chuẩn chỉ, chỉ hoạt động khi quá trình kiểm tra (isBootstrapping) đã xong
  React.useEffect(() => {
    if (isBootstrapping) return; // 🔥 THẦN CHÚ: Đang kiểm tra token thì ĐỨNG IM không chuyển hướng! [_layout.tsx]

    if (!isAuthenticated) {
      router.replace('/(auth)/login'); // Thực sự không có phiên mới đá ra Login [_layout.tsx]
    }
  }, [isAuthenticated, isBootstrapping]);

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponderCapture: (evt, _gestureState) => {
        return isMobile && !isSidebarOpen && evt.nativeEvent.pageX < 40;
      },
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return (
          isMobile &&
          !isSidebarOpen &&
          evt.nativeEvent.pageX < 40 &&
          gestureState.dx > 10
        );
      },
      onPanResponderRelease: (_evt, gestureState) => {
        if (!isSidebarOpen && gestureState.dx > 50) {
          toggleSidebar();
        }
      },
    }),
  ).current;

  // 🔥 Hiển thị loading nếu Store đang fetch dữ liệu HOẶC luồng bootstrap đang khóa xích bảo vệ
  if (isLoading || isBootstrapping) { 
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['bottom']}>
        <ActivityIndicator size="large" color={colors.primary ?? '#6366f1'} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1 }}
      edges={['bottom']}
      {...panResponder.panHandlers}
    >
      {/* Topbar nằm trên cùng, chiếm toàn bộ chiều ngang */}
      <Topbar />

      <View style={{ flex: 1, flexDirection: 'row', position: 'relative' }}>
        {/* Sidebar cố định bên trái — chỉ render inline khi KHÔNG phải mobile */}
        {!isMobile && <Sidebar />}

        {/* Nội dung chính nằm bên phải */}
        <View style={{ flex: 1 }}>
          <Slot />
        </View>
      </View>

      {/* Mobile: Backdrop + Sidebar render ở root để phủ lên cả Topbar */}
      {isMobile && (
        <>
          {isSidebarOpen && (
            <TouchableOpacity
              style={styles.backdrop}
              activeOpacity={0.6}
              onPress={toggleSidebar}
            />
          )}
          <Sidebar />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    position:        'absolute',
    left:            0,
    right:           0,
    top:             0,
    bottom:          0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex:          999,
  },
  topbar: {
    height:           64,
    flexDirection:    'row',
    alignItems:       'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDefault,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems:    'center',
    width:         250, 
  },
  logoImg:   { width: 32, height: 32, marginLeft: 8 },
  brandText: { fontSize: 18, fontWeight: '500', marginLeft: 10 },
  areaTitle: {
    fontSize:   18,
    fontWeight: '400',
    marginLeft: 12,
    color:      colors.textPrimary,
  },
  searchContainer: {
    flex: 1, 
  },
});