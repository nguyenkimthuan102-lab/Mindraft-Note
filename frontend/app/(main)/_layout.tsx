import { View, StyleSheet, useWindowDimensions, TouchableOpacity } from 'react-native';
import { Slot } from 'expo-router';
import { Sidebar } from '../../src/components/layout/Sidebar';
import { Topbar } from '../../src/components/layout/Topbar';
import { colors } from '../../src/constants/colors';
import { useLayoutStore } from '../../src/store/useLayoutStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '../../src/store/useAppStore';

export default function MainLayout() {
  const { isSidebarOpen, toggleSidebar } = useLayoutStore(); // Lấy trạng thái đóng/mở
  const { theme } = useAppStore();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const isDark = theme === 'dark';
  const dynamicBg = isDark ? '#111827' : colors.bgPage;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: dynamicBg }}>
      {/* Topbar nằm trên cùng, chiếm toàn bộ chiều ngang */}
      <Topbar /> 
      
      <View style={{ flex: 1, flexDirection: 'row', position: 'relative' }}>
        {/* Backdrop overlay trên mobile khi sidebar mở */}
        {isSidebarOpen && isMobile && (
          <TouchableOpacity 
            style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 40 }]} 
            activeOpacity={1} 
            onPress={toggleSidebar} 
          />
        )}

        {/* Sidebar */}
        <View style={[
          isSidebarOpen ? { display: 'flex' } : { display: 'none' },
          isMobile ? styles.sidebarMobile : null
        ]}>
          <Sidebar />
        </View>

        {/* Nội dung chính luôn hiển thị full */}
        <View style={{ flex: 1 }}>
          <Slot />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  topbar: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDefault,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 250, // PHẢI CỐ ĐỊNH con số này (bằng hoặc gần bằng width Sidebar)
  },
  logoImg: { width: 32, height: 32, marginLeft: 8 },
  brandText: { fontSize: 18, fontWeight: '500', marginLeft: 10 },
  areaTitle: { fontSize: 18, fontWeight: '400', marginLeft: 12, color: colors.textPrimary },
  searchContainer: {
    flex: 1, // Để thanh search tự giãn rộng ra
    // ...
  },
  sidebarMobile: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 50,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 15,
  }
});