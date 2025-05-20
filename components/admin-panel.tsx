"use client"

import { useState, useEffect } from "react"
import { BarChart3, Package, Users, Settings, ShoppingCart, LogOut, Menu, X, Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import ItemCard from "@/components/product-card"

// Обновленный интерфейс для соответствия структуре API
interface ApiItem {
  id: number
  name: string
  photo: string
  type: {
    name: string
    id: number
  }
  rarity: {
    name: string
    id: number
  }
  category: {
    name: string
    id: number
  }
  collection: {
    name: string
    id: number
  }
  weapon: {
    id: number
    slug: string
    name: string
  }
  created_at: string
}

// Интерфейс для нашего компонента ItemCard
interface Item {
  id: number
  name: string
  price?: number // Оставляем для совместимости, но может быть undefined
  stock?: number // Оставляем для совместимости, но может быть undefined
  category: string
  photo: string
  rarity?: string
  weaponName?: string
  collectionName?: string
  typeName?: string
  created_at?: string
}

// Моковые данные для использования при ошибках или в режиме разработки
const mockItems: Item[] = [
  {
    id: 1,
    name: "AK-47 | Азимов",
    category: "Винтовка",
    photo: "/placeholder.svg?height=200&width=200",
    rarity: "Тайное",
    weaponName: "AK-47",
    collectionName: "Коллекция Феникс",
    typeName: "Оружие",
  },
  {
    id: 2,
    name: "AWP | Драконий лор",
    category: "Снайперская винтовка",
    photo: "/placeholder.svg?height=200&width=200",
    rarity: "Засекреченное",
    weaponName: "AWP",
    collectionName: "Коллекция Кобра",
    typeName: "Оружие",
  },
  {
    id: 3,
    name: "M4A4 | Вой",
    category: "Винтовка",
    photo: "/placeholder.svg?height=200&width=200",
    rarity: "Тайное",
    weaponName: "M4A4",
    collectionName: "Коллекция Охотник",
    typeName: "Оружие",
  },
  {
    id: 4,
    name: "Перчатки | Кровавая паутина",
    category: "Перчатки",
    photo: "/placeholder.svg?height=200&width=200",
    rarity: "Экстраординарное",
    weaponName: "Перчатки",
    collectionName: "Коллекция Перчатки",
    typeName: "Перчатки",
  },
  {
    id: 5,
    name: "USP-S | Убийство подтверждено",
    category: "Пистолет",
    photo: "/placeholder.svg?height=200&width=200",
    rarity: "Засекреченное",
    weaponName: "USP-S",
    collectionName: "Коллекция Феникс",
    typeName: "Оружие",
  },
  {
    id: 6,
    name: "Нож-бабочка | Градиент",
    category: "Нож",
    photo: "/placeholder.svg?height=200&width=200",
    rarity: "Тайное",
    weaponName: "Нож-бабочка",
    collectionName: "Коллекция Хрома",
    typeName: "Нож",
  },
]

export default function AdminPanel() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [items, setItems] = useState<Item[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({
    total: 0,
    rarityCount: {} as Record<string, number>,
    categoryCount: {} as Record<string, number>,
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [isUsingMockData, setIsUsingMockData] = useState(false)

  // �����������ункция для расчета статистики
  const calculateStats = (items: Item[]) => {
    const rarityCount: Record<string, number> = {}
    const categoryCount: Record<string, number> = {}

    items.forEach((item) => {
      // Подсчет по редкости
      if (item.rarity) {
        if (rarityCount[item.rarity]) {
          rarityCount[item.rarity]++
        } else {
          rarityCount[item.rarity] = 1
        }
      }

      // Подсчет по категории
      if (categoryCount[item.category]) {
        categoryCount[item.category]++
      } else {
        categoryCount[item.category] = 1
      }
    })

    return {
      total: items.length,
      rarityCount,
      categoryCount,
    }
  }

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setIsLoading(true)
        setIsUsingMockData(false)

        // Используем локальный API-маршрут для обхода проблем с CORS
        const response = await fetch("/api/items", {
          cache: "no-store",
        })

        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`)
        }

        const data: ApiItem[] = await response.json()

        // Преобразуем данные API в формат, который ожидает наш компонент
        const transformedItems: Item[] = data.map((item) => ({
          id: item.id,
          name: item.name,
          category: item.category.name,
          photo: item.photo || "/placeholder.svg?height=200&width=200",
          rarity: item.rarity.name,
          weaponName: item.weapon.name,
          collectionName: item.collection.name,
          typeName: item.type.name,
          created_at: item.created_at,
        }))

        setItems(transformedItems)
        setStats(calculateStats(transformedItems))
        setError(null)
      } catch (err) {
        console.error("Error in data fetching process:", err)

        // Используем моковые данные в случае ошибки
        setItems(mockItems)
        setStats(calculateStats(mockItems))
        setIsUsingMockData(true)
        setError("Используются демо-данные для предпросмотра.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchItems()
  }, [])

  // Фильтрация предметов по поисковому запросу
  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.weaponName && item.weaponName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.rarity && item.rarity.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="bg-zinc-900 border-zinc-800 hover:bg-zinc-800 hover:text-zinc-100"
        >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={`
        fixed top-0 left-0 z-40 h-full w-64 bg-zinc-900 border-r border-zinc-800 transition-transform
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0
      `}
      >
        <div className="p-4 border-b border-zinc-800">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6" />
            Admin Dashboard
          </h1>
        </div>
        <nav className="p-4 space-y-1">
          <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-md bg-zinc-800 text-zinc-100">
            <BarChart3 size={20} />
            Dashboard
          </a>
          <a
            href="#"
            className="flex items-center gap-3 px-3 py-2 rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
          >
            <Package size={20} />
            Items
          </a>
          <a
            href="#"
            className="flex items-center gap-3 px-3 py-2 rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
          >
            <ShoppingCart size={20} />
            Orders
          </a>
          <a
            href="#"
            className="flex items-center gap-3 px-3 py-2 rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
          >
            <Users size={20} />
            Users
          </a>
          <a
            href="#"
            className="flex items-center gap-3 px-3 py-2 rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
          >
            <Settings size={20} />
            Settings
          </a>
        </nav>
        <div className="absolute bottom-0 w-full p-4 border-t border-zinc-800">
          <a
            href="#"
            className="flex items-center gap-3 px-3 py-2 rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
          >
            <LogOut size={20} />
            Logout
          </a>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:ml-64 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <h2 className="text-2xl font-bold">Items</h2>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
                <Input
                  type="search"
                  placeholder="Search items..."
                  className="pl-8 bg-zinc-900 border-zinc-800 focus-visible:ring-zinc-700"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button className="bg-zinc-800 hover:bg-zinc-700">
                <Plus size={18} className="mr-2" />
                Add Item
              </Button>
            </div>
          </div>

          {/* Item stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              <h3 className="text-zinc-500 text-sm font-medium mb-2">Total Items</h3>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              <h3 className="text-zinc-500 text-sm font-medium mb-2">Categories</h3>
              <p className="text-2xl font-bold">{Object.keys(stats.categoryCount).length}</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              <h3 className="text-zinc-500 text-sm font-medium mb-2">Rarities</h3>
              <p className="text-2xl font-bold">{Object.keys(stats.rarityCount).length}</p>
            </div>
          </div>

          {/* Loading and error states */}
          {isLoading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-zinc-400"></div>
            </div>
          )}

          {isUsingMockData && !isLoading && (
            <div className="bg-amber-900/20 border border-amber-800 text-amber-300 p-4 rounded-lg mb-6">
              <p>Используются демо-данные для предпросмотра.</p>
              <p className="mt-2 text-sm">В рабоче�� версии приложения данные будут загружаться с вашего API.</p>
            </div>
          )}

          {/* Item grid */}
          {!isLoading && (
            <>
              {searchTerm && <p className="mb-4 text-zinc-400">Найдено результатов: {filteredItems.length}</p>}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems.length > 0 ? (
                  filteredItems.map((item) => <ItemCard key={item.id} item={item} />)
                ) : (
                  <div className="col-span-full text-center py-12 text-zinc-400">
                    {searchTerm ? "Ничего не найдено по вашему запросу" : "Предметы не найдены"}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
