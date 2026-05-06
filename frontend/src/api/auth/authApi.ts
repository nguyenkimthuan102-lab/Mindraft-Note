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

export const loginWithEmail = (data: LoginPayload) =>
  axiosClient.post('/auth/login', data);

export const register = (data: RegisterPayload) =>
  axiosClient.post('/auth/register', data);

export const logout = () =>
  axiosClient.post('/auth/logout');