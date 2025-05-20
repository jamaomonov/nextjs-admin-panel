import { AUTH_TOKEN_KEY, API_ENDPOINTS, AUTH_CONFIG } from "@/lib/config"
import type { User, UserRole } from "@/types/auth"

// Флаг для отслеживания выполнения запроса обмена кода
let isExchangingCode = false

// Сохранение токена в localStorage
export const saveToken = (token: string) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(AUTH_TOKEN_KEY, token)
  }
}

// Получение токена из localStorage
export const getToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem(AUTH_TOKEN_KEY)
  }
  return null
}

// Удаление токена из localStorage
export const removeToken = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem(AUTH_TOKEN_KEY)
  }
}

// Проверка, авторизован ли пользователь
export const isAuthenticated = (): boolean => {
  // Если авторизация отключена в конфигурации, всегда возвращаем true
  if (!AUTH_CONFIG.requireAuth) {
    return true
  }
  return !!getToken()
}

// Проверка, имеет ли пользователь доступ на основе роли
export const hasAccess = (role?: UserRole): boolean => {
  // Если авторизация отключена в конфигурации, всегда возвращаем true
  if (!AUTH_CONFIG.requireAuth) {
    return true
  }

  // Если роль не указана, доступ запрещен
  if (!role) {
    return false
  }

  // Пров��ряем, входит ли роль пользователя в список разрешенных ролей
  return AUTH_CONFIG.allowedRoles.includes(role)
}

// Получение информации о текущем пользователе
export const getCurrentUser = async (): Promise<User | null> => {
  // Если авторизация отключена, возвращаем null
  if (!AUTH_CONFIG.requireAuth) {
    return null
  }

  const token = getToken()

  if (!token) {
    return null
  }

  try {
    const response = await fetch(API_ENDPOINTS.me, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      if (response.status === 401) {
        removeToken()
      }
      return null
    }

    const userData = await response.json()
    return userData
  } catch (error) {
    console.error("Error fetching user data:", error)
    return null
  }
}

// Обмен кода авторизации на токен
export const exchangeCodeForToken = async (code: string): Promise<{ user: User; token: string } | null> => {
  // Предотвращаем повторные запросы с тем же кодом
  if (isExchangingCode) {
    console.log("Code exchange already in progress, skipping duplicate request")
    return null
  }

  try {
    isExchangingCode = true
    console.log("Exchanging code for token...")

    const response = await fetch(`${API_ENDPOINTS.googleCallback}?code=${code}`, {
      method: "GET",
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(
        response.status === 400
          ? "Код авторизации недействителен или уже использован"
          : `Не удалось обменять код: ${response.status} ${errorText}`,
      )
    }

    const data = await response.json()

    const token = data.token
    if (!token) {
      throw new Error("Токен не получен")
    }

    saveToken(token)
    return { user: data, token }
  } catch (error) {
    throw error
  } finally {
    isExchangingCode = false
  }
}

// Добавление заголовка авторизации к запросам
export const authHeader = () => {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}
