"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, Filter } from "lucide-react"
import AdminLayout from "@/components/admin-layout"
import ItemCard from "@/components/product-card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import ItemForm from "@/components/item-form"
import DeleteItemDialog from "@/components/delete-item-dialog"
import { useToast } from "@/components/ui/use-toast"
import { useMobile } from "@/hooks/use-mobile"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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
  category: string
  photo: string
  rarity?: string
  weaponName?: string
  collectionName?: string
  typeName?: string
  created_at?: string
  // Добавляем ID для связанных сущностей для редактирования
  type_id: number
  rarity_id: number
  category_id: number
  collection_id: number
  weapon_id: number
}

// Константы для пагинации
const ITEMS_PER_PAGE = 9

export default function ItemsPage() {
  const { toast } = useToast()
  const [items, setItems] = useState<Item[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({
    total: 0,
    rarityCount: {} as Record<string, number>,
    categoryCount: {} as Record<string, number>,
  })
  const [searchTerm, setSearchTerm] = useState("")
  const isMobile = useMobile()

  // Состояния для модальных окон
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [currentItem, setCurrentItem] = useState<Item | null>(null)

  // Состояния для пагинации и фильтрации
  const [currentPage, setCurrentPage] = useState(1)
  const [rarityFilter, setRarityFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("name")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")

  // Функция для расчета статистики
  const calculateStats = useCallback((items: Item[]) => {
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
  }, [])

  // Мемоизированная функция для загрузки предметов
  const fetchItems = useCallback(async () => {
    try {
      setIsLoading(true)

      // Используем AbortController для возможности отмены запроса
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 секунд таймаут

      const response = await fetch("/api/items", {
        cache: "no-store",
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`)
      }

      const data: ApiItem[] = await response.json()

      // Преобразуем данные API в формат, который ожидает наш компонент
      const transformedItems: Item[] = data.map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category.name,
        photo: item.photo || "",
        rarity: item.rarity.name,
        weaponName: item.weapon.name,
        collectionName: item.collection.name,
        typeName: item.type.name,
        created_at: item.created_at,
        // Добавляем ID для связанных сущностей
        type_id: item.type.id,
        rarity_id: item.rarity.id,
        category_id: item.category.id,
        collection_id: item.collection.id,
        weapon_id: item.weapon.id,
      }))

      setItems(transformedItems)
      setStats(calculateStats(transformedItems))
      setError(null)
    } catch (err) {
      console.error("Error in data fetching process:", err)
      setError("Ошибка при загрузке данных")
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить список предметов",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast, calculateStats])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  // Получаем уникальные значения для фильтров
  const filters = useMemo(() => {
    const rarities = new Set<string>()
    const categories = new Set<string>()
    const types = new Set<string>()

    items.forEach((item) => {
      if (item.rarity) rarities.add(item.rarity)
      if (item.category) categories.add(item.category)
      if (item.typeName) types.add(item.typeName)
    })

    return {
      rarities: Array.from(rarities),
      categories: Array.from(categories),
      types: Array.from(types),
    }
  }, [items])

  // Мемоизированная фильтрация и сортировка предметов
  const filteredAndSortedItems = useMemo(() => {
    // Фильтрация по поисковому запросу и фильтрам
    const result = items.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.weaponName && item.weaponName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.rarity && item.rarity.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.typeName && item.typeName.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchesRarity = rarityFilter === "all" || item.rarity === rarityFilter
      const matchesCategory = categoryFilter === "all" || item.category === categoryFilter
      const matchesType = typeFilter === "all" || item.typeName === typeFilter

      return matchesSearch && matchesRarity && matchesCategory && matchesType
    })

    // Сортировка
    result.sort((a, b) => {
      let valueA, valueB

      switch (sortBy) {
        case "name":
          valueA = a.name
          valueB = b.name
          break
        case "rarity":
          valueA = a.rarity || ""
          valueB = b.rarity || ""
          break
        case "category":
          valueA = a.category
          valueB = b.category
          break
        case "type":
          valueA = a.typeName || ""
          valueB = b.typeName || ""
          break
        case "date":
          valueA = a.created_at || ""
          valueB = b.created_at || ""
          break
        default:
          valueA = a.name
          valueB = b.name
      }

      if (sortOrder === "asc") {
        return valueA.localeCompare(valueB)
      } else {
        return valueB.localeCompare(valueA)
      }
    })

    return result
  }, [items, searchTerm, rarityFilter, categoryFilter, typeFilter, sortBy, sortOrder])

  // Пагинация
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredAndSortedItems.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [filteredAndSortedItems, currentPage])

  // Обработчик поиска
  const handleSearch = (term: string) => {
    setSearchTerm(term)
    setCurrentPage(1) // Сбрасываем на первую страницу при поиске
  }

  // Обработчики для модальных окон
  const handleAddItem = () => {
    setIsAddDialogOpen(true)
  }

  const handleEditItem = (item: Item) => {
    setCurrentItem(item)
    setIsEditDialogOpen(true)
  }

  const handleDeleteItem = (item: Item) => {
    setCurrentItem(item)
    setIsDeleteDialogOpen(true)
  }

  const handleFormSuccess = () => {
    setIsAddDialogOpen(false)
    setIsEditDialogOpen(false)
    fetchItems() // Обновляем список предметов
  }

  const handleDeleteSuccess = () => {
    setIsDeleteDialogOpen(false)
    fetchItems() // Обновляем список предметов
  }

  // Компонент для отображения пагинации
  const Pagination = () => {
    const totalPages = Math.ceil(filteredAndSortedItems.length / ITEMS_PER_PAGE)

    return (
      <div className="flex justify-between items-center mt-4 flex-wrap gap-2">
        <div className="text-sm text-zinc-400">
          Показано {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredAndSortedItems.length)} -{" "}
          {Math.min(currentPage * ITEMS_PER_PAGE, filteredAndSortedItems.length)} из {filteredAndSortedItems.length}
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
          >
            Назад
          </Button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            // Показываем максимум 5 страниц
            let pageNum = i + 1
            if (totalPages > 5 && currentPage > 3) {
              pageNum = currentPage - 3 + i
              if (pageNum > totalPages) pageNum = totalPages - (4 - i)
            }

            return (
              <Button
                key={pageNum}
                variant={currentPage === pageNum ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(pageNum)}
                className={currentPage === pageNum ? "bg-zinc-700" : "bg-zinc-800 border-zinc-700 hover:bg-zinc-700"}
              >
                {pageNum}
              </Button>
            )
          })}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages || totalPages === 0}
            className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
          >
            Вперед
          </Button>
        </div>
      </div>
    )
  }

  // Компонент для отображения скелетона загрузки
  const ItemSkeleton = () => (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden h-full">
      <div className="h-48 bg-zinc-800 animate-pulse"></div>
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="h-6 w-3/4 bg-zinc-800 rounded animate-pulse"></div>
          <div className="h-8 w-8 bg-zinc-800 rounded animate-pulse"></div>
        </div>
        <div className="flex gap-2 mb-3">
          <div className="h-6 w-16 bg-zinc-800 rounded animate-pulse"></div>
          <div className="h-6 w-20 bg-zinc-800 rounded animate-pulse"></div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <div className="h-4 w-16 bg-zinc-800 rounded animate-pulse"></div>
            <div className="h-4 w-24 bg-zinc-800 rounded animate-pulse"></div>
          </div>
          <div className="flex justify-between">
            <div className="h-4 w-20 bg-zinc-800 rounded animate-pulse"></div>
            <div className="h-4 w-24 bg-zinc-800 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
      <div className="p-4 pt-0 flex gap-2">
        <div className="h-9 flex-1 bg-zinc-800 rounded animate-pulse"></div>
        <div className="h-9 flex-1 bg-zinc-800 rounded animate-pulse"></div>
      </div>
    </div>
  )

  return (
    <AdminLayout>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Items</h1>
          <p className="text-zinc-400">Manage your items inventory</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-grow">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
            <Input
              type="search"
              placeholder="Search items..."
              className="pl-8 bg-zinc-900 border-zinc-800 focus-visible:ring-zinc-700"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700">
                <Filter size={16} className="mr-2" />
                Filters
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-zinc-900 border-zinc-800 w-56">
              <DropdownMenuLabel>Sort by</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-zinc-800" />
              <DropdownMenuCheckboxItem
                checked={sortBy === "name" && sortOrder === "asc"}
                onCheckedChange={() => {
                  setSortBy("name")
                  setSortOrder("asc")
                }}
              >
                Name (A-Z)
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={sortBy === "name" && sortOrder === "desc"}
                onCheckedChange={() => {
                  setSortBy("name")
                  setSortOrder("desc")
                }}
              >
                Name (Z-A)
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={sortBy === "date" && sortOrder === "desc"}
                onCheckedChange={() => {
                  setSortBy("date")
                  setSortOrder("desc")
                }}
              >
                Newest first
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={sortBy === "date" && sortOrder === "asc"}
                onCheckedChange={() => {
                  setSortBy("date")
                  setSortOrder("asc")
                }}
              >
                Oldest first
              </DropdownMenuCheckboxItem>

              <DropdownMenuLabel className="mt-2">Rarity</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-zinc-800" />
              <DropdownMenuCheckboxItem checked={rarityFilter === "all"} onCheckedChange={() => setRarityFilter("all")}>
                All rarities
              </DropdownMenuCheckboxItem>
              {filters.rarities.map((rarity) => (
                <DropdownMenuCheckboxItem
                  key={rarity}
                  checked={rarityFilter === rarity}
                  onCheckedChange={() => setRarityFilter(rarity)}
                >
                  {rarity}
                </DropdownMenuCheckboxItem>
              ))}

              <DropdownMenuLabel className="mt-2">Type</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-zinc-800" />
              <DropdownMenuCheckboxItem checked={typeFilter === "all"} onCheckedChange={() => setTypeFilter("all")}>
                All types
              </DropdownMenuCheckboxItem>
              {filters.types.map((type) => (
                <DropdownMenuCheckboxItem
                  key={type}
                  checked={typeFilter === type}
                  onCheckedChange={() => setTypeFilter(type)}
                >
                  {type}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button className="bg-zinc-800 hover:bg-zinc-700" onClick={handleAddItem}>
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

      {/* Error state */}
      {error && !isLoading && (
        <div className="bg-red-900/20 border border-red-800 text-red-300 p-4 rounded-lg mb-6">
          <p>{error}</p>
        </div>
      )}

      {/* Item grid */}
      <div>
        {searchTerm || rarityFilter !== "all" || categoryFilter !== "all" || typeFilter !== "all" ? (
          <p className="mb-4 text-zinc-400">Найдено результатов: {filteredAndSortedItems.length}</p>
        ) : null}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            // Скелетоны загрузки
            Array(6)
              .fill(0)
              .map((_, index) => <ItemSkeleton key={index} />)
          ) : paginatedItems.length > 0 ? (
            // Отображение предметов
            paginatedItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onEdit={() => handleEditItem(item)}
                onDelete={() => handleDeleteItem(item)}
              />
            ))
          ) : (
            // Сообщение, если ничего не найдено
            <div className="col-span-full text-center py-12 text-zinc-400">
              {searchTerm || rarityFilter !== "all" || categoryFilter !== "all" || typeFilter !== "all"
                ? "Ничего не найдено по вашему запросу"
                : "Предметы не найдены"}
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {!isLoading && filteredAndSortedItems.length > ITEMS_PER_PAGE && <Pagination />}

      {/* Модальное окно для добавления предмета */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Добавить новый предмет</DialogTitle>
          </DialogHeader>
          <ItemForm onSuccess={handleFormSuccess} onCancel={() => setIsAddDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Модальное окно для редактирования предмета */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Редактировать предмет</DialogTitle>
          </DialogHeader>
          {currentItem && (
            <ItemForm
              initialData={{
                id: currentItem.id,
                name: currentItem.name,
                photo: currentItem.photo,
                type_id: currentItem.type_id,
                rarity_id: currentItem.rarity_id,
                category_id: currentItem.category_id,
                collection_id: currentItem.collection_id,
                weapon_id: currentItem.weapon_id,
              }}
              onSuccess={handleFormSuccess}
              onCancel={() => setIsEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Диалог подтверждения удаления */}
      {currentItem && (
        <DeleteItemDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={handleDeleteSuccess}
          itemId={currentItem.id}
          itemName={currentItem.name}
        />
      )}
    </AdminLayout>
  )
}
