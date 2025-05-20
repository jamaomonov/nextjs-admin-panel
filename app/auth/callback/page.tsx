"use client"

import { useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { exchangeCodeForToken } from "@/lib/auth"
import { Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const processingRef = useRef(false)
  const errorRef = useRef<string | null>(null)
  const loadingRef = useRef(true)

  useEffect(() => {
    // Предотвращаем повторные вызовы API
    if (processingRef.current) {
      return
    }

    const processAuth = async () => {
      // Устанавливаем флаг, что запрос в процессе
      processingRef.current = true

      try {
        const code = searchParams?.get("code")
        console.log("Callback code:", code)

        if (!code) {
          errorRef.current = "Код авторизации не найден"
          loadingRef.current = false
          // Принудительно обновляем компонент
          forceUpdate()
          return
        }

        const result = await exchangeCodeForToken(code)

        if (!result) {
          errorRef.current = "Не удалось обменять код на токен"
          loadingRef.current = false
          forceUpdate()
          return
        }

        router.push("/dashboard")
      } catch (err: any) {
        console.error("Auth callback error:", err.message)
        errorRef.current = err.message || "Произошла ошибка при обработке авторизации"
        loadingRef.current = false
        forceUpdate()
      }
    }

    // Используем setTimeout для предотвращения проблем с гидратацией
    setTimeout(() => {
      processAuth()
    }, 0)

    // Функция для принудительного обновления компонента
    function forceUpdate() {
      const event = new Event("forceUpdate")
      window.dispatchEvent(event)
    }

    // Слушатель для принудительного обновления
    const handleForceUpdate = () => {
      // Это просто для обновления компонента
    }
    window.addEventListener("forceUpdate", handleForceUpdate)

    return () => {
      window.removeEventListener("forceUpdate", handleForceUpdate)
    }
  }, [searchParams, router])

  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-950 p-4">
      <div className="w-full max-w-md">
        {!errorRef.current ? (
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-zinc-400 mx-auto mb-4" />
            <p className="text-zinc-400">Выполняется вход в систему...</p>
          </div>
        ) : (
          <Alert variant="destructive" className="bg-red-900/20 border-red-800 text-red-300">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Ошибка авторизации</AlertTitle>
            <AlertDescription>{errorRef.current}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  )
}
