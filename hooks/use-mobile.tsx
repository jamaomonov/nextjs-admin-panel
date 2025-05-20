"use client"

import { useState, useEffect } from "react"

export function useMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Функция для проверки размера экрана
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768) // 768px - стандартная точка для md в Tailwind
    }

    // Проверяем при монтировании
    checkIfMobile()

    // Добавляем слушатель изменения размера окна
    window.addEventListener("resize", checkIfMobile)

    // Очищаем слушатель при размонтировании
    return () => {
      window.removeEventListener("resize", checkIfMobile)
    }
  }, [])

  return isMobile
}
