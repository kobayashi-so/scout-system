import { apiClient } from './client'
import type { LoginUserPayload, RegisterUserPayload, UserResponse } from '../type/user'

// バックエンドの users 登録APIを呼び出す
export async function registerUser(payload: RegisterUserPayload): Promise<UserResponse> {
  const { data } = await apiClient.post<UserResponse>('/api/users/register', payload)
  return data
}

// バックエンドのログインAPIを呼び出す
export async function loginUser(payload: LoginUserPayload): Promise<UserResponse> {
  const { data } = await apiClient.post<UserResponse>('/api/users/login', payload)
  return data
}
