"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Loader2 } from "lucide-react"
import { AUTH_CONFIG } from "@/lib/config"
import { hasAccess } from "@/lib/auth"

interface AuthGuardProps {
  children: React.ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isLoading, user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  // Публичные маршруты, которые не требуют авторизации
  const publicRoutes = ["/login", "/auth/callback", "/forbidden"]
  const isPublicRoute = publicRoutes.some((route) => pathname?.includes(route))

  useEffect(() => {
    // Если авторизация отключена в конфигурации, пропускаем проверки
    if (!AUTH_CONFIG.requireAuth) {
      return
    }

    // Если страница загружается, ничего не делаем
    if (isLoading) {
      return
    }

    // Если пользователь не авторизован и маршрут не публичный, перенаправляем на страницу входа
    if (!isAuthenticated && !isPublicRoute) {
      router.push(AUTH_CONFIG.loginPage)
      return
    }

    // Если пользователь авторизован, но не имеет нужной роли
    if (isAuthenticated && user && !hasAccess(user.role) && !isPublicRoute) {
      router.push(AUTH_CONFIG.forbiddenPage)
      return
    }
  }, [isAuthenticated, isLoading, router, pathname, user, isPublicRoute])

  // Показываем индикатор загрузки, если проверяем авторизацию
  if (AUTH_CONFIG.requireAuth && isLoading && !isPublicRoute) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-zinc-400 mx-auto mb-4" />
          <p className="text-zinc-400">Проверка авторизации...</p>
        </div>
      </div>
    )
  }

  // Если авторизация отключена или пользователь имеет доступ, показываем содержимое
  return <>{children}</>
}
