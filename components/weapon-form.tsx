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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { useRouter } from "next/navigation"

interface WeaponFormProps {
  initialData?: {
    id?: number
    name: string
    type_id: number
    damage?: number
    fire_rate?: number
    recoil?: number
    range?: number
    mobility?: number
    armor_penetration?: number
    penetration_power?: number
    ammo?: number
    cost?: number
    damage_info?: {
      armor?: {
        arms?: number
        chest?: number
        head?: number
        legs?: number
        stomach?: number
      }
      no_armor?: {
        arms?: number
        chest?: number
        head?: number
        legs?: number
        stomach?: number
      }
    }
  }
  onSuccess: () => void
  onCancel: () => void
}

interface SelectOption {
  id: number
  name: string
}

export default function WeaponForm({ initialData, onSuccess, onCancel }: WeaponFormProps) {
  const router = useRouter()
  const isEditing = !!initialData?.id

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    type_id: initialData?.type_id || "",
    damage: initialData?.damage || "0",
    fire_rate: initialData?.fire_rate || "0",
    recoil: initialData?.recoil || "0",
    range: initialData?.range || "0",
    mobility: initialData?.mobility || "0",
    armor_penetration: initialData?.armor_penetration || "0",
    penetration_power: initialData?.penetration_power || "0",
    ammo: initialData?.ammo || "0",
    cost: initialData?.cost || "0",
    damage_info: {
      armor: {
        arms: initialData?.damage_info?.armor?.arms || "0",
        chest: initialData?.damage_info?.armor?.chest || "0",
        head: initialData?.damage_info?.armor?.head || "0",
        legs: initialData?.damage_info?.armor?.legs || "0",
        stomach: initialData?.damage_info?.armor?.stomach || "0",
      },
      no_armor: {
        arms: initialData?.damage_info?.no_armor?.arms || "0",
        chest: initialData?.damage_info?.no_armor?.chest || "0",
        head: initialData?.damage_info?.no_armor?.head || "0",
        legs: initialData?.damage_info?.no_armor?.legs || "0",
        stomach: initialData?.damage_info?.no_armor?.stomach || "0",
      },
    },
  })

  const [types, setTypes] = useState<SelectOption[]>([])
  const [isLoadingOptions, setIsLoadingOptions] = useState(true)

  // Загрузка типов оружия
  useEffect(() => {
    const fetchTypes = async () => {
      setIsLoadingOptions(true)
      try {
        const response = await fetch("/api/types", { next: { revalidate: 60 } })

        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`)
        }

        const data = await response.json()
        setTypes(data)
      } catch (error) {
        console.error("Error loading weapon types:", error)
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить типы оружия",
          variant: "destructive",
        })
      } finally {
        setIsLoadingOptions(false)
      }
    }

    fetchTypes()
  }, [])

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
    // Clear error when user makes changes
    setError(null)
  }

  const handleDamageInfoChange = (
    category: "armor" | "no_armor",
    field: "arms" | "chest" | "head" | "legs" | "stomach",
    value: string | number,
  ) => {
    setFormData((prev) => ({
      ...prev,
      damage_info: {
        ...prev.damage_info,
        [category]: {
          ...prev.damage_info[category],
          [field]: value,
        },
      },
    }))
    // Clear error when user makes changes
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Validate required fields
      if (!formData.name || !formData.type_id) {
        throw new Error("Название и тип оружия обязательны для заполнения")
      }

      // Process form data to ensure correct types and remove empty fields
      const processedData: Record<string, any> = {
        name: formData.name,
        type_id: Number(formData.type_id),
      }

      // Add optional numeric fields if they have values
      const numericFields = [
        "damage",
        "fire_rate",
        "recoil",
        "range",
        "mobility",
        "armor_penetration",
        "penetration_power",
        "ammo",
        "cost",
      ]

      numericFields.forEach((field) => {
        if (formData[field] !== "") {
          processedData[field] = Number(formData[field])
        }
      })

      // Process damage_info if any values are provided
      const armorDamage = formData.damage_info.armor
      const noArmorDamage = formData.damage_info.no_armor

      const hasArmorDamage = Object.values(armorDamage).some((value) => value !== "")
      const hasNoArmorDamage = Object.values(noArmorDamage).some((value) => value !== "")

      if (hasArmorDamage || hasNoArmorDamage) {
        processedData.damage_info = {}

        if (hasArmorDamage) {
          processedData.damage_info.armor = {}
          Object.entries(armorDamage).forEach(([key, value]) => {
            if (value !== "") {
              processedData.damage_info.armor[key] = Number(value)
            }
          })
        }

        if (hasNoArmorDamage) {
          processedData.damage_info.no_armor = {}
          Object.entries(noArmorDamage).forEach(([key, value]) => {
            if (value !== "") {
              processedData.damage_info.no_armor[key] = Number(value)
            }
          })
        }
      }

      const url = isEditing ? `/api/weapons/${initialData.id}` : "/api/weapons"
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
        description: isEditing ? "Оружие обновлено" : "Оружие создано",
      })

      // Invalidate cache to refresh data
      router.refresh()

      onSuccess()
    } catch (error) {
      console.error("Error saving weapon:", error)
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive" className="bg-red-900/20 border-red-800 text-red-300">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="whitespace-pre-wrap">{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="bg-zinc-900 border border-zinc-800 mb-4">
          <TabsTrigger value="basic">Основное</TabsTrigger>
          <TabsTrigger value="stats">Характеристики</TabsTrigger>
          <TabsTrigger value="damage">Урон</TabsTrigger>
        </TabsList>

        {/* Основные параметры */}
        <TabsContent value="basic" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Название*</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Введите название оружия"
              className="bg-zinc-800 border-zinc-700"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Тип*</Label>
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
            <Label htmlFor="cost">Стоимость</Label>
            <Input
              id="cost"
              type="number"
              value={formData.cost}
              onChange={(e) => handleChange("cost", e.target.value)}
              placeholder="Стоимость оружия"
              className="bg-zinc-800 border-zinc-700"
            />
          </div>
        </TabsContent>

        {/* Характеристики оружия */}
        <TabsContent value="stats" className="space-y-4">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="damage">Урон</Label>
                  <Input
                    id="damage"
                    type="number"
                    value={formData.damage}
                    onChange={(e) => handleChange("damage", e.target.value)}
                    placeholder="Базовый урон"
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fire_rate">Скорострельность</Label>
                  <Input
                    id="fire_rate"
                    type="number"
                    value={formData.fire_rate}
                    onChange={(e) => handleChange("fire_rate", e.target.value)}
                    placeholder="Выстрелов в минуту"
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recoil">Отдача</Label>
                  <Input
                    id="recoil"
                    type="number"
                    value={formData.recoil}
                    onChange={(e) => handleChange("recoil", e.target.value)}
                    placeholder="Уровень отдачи"
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="range">Дальность</Label>
                  <Input
                    id="range"
                    type="number"
                    value={formData.range}
                    onChange={(e) => handleChange("range", e.target.value)}
                    placeholder="Эффективная дальность"
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mobility">Мобильность</Label>
                  <Input
                    id="mobility"
                    type="number"
                    value={formData.mobility}
                    onChange={(e) => handleChange("mobility", e.target.value)}
                    placeholder="Скорость передвижения"
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ammo">Боезапас</Label>
                  <Input
                    id="ammo"
                    type="number"
                    value={formData.ammo}
                    onChange={(e) => handleChange("ammo", e.target.value)}
                    placeholder="Количество патронов"
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="armor_penetration">Пробитие брони</Label>
                  <Input
                    id="armor_penetration"
                    type="number"
                    value={formData.armor_penetration}
                    onChange={(e) => handleChange("armor_penetration", e.target.value)}
                    placeholder="Процент пробития брони"
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="penetration_power">Сила пробития</Label>
                  <Input
                    id="penetration_power"
                    type="number"
                    value={formData.penetration_power}
                    onChange={(e) => handleChange("penetration_power", e.target.value)}
                    placeholder="Сила пробития материалов"
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Информация об уроне */}
        <TabsContent value="damage" className="space-y-4">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-4">Урон по броне</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div className="space-y-2">
                  <Label htmlFor="armor_head">Голова</Label>
                  <Input
                    id="armor_head"
                    type="number"
                    value={formData.damage_info.armor.head}
                    onChange={(e) => handleDamageInfoChange("armor", "head", e.target.value)}
                    placeholder="Урон в голову"
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="armor_chest">Грудь</Label>
                  <Input
                    id="armor_chest"
                    type="number"
                    value={formData.damage_info.armor.chest}
                    onChange={(e) => handleDamageInfoChange("armor", "chest", e.target.value)}
                    placeholder="Урон в грудь"
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="armor_stomach">Живот</Label>
                  <Input
                    id="armor_stomach"
                    type="number"
                    value={formData.damage_info.armor.stomach}
                    onChange={(e) => handleDamageInfoChange("armor", "stomach", e.target.value)}
                    placeholder="Урон в живот"
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="armor_arms">Руки</Label>
                  <Input
                    id="armor_arms"
                    type="number"
                    value={formData.damage_info.armor.arms}
                    onChange={(e) => handleDamageInfoChange("armor", "arms", e.target.value)}
                    placeholder="Урон в руки"
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="armor_legs">Ноги</Label>
                  <Input
                    id="armor_legs"
                    type="number"
                    value={formData.damage_info.armor.legs}
                    onChange={(e) => handleDamageInfoChange("armor", "legs", e.target.value)}
                    placeholder="Урон в ноги"
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>
              </div>

              <h3 className="text-lg font-medium mb-4">Урон без брони</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="no_armor_head">Голова</Label>
                  <Input
                    id="no_armor_head"
                    type="number"
                    value={formData.damage_info.no_armor.head}
                    onChange={(e) => handleDamageInfoChange("no_armor", "head", e.target.value)}
                    placeholder="Урон в голову"
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="no_armor_chest">Грудь</Label>
                  <Input
                    id="no_armor_chest"
                    type="number"
                    value={formData.damage_info.no_armor.chest}
                    onChange={(e) => handleDamageInfoChange("no_armor", "chest", e.target.value)}
                    placeholder="Урон в грудь"
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="no_armor_stomach">Живот</Label>
                  <Input
                    id="no_armor_stomach"
                    type="number"
                    value={formData.damage_info.no_armor.stomach}
                    onChange={(e) => handleDamageInfoChange("no_armor", "stomach", e.target.value)}
                    placeholder="Урон в живот"
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="no_armor_arms">Руки</Label>
                  <Input
                    id="no_armor_arms"
                    type="number"
                    value={formData.damage_info.no_armor.arms}
                    onChange={(e) => handleDamageInfoChange("no_armor", "arms", e.target.value)}
                    placeholder="Урон в руки"
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="no_armor_legs">Ноги</Label>
                  <Input
                    id="no_armor_legs"
                    type="number"
                    value={formData.damage_info.no_armor.legs}
                    onChange={(e) => handleDamageInfoChange("no_armor", "legs", e.target.value)}
                    placeholder="Урон в ноги"
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
