import axiosClient from '../axiosClient';

// ─── Payload types ────────────────────────────────────────────────────────────

interface LoginPayload {
  email: string;
  password: string;
}

interface RegisterPayload {
  email: string;
  password: string;
  name: string;
}

export interface VerifyOtpPayload {
  email: string;
  otp: string;
  purpose: 'register' | 'reset_password';
}

interface ForgotPasswordPayload {
  email: string;
}

interface ResetPasswordPayload {
  reset_token: string;
  new_password: string;
  logout_all_devices?: boolean;
}

// ─── Response types ───────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
}

export interface LoginResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string; // only on mobile (X-Platform: mobile)
  user: AuthUser;
}

export interface VerifyOtpRegisterResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  user: AuthUser;
}

export interface VerifyOtpResetResponse {
  reset_token: string;
  expires_in: number;
}

// ─── API calls ────────────────────────────────────────────────────────────────

/** 1.4 – Đăng nhập thường */
export const loginWithEmail = async (data: LoginPayload): Promise<LoginResponse> => {
  const response = await axiosClient.post('/auth/login/', data, {
    // Báo cho response interceptor KHÔNG tự động retry khi gặp 401.
    // Nếu không có flag này, sai mật khẩu → 401 → interceptor gọi /auth/refresh/
    // → refresh thất bại → vòng lặp lỗi spam server.
    _skipRetry: true,
  } as any);
  return response.data.data as LoginResponse;
};

/** 1.5 – Đăng ký (gửi OTP) */
export const register = async (data: RegisterPayload) => {
  const response = await axiosClient.post('/auth/register/', data);
  return response.data;
};

/** 1.6 – Xác thực OTP (dùng cho cả register lẫn reset_password) */
export const verifyOtp = async (
  data: VerifyOtpPayload
): Promise<VerifyOtpRegisterResponse | VerifyOtpResetResponse> => {
  const response = await axiosClient.post('/auth/verify-otp/', data);
  return response.data.data;
};

/** 1.7 – Gửi lại OTP */
export const resendOtp = async (
  email: string,
  purpose: 'register' | 'reset_password'
) => {
  const response = await axiosClient.post('/auth/resend-otp/', { email, purpose });
  return response.data;
};

/** 1.8 – Quên mật khẩu: gửi OTP về mail */
export const forgotPassword = async (data: ForgotPasswordPayload) => {
  const response = await axiosClient.post('/auth/forgot-password/', data);
  return response.data;
};

/** 1.9 – Đặt lại mật khẩu mới bằng reset_token */
export const resetPassword = async (data: ResetPasswordPayload): Promise<LoginResponse> => {
  const response = await axiosClient.post('/auth/reset-password/', data);
  return response.data.data as LoginResponse;
};

/** Đăng xuất */
export const logout = () => axiosClient.post('/auth/logout/');
