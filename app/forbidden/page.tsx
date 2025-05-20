"use client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { ShieldAlert, LogOut } from "lucide-react"

export default function ForbiddenPage() {
  const { logout, user } = useAuth()
  const router = useRouter()

  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-950 p-4">
      <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-red-900/30 border border-red-800">
              <ShieldAlert className="h-8 w-8 text-red-500" />
            </div>
          </div>
          <CardTitle className="text-2xl">Доступ запрещен</CardTitle>
          <CardDescription className="text-zinc-400">
            У вас недостаточно прав для доступа к админ-панели
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {user && (
            <div className="p-4 bg-zinc-800 rounded-md">
              <p className="text-sm text-zinc-400">Вы вошли как:</p>
              <p className="font-medium">{user.username}</p>
              <p className="text-sm text-zinc-400">Роль: {user.role}</p>
            </div>
          )}
          <p className="text-center text-zinc-400">
            Для доступа к админ-панели необходимо иметь роль администратора или модератора.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={logout} variant="destructive" className="w-full">
            <LogOut className="mr-2 h-4 w-4" />
            Выйти
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
