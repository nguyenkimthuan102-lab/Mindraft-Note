// src/api/api.ts
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// ---------- Base URL ----------
const getBaseUrl = () => {
  if (__DEV__) {
    if (Platform.OS === 'android') return process.env.EXPO_PUBLIC_API_URL;
    if (Platform.OS === 'ios') return process.env.EXPO_PUBLIC_API_URL;
    return 'http://localhost:8000/api';
  }
  return process.env.EXPO_PUBLIC_API_URL ?? 'https://api.mindraft.com/v1';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ---------- Token helpers (mobile only) ----------
const getStoredAccessToken = () => SecureStore.getItemAsync('access_token');
const getStoredRefreshToken = () => SecureStore.getItemAsync('refresh_token');
export const saveAccessToken = (token: string) => SecureStore.setItemAsync('access_token', token);

export const saveTokens = async (accessToken: string, refreshToken: string) => {
  await SecureStore.setItemAsync('access_token', accessToken);
  await SecureStore.setItemAsync('refresh_token', refreshToken);
};
const clearTokens = () => {
  SecureStore.deleteItemAsync('access_token');
  SecureStore.deleteItemAsync('refresh_token');
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
    if (Platform.OS !== 'web') {
      const token = await getStoredAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      config.headers['X-Platform'] = 'mobile';
    } else {
      // Web: rely on httpOnly cookie
      config.withCredentials = true;
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

    if (error.response?.status !== 401 || originalRequest._retry) {
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

      if (Platform.OS === 'web') {
        // Web: refresh via cookie (no body)
        await axios.post(`${getBaseUrl()}/auth/refresh`, {}, { withCredentials: true });
        // no token to save – cookie handles it
      } else {
        const refreshToken = await getStoredRefreshToken();
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(
          `${getBaseUrl()}/auth/refresh`,
          { refresh_token: refreshToken },
          { headers: { 'Content-Type': 'application/json', 'X-Platform': 'mobile' } }
        );

        const newToken = data.data.access_token;
        if (!newToken) throw new Error('Missing access_token in refresh response');
        await saveAccessToken(newToken);
      }

      processQueue(null, newToken);
      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
      }
      return api(originalRequest);
    } catch (refreshError) {
      if (Platform.OS !== 'web') await clearTokens();
      processQueue(refreshError, null);
      // Optionally dispatch logout event here
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