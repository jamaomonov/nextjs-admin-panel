"use client"

import { useState, useEffect } from "react"
import AdminLayout from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, Edit, Trash2 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import GenericForm from "@/components/generic-form"
import GenericDeleteDialog from "@/components/generic-delete-dialog"
import { useToast } from "@/components/ui/use-toast"

interface Rarity {
  id: number
  name: string
  color?: string
}

// Моковые данные дл�� использования при ошибках
const mockRarities: Rarity[] = [
  { id: 1, name: "Common", color: "#d3d3d3" },
  { id: 2, name: "Uncommon", color: "#add8e6" },
  { id: 3, name: "Rare", color: "#87ceeb" },
  { id: 4, name: "Epic", color: "#9370db" },
  { id: 5, name: "Legendary", color: "#ff69b4" },
]

// Функция для определения цвета редкости
const getRarityColor = (name: string): string => {
  const rarityLower = name.toLowerCase()

  switch (rarityLower) {
    case "common":
      return "#d3d3d3"
    case "uncommon":
      return "#add8e6"
    case "rare":
      return "#87ceeb"
    case "epic":
      return "#9370db"
    case "legendary":
      return "#ff69b4"
    case "arcane":
      return "#ff4500"
    case "nameless":
      return "#b8860b"
    default:
      return "#808080" // Default gray
  }
}

export default function RaritiesPage() {
  const { toast } = useToast()
  const [rarities, setRarities] = useState<Rarity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isUsingMockData, setIsUsingMockData] = useState(false)

  // Состояния для модальных окон
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [currentRarity, setCurrentRarity] = useState<Rarity | null>(null)

  const fetchRarities = async () => {
    try {
      setIsLoading(true)
      setIsUsingMockData(false)

      const response = await fetch("/api/rarities", {
        cache: "no-store",
      })

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`)
      }

      const data: Rarity[] = await response.json()

      // Добавляем цвета к редкостям, если их нет в API
      const raritiesWithColors = data.map((rarity) => ({
        ...rarity,
        color: rarity.color || getRarityColor(rarity.name),
      }))

      setRarities(raritiesWithColors)
    } catch (err) {
      console.error("Error fetching rarities:", err)
      setRarities(mockRarities)
      setIsUsingMockData(true)
      toast({
        title: "Внимание",
        description: "Используются демо-данные для предпросмотра.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchRarities()
  }, [])

  // Фильтрация редкостей по поисковому запросу
  const filteredRarities = rarities.filter((rarity) => rarity.name.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <AdminLayout>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Rarities</h1>
          <p className="text-zinc-400">Manage item rarity levels</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
            <Input
              type="search"
              placeholder="Search rarities..."
              className="pl-8 bg-zinc-900 border-zinc-800 focus-visible:ring-zinc-700"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button className="bg-zinc-800 hover:bg-zinc-700" onClick={() => setIsAddDialogOpen(true)}>
            <Plus size={18} className="mr-2" />
            Add Rarity
          </Button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-zinc-400"></div>
        </div>
      )}

      {isUsingMockData && !isLoading && (
        <div className="bg-amber-900/20 border border-amber-800 text-amber-300 p-4 rounded-lg mb-6">
          <p>Используются демо-данные для предпросмотра.</p>
          <p className="mt-2 text-sm">В рабочей версии приложения данные будут загружаться с вашего API.</p>
        </div>
      )}

      {/* Rarities table */}
      {!isLoading && (
        <>
          {searchTerm && <p className="mb-4 text-zinc-400">Найдено результатов: {filteredRarities.length}</p>}
          <div className="rounded-md border border-zinc-800 overflow-hidden">
            <Table>
              <TableHeader className="bg-zinc-900">
                <TableRow className="hover:bg-zinc-900/80 border-zinc-800">
                  <TableHead className="text-zinc-400">ID</TableHead>
                  <TableHead className="text-zinc-400">Name</TableHead>
                  <TableHead className="text-zinc-400">Color</TableHead>
                  <TableHead className="text-zinc-400 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRarities.length > 0 ? (
                  filteredRarities.map((rarity) => (
                    <TableRow key={rarity.id} className="hover:bg-zinc-900/50 border-zinc-800">
                      <TableCell>{rarity.id}</TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: rarity.color }}></div>
                          {rarity.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono bg-zinc-900 border-zinc-700">
                          {rarity.color}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setCurrentRarity(rarity)
                              setIsEditDialogOpen(true)
                            }}
                            className="h-8 w-8 text-zinc-400 hover:text-zinc-100"
                          >
                            <Edit size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setCurrentRarity(rarity)
                              setIsDeleteDialogOpen(true)
                            }}
                            className="h-8 w-8 text-red-400 hover:text-red-300"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      {searchTerm ? "Ничего не найдено по вашему запросу" : "Редкости не найдены"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {/* Модальное окно для добавления редкости */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 max-w-2xl">
          <DialogHeader>
            <DialogTitle>Добавить новую редкость</DialogTitle>
          </DialogHeader>
          <GenericForm
            endpoint="/api/rarities"
            entityName="Редкость"
            fields={[
              { name: "name", label: "Название", type: "text", required: true },
              { name: "color", label: "Цвет", type: "color", required: true, defaultValue: "#808080" },
            ]}
            onSuccess={() => {
              setIsAddDialogOpen(false)
              fetchRarities()
            }}
            onCancel={() => setIsAddDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Модальное окно для редактирования редкости */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 max-w-2xl">
          <DialogHeader>
            <DialogTitle>Редактировать редкость</DialogTitle>
          </DialogHeader>
          {currentRarity && (
            <GenericForm
              endpoint="/api/rarities"
              entityName="Редкость"
              initialData={currentRarity}
              fields={[
                { name: "name", label: "Название", type: "text", required: true },
                { name: "color", label: "Цвет", type: "color", required: true },
              ]}
              onSuccess={() => {
                setIsEditDialogOpen(false)
                fetchRarities()
              }}
              onCancel={() => setIsEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Диалог подтверждения удаления */}
      {currentRarity && (
        <GenericDeleteDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={() => {
            setIsDeleteDialogOpen(false)
            fetchRarities()
          }}
          endpoint="/api/rarities"
          id={currentRarity.id}
          entityName="редкость"
          entityLabel={currentRarity.name}
        />
      )}
    </AdminLayout>
  )
}
