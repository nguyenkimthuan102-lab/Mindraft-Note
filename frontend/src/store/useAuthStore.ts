import { create } from 'zustand';
import api from '../api/axiosClient';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
interface User {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean; // Trạng thái chờ check token khi vừa F5 hoặc vừa bật app
  setUser: (user: User) => void;
  logout: () => Promise<void>;
  initialize: () => Promise<void>; // Hàm tự động khôi phục phiên đăng nhập
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => set({ user, isAuthenticated: true, isLoading: false }),
  
  logout: async () => {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token'); // Phòng hờ nếu Web có lưu
      } else {
        await SecureStore.deleteItemAsync('access_token');
      }
    } catch (err) {
      console.error('[AuthStore] Lỗi dọn dẹp token local khi logout:', err);
    } finally {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  initialize: async () => {
    set({ isLoading: true });
    try {
      // Gọi API lấy thông tin cá nhân hiện tại. 
      // Nhờ Interceptor, Web tự đính cookie ngầm, Mobile tự đính token từ SecureStore.
      const res = await api.get('/users/me');
      const userData = res.data?.data;
      
      if (userData) {
        set({ user: userData, isAuthenticated: true });
      } else {
        set({ user: null, isAuthenticated: false });
      }
    } catch (err) {
      // Nếu dính lỗi 401 (hết hạn hoàn toàn), luồng tự động đẩy về unauthenticated
      set({ user: null, isAuthenticated: false });
    } finally {
      set({ isLoading: false }); // Hoàn thành việc check, tắt màn hình Loading
    }
  },
}));