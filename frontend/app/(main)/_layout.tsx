import { Stack } from 'expo-router';
import { View, StyleSheet } from 'react-native';

// PHẢI có dấu { } vì dùng named export
import { Sidebar } from '../../src/components/layout/Sidebar';
import { NoteEditor } from '../../src/components/notes/NoteEditor';
import { Topbar } from '../../src/components/layout/Topbar'; // Thêm lại Topbar nếu nhóm có dùng

export default function MainLayout() {
  return (
    <View style={styles.container}>
      {/* 1. Thanh Topbar nằm ngang trên cùng (nếu có) */}
      <Topbar /> 

      <View style={styles.row}>
        {/* 2. Thanh Sidebar bên trái cố định */}
        <Sidebar />

        {/* 3. Vùng nội dung chính bên phải */}
        <View style={styles.content}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="settings" />
          </Stack>
        </View>
      </View>
      
      {/* 4. Modal Editor nằm lớp trên cùng */}
      <NoteEditor />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  row: {
    flex: 1,
    flexDirection: 'row', // Đặt Sidebar và Content nằm cạnh nhau
  },
  content: {
    flex: 1, // Để vùng nội dung chiếm hết phần còn lại của màn hình
  }
});