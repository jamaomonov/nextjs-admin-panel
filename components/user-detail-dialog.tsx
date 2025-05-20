"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Mail, Calendar, MapPin, Phone, Globe } from "lucide-react"

interface User {
  id: number
  username: string
  email: string
  avatar: string
  role: string
  created_at: string
  updated_at: string
  is_online?: boolean
}

interface UserDetailDialogProps {
  isOpen: boolean
  onClose: () => void
  user: User
}

export default function UserDetailDialog({ isOpen, onClose, user }: UserDetailDialogProps) {
  // Функция для получения инициалов пользователя
  const getUserInitials = (username: string) => {
    return username.charAt(0).toUpperCase()
  }

  // Функция для форматирования даты
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd.MM.yyyy HH:mm")
    } catch (error) {
      return dateString
    }
  }

  // Функция для получения цвета бейджа роли
  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case "admin":
        return "border-red-500 bg-red-500/10 text-red-500"
      case "moderator":
        return "border-blue-500 bg-blue-500/10 text-blue-500"
      default:
        return "border-green-500 bg-green-500/10 text-green-500"
    }
  }

  // Генерируем случайные данные для демонстрации
  const mockUserDetails = {
    phone: "+7 (999) 123-45-67",
    location: "Москва, Россия",
    website: "example.com",
    lastLogin: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
    registrationIP: "192.168.1." + Math.floor(Math.random() * 255),
    totalLogins: Math.floor(Math.random() * 100),
    recentActivity: [
      { action: "Вход в систему", date: new Date(Date.now() - 3600000).toISOString() },
      { action: "Изменение профиля", date: new Date(Date.now() - 86400000).toISOString() },
      { action: "Добавление предмета", date: new Date(Date.now() - 172800000).toISOString() },
    ],
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Информация о пользователе</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Основная информация */}
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.username} />
                <AvatarFallback className="bg-zinc-700 text-2xl">{getUserInitials(user.username)}</AvatarFallback>
              </Avatar>
              {user.is_online && (
                <span className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-zinc-900"></span>
              )}
            </div>

            <div className="flex-1">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                {user.username}
                <Badge variant="outline" className={getRoleBadgeClass(user.role)}>
                  {user.role}
                </Badge>
                {user.is_online && (
                  <Badge variant="outline" className="border-green-500 bg-green-500/10 text-green-500">
                    Online
                  </Badge>
                )}
              </h2>

              <div className="mt-2 space-y-1 text-zinc-300">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-zinc-500" />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-zinc-500" />
                  <span>Зарегистрирован: {formatDate(user.created_at)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-zinc-500" />
                  <span>{mockUserDetails.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-zinc-500" />
                  <span>{mockUserDetails.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-zinc-500" />
                  <span>{mockUserDetails.website}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Вкладки с дополнительной информацией */}
          <Tabs defaultValue="activity" className="w-full">
            <TabsList className="bg-zinc-900 border border-zinc-800">
              <TabsTrigger value="activity">Активность</TabsTrigger>
              <TabsTrigger value="security">Безопасность</TabsTrigger>
              <TabsTrigger value="items">Предметы</TabsTrigger>
            </TabsList>

            <TabsContent value="activity" className="space-y-4 mt-4">
              <Card className="bg-zinc-800 border-zinc-700">
                <CardHeader>
                  <CardTitle className="text-lg">Последние действия</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mockUserDetails.recentActivity.map((activity, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center border-b border-zinc-700 pb-2 last:border-0 last:pb-0"
                    >
                      <span>{activity.action}</span>
                      <span className="text-sm text-zinc-400">{formatDate(activity.date)}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="space-y-4 mt-4">
              <Card className="bg-zinc-800 border-zinc-700">
                <CardHeader>
                  <CardTitle className="text-lg">Информация о безопасности</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-zinc-400">Последний вход</p>
                      <p>{formatDate(mockUserDetails.lastLogin)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-zinc-400">IP при регистрации</p>
                      <p>{mockUserDetails.registrationIP}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-zinc-400">Всего входов</p>
                      <p>{mockUserDetails.totalLogins}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-zinc-400">Двухфакторная аутентификация</p>
                      <Badge variant="outline" className="border-red-500 bg-red-500/10 text-red-500">
                        Отключена
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="items" className="space-y-4 mt-4">
              <Card className="bg-zinc-800 border-zinc-700">
                <CardHeader>
                  <CardTitle className="text-lg">Предметы пользователя</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-zinc-400">У пользователя нет предметов или они недоступны для просмотра.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}
