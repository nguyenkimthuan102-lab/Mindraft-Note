<<<<<<< HEAD
import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/store/useAuthStore';
import { useAppStore } from '../src/store/useAppStore';

export default function Index() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const initSettings = useAppStore((s) => s.initSettings);

  useEffect(() => {
    // Khởi tạo các cài đặt hệ thống (Theme, ViewMode) từ SQLite hoặc Web API ngay khi app mở
    initSettings();
  }, [initSettings]);

  if (isAuthenticated) {
    return <Redirect href="/(main)" />;
  }

=======
import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/store/useAuthStore';

export default function Index() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (isAuthenticated) return <Redirect href="/(main)" />;
>>>>>>> 07cda75d68652b08f9f3356682296e9ea4400122
  return <Redirect href="/(auth)/login" />;
}