import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { apiRequest } from '../axiosClient';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

export function useGoogleAuth() {
  // Lấy đúng client ID theo nền tảng từ biến môi trường
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId,
    androidClientId,
    webClientId,       // ✅ Thêm dòng này để hỗ trợ web
  });

  const signIn = async () => {
    const result = await promptAsync();
    if (result.type !== 'success') return null;

    const { id_token } = result.params;

    const data = await apiRequest<{
      access_token: string;
      refresh_token: string;
      expires_in: number;
      user: { id: string; name: string; email: string; avatar_url: string | null };
    }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ id_token }),
    });

    // Chỉ lưu token thủ công trên mobile; web dùng cookie (withCredentials)
    if (Platform.OS !== 'web') {
      await SecureStore.setItemAsync('access_token', data.access_token);
      await SecureStore.setItemAsync('refresh_token', data.refresh_token);
    }

    return data;
  };

  return { signIn, request };
}