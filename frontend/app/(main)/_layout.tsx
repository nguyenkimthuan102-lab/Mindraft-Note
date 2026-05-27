// app/main/_layout.tsx
import React from 'react';
import { View, StyleSheet, TouchableOpacity, PanResponder, useWindowDimensions, ActivityIndicator } from 'react-native';
import { Slot, useRouter } from 'expo-router';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

import { Sidebar } from '../../src/components/layout/Sidebar';
import { Topbar }  from '../../src/components/layout/Topbar';
import { colors }  from '../../src/constants/colors';
import { useLayoutStore }   from '../../src/store/useLayoutStore';
import { useSettingsStore } from '../../src/store/useSettingsStore';
import { useAppStore }      from '../../src/store/useAppStore';
import { SafeAreaView } from 'react-native-safe-area-context';

// ─── Helpers đọc token (đồng bộ với axiosClient.ts) ───────────────────────────

/**
 * Đọc access_token từ nơi lưu trữ phù hợp với platform:
 *   - Web    → localStorage
 *   - Mobile → expo-secure-store
 */
async function getStoredAccessToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return localStorage.getItem('access_token');
  }
  return SecureStore.getItemAsync('access_token');
}

/**
 * Kiểm tra JWT còn hạn hay không.
 * JWT có dạng header.payload.signature, payload là base64url JSON.
 * Trả về true nếu token hợp lệ VÀ chưa hết hạn (còn ít nhất 30 giây).
 */
function isTokenValid(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    
    // ĐÃ SỬA: Giải mã Base64 an toàn cho cả Web (atob) và Điện thoại Mobile (hàm dịch thủ công)
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

    // Còn ít nhất 30 giây thì coi là hợp lệ
    return payload.exp * 1000 > Date.now() + 30_000;
  } catch (error) {
    console.error('[Layout] Lỗi phân tích JWT Token:', error);
    return false;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MainLayout() {
  const router                = useRouter();
  const { isSidebarOpen, toggleSidebar } = useLayoutStore();
  const { loadSettings }      = useSettingsStore();
  const { width }             = useWindowDimensions();
  const isMobile              = width < 720;

  /**
   * isBootstrapping: true trong khi đang kiểm tra token + load settings.
   * Tránh render nội dung bảo vệ trước khi xác minh xong.
   */
  const [isBootstrapping, setIsBootstrapping] = React.useState(true);

  // ── 1. Ẩn sidebar mặc định trên mobile ──────────────────────────────────────
  React.useEffect(() => {
    if (isMobile && isSidebarOpen) {
      toggleSidebar();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile]);

  // ── 2. Auto-login + load settings khi app/tab khởi động ─────────────────────
  React.useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const token = await getStoredAccessToken();

        // ── Trường hợp 1: Không có token nào → chưa đăng nhập lần nào ──────────
        if (!token) {
          if (!cancelled) router.replace('/(auth)/login');
          return;
        }

        // ── Trường hợp 2: Có token và còn hạn → load settings bình thường ──────
        if (isTokenValid(token)) {
          // loadSettings dùng instance api có interceptor — nếu server vẫn trả
          // 401 (status_token không khớp), interceptor sẽ tự thử refresh một lần.
          // Nếu refresh cũng thất bại → loadSettings throw → rơi vào catch bên dưới.
          // Nếu loadSettings lỗi mạng (không liên quan auth) → vẫn ở lại app,
          // chỉ không có settings từ server (isLoaded = true với giá trị mặc định).
          await loadSettings();
          return;
        }

        // ── Trường hợp 3: Có token nhưng hết hạn → thử refresh qua axiosClient ─
        // Gọi loadSettings sẽ trigger request → server trả 401 → interceptor tự
        // gọi POST /auth/refresh (dùng HttpOnly Cookie trên Web, SecureStore trên Mobile).
        //   - Refresh thành công → interceptor lưu token mới, retry request → settings load OK
        //   - Refresh thất bại   → interceptor clearTokens() rồi throw → rơi vào catch
        await loadSettings();

      } catch {
        // Chỉ redirect về login khi rõ ràng không còn session hợp lệ.
        // (loadSettings lỗi mạng thuần túy không rơi vào đây vì
        //  useSettingsStore.loadSettings() tự catch và không re-throw.)
        if (!cancelled) router.replace('/(auth)/login');
      } finally {
        if (!cancelled) setIsBootstrapping(false);
      }
    }

    bootstrap();

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 3. Swipe từ cạnh trái để mở sidebar (mobile) ────────────────────────────
  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponderCapture: (evt, _gestureState) => {
        // Chỉ bắt sự kiện khi chạm vào 40px đầu bên trái và sidebar đang đóng
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
        // Mở sidebar nếu vuốt > 50px sang phải
        if (!isSidebarOpen && gestureState.dx > 50) {
          toggleSidebar();
        }
      },
    }),
  ).current;

  // ── 4. Hiển thị màn hình loading trong khi bootstrap ────────────────────────
  if (isBootstrapping) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['bottom']}>
        <ActivityIndicator size="large" color={colors.primary ?? '#6366f1'} />
      </SafeAreaView>
    );
  }

  // ── 5. Render layout chính ───────────────────────────────────────────────────
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

        {/* Nội dung chính */}
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

// ─── Styles ───────────────────────────────────────────────────────────────────

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
    width:         250, // CỐ ĐỊNH bằng hoặc gần bằng width Sidebar
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
    flex: 1, // Tự giãn rộng ra
  },
});