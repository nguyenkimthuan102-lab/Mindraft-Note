import axios from 'axios';
import { Platform } from 'react-native';

// 1. Cấu hình BASE_URL thông minh
// Trên Android Emulator, localhost là 10.0.2.2. Trên Web/iOS là localhost.
const getBaseUrl = () => {
  if (__DEV__) {
    if (Platform.OS === 'android') return 'http://10.0.2.2:8000/api';
    return 'http://localhost:8000/api';
  }
  return 'https://your-production-domain.com/api'; // Domain thật khi deploy
};

const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 2. Request Interceptor: Tự động đính kèm Token vào Header
api.interceptors.request.use(
  async (config) => {
    // Giả sử bạn lưu token trong một store hoặc storage nào đó
    // Lưu ý: Với web, bạn có thể dùng localStorage, với mobile dùng SecureStore
    let token = null;
    
    // Ví dụ lấy từ logic của bạn (Zustand hoặc Storage)
    // token = await SecureStore.getItemAsync('userToken'); 

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 3. Response Interceptor: Xử lý lỗi tập trung (401, 403, 500)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response ? error.response.status : null;

    if (status === 401) {
      // Logic xử lý khi hết hạn đăng nhập (ví dụ: logout hoặc refresh token)
      console.warn("Phiên đăng nhập hết hạn.");
    } else if (status === 500) {
      console.error("Lỗi hệ thống phía Backend.");
    }

    return Promise.reject(error);
  }
);

export default api;