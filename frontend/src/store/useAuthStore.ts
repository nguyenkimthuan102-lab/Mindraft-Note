import { create } from 'zustand';
import api from '../api/axiosClient';
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
  logout: () => void;
  initialize: () => Promise<void>; // Hàm tự động khôi phục phiên đăng nhập
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true, // Mặc định ban đầu luôn là true để Layout dừng lại đợi

  setUser: (user) => set({ user, isAuthenticated: true, isLoading: false }),
  logout: () => set({ user: null, isAuthenticated: false, isLoading: false }),

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