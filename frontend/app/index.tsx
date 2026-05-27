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

  return <Redirect href="/(auth)/login" />;
}