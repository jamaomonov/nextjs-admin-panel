import { API_ENDPOINTS } from "@/lib/config"
import { NextResponse } from "next/server"

export const revalidate = 0 // Disable cache for this route

export async function POST(request: Request) {
  try {
    // Get the form data from the request
    const formData = await request.formData()

    // Forward the request to the external API with the correct URL
    const response = await fetch(API_ENDPOINTS.upload, {
      method: "POST",
      body: formData,
    })

    // Get the response as text first
    const responseText = await response.text()
    console.log("API Upload Response:", responseText)

    // Try to parse the response as JSON
    let data
    try {
      data = JSON.parse(responseText)
    } catch (e) {
      console.error("Failed to parse response as JSON:", e)
      return NextResponse.json({ error: "Invalid JSON response from server" }, { status: 500 })
    }

    if (!response.ok) {
      if (response.status === 400) {
        return NextResponse.json({ error: data.detail || "Bad request", details: data }, { status: 400 })
      }
      return NextResponse.json(
        { error: `Upload failed with status: ${response.status}`, details: data },
        { status: response.status },
      )
    }

    // Return the response directly without modifying it
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in upload process:", error)
    return NextResponse.json(
      { error: "Failed to upload file", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
