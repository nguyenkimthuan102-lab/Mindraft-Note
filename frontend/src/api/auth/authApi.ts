import axiosClient from '../axiosClient';

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


export const loginWithEmail = (data: LoginPayload) =>
  axiosClient.post('/auth/login', data);

//Luồng register
export const register = async (data: RegisterPayload) => {
  const response = await axiosClient.post('/auth/register/', data);
  return response.data;
};

export const verifyOtp = async (data: VerifyOtpPayload) => {
  const response = await axiosClient.post('/auth/verify-otp/', data);
  return response.data;
};

export const resendOtp = async (
  email: string,
  purpose: 'register' | 'reset_password'
) => {
  const response = await axiosClient.post('/auth/resend-otp/', {
    email,
    purpose,
  });

  return response.data;
};

export const logout = () =>
  axiosClient.post('/auth/logout');