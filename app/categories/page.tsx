"use client"

import { useState, useEffect } from "react"
import AdminLayout from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, Edit, Trash2 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import GenericForm from "@/components/generic-form"
import GenericDeleteDialog from "@/components/generic-delete-dialog"
import { useToast } from "@/components/ui/use-toast"

interface Category {
  id: number
  name: string
}

// Моковые данные для использования при ошибках
const mockCategories: Category[] = [
  { id: 1, name: "Винтовка" },
  { id: 2, name: "Пистолет" },
  { id: 3, name: "Нож" },
  { id: 4, name: "Перчатки" },
  { id: 5, name: "Снайперская винтовка" },
]

export default function CategoriesPage() {
  const { toast } = useToast()
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isUsingMockData, setIsUsingMockData] = useState(false)

  // Состояния для модальных окон
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null)

  const fetchCategories = async () => {
    try {
      setIsLoading(true)
      setIsUsingMockData(false)

      const response = await fetch("/api/categories", {
        cache: "no-store",
      })

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`)
      }

      const data: Category[] = await response.json()
      setCategories(data)
    } catch (err) {
      console.error("Error fetching categories:", err)
      setCategories(mockCategories)
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
    fetchCategories()
  }, [])

  // Фильтрация категорий по поисковому запросу
  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <AdminLayout>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Categories</h1>
          <p className="text-zinc-400">Manage item categories</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
            <Input
              type="search"
              placeholder="Search categories..."
              className="pl-8 bg-zinc-900 border-zinc-800 focus-visible:ring-zinc-700"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button className="bg-zinc-800 hover:bg-zinc-700" onClick={() => setIsAddDialogOpen(true)}>
            <Plus size={18} className="mr-2" />
            Add Category
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

      {/* Categories table */}
      {!isLoading && (
        <>
          {searchTerm && <p className="mb-4 text-zinc-400">Найдено результатов: {filteredCategories.length}</p>}
          <div className="rounded-md border border-zinc-800 overflow-hidden">
            <Table>
              <TableHeader className="bg-zinc-900">
                <TableRow className="hover:bg-zinc-900/80 border-zinc-800">
                  <TableHead className="text-zinc-400">ID</TableHead>
                  <TableHead className="text-zinc-400">Name</TableHead>
                  <TableHead className="text-zinc-400 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.length > 0 ? (
                  filteredCategories.map((category) => (
                    <TableRow key={category.id} className="hover:bg-zinc-900/50 border-zinc-800">
                      <TableCell>{category.id}</TableCell>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setCurrentCategory(category)
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
                              setCurrentCategory(category)
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
                    <TableCell colSpan={3} className="h-24 text-center">
                      {searchTerm ? "Ничего не найдено по вашему запросу" : "Категории не найдены"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {/* Модальное окно для добавления категории */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 max-w-2xl">
          <DialogHeader>
            <DialogTitle>Добавить новую категорию</DialogTitle>
          </DialogHeader>
          <GenericForm
            endpoint="/api/categories"
            entityName="Категория"
            fields={[{ name: "name", label: "Название", type: "text", required: true }]}
            onSuccess={() => {
              setIsAddDialogOpen(false)
              fetchCategories()
            }}
            onCancel={() => setIsAddDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Мод��льное окно для редактирования категории */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 max-w-2xl">
          <DialogHeader>
            <DialogTitle>Редактировать категорию</DialogTitle>
          </DialogHeader>
          {currentCategory && (
            <GenericForm
              endpoint="/api/categories"
              entityName="Категория"
              initialData={currentCategory}
              fields={[{ name: "name", label: "Название", type: "text", required: true }]}
              onSuccess={() => {
                setIsEditDialogOpen(false)
                fetchCategories()
              }}
              onCancel={() => setIsEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Диалог подтверждения удаления */}
      {currentCategory && (
        <GenericDeleteDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={() => {
            setIsDeleteDialogOpen(false)
            fetchCategories()
          }}
          endpoint="/api/categories"
          id={currentCategory.id}
          entityName="категорию"
          entityLabel={currentCategory.name}
        />
      )}
    </AdminLayout>
  )
}
