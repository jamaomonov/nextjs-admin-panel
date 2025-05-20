// Импортируем конфигурацию
import { API_ENDPOINTS } from "@/lib/config"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    // Получаем параметры запроса
    const url = new URL(request.url)
    const limit = url.searchParams.get("limit")
    const offset = url.searchParams.get("offset")
    const category = url.searchParams.get("category")
    const rarity = url.searchParams.get("rarity")
    const type = url.searchParams.get("type")
    const search = url.searchParams.get("search")

    // Формируем URL для запроса к внешнему API
    let apiUrl = API_ENDPOINTS.items
    const queryParams = new URLSearchParams()

    if (limit) queryParams.append("limit", limit)
    if (offset) queryParams.append("offset", offset)
    if (category) queryParams.append("category", category)
    if (rarity) queryParams.append("rarity", rarity)
    if (type) queryParams.append("type", type)
    if (search) queryParams.append("search", search)

    if (queryParams.toString()) {
      apiUrl += `?${queryParams.toString()}`
    }

    // Используем AbortController для возможности отмены запроса
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 секунд таймаут

    const response = await fetch(apiUrl, {
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      return NextResponse.json({ error: `API responded with status: ${response.status}` }, { status: response.status })
    }

    // First get the response as text
    const text = await response.text()

    // Try to parse the text as JSON
    try {
      const data = JSON.parse(text)
      return NextResponse.json(data)
    } catch (e) {
      console.error("Failed to parse response as JSON:", e, "Response:", text)
      return NextResponse.json(
        { error: "Invalid JSON response from server", responseText: text.substring(0, 100) },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error fetching items:", error)

    // Более информативный ответ об ошибке
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { error: "Failed to fetch items from external API", details: errorMessage },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Ensure all required fields are present and have correct types
    const requiredFields = ["name", "photo", "type_id", "rarity_id", "category_id", "collection_id", "weapon_id"]
    const missingFields = requiredFields.filter((field) => body[field] === undefined || body[field] === null)

    if (missingFields.length > 0) {
      return NextResponse.json({ error: "Missing required fields", details: missingFields }, { status: 400 })
    }

    // Используем AbortController для возможности отмены запроса
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 секунд таймаут для POST запросов

    const response = await fetch(API_ENDPOINTS.items, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    const responseText = await response.text()
    let responseData

    try {
      responseData = JSON.parse(responseText)
    } catch (e) {
      // If response is not valid JSON, use the text as error message
      return NextResponse.json(
        { error: `API Error: ${response.status}`, details: responseText },
        { status: response.status },
      )
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: `API Error: ${response.status}`, details: responseData },
        { status: response.status },
      )
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error("Error creating item:", error)

    // Более информативный ответ об ошибке
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: "Failed to create item", details: errorMessage }, { status: 500 })
  }
}
