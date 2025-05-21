"use client"

import { DEFAULT_ITEM_IMAGE, IMAGE_BASE_URL } from "@/lib/config"
import Image from "next/image"
import { Edit, Trash2, MoreVertical, BarChart3 } from "lucide-react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"

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
  type_id?: number
  rarity_id?: number
  category_id?: number
  collection_id?: number
  weapon_id?: number
}

interface ItemCardProps {
  item: Item
  onEdit?: () => void
  onDelete?: () => void
}

export default function ItemCard({ item, onEdit, onDelete }: ItemCardProps) {
  const router = useRouter()

  // Функция для определения градиента фона контейнера изображения в зависимости от редкости
  const getImageContainerBgGradient = (rarity?: string) => {
    if (!rarity) return "bg-gradient-to-b from-zinc-700 to-zinc-900" // стандартный градиент

    const rarityLower = rarity.toLowerCase()

    switch (rarityLower) {
      case "common":
        return "bg-gradient-to-b from-gray-300 to-gray-500"
      case "uncommon":
        return "bg-[#378fff]"
      case "rare":
        return "bg-[#0043ff]"
      case "epic":
        return "bg-[#941dff]"
      case "legendary":
        return "bg-[#ff2586]"
      case "arcane":
        return "bg-[#ff0000]"
      case "nameless":
        return "bg-gradient-to-b from-yellow-500 to-amber-700"
      default:
        return "bg-gradient-to-b from-zinc-700 to-zinc-900"
    }
  }

  // Функция для определения цвета бейджа редкости
  const getRarityColor = (rarity?: string) => {
    if (!rarity) return "border-zinc-700 bg-zinc-800 text-zinc-300"

    const rarityLower = rarity.toLowerCase()

    switch (rarityLower) {
      case "common":
        return "border-gray-400 bg-gray-300 text-gray-800"
      case "uncommon":
        return "border-blue-300 bg-blue-200 text-blue-800"
      case "rare":
        return "border-blue-400 bg-blue-300 text-blue-900"
      case "epic":
        return "border-purple-400 bg-purple-300 text-purple-900"
      case "legendary":
        return "border-pink-400 bg-pink-300 text-pink-900"
      case "arcane":
        return "border-red-600 bg-red-500 text-red-950"
      case "nameless":
        return "border-yellow-600 bg-yellow-500 text-yellow-900"
      default:
        return "border-zinc-700 bg-zinc-800 text-zinc-300"
    }
  }

  // Форматирование даты создания
  const formatDate = (dateString?: string) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  // Получаем градиент фона для контейнера изображения
  const imageContainerBgGradient = getImageContainerBgGradient(item.rarity)

  // Формируем полный URL для изображения
  const getImageUrl = (photoPath: string) => {
    if (!photoPath) return "placeholder.svg"
    if (photoPath.startsWith("http")) return photoPath
    if (!photoPath.startsWith("/")) return `${IMAGE_BASE_URL}/${photoPath}`
    return `${IMAGE_BASE_URL}${photoPath}`
  }

  const imageUrl = getImageUrl(item.photo)

  // Add this function before the return statement
  const handleViewStatistics = () => {
    router.push(`/items/${item.id}/statistics?name=${encodeURIComponent(item.name)}`)
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800 overflow-hidden h-full flex flex-col">
      <div className={`relative h-48 ${imageContainerBgGradient}`}>
        <Image
          src={imageUrl || "/placeholder.svg"}
          alt={item.name}
          fill
          className="object-cover z-10"
          onError={(e) => {
            // Fallback to placeholder if image fails to load
            const target = e.target as HTMLImageElement
            target.src = DEFAULT_ITEM_IMAGE
          }}
          loading="lazy" // Добавляем ленивую загрузку для оптимизации
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 to-transparent z-20"></div>
      </div>
      <CardContent className="p-4 flex-grow">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-lg line-clamp-1 text-zinc-100">{item.name}</h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-zinc-100">
                <MoreVertical size={16} />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
              <DropdownMenuItem
                className="text-zinc-300 hover:text-zinc-100 focus:text-zinc-100 focus:bg-zinc-800"
                onClick={onEdit}
              >
                <Edit size={16} className="mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-500 hover:text-red-400 focus:text-red-400 focus:bg-zinc-800"
                onClick={onDelete}
              >
                <Trash2 size={16} className="mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          {item.rarity && (
            <Badge variant="outline" className={getRarityColor(item.rarity)}>
              {item.rarity}
            </Badge>
          )}
          <Badge variant="outline" className="bg-zinc-800 text-zinc-300 border-zinc-700">
            {item.category}
          </Badge>
          {/* Добавляем отображение типа предмета */}
          {item.typeName && (
            <Badge variant="outline" className="bg-zinc-800 text-zinc-300 border-zinc-700">
              {item.typeName}
            </Badge>
          )}
        </div>

        <div className="space-y-2 text-sm text-zinc-400">
          {item.weaponName && (
            <div className="flex justify-between">
              <span>Weapon:</span>
              <span className="text-zinc-300">{item.weaponName}</span>
            </div>
          )}
          {item.collectionName && (
            <div className="flex justify-between">
              <span>Collection:</span>
              <span className="text-zinc-300">{item.collectionName}</span>
            </div>
          )}
          {item.created_at && (
            <div className="flex justify-between">
              <span>Added:</span>
              <span className="text-zinc-300">{formatDate(item.created_at)}</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex gap-2 mt-auto">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 bg-zinc-800 border-zinc-700 hover:bg-zinc-700 hover:text-zinc-100"
          onClick={onEdit}
        >
          <Edit size={14} className="mr-1" />
          Edit
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 bg-zinc-800 border-zinc-700 hover:bg-zinc-700 hover:text-zinc-100"
          onClick={handleViewStatistics}
        >
          <BarChart3 size={14} className="mr-1" />
          Stats
        </Button>
        <Button
          size="sm"
          className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-red-400 hover:text-red-300"
          onClick={onDelete}
        >
          <Trash2 size={14} className="mr-1" />
          Delete
        </Button>
      </CardFooter>
    </Card>
  )
}
