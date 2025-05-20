"use client"

import { useState, useEffect, useCallback } from "react"
import AdminLayout from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, UserCog, Eye, Ban, Mail, MoreHorizontal } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import ChangeRoleDialog from "@/components/change-role-dialog"
import { format } from "date-fns"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import UserDetailDialog from "@/components/user-detail-dialog"
import { useMobile } from "@/hooks/use-mobile"
import { Skeleton } from "@/components/ui/skeleton"

interface User {
  id: number
  username: string
  email: string
  avatar: string
  role: string
  created_at: string
  updated_at: string
  is_online?: boolean // Добавляем поле для онлайн-статуса
}

// Константы для пагинации
const ITEMS_PER_PAGE = 10

export default function UsersPage() {
  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const isMobile = useMobile()

  // Состояние для диалогов
  const [isChangeRoleDialogOpen, setIsChangeRoleDialogOpen] = useState(false)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  // Состояние для пагинации
  const [currentPage, setCurrentPage] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)
  const [roleFilter, setRoleFilter] = useState<string>("all")

  // Мемоизированная функция для загрузки пользователей
  const fetchUsers = useCallback(
    async (page: number, role = "all") => {
      try {
        setIsLoading(true)
        setError(null)

        // Формируем параметры запроса для пагинации и фильтрации
        const limit = ITEMS_PER_PAGE
        const offset = (page - 1) * ITEMS_PER_PAGE

        // В реальном API мы бы использовали эти параметры
        // const queryParams = new URLSearchParams({
        //   limit: limit.toString(),
        //   offset: offset.toString(),
        //   ...(role !== "all" ? { role } : {})
        // }).toString()

        const response = await fetch("/api/users", {
          cache: "no-store",
        })

        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`)
        }

        const data: User[] = await response.json()

        // Фильтрация на стороне клиента (в реальном API это делалось бы на сервере)
        let filteredData = data
        if (role !== "all") {
          filteredData = data.filter((user) => user.role === role)
        }

        // Добавляем случайный онлайн-статус для демонстрации
        const enhancedData = filteredData.map((user) => ({
          ...user,
          is_online: Math.random() > 0.5,
        }))

        // Пагинация на стороне клиента
        const paginatedData = enhancedData.slice(offset, offset + limit)

        setUsers(paginatedData)
        setTotalUsers(filteredData.length)
      } catch (err) {
        console.error("Error fetching users:", err)
        setError("Не удалось загрузить список пользователей")
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить список пользователей",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    },
    [toast],
  )

  // Загрузка пользователей при изменении страницы или фильтра
  useEffect(() => {
    fetchUsers(currentPage, roleFilter)
  }, [currentPage, roleFilter, fetchUsers])

  // Обработчик поиска
  const handleSearch = (term: string) => {
    setSearchTerm(term)
    // При поиске сбрасываем на первую страницу
    setCurrentPage(1)
  }

  // Фильтрация пользователей по поисковому запросу
  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

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

  // Функция для получения инициалов пользователя
  const getUserInitials = (username: string) => {
    return username.charAt(0).toUpperCase()
  }

  // Обработчик изменения страницы
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Обработчик изменения фильтра ролей
  const handleRoleFilterChange = (role: string) => {
    setRoleFilter(role)
    setCurrentPage(1) // Сбрасываем на первую страницу при изменении фильтра
  }

  // Компонент для отображения пагинации
  const Pagination = () => {
    const totalPages = Math.ceil(totalUsers / ITEMS_PER_PAGE)

    return (
      <div className="flex justify-between items-center mt-4">
        <div className="text-sm text-zinc-400">
          Показано {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, totalUsers)} -{" "}
          {Math.min(currentPage * ITEMS_PER_PAGE, totalUsers)} из {totalUsers}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
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
                onClick={() => handlePageChange(pageNum)}
                className={currentPage === pageNum ? "bg-zinc-700" : "bg-zinc-800 border-zinc-700 hover:bg-zinc-700"}
              >
                {pageNum}
              </Button>
            )
          })}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
          >
            Вперед
          </Button>
        </div>
      </div>
    )
  }

  // Компонент для отображения пользователя в виде карточки (для мобильных устройств)
  const UserCard = ({ user }: { user: User }) => {
    return (
      <Card className="bg-zinc-900 border-zinc-800 mb-4">
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar>
                  <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.username} />
                  <AvatarFallback className="bg-zinc-700">{getUserInitials(user.username)}</AvatarFallback>
                </Avatar>
                {user.is_online && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-zinc-900"></span>
                )}
              </div>
              <div>
                <p className="font-medium">{user.username}</p>
                <p className="text-sm text-zinc-400">{user.email}</p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal size={16} />
                  <span className="sr-only">Действия</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
                <DropdownMenuItem
                  className="text-zinc-300 hover:text-zinc-100 focus:text-zinc-100 focus:bg-zinc-800 cursor-pointer"
                  onClick={() => {
                    setCurrentUser(user)
                    setIsDetailDialogOpen(true)
                  }}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  <span>Просмотр</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-zinc-300 hover:text-zinc-100 focus:text-zinc-100 focus:bg-zinc-800 cursor-pointer"
                  onClick={() => {
                    setCurrentUser(user)
                    setIsChangeRoleDialogOpen(true)
                  }}
                >
                  <UserCog className="mr-2 h-4 w-4" />
                  <span>Изменить роль</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="text-zinc-300 hover:text-zinc-100 focus:text-zinc-100 focus:bg-zinc-800 cursor-pointer">
                  <Mail className="mr-2 h-4 w-4" />
                  <span>Отправить сообщение</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-500 hover:text-red-400 focus:text-red-400 focus:bg-zinc-800 cursor-pointer">
                  <Ban className="mr-2 h-4 w-4" />
                  <span>Блокировать</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="outline" className={getRoleBadgeClass(user.role)}>
              {user.role}
            </Badge>
            <Badge variant="outline" className="border-zinc-700 bg-zinc-800 text-zinc-300">
              {formatDate(user.created_at)}
            </Badge>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Компонент для отображения скелетона загрузки
  const UserSkeleton = () => {
    if (isMobile) {
      return (
        <Card className="bg-zinc-900 border-zinc-800 mb-4">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div>
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-4 w-40" />
                </div>
              </div>
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
            <div className="mt-3 flex gap-2">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-32" />
            </div>
          </CardContent>
        </Card>
      )
    }

    return (
      <TableRow>
        <TableCell>
          <Skeleton className="h-10 w-40" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-5 w-48" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-6 w-20" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-5 w-32" />
        </TableCell>
        <TableCell className="text-right">
          <Skeleton className="h-8 w-8 ml-auto" />
        </TableCell>
      </TableRow>
    )
  }

  return (
    <AdminLayout>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Users</h1>
          <p className="text-zinc-400">Manage user accounts and permissions</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
            <Input
              type="search"
              placeholder="Search users..."
              className="pl-8 bg-zinc-900 border-zinc-800 focus-visible:ring-zinc-700"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <Select value={roleFilter} onValueChange={handleRoleFilterChange}>
            <SelectTrigger className="bg-zinc-900 border-zinc-800 w-[180px]">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800">
              <SelectItem value="all">All roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="moderator">Moderator</SelectItem>
              <SelectItem value="user">User</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Error state */}
      {error && !isLoading && (
        <div className="bg-red-900/20 border border-red-800 text-red-300 p-4 rounded-lg mb-6">
          <p>{error}</p>
        </div>
      )}

      {/* Mobile view */}
      {isMobile ? (
        <>
          {isLoading ? (
            Array(3)
              .fill(0)
              .map((_, index) => <UserSkeleton key={index} />)
          ) : filteredUsers.length > 0 ? (
            filteredUsers.map((user) => <UserCard key={user.id} user={user} />)
          ) : (
            <div className="text-center py-8 text-zinc-400">
              {searchTerm ? "Ничего не найдено по вашему запросу" : "Пользователи не найдены"}
            </div>
          )}
        </>
      ) : (
        /* Desktop view */
        <div className="rounded-md border border-zinc-800 overflow-hidden">
          <Table>
            <TableHeader className="bg-zinc-900">
              <TableRow className="hover:bg-zinc-900/80 border-zinc-800">
                <TableHead className="text-zinc-400">Name</TableHead>
                <TableHead className="text-zinc-400">Email</TableHead>
                <TableHead className="text-zinc-400">Role</TableHead>
                <TableHead className="text-zinc-400">Created At</TableHead>
                <TableHead className="text-zinc-400 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(5)
                  .fill(0)
                  .map((_, index) => <UserSkeleton key={index} />)
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <TableRow key={user.id} className="hover:bg-zinc-900/50 border-zinc-800">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar>
                            <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.username} />
                            <AvatarFallback className="bg-zinc-700">{getUserInitials(user.username)}</AvatarFallback>
                          </Avatar>
                          {user.is_online && (
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-zinc-900"></span>
                          )}
                        </div>
                        {user.username}
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getRoleBadgeClass(user.role)}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(user.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-zinc-100">
                            <MoreHorizontal size={16} />
                            <span className="sr-only">Действия</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
                          <DropdownMenuItem
                            className="text-zinc-300 hover:text-zinc-100 focus:text-zinc-100 focus:bg-zinc-800 cursor-pointer"
                            onClick={() => {
                              setCurrentUser(user)
                              setIsDetailDialogOpen(true)
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            <span>Просмотр</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-zinc-300 hover:text-zinc-100 focus:text-zinc-100 focus:bg-zinc-800 cursor-pointer"
                            onClick={() => {
                              setCurrentUser(user)
                              setIsChangeRoleDialogOpen(true)
                            }}
                          >
                            <UserCog className="mr-2 h-4 w-4" />
                            <span>Изменить роль</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-zinc-300 hover:text-zinc-100 focus:text-zinc-100 focus:bg-zinc-800 cursor-pointer">
                            <Mail className="mr-2 h-4 w-4" />
                            <span>Отправить сообщение</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-500 hover:text-red-400 focus:text-red-400 focus:bg-zinc-800 cursor-pointer">
                            <Ban className="mr-2 h-4 w-4" />
                            <span>Блокировать</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    {searchTerm ? "Ничего не найдено по вашему запросу" : "Пользователи не найдены"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {!isLoading && filteredUsers.length > 0 && <Pagination />}

      {/* Диалог изменения роли */}
      {currentUser && (
        <ChangeRoleDialog
          isOpen={isChangeRoleDialogOpen}
          onClose={() => setIsChangeRoleDialogOpen(false)}
          onSuccess={() => {
            setIsChangeRoleDialogOpen(false)
            fetchUsers(currentPage, roleFilter)
          }}
          userId={currentUser.id}
          userName={currentUser.username}
          currentRole={currentUser.role}
        />
      )}

      {/* Диалог просмотра деталей пользователя */}
      {currentUser && (
        <UserDetailDialog isOpen={isDetailDialogOpen} onClose={() => setIsDetailDialogOpen(false)} user={currentUser} />
      )}
    </AdminLayout>
  )
}
