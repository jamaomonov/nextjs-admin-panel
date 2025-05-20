"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface WeaponDetailProps {
  isOpen: boolean
  onClose: () => void
  weapon: {
    id: number
    name: string
    slug: string
    type?: {
      name: string
      id: number
    }
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
}

export default function WeaponDetailDialog({ isOpen, onClose, weapon }: WeaponDetailProps) {
  // Максимальные значения для прогресс-баров
  const maxValues = {
    damage: 100,
    fire_rate: 1200,
    recoil: 100,
    range: 100,
    mobility: 100,
    armor_penetration: 100,
    penetration_power: 100,
    ammo: 150,
  }

  // Функция для получения цвета прогресс-бара в зависимости от значения
  const getProgressColor = (value: number, max: number, isRecoil = false) => {
    const percentage = (value / max) * 100

    // Для отдачи: меньше = лучше
    if (isRecoil) {
      if (percentage < 30) return "bg-green-500"
      if (percentage < 60) return "bg-yellow-500"
      return "bg-red-500"
    }

    // Для остальных характеристик: больше = лучше
    if (percentage > 70) return "bg-green-500"
    if (percentage > 40) return "bg-yellow-500"
    return "bg-red-500"
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            {weapon.name}
            {weapon.type && (
              <Badge variant="outline" className="ml-2 bg-zinc-800 text-zinc-300 border-zinc-700">
                {weapon.type.name}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Основная информация */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-zinc-800 p-3 rounded-md">
              <div className="text-sm text-zinc-400">ID</div>
              <div className="font-medium">{weapon.id}</div>
            </div>
            <div className="bg-zinc-800 p-3 rounded-md">
              <div className="text-sm text-zinc-400">Slug</div>
              <div className="font-medium">{weapon.slug}</div>
            </div>
            {weapon.cost !== undefined && (
              <div className="bg-zinc-800 p-3 rounded-md">
                <div className="text-sm text-zinc-400">Стоимость</div>
                <div className="font-medium">${weapon.cost}</div>
              </div>
            )}
            {weapon.ammo !== undefined && (
              <div className="bg-zinc-800 p-3 rounded-md">
                <div className="text-sm text-zinc-400">Боезапас</div>
                <div className="font-medium">{weapon.ammo} патр.</div>
              </div>
            )}
          </div>

          {/* Характеристики оружия */}
          <Card className="bg-zinc-800 border-zinc-700">
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-4">Характеристики</h3>
              <div className="space-y-4">
                {weapon.damage !== undefined && (
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm text-zinc-400">Урон</span>
                      <span className="text-sm font-medium">{weapon.damage}</span>
                    </div>
                    <Progress
                      value={(weapon.damage / maxValues.damage) * 100}
                      className="h-2 bg-zinc-700"
                      indicatorClassName={getProgressColor(weapon.damage, maxValues.damage)}
                    />
                  </div>
                )}

                {weapon.fire_rate !== undefined && (
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm text-zinc-400">Скорострельность</span>
                      <span className="text-sm font-medium">{weapon.fire_rate} выстр/мин</span>
                    </div>
                    <Progress
                      value={(weapon.fire_rate / maxValues.fire_rate) * 100}
                      className="h-2 bg-zinc-700"
                      indicatorClassName={getProgressColor(weapon.fire_rate, maxValues.fire_rate)}
                    />
                  </div>
                )}

                {weapon.recoil !== undefined && (
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm text-zinc-400">Отдача</span>
                      <span className="text-sm font-medium">{weapon.recoil}</span>
                    </div>
                    <Progress
                      value={(weapon.recoil / maxValues.recoil) * 100}
                      className="h-2 bg-zinc-700"
                      indicatorClassName={getProgressColor(weapon.recoil, maxValues.recoil, true)}
                    />
                  </div>
                )}

                {weapon.range !== undefined && (
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm text-zinc-400">Дальность</span>
                      <span className="text-sm font-medium">{weapon.range} м</span>
                    </div>
                    <Progress
                      value={(weapon.range / maxValues.range) * 100}
                      className="h-2 bg-zinc-700"
                      indicatorClassName={getProgressColor(weapon.range, maxValues.range)}
                    />
                  </div>
                )}

                {weapon.mobility !== undefined && (
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm text-zinc-400">Мобильность</span>
                      <span className="text-sm font-medium">{weapon.mobility}</span>
                    </div>
                    <Progress
                      value={(weapon.mobility / maxValues.mobility) * 100}
                      className="h-2 bg-zinc-700"
                      indicatorClassName={getProgressColor(weapon.mobility, maxValues.mobility)}
                    />
                  </div>
                )}

                {weapon.armor_penetration !== undefined && (
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm text-zinc-400">Пробитие брони</span>
                      <span className="text-sm font-medium">{weapon.armor_penetration}%</span>
                    </div>
                    <Progress
                      value={(weapon.armor_penetration / maxValues.armor_penetration) * 100}
                      className="h-2 bg-zinc-700"
                      indicatorClassName={getProgressColor(weapon.armor_penetration, maxValues.armor_penetration)}
                    />
                  </div>
                )}

                {weapon.penetration_power !== undefined && (
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm text-zinc-400">Сила пробития</span>
                      <span className="text-sm font-medium">{weapon.penetration_power}</span>
                    </div>
                    <Progress
                      value={(weapon.penetration_power / maxValues.penetration_power) * 100}
                      className="h-2 bg-zinc-700"
                      indicatorClassName={getProgressColor(weapon.penetration_power, maxValues.penetration_power)}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Информация об уроне */}
          {weapon.damage_info && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Урон по броне */}
              {weapon.damage_info.armor && Object.keys(weapon.damage_info.armor).length > 0 && (
                <Card className="bg-zinc-800 border-zinc-700">
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-medium mb-4">Урон по броне</h3>
                    <div className="space-y-3">
                      {weapon.damage_info.armor.head !== undefined && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-zinc-400">Голова</span>
                          <Badge variant="outline" className="bg-zinc-700 border-zinc-600">
                            {weapon.damage_info.armor.head}
                          </Badge>
                        </div>
                      )}
                      {weapon.damage_info.armor.chest !== undefined && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-zinc-400">Грудь</span>
                          <Badge variant="outline" className="bg-zinc-700 border-zinc-600">
                            {weapon.damage_info.armor.chest}
                          </Badge>
                        </div>
                      )}
                      {weapon.damage_info.armor.stomach !== undefined && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-zinc-400">Живот</span>
                          <Badge variant="outline" className="bg-zinc-700 border-zinc-600">
                            {weapon.damage_info.armor.stomach}
                          </Badge>
                        </div>
                      )}
                      {weapon.damage_info.armor.arms !== undefined && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-zinc-400">Руки</span>
                          <Badge variant="outline" className="bg-zinc-700 border-zinc-600">
                            {weapon.damage_info.armor.arms}
                          </Badge>
                        </div>
                      )}
                      {weapon.damage_info.armor.legs !== undefined && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-zinc-400">Ноги</span>
                          <Badge variant="outline" className="bg-zinc-700 border-zinc-600">
                            {weapon.damage_info.armor.legs}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Урон без брони */}
              {weapon.damage_info.no_armor && Object.keys(weapon.damage_info.no_armor).length > 0 && (
                <Card className="bg-zinc-800 border-zinc-700">
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-medium mb-4">У��он без брони</h3>
                    <div className="space-y-3">
                      {weapon.damage_info.no_armor.head !== undefined && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-zinc-400">Голова</span>
                          <Badge variant="outline" className="bg-zinc-700 border-zinc-600">
                            {weapon.damage_info.no_armor.head}
                          </Badge>
                        </div>
                      )}
                      {weapon.damage_info.no_armor.chest !== undefined && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-zinc-400">Грудь</span>
                          <Badge variant="outline" className="bg-zinc-700 border-zinc-600">
                            {weapon.damage_info.no_armor.chest}
                          </Badge>
                        </div>
                      )}
                      {weapon.damage_info.no_armor.stomach !== undefined && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-zinc-400">Живот</span>
                          <Badge variant="outline" className="bg-zinc-700 border-zinc-600">
                            {weapon.damage_info.no_armor.stomach}
                          </Badge>
                        </div>
                      )}
                      {weapon.damage_info.no_armor.arms !== undefined && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-zinc-400">Руки</span>
                          <Badge variant="outline" className="bg-zinc-700 border-zinc-600">
                            {weapon.damage_info.no_armor.arms}
                          </Badge>
                        </div>
                      )}
                      {weapon.damage_info.no_armor.legs !== undefined && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-zinc-400">Ноги</span>
                          <Badge variant="outline" className="bg-zinc-700 border-zinc-600">
                            {weapon.damage_info.no_armor.legs}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
