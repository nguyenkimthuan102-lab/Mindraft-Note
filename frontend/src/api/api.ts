import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// LƯU Ý: Nếu test trên Web dùng 127.0.0.1, nếu máy ảo Android dùng 10.0.2.2
const BASE_URL = 'http://localhost:8000/api';

// --- BỘ TIẾP HỢP BỘ NHỚ (FIX LỖI WEB) ---
export const storage = {
  getItem: async (key: string) => {
    if (Platform.OS === 'web') return localStorage.getItem(key);
    return await SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string) => {
    if (Platform.OS === 'web') localStorage.setItem(key, value);
    else await SecureStore.setItemAsync(key, value);
  },
  deleteItem: async (key: string) => {
    if (Platform.OS === 'web') localStorage.removeItem(key);
    else await SecureStore.deleteItemAsync(key);
  }
};

async function getAccessToken(): Promise<string | null> {
  return storage.getItem('access_token');
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await storage.getItem('refresh_token');
  if (!refreshToken) return null;

  const res = await fetch(`${BASE_URL}/auth/refresh/`, {
    method: 'POST',
    headers: {  
      'Content-Type': 'application/json',
      'X-Platform': 'mobile',
    },
    body: JSON.stringify({ refresh: refreshToken }),
  });

  if (!res.ok) {
    await storage.deleteItem('access_token');
    await storage.deleteItem('refresh_token');
    return null;
  }

  const resData = await res.json();
  const newAccess = resData.data?.access || resData.access;

  if (newAccess) {
    await storage.setItem('access_token', newAccess);
    return newAccess;
  }
  return null;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  let token = await getAccessToken();

  const makeRequest = (t: string | null) =>
    fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-Platform': 'mobile',
        ...(t ? { Authorization: `Bearer ${t}` } : {}),
        ...options.headers,
      },
    });

  let res = await makeRequest(token);

  if (res.status === 401) {
    token = await refreshAccessToken();
    if (!token) throw new Error('UNAUTHENTICATED');
    res = await makeRequest(token);
  }

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw { status: res.status, ...(errorBody.error ?? errorBody) };
  }

  if (res.status === 204) return undefined as T;

  const body = await res.json();
  return (body.data !== undefined ? body.data : body) as T;
}