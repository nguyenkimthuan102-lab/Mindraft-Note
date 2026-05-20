import { View, StyleSheet, TouchableOpacity, PanResponder, useWindowDimensions } from 'react-native';
import { Slot } from 'expo-router';
import { Sidebar } from '../../src/components/layout/Sidebar';
import { Topbar } from '../../src/components/layout/Topbar';
import { colors } from '../../src/constants/colors';
import { useLayoutStore } from '../../src/store/useLayoutStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import React from 'react';

export default function MainLayout() {
  const { isSidebarOpen, toggleSidebar } = useLayoutStore();
  const { width } = useWindowDimensions();
  const isMobile = width < 720;

  React.useEffect(() => {
    // Ẩn sidebar mặc định khi vào bằng điện thoại
    if (isMobile && isSidebarOpen) {
      toggleSidebar();
    }
  }, [isMobile]);

  // Thiết lập vuốt từ cạnh trái để mở sidebar trên điện thoại
  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponderCapture: (evt, gestureState) => {
        if (isMobile && !isSidebarOpen && evt.nativeEvent.pageX < 40) {
          return true;
        }
        return false;
      },
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        if (isMobile && !isSidebarOpen && evt.nativeEvent.pageX < 40 && gestureState.dx > 10) {
          return true;
        }
        return false;
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (!isSidebarOpen && gestureState.dx > 50) {
          toggleSidebar();
        }
      },
    })
  ).current;

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom']} {...panResponder.panHandlers}>
      {/* Topbar nằm trên cùng, chiếm toàn bộ chiều ngang */}
      <Topbar /> 
      
      <View style={{ flex: 1, flexDirection: 'row', position: 'relative' }}>
        {/* Sidebar nằm bên trái (Chỉ render trong hàng khi không phải mobile) */}
        {!isMobile && <Sidebar />}
        
        {/* Nội dung chính nằm bên phải */}
        <View style={{ flex: 1 }}>
          <Slot />
        </View>
      </View>

      {/* Render Backdrop và Sidebar ở cấp độ gốc (Root) khi là điện thoại để che phủ hoàn toàn cả Topbar */}
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
  backdrop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 999,
  },
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