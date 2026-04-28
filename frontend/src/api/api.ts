import * as SecureStore from 'expo-secure-store';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://api.mindraft.com/v1';

async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync('access_token');
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await SecureStore.getItemAsync('refresh_token');
  if (!refreshToken) return null;

  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Platform': 'mobile',
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!res.ok) {
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
    return null;
  }

  const { data } = await res.json();
  await SecureStore.setItemAsync('access_token', data.access_token);
  return data.access_token;
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
    const body = await res.json().catch(() => ({}));
    throw { status: res.status, ...(body.error ?? {}) };
  }

  if (res.status === 204) return undefined as T;

  const body = await res.json();
  return body.data as T;
}