// Определение возможных ролей пользователя
export type UserRole = "admin" | "moderator" | "user"

export interface User {
  username: string
  email: string
  avatar: string
  id: number
  google_id: string
  role: UserRole
  created_at: string
  updated_at: string
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}
