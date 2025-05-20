import { API_ENDPOINTS } from "@/lib/config"
import { NextResponse } from "next/server"

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const body = await request.json()

    // Ensure all required fields are present and have correct types
    const requiredFields = ["name", "photo", "type_id", "rarity_id", "category_id", "collection_id", "weapon_id"]
    const missingFields = requiredFields.filter((field) => body[field] === undefined || body[field] === null)

    if (missingFields.length > 0) {
      return NextResponse.json({ error: "Missing required fields", details: missingFields }, { status: 400 })
    }

    const response = await fetch(`${API_ENDPOINTS.items}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

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
    console.error("Error updating item:", error)
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    const response = await fetch(`${API_ENDPOINTS.items}/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Unknown error" }))
      return NextResponse.json(
        { error: `API Error: ${response.status}`, details: errorData },
        { status: response.status },
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting item:", error)
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 })
  }
}
