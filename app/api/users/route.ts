import { API_BASE_URL } from "@/lib/config"
import { NextResponse } from "next/server"
import { authHeader } from "@/lib/auth"

// Оптимизированная версия API-маршрута для пользователей
export async function GET(request: Request) {
  try {
    // Получаем параметры запроса
    const url = new URL(request.url)
    const limit = url.searchParams.get("limit")
    const offset = url.searchParams.get("offset")
    const role = url.searchParams.get("role")

    // Формируем URL для запроса к внешнему API
    let apiUrl = `${API_BASE_URL}/admin/api/v1/users/`
    const queryParams = new URLSearchParams()

    if (limit) queryParams.append("limit", limit)
    if (offset) queryParams.append("offset", offset)
    if (role && role !== "all") queryParams.append("role", role)

    if (queryParams.toString()) {
      apiUrl += `?${queryParams.toString()}`
    }

    // Используем AbortController для возможности отмены запроса
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 секунд таймаут

    const response = await fetch(apiUrl, {
      headers: {
        "Content-Type": "application/json",
        ...authHeader(),
      },
      cache: "no-store",
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching users:", error)

    // Более информативный ответ об ошибке
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { error: "Failed to fetch users from external API", details: errorMessage },
      { status: 500 },
    )
  }
}
