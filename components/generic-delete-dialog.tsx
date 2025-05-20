"use client"

import { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

interface DeleteDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  endpoint: string
  id: number
  entityName: string
  entityLabel: string
}

export default function GenericDeleteDialog({
  isOpen,
  onClose,
  onConfirm,
  endpoint,
  id,
  entityName,
  entityLabel,
}: DeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`${endpoint}/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error(`Ошибка при удалении ${entityName}`)
      }

      toast({
        title: "Успешно",
        description: `${entityLabel} был удален`,
      })

      onConfirm()
    } catch (error) {
      console.error(`Error deleting ${entityName}:`, error)
      toast({
        title: "Ошибка",
        description: `Не удалось удалить ${entityName}`,
        variant: "destructive",
      })
      onClose()
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="bg-zinc-900 border-zinc-800">
        <AlertDialogHeader>
          <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
          <AlertDialogDescription className="text-zinc-400">
            Вы собираетесь удалить {entityName} &quot;{entityLabel}&quot;. Это действие нельзя отменить.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-300"
            disabled={isDeleting}
          >
            Отмена
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              handleDelete()
            }}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Удаление...
              </>
            ) : (
              "Удалить"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
