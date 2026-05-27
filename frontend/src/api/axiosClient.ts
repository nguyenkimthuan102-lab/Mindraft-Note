// src/api/api.ts
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// ---------- Base URL ----------
const getBaseUrl = () => {
  if (__DEV__) {
    if (Platform.OS === 'android' || Platform.OS === 'ios') return process.env.EXPO_PUBLIC_API_URL;
    return 'http://localhost:8000/api';
  }
  return process.env.EXPO_PUBLIC_API_URL ?? 'https://api.mindraft.com/v1';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ---------- Token helpers (Hỗ trợ cả Mobile và Web) ----------
const getStoredAccessToken = () => {
  if (Platform.OS === 'web') return Promise.resolve(localStorage.getItem('access_token'));
  return SecureStore.getItemAsync('access_token');
};

const getStoredRefreshToken = () => {
  if (Platform.OS === 'web') return Promise.resolve(null); // Web dùng HttpOnly Cookie
  return SecureStore.getItemAsync('refresh_token');
};

export const saveAccessToken = (token: string) => {
  if (Platform.OS === 'web') {
    localStorage.setItem('access_token', token);
    return Promise.resolve();
  }
  return SecureStore.setItemAsync('access_token', token);
};

export const saveTokens = async (accessToken: string, refreshToken: string) => {
  if (Platform.OS === 'web') {
    localStorage.setItem('access_token', accessToken);
    // Web không lưu refresh_token vào localStorage vì đã có cookie
  } else {
    await SecureStore.setItemAsync('access_token', accessToken);
    await SecureStore.setItemAsync('refresh_token', refreshToken);
  }
};

const clearTokens = async () => {
  if (Platform.OS === 'web') {
    localStorage.removeItem('access_token');
  } else {
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
  }
};
// ---------- Queue for 401 concurrent requests ----------
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string | null) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
};

// ---------- Request interceptor ----------
api.interceptors.request.use(
  async (config) => {
    const token = await getStoredAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (Platform.OS !== 'web') {
      config.headers['X-Platform'] = 'mobile';
    } else {
      config.withCredentials = true; // Bắt buộc để Web tự gửi kèm HttpOnly Cookie (refresh_token)
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ---------- Response interceptor ----------
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status !== 401 || originalRequest._retry || originalRequest._skipRetry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token: string | null) => {
            if (token) originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          },
          reject,
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      let newToken: string | null = null;
      let newUser: any = null; // Tạo biến hứng dữ liệu User trả về từ Backend của bạn

      if (Platform.OS === 'web') {
        const { data } = await axios.post(`${getBaseUrl()}/auth/refresh/`, {}, { withCredentials: true });
        newToken = data?.data?.access_token;
        newUser = data?.data?.user; //  Bốc cục user ra từ hàm refresh_token_view Backend

        if (!newToken) throw new Error('Thất bại: Không tìm thấy access_token trong response refresh của Web');
        await saveAccessToken(newToken);
      } else {
        const refreshToken = await getStoredRefreshToken();
        if (!refreshToken) throw new Error('Không tìm thấy refresh token trên thiết bị');

        const { data } = await axios.post(
          `${getBaseUrl()}/auth/refresh/`,
          { refresh_token: refreshToken },
          { headers: { 'Content-Type': 'application/json', 'X-Platform': 'mobile' } }
        );

        newToken = data?.data?.access_token;
        newUser = data?.data?.user; // Bốc cục user ra từ hàm refresh_token_view Backend
        if (!newToken) throw new Error('Thất bại: Không tìm thấy access_token trong response refresh của Mobile');
        await saveAccessToken(newToken);
      }

      // ĐỒNG BỘ RAM STORE: Nạp ngược thông tin User mới nhất vào Zustand để UI cập nhật theo ngầm
      if (newUser) {
        const { useAuthStore } = require('../store/useAuthStore'); // Import động để tránh lỗi xoay vòng (circular dependency)
        useAuthStore.getState().setUser(newUser);
      }

      processQueue(null, newToken);
      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
      }
      return api(originalRequest);
    } catch (refreshError) {
      await clearTokens();
      processQueue(refreshError, null);
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

// Có thể giữ lại hàm apiRequest nếu còn nơi dùng
export async function apiRequest<T>(
  path: string,
  options: { method?: string; body?: unknown; headers?: Record<string, string> } = {}
): Promise<T> {
  const response = await api({
    url: path,
    method: options.method?.toLowerCase() || 'get',
    data: options.body,
    headers: options.headers,
  });
  if (response.status === 204) return undefined as T;
  return response.data.data as T;
}

export default api;