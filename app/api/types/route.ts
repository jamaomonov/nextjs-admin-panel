import { API_ENDPOINTS } from "@/lib/config"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Use AbortController to set a timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    const response = await fetch(API_ENDPOINTS.types, {
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      // Return a proper JSON error response instead of throwing
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
      // Return a proper JSON error response
      return NextResponse.json(
        { error: "Invalid JSON response from server", responseText: text.substring(0, 100) },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error fetching types:", error)
    // Return a proper JSON error response
    return NextResponse.json(
      {
        error: "Failed to fetch types from external API",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const response = await fetch(API_ENDPOINTS.types, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      // First try to get the error as text
      const errorText = await response.text()
      let errorData

      try {
        // Try to parse as JSON
        errorData = JSON.parse(errorText)
      } catch (e) {
        // If not valid JSON, use the text directly
        errorData = { message: errorText }
      }

      return NextResponse.json(
        { error: `API Error: ${response.status}`, details: errorData },
        { status: response.status },
      )
    }

    // First get the response as text
    const text = await response.text()

    // Try to parse the text as JSON
    try {
      const data = JSON.parse(text)
      return NextResponse.json(data)
    } catch (e) {
      console.error("Failed to parse response as JSON:", e)
      return NextResponse.json({ error: "Invalid JSON response from server" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error creating type:", error)
    return NextResponse.json(
      { error: "Failed to create type", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
