import { type NextRequest, NextResponse } from "next/server"
import { API_ENDPOINTS } from "@/lib/config"

// Обработчик для перенаправления на Google OAuth
export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const path = url.pathname

  // Если это запрос на вход через Google
  if (path.endsWith("/google/login")) {
    return NextResponse.redirect(API_ENDPOINTS.googleLogin)
  }

  // Для других запросов возвращаем 404
  return new NextResponse("Not found", { status: 404 })
}
