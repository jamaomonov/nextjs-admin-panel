"use client"

import { useState, useEffect } from "react"
import AdminLayout from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, Edit, Trash2, Eye } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import GenericDeleteDialog from "@/components/generic-delete-dialog"
import { useToast } from "@/components/ui/use-toast"
import WeaponForm from "@/components/weapon-form"
import WeaponDetailDialog from "@/components/weapon-detail-dialog"

interface Type {
  id: number
  name: string
}

interface Weapon {
  id: number
  name: string
  slug: string
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
  type?: {
    name: string
    id: number
  }
}

// Моковые данные для использования при ошибках
const mockWeapons: Weapon[] = [
  {
    id: 1,
    name: "AK-47",
    slug: "ak47",
    type_id: 1,
    type: { name: "Rifle", id: 1 },
    damage: 35,
    fire_rate: 600,
    recoil: 10,
    range: 30,
    mobility: 80,
    armor_penetration: 50,
    penetration_power: 80,
    ammo: 30,
    cost: 2700,
    damage_info: {
      armor: {
        arms: 30,
        chest: 40,
        head: 75,
        legs: 25,
        stomach: 50,
      },
      no_armor: {
        arms: 40,
        chest: 50,
        head: 100,
        legs: 30,
        stomach: 60,
      },
    },
  },
  { id: 2, name: "M4A4", slug: "m4a4", type_id: 1, type: { name: "Rifle", id: 1 } },
  { id: 3, name: "AWP", slug: "awp", type_id: 2, type: { name: "Sniper Rifle", id: 2 } },
  { id: 4, name: "Desert Eagle", slug: "deagle", type_id: 3, type: { name: "Pistol", id: 3 } },
  { id: 5, name: "USP-S", slug: "usp", type_id: 3, type: { name: "Pistol", id: 3 } },
  { id: 6, name: "Knife", slug: "knife", type_id: 4, type: { name: "Knife", id: 4 } },
]

export default function WeaponsPage() {
  const { toast } = useToast()
  const [weapons, setWeapons] = useState<Weapon[]>([])
  const [types, setTypes] = useState<Type[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isUsingMockData, setIsUsingMockData] = useState(false)

  // Состояния для модальных окон
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [currentWeapon, setCurrentWeapon] = useState<Weapon | null>(null)

  const fetchTypes = async () => {
    try {
      const response = await fetch("/api/types", {
        cache: "no-store",
      })

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`)
      }

      const data = await response.json()
      setTypes(data)
    } catch (err) {
      console.error("Error fetching types:", err)
    }
  }

  const fetchWeapons = async () => {
    try {
      setIsLoading(true)
      setIsUsingMockData(false)

      const response = await fetch("/api/weapons", {
        cache: "no-store",
      })

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`)
      }

      const data: Weapon[] = await response.json()
      setWeapons(data)
    } catch (err) {
      console.error("Error fetching weapons:", err)
      setWeapons(mockWeapons)
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
    fetchTypes()
    fetchWeapons()
  }, [])

  // Фильтрация оружия по поисковому запросу
  const filteredWeapons = weapons.filter(
    (weapon) =>
      weapon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      weapon.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (weapon.type?.name && weapon.type.name.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  return (
    <AdminLayout>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Weapons</h1>
          <p className="text-zinc-400">Manage weapon types and characteristics</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
            <Input
              type="search"
              placeholder="Search weapons..."
              className="pl-8 bg-zinc-900 border-zinc-800 focus-visible:ring-zinc-700"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button className="bg-zinc-800 hover:bg-zinc-700" onClick={() => setIsAddDialogOpen(true)}>
            <Plus size={18} className="mr-2" />
            Add Weapon
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

      {/* Weapons table */}
      {!isLoading && (
        <>
          {searchTerm && <p className="mb-4 text-zinc-400">Найдено результатов: {filteredWeapons.length}</p>}
          <div className="rounded-md border border-zinc-800 overflow-hidden">
            <Table>
              <TableHeader className="bg-zinc-900">
                <TableRow className="hover:bg-zinc-900/80 border-zinc-800">
                  <TableHead className="text-zinc-400">Name</TableHead>
                  <TableHead className="text-zinc-400">Type</TableHead>
                  <TableHead className="text-zinc-400">Damage</TableHead>
                  <TableHead className="text-zinc-400">Fire Rate</TableHead>
                  <TableHead className="text-zinc-400">Ammo</TableHead>
                  <TableHead className="text-zinc-400">Cost</TableHead>
                  <TableHead className="text-zinc-400 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWeapons.length > 0 ? (
                  filteredWeapons.map((weapon) => (
                    <TableRow key={weapon.id} className="hover:bg-zinc-900/50 border-zinc-800">
                      <TableCell className="font-medium">{weapon.name}</TableCell>
                      <TableCell>
                        {weapon.type?.name && (
                          <Badge variant="outline" className="bg-zinc-800 text-zinc-300 border-zinc-700">
                            {weapon.type.name}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{weapon.damage || "-"}</TableCell>
                      <TableCell>{weapon.fire_rate || "-"}</TableCell>
                      <TableCell>{weapon.ammo || "-"}</TableCell>
                      <TableCell>{weapon.cost ? `$${weapon.cost}` : "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setCurrentWeapon(weapon)
                              setIsDetailDialogOpen(true)
                            }}
                            className="h-8 w-8 text-zinc-400 hover:text-zinc-100"
                          >
                            <Eye size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setCurrentWeapon(weapon)
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
                              setCurrentWeapon(weapon)
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
                    <TableCell colSpan={7} className="h-24 text-center">
                      {searchTerm ? "Ничего не найдено по вашему запросу" : "Оружие не найдено"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {/* Модальное окно для добавления оружия */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 max-w-4xl">
          <DialogHeader>
            <DialogTitle>Добавить новое оружие</DialogTitle>
          </DialogHeader>
          <WeaponForm
            onSuccess={() => {
              setIsAddDialogOpen(false)
              fetchWeapons()
            }}
            onCancel={() => setIsAddDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Модальное окно для редактирования оружия */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 max-w-4xl">
          <DialogHeader>
            <DialogTitle>Редактировать оружие</DialogTitle>
          </DialogHeader>
          {currentWeapon && (
            <WeaponForm
              initialData={currentWeapon}
              onSuccess={() => {
                setIsEditDialogOpen(false)
                fetchWeapons()
              }}
              onCancel={() => setIsEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Модальное окно для просмотра деталей оружия */}
      {currentWeapon && (
        <WeaponDetailDialog
          isOpen={isDetailDialogOpen}
          onClose={() => setIsDetailDialogOpen(false)}
          weapon={currentWeapon}
        />
      )}

      {/* Диалог подтверждения удаления */}
      {currentWeapon && (
        <GenericDeleteDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={() => {
            setIsDeleteDialogOpen(false)
            fetchWeapons()
          }}
          endpoint="/api/weapons"
          id={currentWeapon.id}
          entityName="оружие"
          entityLabel={currentWeapon.name}
        />
      )}
    </AdminLayout>
  )
}
