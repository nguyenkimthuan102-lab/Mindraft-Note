import * as Google from 'expo-auth-session/providers/google';
import { Platform } from 'react-native';
import { apiRequest, saveTokens } from '../axiosClient'; 

export function useGoogleAuth() {
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId,
    androidClientId,
    webClientId,
    responseType: 'id_token',
  });

  const signIn = async () => {
    try {
      const result = await promptAsync();
      
      // Nếu user hủy hoặc lỗi, chặn ngay
      if (result.type !== 'success' || !result.params?.id_token) {
        console.log('Google login was canceled or failed.');
        return null; 
      }

      const id_token = result.params.id_token;
      
      const data = await apiRequest<{
        access_token: string;
        refresh_token: string;
        expires_in: number;
        user: { id: string; name: string; email: string; avatar_url: string | null };
      }>('/auth/google/', {
        method: 'POST',
        body: { id_token }, 
      });

      if (Platform.OS !== 'web') {
        await saveTokens(data.access_token, data.refresh_token);
      }

      return data;
    } catch (error) {
      console.error('Lỗi khi gọi API /auth/google:', error);
      throw error;
    }
  };

  return { signIn, request };
}