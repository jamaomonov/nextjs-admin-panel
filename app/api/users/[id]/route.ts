import { API_BASE_URL } from "@/lib/config"
import { NextResponse } from "next/server"
import { authHeader } from "@/lib/auth"

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const body = await request.json()

    // Проверяем, что роль указана и является допустимой
    if (!body.role || !["user", "moderator", "admin"].includes(body.role)) {
      return NextResponse.json({ error: "Invalid role. Must be one of: user, moderator, admin" }, { status: 400 })
    }

    // Используем AbortController для возможности отмены запроса
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 секунд таймаут

    const response = await fetch(`${API_BASE_URL}/admin/api/v1/users/?user_id=${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...authHeader(),
      },
      body: JSON.stringify({ role: body.role }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Unknown error" }))
      return NextResponse.json(
        { error: `API Error: ${response.status}`, details: errorData },
        { status: response.status },
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error updating user role:", error)

    // Более информативный ответ об ошибке
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: "Failed to update user role", details: errorMessage }, { status: 500 })
  }
}
