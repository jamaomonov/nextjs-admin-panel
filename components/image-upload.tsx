"use client"

import { API_ENDPOINTS } from "@/lib/config"
import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, X, Upload } from "lucide-react"
import Image from "next/image"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ImageUploadProps {
  value: string
  onChange: (url: string) => void
  onError: (error: string) => void
}

export default function ImageUpload({ value, onChange, onError }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Получаем URL для предпросмотра
  const getPreviewUrl = (path: string) => {
    if (!path) return null
    if (path.startsWith("http")) return path
    return `${API_ENDPOINTS.items.split("/admin")[0]}${path}`
  }

  const previewUrl = getPreviewUrl(value)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setUploadError("Пожалуйста, выберите изображение")
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Размер файла не должен превышать 5MB")
      return
    }

    setIsUploading(true)
    setUploadError(null)

    try {
      // Create FormData for file upload
      const formData = new FormData()
      formData.append("file", file)

      // Send file to server
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 400) {
          throw new Error(`Ошибка валидации: ${data.error || data.detail || "Неверный формат файла"}`)
        } else {
          throw new Error(`Ошибка загрузки: ${response.status} - ${data.error || "Неизвестная ошибка"}`)
        }
      }

      console.log("Upload response:", data)

      // Получаем путь к изображению из ответа API
      const imagePath = data.path || ""

      // Сохраняем только путь (без базового URL)
      onChange(imagePath)
      setUploadError(null)
    } catch (error) {
      console.error("Error uploading image:", error)
      setUploadError(error instanceof Error ? error.message : "Ошибка при загрузке изображения")
      onError(error instanceof Error ? error.message : "Ошибка при загрузке изображения")
    } finally {
      setIsUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleRemoveImage = () => {
    onChange("")
    setUploadError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-4">
      {uploadError && (
        <Alert variant="destructive" className="bg-red-900/20 border-red-800 text-red-300">
          <AlertDescription>{uploadError}</AlertDescription>
        </Alert>
      )}

      {/* Image preview */}
      {previewUrl ? (
        <div className="relative w-full h-48 bg-zinc-800 rounded-md overflow-hidden">
          <Image
            src={previewUrl || "/placeholder.svg"}
            alt="Preview"
            fill
            className="object-contain"
            onError={() => {
              setUploadError("Не удалось загрузить изображение")
            }}
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 rounded-full"
            onClick={handleRemoveImage}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="w-full h-48 bg-zinc-800 rounded-md flex flex-col items-center justify-center border-2 border-dashed border-zinc-700">
          <Upload className="h-10 w-10 text-zinc-500 mb-2" />
          <p className="text-zinc-500">Загрузите изображение</p>
        </div>
      )}

      {/* Upload controls */}
      <div className="space-y-2">
        <Label htmlFor="image-upload" className="mb-2 block">
          Загрузить изображение
        </Label>
        <div className="flex gap-2">
          <Input
            ref={fileInputRef}
            id="image-upload"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={isUploading}
            className="bg-zinc-800 border-zinc-700"
          />
          {isUploading && <Loader2 className="h-5 w-5 animate-spin text-zinc-400 mt-2" />}
        </div>
      </div>
    </div>
  )
}
