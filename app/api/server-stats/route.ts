import { API_ENDPOINTS } from "@/lib/config"
import { NextResponse } from "next/server"

export const revalidate = 60 // Revalidate every 60 seconds

export async function GET() {
  try {
    console.log("Fetching server stats from external API...")
    const response = await fetch(API_ENDPOINTS.serverStats, {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      console.error(`Server stats API responded with status: ${response.status}`)

      if (response.status === 404) {
        return NextResponse.json(
          {
            cpu_percent: 0,
            memory: { total_gb: 0, used_gb: 0, available_gb: 0, percent: 0 },
            disk: { total_gb: 0, used_gb: 0, free_gb: 0, percent: 0 },
          },
          { status: 200 },
        )
      }

      return NextResponse.json(
        {
          error: `API responded with status: ${response.status}`,
          cpu_percent: 0,
          memory: { total_gb: 0, used_gb: 0, available_gb: 0, percent: 0 },
          disk: { total_gb: 0, used_gb: 0, free_gb: 0, percent: 0 },
        },
        { status: 200 },
      )
    }

    const data = await response.json()
    console.log("Server stats received:", data)

    if (!data || Object.keys(data).length === 0) {
      return NextResponse.json(
        {
          error: "Empty response from server",
          cpu_percent: 0,
          memory: { total_gb: 0, used_gb: 0, available_gb: 0, percent: 0 },
          disk: { total_gb: 0, used_gb: 0, free_gb: 0, percent: 0 },
        },
        { status: 200 },
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching server stats:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch server stats",
        cpu_percent: 0,
        memory: { total_gb: 0, used_gb: 0, available_gb: 0, percent: 0 },
        disk: { total_gb: 0, used_gb: 0, free_gb: 0, percent: 0 },
      },
      { status: 200 },
    )
  }
}
