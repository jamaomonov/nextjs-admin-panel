"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import ImageUpload from "@/components/image-upload"
import { useRouter } from "next/navigation"

interface ItemFormProps {
  initialData?: {
    id?: number
    name: string
    photo: string
    type_id: number
    rarity_id: number
    category_id: number
    collection_id: number
    weapon_id: number
  }
  onSuccess: () => void
  onCancel: () => void
}

interface SelectOption {
  id: number
  name: string
}

export default function ItemForm({ initialData, onSuccess, onCancel }: ItemFormProps) {
  const router = useRouter()
  const isEditing = !!initialData?.id

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    photo: initialData?.photo || "",
    type_id: initialData?.type_id || "",
    rarity_id: initialData?.rarity_id || "",
    category_id: initialData?.category_id || "",
    collection_id: initialData?.collection_id || "",
    weapon_id: initialData?.weapon_id || "",
  })

  const [types, setTypes] = useState<SelectOption[]>([])
  const [rarities, setRarities] = useState<SelectOption[]>([])
  const [categories, setCategories] = useState<SelectOption[]>([])
  const [collections, setCollections] = useState<SelectOption[]>([])
  const [weapons, setWeapons] = useState<SelectOption[]>([])
  const [isLoadingOptions, setIsLoadingOptions] = useState(true)

  // Загрузка опций для выпадающих списков
  useEffect(() => {
    const fetchOptions = async () => {
      setIsLoadingOptions(true)
      try {
        const [typesRes, raritiesRes, categoriesRes, collectionsRes, weaponsRes] = await Promise.all([
          fetch("/api/types", { next: { revalidate: 60 } }),
          fetch("/api/rarities", { next: { revalidate: 60 } }),
          fetch("/api/categories", { next: { revalidate: 60 } }),
          fetch("/api/collections", { next: { revalidate: 60 } }),
          fetch("/api/weapons", { next: { revalidate: 60 } }),
        ])

        const typesData = await typesRes.json()
        const raritiesData = await raritiesRes.json()
        const categoriesData = await categoriesRes.json()
        const collectionsData = await collectionsRes.json()
        const weaponsData = await weaponsRes.json()

        setTypes(typesData)
        setRarities(raritiesData)
        setCategories(categoriesData)
        setCollections(collectionsData)
        setWeapons(weaponsData)
      } catch (error) {
        console.error("Error loading form options:", error)
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить данные для формы",
          variant: "destructive",
        })
      } finally {
        setIsLoadingOptions(false)
      }
    }

    fetchOptions()
  }, [])

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
    // Clear error when user makes changes
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Validate required fields before sending
      const requiredFields = ["name", "photo", "type_id", "rarity_id", "category_id", "collection_id", "weapon_id"]
      const missingFields = requiredFields.filter((field) => !formData[field])

      if (missingFields.length > 0) {
        throw new Error(`Пожалуйста, заполните все обязательные поля: ${missingFields.join(", ")}`)
      }

      // Ensure all ID fields are numbers, not empty strings
      const processedData = {
        ...formData,
        type_id: formData.type_id ? Number(formData.type_id) : null,
        rarity_id: formData.rarity_id ? Number(formData.rarity_id) : null,
        category_id: formData.category_id ? Number(formData.category_id) : null,
        collection_id: formData.collection_id ? Number(formData.collection_id) : null,
        weapon_id: formData.weapon_id ? Number(formData.weapon_id) : null,
      }

      const url = isEditing ? `/api/items/${initialData.id}` : "/api/items"
      const method = isEditing ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(processedData),
      })

      const responseData = await response.json()

      if (!response.ok) {
        if (response.status === 400 || response.status === 422) {
          // Handle Bad Request or Unprocessable Entity with details
          const errorMessage = responseData.error || responseData.message || responseData.detail || "Неверные данные"
          let errorDetails = ""

          if (responseData.details) {
            errorDetails =
              typeof responseData.details === "object"
                ? JSON.stringify(responseData.details, null, 2)
                : responseData.details
          }

          throw new Error(`${errorMessage}${errorDetails ? `\n${errorDetails}` : ""}`)
        }
        throw new Error(responseData.error || "Произошла ошибка при сохранении")
      }

      toast({
        title: "Успешно",
        description: isEditing ? "Предмет обновлен" : "Предмет создан",
      })

      // Invalidate cache to refresh data
      router.refresh()

      onSuccess()
    } catch (error) {
      console.error("Error saving item:", error)
      setError(error instanceof Error ? error.message : "Произошла ошибка при сохранении")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingOptions) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
        <span className="ml-2 text-zinc-400">Загрузка данных...</span>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive" className="bg-red-900/20 border-red-800 text-red-300">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="whitespace-pre-wrap">{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Название</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => handleChange("name", e.target.value)}
          placeholder="Введите название предмета"
          className="bg-zinc-800 border-zinc-700"
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Изображение</Label>
        <ImageUpload
          value={formData.photo}
          onChange={(path) => handleChange("photo", path)}
          onError={(errorMessage) => setError(errorMessage)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type">Тип</Label>
          <Select
            value={formData.type_id ? formData.type_id.toString() : ""}
            onValueChange={(value) => handleChange("type_id", value ? Number.parseInt(value) : "")}
          >
            <SelectTrigger className="bg-zinc-800 border-zinc-700">
              <SelectValue placeholder="Не выбрано" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-700">
              {types.map((type) => (
                <SelectItem key={type.id} value={type.id.toString()}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="rarity">Редкость</Label>
          <Select
            value={formData.rarity_id ? formData.rarity_id.toString() : ""}
            onValueChange={(value) => handleChange("rarity_id", value ? Number.parseInt(value) : "")}
          >
            <SelectTrigger className="bg-zinc-800 border-zinc-700">
              <SelectValue placeholder="Не выбрано" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-700">
              {rarities.map((rarity) => (
                <SelectItem key={rarity.id} value={rarity.id.toString()}>
                  {rarity.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Категория</Label>
          <Select
            value={formData.category_id ? formData.category_id.toString() : ""}
            onValueChange={(value) => handleChange("category_id", value ? Number.parseInt(value) : "")}
          >
            <SelectTrigger className="bg-zinc-800 border-zinc-700">
              <SelectValue placeholder="Не выбрано" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-700">
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="collection">Коллекция</Label>
          <Select
            value={formData.collection_id ? formData.collection_id.toString() : ""}
            onValueChange={(value) => handleChange("collection_id", value ? Number.parseInt(value) : "")}
          >
            <SelectTrigger className="bg-zinc-800 border-zinc-700">
              <SelectValue placeholder="Не выбрано" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-700">
              {collections.map((collection) => (
                <SelectItem key={collection.id} value={collection.id.toString()}>
                  {collection.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="weapon">Оружие</Label>
          <Select
            value={formData.weapon_id ? formData.weapon_id.toString() : ""}
            onValueChange={(value) => handleChange("weapon_id", value ? Number.parseInt(value) : "")}
          >
            <SelectTrigger className="bg-zinc-800 border-zinc-700">
              <SelectValue placeholder="Не выбрано" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-700">
              {weapons.map((weapon) => (
                <SelectItem key={weapon.id} value={weapon.id.toString()}>
                  {weapon.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
        >
          Отмена
        </Button>
        <Button type="submit" disabled={isLoading} className="bg-zinc-700 hover:bg-zinc-600">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? "Сохранить" : "Создать"}
        </Button>
      </div>
    </form>
  )
}
