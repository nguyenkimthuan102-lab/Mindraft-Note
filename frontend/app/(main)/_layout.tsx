import { View, StyleSheet } from 'react-native';
import { Slot } from 'expo-router';
import { Sidebar } from '../../src/components/layout/Sidebar';
import { Topbar } from '../../src/components/layout/Topbar';
import { colors } from '../../src/constants/colors';
import { useLayoutStore } from '../../src/store/useLayoutStore';

export default function MainLayout() {
  const { isSidebarOpen } = useLayoutStore(); // Lấy trạng thái đóng/mở

  return (
    <View style={{ flex: 1 }}>
      {/* Topbar nằm trên cùng, chiếm toàn bộ chiều ngang */}
      <Topbar /> 
      
      <View style={{ flex: 1, flexDirection: 'row' }}>
        {/* Sidebar nằm bên trái */}
        <Sidebar />
        
        {/* Nội dung chính nằm bên phải */}
        <View style={{ flex: 1 }}>
          <Slot />
        </View>
      </View>
    </View>
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
  }
});