import apiClient from './client';
import { API_ENDPOINTS } from '@/constants/api';
import type { User } from '@/types/user';

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

interface AuthResponse {
  user: User;
  token: string;
}

export async function login(data: LoginRequest): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>(API_ENDPOINTS.AUTH_LOGIN, data);
  return response.data;
}

export async function register(data: RegisterRequest): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>(API_ENDPOINTS.AUTH_REGISTER, data);
  return response.data;
}

export async function logout(): Promise<void> {
  await apiClient.post(API_ENDPOINTS.AUTH_LOGOUT);
}

export async function deleteAccount(): Promise<void> {
  await apiClient.delete(API_ENDPOINTS.AUTH_DELETE_ACCOUNT);
}

export async function getMe(): Promise<User | null> {
  try {
    const response = await apiClient.get<{ user: User }>(API_ENDPOINTS.AUTH_ME);
    return response.data.user;
  } catch {
    return null;
  }
}
