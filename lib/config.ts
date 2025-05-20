/**
 * Конфигурационный файл для хранения глобальных настроек приложения
 */

// Базовый URL для API запр��сов
export const API_BASE_URL = "http://127.0.1:8000"

// URL для API-эндпоинтов
export const API_ENDPOINTS = {
  // Основные эндпоинты
  items: `${API_BASE_URL}/admin/api/v1/items`,
  weapons: `${API_BASE_URL}/admin/api/v1/weapons`,
  categories: `${API_BASE_URL}/admin/api/v1/categories`,
  collections: `${API_BASE_URL}/admin/api/v1/collections`,
  rarities: `${API_BASE_URL}/admin/api/v1/rarities`,
  types: `${API_BASE_URL}/admin/api/v1/types`,
  upload: `${API_BASE_URL}/admin/api/v1/upload`,
  serverStats: `${API_BASE_URL}/admin/api/v1/get-server-stats`,

  // Эндпоинты аутентификации
  googleLogin: `${API_BASE_URL}/auth/google/login`,
  googleCallback: `${API_BASE_URL}/auth/google/callback`,
  me: `${API_BASE_URL}/auth/me`,
}

// URL для изображений
export const IMAGE_BASE_URL = API_BASE_URL

// Placeholder для изображений
export const DEFAULT_ITEM_IMAGE = ""

// Ключ для хранения токена в localStorage
export const AUTH_TOKEN_KEY = "admin_auth_token"

// Базовый URL для фронтенда (для редиректов)
export const FRONTEND_URL =
  typeof window !== "undefined" ? `${window.location.protocol}//${window.location.host}` : "http://localhost:3000"

// Настройки авторизации
export const AUTH_CONFIG = {
  // Включить/отключить требование авторизации
  requireAuth: false,

  // Роли, которым разрешен доступ к админ-панели
  allowedRoles: ["admin", "moderator"],

  // Страница для перенаправления неавторизованных пользователей
  loginPage: "/login",

  // Страница для перенаправления пользователей с недостаточными правами
  forbiddenPage: "/forbidden",
}
