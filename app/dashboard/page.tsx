"use client"

import { useState, useEffect } from "react"
import AdminLayout from "@/components/admin-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Package, Users, Sword, Grid3X3, Album, Star, FileType, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ServerStats {
  cpu_percent: number
  memory: {
    total_gb: number
    used_gb: number
    available_gb: number
    percent: number
  }
  disk: {
    total_gb: number
    used_gb: number
    free_gb: number
    percent: number
  }
}

interface EntityCount {
  items: number
  users: number
  weapons: number
  categories: number
  collections: number
  rarities: number
  types: number
}

export default function DashboardPage() {
  const [serverStats, setServerStats] = useState<ServerStats>({
    cpu_percent: 0,
    memory: { total_gb: 0, used_gb: 0, available_gb: 0, percent: 0 },
    disk: { total_gb: 0, used_gb: 0, free_gb: 0, percent: 0 },
  })

  const [counts, setCounts] = useState<EntityCount>({
    items: 0,
    users: 0,
    weapons: 0,
    categories: 0,
    collections: 0,
    rarities: 0,
    types: 0,
  })

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Add a fallback mechanism for when the API is unavailable
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Create mock data for when the API is unavailable
        const mockStats = {
          cpu_percent: 25.5,
          memory: {
            total_gb: 16.0,
            used_gb: 8.2,
            available_gb: 7.8,
            percent: 51.25,
          },
          disk: {
            total_gb: 512.0,
            used_gb: 256.0,
            free_gb: 256.0,
            percent: 50.0,
          },
        }

        // Attempt to fetch real server stats, but use mock data if it fails
        try {
          await fetchServerStats().catch((err) => {
            console.warn("Server stats unavailable, using mock data:", err)
            setServerStats(mockStats)
          })
        } catch (err) {
          console.warn("Server stats unavailable, using mock data:", err)
          setServerStats(mockStats)
        }

        // Attempt to fetch entity counts
        try {
          await fetchEntityCounts().catch((err) => {
            console.warn("Entity counts unavailable, using mock data:", err)
            // Set mock counts if API fails
            setCounts({
              items: 42,
              users: 15,
              weapons: 24,
              categories: 8,
              collections: 12,
              rarities: 6,
              types: 5,
            })
          })
        } catch (err) {
          console.warn("Entity counts unavailable, using mock data:", err)
          // Set mock counts if API fails
          setCounts({
            items: 42,
            users: 15,
            weapons: 24,
            categories: 8,
            collections: 12,
            rarities: 6,
            types: 5,
          })
        }
      } catch (error) {
        console.error("Error in fetchData:", error)
        setError("Произошла ошибка при загрузке данных. Используются демо-данные.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const fetchServerStats = async () => {
    try {
      // Используем наш API-маршрут вместо прямого обращения к внешнему API
      const response = await fetch("/api/server-stats")

      if (!response.ok) {
        throw new Error(`Ошибка при получении статистики сервера: ${response.status}`)
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      setServerStats(data)
    } catch (error) {
      console.error("Error fetching server stats:", error)
      setError(error instanceof Error ? error.message : "Не удалось загрузить данные сервера")
    }
  }

  // Update the fetchEntityCounts function to better handle API errors
  const fetchEntityCounts = async () => {
    try {
      // Get counts from each API with improved error handling
      const fetchWithErrorHandling = async (url: string) => {
        try {
          const response = await fetch(url)
          if (!response.ok) {
            console.warn(`Warning: ${url} returned status ${response.status}`)
            return []
          }

          const text = await response.text()
          // Try to parse as JSON, return empty array if it fails
          try {
            return JSON.parse(text)
          } catch (e) {
            console.error(`Error parsing JSON from ${url}:`, e, "Response:", text)
            return []
          }
        } catch (error) {
          console.error(`Error fetching from ${url}:`, error)
          return []
        }
      }

      // Fetch data from all endpoints with better error handling
      const [itemsData, weaponsData, categoriesData, collectionsData, raritiesData, typesData] = await Promise.all([
        fetchWithErrorHandling("/api/items"),
        fetchWithErrorHandling("/api/weapons"),
        fetchWithErrorHandling("/api/categories"),
        fetchWithErrorHandling("/api/collections"),
        fetchWithErrorHandling("/api/rarities"),
        fetchWithErrorHandling("/api/types"),
      ])

      // Set counts with proper array checking
      setCounts({
        items: Array.isArray(itemsData) ? itemsData.length : 0,
        users: 0, // No API for users, so leave at 0
        weapons: Array.isArray(weaponsData) ? weaponsData.length : 0,
        categories: Array.isArray(categoriesData) ? categoriesData.length : 0,
        collections: Array.isArray(collectionsData) ? collectionsData.length : 0,
        rarities: Array.isArray(raritiesData) ? raritiesData.length : 0,
        types: Array.isArray(typesData) ? typesData.length : 0,
      })
    } catch (error) {
      console.error("Error fetching entity counts:", error)
      setError(error instanceof Error ? error.message : "Не удалось загрузить данные элементов")

      // Set default counts to avoid UI issues
      setCounts({
        items: 0,
        users: 0,
        weapons: 0,
        categories: 0,
        collections: 0,
        rarities: 0,
        types: 0,
      })
    }
  }

  // Статистика для отображения
  const stats = [
    { label: "Total Items", value: counts.items, icon: Package, color: "bg-blue-500" },
    { label: "Total Users", value: counts.users, icon: Users, color: "bg-green-500" },
    { label: "Weapons", value: counts.weapons, icon: Sword, color: "bg-amber-500" },
    { label: "Categories", value: counts.categories, icon: Grid3X3, color: "bg-purple-500" },
    { label: "Collections", value: counts.collections, icon: Album, color: "bg-pink-500" },
    { label: "Rarities", value: counts.rarities, icon: Star, color: "bg-yellow-500" },
    { label: "Types", value: counts.types, icon: FileType, color: "bg-cyan-500" },
  ]

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-zinc-400">Welcome to your admin dashboard</p>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-zinc-400"></div>
        </div>
      )}

      {error && (
        <Alert variant="destructive" className="bg-red-900/20 border-red-800 text-red-300 mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!isLoading && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <Card key={stat.label} className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${stat.color}`}>
                      <stat.icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-zinc-400">{stat.label}</p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                        <Users className="h-5 w-5 text-zinc-400" />
                      </div>
                      <div>
                        <p className="font-medium">User added a new item</p>
                        <p className="text-sm text-zinc-400">
                          {i} hour{i !== 1 ? "s" : ""} ago
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4">System Status</h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">CPU Usage</span>
                      <span className="font-medium">{serverStats.cpu_percent.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-zinc-800 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${Math.min(serverStats.cpu_percent, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Memory Usage</span>
                      <span className="font-medium">{serverStats.memory.percent.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-zinc-800 rounded-full h-2">
                      <div
                        className="bg-amber-500 h-2 rounded-full"
                        style={{ width: `${Math.min(serverStats.memory.percent, 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-zinc-500">
                      <span>Used: {serverStats.memory.used_gb.toFixed(2)} GB</span>
                      <span>Total: {serverStats.memory.total_gb.toFixed(2)} GB</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Disk Usage</span>
                      <span className="font-medium">{serverStats.disk.percent.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-zinc-800 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${Math.min(serverStats.disk.percent, 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-zinc-500">
                      <span>Used: {serverStats.disk.used_gb.toFixed(2)} GB</span>
                      <span>Free: {serverStats.disk.free_gb.toFixed(2)} GB</span>
                      <span>Total: {serverStats.disk.total_gb.toFixed(2)} GB</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </AdminLayout>
  )
}
