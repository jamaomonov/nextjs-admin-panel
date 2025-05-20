"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import type { User } from "@/types/auth"
import { getCurrentUser, removeToken, isAuthenticated, hasAccess } from "@/lib/auth"
import { API_ENDPOINTS, AUTH_CONFIG } from "@/lib/config"

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: () => void
  logout: () => void
  refreshUser: () => Promise<void>
  hasPermission: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  // Проверка аутентификации при загрузке
  useEffect(() => {
    // Если авторизация отключена в конфигурации, пропускаем проверки
    if (!AUTH_CONFIG.requireAuth) {
      setIsLoading(false)
      return
    }

    const checkAuth = async () => {
      setIsLoading(true)
      try {
        if (isAuthenticated()) {
          const userData = await getCurrentUser()
          if (userData) {
            setUser(userData)

            // Проверяем роль пользователя
            if (!hasAccess(userData.role)) {
              // Если роль не разрешена, перенаправляем на страницу с ошибкой доступа
              if (
                !pathname?.includes("/forbidden") &&
                !pathname?.includes("/login") &&
                !pathname?.includes("/auth/callback")
              ) {
                router.push(AUTH_CONFIG.forbiddenPage)
              }
            }
          } else {
            // Если токен есть, но пользователя получить не удалось
            removeToken()
            if (
              !pathname?.includes("/login") &&
              !pathname?.includes("/auth/callback") &&
              !pathname?.includes("/forbidden")
            ) {
              router.push(AUTH_CONFIG.loginPage)
            }
          }
        } else if (
          !pathname?.includes("/login") &&
          !pathname?.includes("/auth/callback") &&
          !pathname?.includes("/forbidden")
        ) {
          router.push(AUTH_CONFIG.loginPage)
        }
      } catch (err) {
        setError("Ошибка при проверке аутентификации")
        console.error("Auth check error:", err)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [pathname, router])

  // Функция для входа через Google
  const login = () => {
    window.location.href = API_ENDPOINTS.googleLogin
  }

  // Функция для выхода
  const logout = () => {
    removeToken()
    setUser(null)
    router.push(AUTH_CONFIG.loginPage)
  }

  // Функция для обновления данных пользователя
  const refreshUser = async () => {
    if (!AUTH_CONFIG.requireAuth) {
      return
    }

    setIsLoading(true)
    try {
      const userData = await getCurrentUser()
      if (userData) {
        setUser(userData)
      } else {
        removeToken()
        router.push(AUTH_CONFIG.loginPage)
      }
    } catch (err) {
      setError("Ошибка при обновлении данных пользователя")
      console.error("User refresh error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  // Проверяем, имеет ли пользователь доступ на основе роли
  const hasPermission = !user ? false : hasAccess(user.role)

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: AUTH_CONFIG.requireAuth ? !!user : true,
        isLoading,
        error,
        login,
        logout,
        refreshUser,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
