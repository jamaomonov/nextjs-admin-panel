"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

interface ChangeRoleDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  userId: number
  userName: string
  currentRole: string
}

type Role = "user" | "moderator" | "admin"

export default function ChangeRoleDialog({
  isOpen,
  onClose,
  onSuccess,
  userId,
  userName,
  currentRole,
}: ChangeRoleDialogProps) {
  const [selectedRole, setSelectedRole] = useState<Role>(currentRole as Role)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async () => {
    if (selectedRole === currentRole) {
      onClose()
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: selectedRole }),
      })

      if (!response.ok) {
        throw new Error(`Ошибка при обновлении роли: ${response.status}`)
      }

      toast({
        title: "Успешно",
        description: `Роль пользователя ${userName} изменена на ${selectedRole}`,
      })

      onSuccess()
    } catch (error) {
      console.error("Error updating user role:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось обновить роль пользователя",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
        <DialogHeader>
          <DialogTitle>Изменить роль пользователя</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="mb-4">
            Пользователь: <span className="font-medium">{userName}</span>
          </p>
          <div className="space-y-4">
            <RadioGroup value={selectedRole} onValueChange={(value) => setSelectedRole(value as Role)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="user" id="user" />
                <Label htmlFor="user" className="cursor-pointer">
                  Пользователь
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="moderator" id="moderator" />
                <Label htmlFor="moderator" className="cursor-pointer">
                  Модератор
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="admin" id="admin" />
                <Label htmlFor="admin" className="cursor-pointer">
                  Администратор
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
          >
            Отмена
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || selectedRole === currentRole}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Сохранить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
